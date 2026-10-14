# JAPAN — Internal Linking Graph V2

**Locked project:** `thuexemayhanoi/japan` → **https://ja.rentbikehanoi.com/** → `ja-JP`.

## Results and rule of relevance

SEO architecture: **200 Supporting Posts → their published Silo archives → 5 Cluster Pillars → matching commercial/priority pages**. This release **edits only the main pages and category archives**; no Article JSON or Post HTML changes, no URL/SEO/NAP/CNAME rewrites. Homepage may be linked from the logo/menu/breadcrumb as normal navigation, but **must not receive bulk contextual backlinks** unrelated to transactional search intent.

### Direct Pillar coverage fixed

- `/bike-types/`: added links to the published 50cc and electric-vehicle guide archives; retains relevant existing links and vehicle-comparison options.
- `/rental-prices/`: added delivery/additional-cost and vehicle/price-comparison Silo archives.
- `/rental-guide/`: added city-driving and return/troubleshooting Silo archives.
- `/hanoi-areas/`: added West Lake and station/access Silo archives.
- `/routes-mobility/`: all eligible published children were already linked; missing planned child is intentionally not published.
- **Hard gate:** each parent Pillar must link to **every currently published** child Silo and must not link to an unpublished child.

### Live graph exports

| File | What it contains |
|---|---|
| `reports/japan-internal-link-graph-nonpost.csv` | **33 main/category URLs**: outgoing URLs, incoming URLs, both outgoing and incoming contextual anchor strings, cluster, unique counts and next truly missing topical URL to consider |
| `reports/japan-internal-link-graph.csv` | Full **233-URL** graph, including the 200 Post pages as read-only inputs; current outgoing/incoming URLs and anchored sources |
| `reports/japan-internal-link-context-edges.csv` | Actual contextual source → target → anchor → source cluster → target cluster → **edge role**; filter by role for Post→Silo, Silo→Pillar, Pillar→Commercial |
| `reports/japan-internal-link-opportunities.csv` | Reviewable **P1/P2 recommended additions only**: missing destination, matching Japanese anchor and reason — never recommend an existing contextual link again |
| `reports/japan-internal-link-summary.json` | Counts, role distribution, orphan/broken-link tests and opportunity count from current generated HTML |

**Incoming anchor detail** is recorded per source URL. Broad navigation, breadcrumb and footer links are excluded from editorial contextual counts to avoid falsely inflating SEO internal links.

### Evaluation

- A good link must answer the next user question, explain a concept, move readers to a relevant Silo/Pillar, or support a commercial quote/booking step when appropriate.
- Never force a route/weather/legal page to the Homepage simply to increase its inbound-link count.
- For 50cc and Vietnamese licensing, do not invent exemptions. For price, stock and deposits, keep the verified reference data.
- A graph recommendation is a **candidate to review**, not a requirement to insert irrelevant links automatically.
- Do not claim SEO rank, AI citations or performance gains are guaranteed by graph counts.

### Verification

```sh
node scripts/build.mjs
node scripts/build.mjs --check
node scripts/qa-factory.mjs
node scripts/qa-nonpost.mjs
node scripts/qa-internal-links.mjs
node scripts/smoke-factory.mjs
node scripts/seo-audit.mjs --mode=offline
```

The deterministic graph regenerates on every static site build. Scoped deployment requires clean QA, then PR review and GitHub Pages success. The 200 article pages must remain unchanged.
