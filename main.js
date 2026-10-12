"use strict";

(() => {
  const menuButton = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  menuButton.addEventListener("click", () => {
    const opened = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(opened));
    menuButton.setAttribute("aria-label", opened ? "Close navigation" : "Open navigation");
    navLinks.classList.toggle("open", opened);
  });
  navLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
  }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && navLinks.classList.contains("open")) {
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");
      menuButton.focus();
    }
  });

  const data = window.WorkRoverResults;
  const search = document.getElementById("model-search");
  const tbody = document.getElementById("results-body");
  const chart = document.getElementById("benchmark-chart");
  let group = "small";
  let benchmark = 0;
  let sortColumn = 0;
  let descending = true;
  const escapeText = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const scoreText = value => value === null ? "—" : value.toFixed(2);

  function selectedModels() {
    const query = search.value.trim().toLowerCase();
    return data.models.filter(model => (group === "all" || model.group === group || model.ours) && model.name.toLowerCase().includes(query));
  }
  function sortedModels(models, column, isDescending) {
    return [...models].sort((left, right) => {
      const a = left.scores[column], b = right.scores[column];
      if (a === null && b === null) return left.name.localeCompare(right.name);
      if (a === null) return 1;
      if (b === null) return -1;
      return (isDescending ? b - a : a - b) || left.name.localeCompare(right.name);
    });
  }
  function render() {
    const models = selectedModels();
    const metric = data.benchmarks[benchmark];
    document.getElementById("chart-title").textContent = metric.name;
    document.getElementById("chart-unit").textContent = `${metric.unit === "Elo" ? "Elo rating" : "Score (%)"} · higher is better`;
    chart.setAttribute("aria-label", `${metric.name} scores for ${models.length} selected models`);
    chart.innerHTML = models.length ? sortedModels(models, benchmark, true).map(model => {
      const value = model.scores[benchmark];
      const width = value === null ? 0 : Math.max(0, Math.min(100, value / metric.maximum * 100));
      return `<div class="chart-row ${model.ours ? "ours" : model.name === "Qwen3.5-35B-A3B" ? "backbone" : ""}"><span class="chart-row-name">${escapeText(model.name)}</span><div class="chart-bar-track" aria-hidden="true"><div class="chart-bar" style="width:${width}%${value === null ? ";min-width:0" : ""}"></div></div><span class="chart-value">${scoreText(value)}${value === null ? "" : `<small> ${metric.unit}</small>`}</span></div>`;
    }).join("") : '<p class="empty-state">No models match this search.</p>';
    tbody.innerHTML = models.length ? sortedModels(models, sortColumn, descending).map(model => `<tr class="${model.ours ? "ours" : ""}"><td>${escapeText(model.name)}${model.ours ? '<span class="ours-tag">OURS</span>' : ""}</td>${model.scores.map(value => `<td>${scoreText(value)}</td>`).join("")}</tr>`).join("") : '<tr><td colspan="6" class="empty-state">No models match this search.</td></tr>';
    document.getElementById("results-count").textContent = `${models.length} ${models.length === 1 ? "model" : "models"} shown${group !== "small" && group !== "all" ? " · WorkRover included as a comparison" : ""}. Select a column heading to sort.`;
    document.querySelectorAll("[data-sort]").forEach(button => {
      const selected = Number(button.dataset.sort) === sortColumn;
      button.closest("th").setAttribute("aria-sort", selected ? (descending ? "descending" : "ascending") : "none");
      button.querySelector("i").textContent = selected ? (descending ? "↓" : "↑") : "↕";
    });
  }
  document.querySelectorAll("[data-group]").forEach(button => button.addEventListener("click", () => {
    group = button.dataset.group;
    document.querySelectorAll("[data-group]").forEach(item => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    render();
  }));
  document.querySelectorAll("[data-benchmark]").forEach(button => button.addEventListener("click", () => {
    benchmark = Number(button.dataset.benchmark);
    sortColumn = benchmark;
    descending = true;
    document.querySelectorAll("[data-benchmark]").forEach(item => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    render();
  }));
  document.querySelectorAll("[data-sort]").forEach(button => button.addEventListener("click", () => {
    const column = Number(button.dataset.sort);
    descending = sortColumn === column ? !descending : true;
    sortColumn = column;
    render();
  }));
  search.addEventListener("input", render);
  render();

  const caseTabs = [...document.querySelectorAll("[data-case]")];
  function selectCase(button, focus = false) {
    caseTabs.forEach(item => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(`case-${item.dataset.case}`).hidden = !selected;
    });
    if (focus) button.focus();
  }
  caseTabs.forEach((button, index) => {
    button.addEventListener("click", () => selectCase(button));
    button.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % caseTabs.length;
      if (event.key === "ArrowLeft") next = (index + caseTabs.length - 1) % caseTabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = caseTabs.length - 1;
      if (next !== undefined) {event.preventDefault(); selectCase(caseTabs[next], true);}
    });
  });

  const dialog = document.getElementById("figure-dialog");
  let figureTrigger;
  document.querySelectorAll("[data-figure]").forEach(button => button.addEventListener("click", () => {
    figureTrigger = button;
    const image = document.getElementById("dialog-image");
    image.src = button.dataset.figure;
    image.alt = button.querySelector("img").alt;
    document.getElementById("dialog-caption").textContent = button.dataset.caption;
    document.getElementById("download-figure").href = button.dataset.figure;
    dialog.showModal();
    document.body.classList.add("dialog-open");
    document.getElementById("close-dialog").focus();
  }));
  document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
  dialog.addEventListener("close", () => {document.body.classList.remove("dialog-open"); figureTrigger?.focus();});

  document.getElementById("copy-citation").addEventListener("click", async () => {
    const text = document.getElementById("bibtex").textContent;
    const status = document.getElementById("copy-status");
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Citation copied to clipboard.";
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(document.getElementById("bibtex"));
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = "Citation selected. Press Ctrl+C or ⌘C to copy.";
    }
  });

  if ("IntersectionObserver" in window) {
    const links = [...navLinks.querySelectorAll('a[href^="#"]')];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) links.forEach(link => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, {rootMargin: "-12% 0px -65% 0px"});
    document.querySelectorAll("main > section[id]").forEach(section => observer.observe(section));
  }
})();
