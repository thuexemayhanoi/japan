# JAPAN INTERNAL LINKING — MASTER GRAPH A–Z

**Repository:** `thuexemayhanoi/japan` · **Production:** https://ja.rentbikehanoi.com/ · **Language:** ja-JP.

## Purpose and scope

Map **all currently published URLs**, especially the 33 non-Post landing pages, five Pillars and published Silo archives. Keep all 200 published Post URLs and article contents unchanged. Use the actual generated HTML rather than counting planned topics as live.

**SEO direction:** Supporting Article → matching Silo Archive (or live Pillar) → Cluster Pillar → genuinely relevant Commercial / Priority URL. A backlink to Homepage may exist through the site logo, menu or breadcrumb for navigation; do not add blanket contextual links from all Silo pages to Homepage.

## Machine-generated source of truth

Run `node scripts/build.mjs` to rebuild SEO HTML and automatically regenerate the graph from that same publication snapshot. Verification: `node scripts/build.mjs --check` and `node scripts/qa-internal-links.mjs`.

| Output | Fields / use |
|---|---|
| `reports/japan-internal-link-graph.csv` | **Every published URL** → outgoing and incoming contextual URL lists, unique counts, anchor texts, cluster, recommended target/anchor/action |
| `reports/japan-internal-link-graph-nonpost.csv` | Concise graph for all **33 non-Post pages** including Homepage, Pillars, Silo archives, Contact/FAQ/About/legal |
| `reports/japan-internal-link-context-edges.csv` | Every contextual link edge: source URL, target URL, anchor, zone, source cluster, target cluster. Filter by target URL for incoming anchors, or by source URL for outgoing anchors |
| `reports/japan-internal-link-summary.json` | Generation snapshot and graph completeness statistics |

Contextual edges exclude sitewide header/footer links and exclude breadcrumbs. These are still counted in the all-link totals of the full graph. Do not mistake thousands of menu/footer links for editorial internal linking.

## Cluster and anchor policy

| Supporting Silo | Matching Pillar | Next commercially relevant destination |
|---|---|---|
| `/categories/motorbikes/*/` | `/bike-types/` | `/bike-types/scooters/`, `/bike-types/50cc/` or `/rental-prices/` when the vehicle/topic matches |
| `/categories/prices/*/` | `/rental-prices/` | `/contact/` only for actual quotes, delivery or price-condition questions |
| `/categories/guide/*/` | `/rental-guide/` | `/rental-guide/documents-deposit/`, pricing only when discussing price/contracts |
| `/categories/areas/*/` | `/hanoi-areas/` | `/routes-mobility/` and local `/contact/` only if Nguyễn Tú location/meeting is relevant |
| `/categories/routes/*/` | `/routes-mobility/` | `/hanoi-areas/`, safe-driving guide or alternative transport; **never force a booking CTA** |

Use short, varied Japanese anchors that describe the destination (e.g. 車種別の保証金と料金) and avoid `こちら`, `詳しく見る`, repetitive exact matches, self-links and duplicate links to the same target within the matrix section.

## Implementation and acceptance

- Matrix source: `site/nonpost-seo.json`, centrally rendered by `scripts/nonpost-seo.mjs`; do **not** patch generated `index.html` by hand.
- Indexable target URLs must exist in the current page inventory. A child archive is only published after at least five accepted Post articles; future rows remain dormant.
- The article HTML and `content/articles/JP-*.json` remain protected, as do NAP, CNAME, canonical, sitemap and Writer state.
- `scripts/internal-link-graph.mjs` is deterministic; its CSVs sync automatically when build regenerates published pages.
- CI gate `scripts/qa-internal-links.mjs`: published-only targets, unique anchors/targets, child-to-Pillar links, homepage spam refusal and graph completeness.
- Graph provides link structure and recommendations, **not Google ranking, link equity measurement or indexing guarantees**.

