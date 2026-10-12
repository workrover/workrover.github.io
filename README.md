# WorkRover project page

The official research project page for **WorkRover: Scaling Long-Horizon Cowork Agent Training Via Recursive Environment Evolution**.

Live website: https://workrover.github.io/

This is a standalone, responsive static website. Its figures, authors, benchmark scores, and paper download come from the WorkRover manuscript. The research-page structure is inspired by [LocalSearchBench](https://localsearchbench.github.io/) and [MMSearch](https://mmsearch.github.io/).

## Local preview

```sh
python3 -m http.server 8080
```

Open http://localhost:8080/. No Node.js dependencies or build step are required.

## Update manuscript assets

```sh
python3 -m pip install pymupdf pillow
python3 build_assets.py /path/to/CoworkWorld-arxiv
```

The exporter reads the manuscript's Table 1, renders its original PDF figures for the web, and refreshes the paper download. It does not change the manuscript.

## Publish

Use the public `workrover/workrover.github.io` repository. In **Settings → Pages**, select **Deploy from a branch**, the `main` branch, and `/ (root)`. The `.nojekyll` file makes GitHub Pages serve the static files directly.

The page includes an accessible benchmark explorer, model filters, column sorting, CSV export, recorded case studies, expandable paper figures, and a copyable BibTeX citation. Benchmark comparisons preserve the source-specific evaluation protocols described in the paper.
