"""Export the manuscript's figures and Table 1 for the static project page."""
from pathlib import Path
import csv
import json
import re
import shutil
import sys

import fitz
from PIL import Image

SITE = Path(__file__).resolve().parent
PAPER = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else SITE.parent

def figure(source, target, width=2200):
    with fitz.open(PAPER / source) as document:
        page = document[0]
        pixmap = page.get_pixmap(matrix=fitz.Matrix(width / page.rect.width, width / page.rect.width), alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        image.save(SITE / target, "WEBP", quality=90, method=6)

for source, target in [
    ("overview-2", "method-overview"),
    ("train", "turn-credit"),
    ("figure6_fcr_four_panels", "environment-evolution"),
    ("vtca_benchmark_results", "vtca-ablation"),
    ("skill_distributions_treemap", "skill-coverage"),
    ("rl_task_harborpeak", "case-handoff"),
    ("deepresearch_case1875", "case-course"),
    ("deepresearch_case1781", "case-policy"),
]:
    figure(f"figures/generated/{source}.pdf", f"{target}.webp")

for source, target in [
    ("figures/logos/affiliations/fudan.pdf", "fudan.webp"),
    ("assets/fudannlp-logo-hd.pdf", "fudannlp.webp"),
    ("figures/logos/affiliations/ecnu.pdf", "ecnu.webp"),
    ("figures/logos/affiliations/renmin.pdf", "renmin.webp"),
    ("figures/logos/affiliations/qiji-zhifeng-square.pdf", "qiji.webp"),
]:
    figure(source, target, width=320)

sii = Image.open(PAPER / "figures/logos/affiliations/sii-mark.png")
sii.thumbnail((320, 240))
sii.save(SITE / "sii.webp", "WEBP", quality=95)
logo = Image.open(PAPER / "figures/logos/workrover/workrover-logo-transparent.png")
logo = logo.crop(logo.getchannel("A").point(lambda alpha: 255 if alpha > 40 else 0).getbbox())
logo.thumbnail((1600, 500))
logo.save(SITE / "workrover-logo.png", optimize=True)
favicon = Image.open(PAPER / "figures/logos/workrover/workrover-logo-transparent.png").crop((200, 180, 732, 532))
canvas = Image.new("RGBA", (532, 532), (255, 255, 255, 0))
canvas.alpha_composite(favicon, (0, 90))
canvas.resize((128, 128), Image.Resampling.LANCZOS).save(SITE / "favicon.png")
shutil.copy2(PAPER / "neurips_2026.pdf", SITE / "workrover.pdf")

models = []
category = None
for line in (PAPER / "6-implementation.tex").read_text().splitlines():
    if line.lstrip().startswith("%"):
        continue
    if "Proprietary Models" in line and "multicolumn" in line:
        category = "proprietary"
    elif "Open-Weight Models" in line and "multicolumn" in line:
        category = "large" if "400B" in line else "small"
    if "&" not in line or "\\MainEloCell{" not in line:
        continue
    fields = re.findall(r"\\Main(?:Score|Elo)Cell\{((?:[^{}]|\{[^{}]*\})*)\}", line)
    if len(fields) != 5:
        raise ValueError(f"Expected five benchmark scores: {line}")
    scores = []
    for field in fields:
        number = re.search(r"-?\d+(?:\.\d+)?", field)
        scores.append(float(number.group()) if number else None)
    label = line.split("&", 1)[0].strip()
    label = re.sub(r"^\\TableModelLogo(?:\[[^]]*\])?\{[^}]*\}\s*", "", label)
    for _ in range(3):
        label = re.sub(r"\\(?:textbf|textsc)\{([^{}]*)\}", r"\1", label)
    label = label.replace(" (Ours)", "").strip()
    models.append({"name": label, "group": category, "ours": label.startswith("WorkRover"), "scores": scores})
assert len(models) == 14, f"Unexpected Table 1 model count: {len(models)}"
assert next(m["scores"] for m in models if m["ours"]) == [36.89, 1218.0, 28.67, 74.13, 48.87]
data = {"benchmarks": [
    {"name": "JobBench", "unit": "%", "maximum": 100},
    {"name": "GDPval v2", "unit": "Elo", "maximum": 1800},
    {"name": "AutomationBench", "unit": "%", "maximum": 100},
    {"name": "WorkBuddy Bench (Office)", "unit": "%", "maximum": 100},
    {"name": "OfficeQA Pro", "unit": "%", "maximum": 100},
], "models": models}
(SITE / "results-data.js").write_text("window.WorkRoverResults = " + json.dumps(data, indent=2) + ";\n")
with (SITE / "workrover-results.csv").open("w", newline="") as output:
    writer = csv.writer(output)
    writer.writerow(["Model", "Model group", *[f"{item['name']} ({item['unit']})" for item in data["benchmarks"]]])
    for model in models:
        writer.writerow([model["name"], model["group"], *[f"{value:.2f}" if value is not None else "" for value in model["scores"]]])
print(f"Exported {len(models)} models, eight paper figures, institution logos, and the manuscript.")
