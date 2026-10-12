# JAPAN SEO MASTER MATRIX · 2026-10-13

Scope: **thuexemayhanoi/japan** exclusively · https://ja.rentbikehanoi.com/ · Japanese `ja-JP`.
Purpose: increase relevant traffic and inquiry conversion. **No Top 1 guarantee**. This is an implementation guide, not claimed GSC data.

## Verified baseline
- 12 generated public URLs, 12 sitemap locations, robots permits crawling, 404.html carries noindex, canonicals point to the Japanese custom domain.
- Exactly 5 parent / 20 child taxonomy entries with **200 planned article capacity**; 24 initial topic briefs, **0 published Japanese blog posts**, 176 not briefed; Content Factory 200 **PAUSED**. Never create empty archives or auto publish.
- Homepage daily example rates: manual **150,000 VND** and scooter **200,000 VND**, short-term estimates only; long-term rates, deposits and delivery subject to confirmation.
- NAP single source: `site/data.json`; Nguyễn Tú, 112 Nguyễn Văn Cừ, Bồ Đề, Long Biên, Hà Nội; +84 942 467 674; 09:00–21:00 every day; Maps CID 7448790013669858019.
- Japanese Search Console property not verified from connectors. VibeSEO connected project `3937` is for `thuexemaynguyentu.com`, **not `ja.rentbikehanoi.com`**. Do not import its rankings, AI visibility, or keywords into Japan metrics.

## Seven SEO workstreams & next action
| Priority | Workstream | Baseline / technical action | Measurement / approval |
| --- | --- | --- | --- |
| P0 | Technical/indexability | Daily self-canonical, sitemap, robots, HTML, 404 and actual live HTTP audit; preserve URLs | Search Console Google-selected canonical and coverage require connected property |
| P1 | Performance / CWV | Keep no third-party Quick Call scripts; inspect HTML/CSS/JS byte size; no speculative scores | PageSpeed mobile lab + CrUX field LCP, INP, CLS still required |
| P0 | Schema/entity | Ensure Japanese Article inLanguage=ja; existing LocalBusiness/WebSite/WebPage/BreadcrumbList/visible FAQ; consistent NAP | Test Rich Results; schema doesn't guarantee rich snippets |
| P1 | AI Search AEO GEO | Clear direct Japanese answers, factual pricing, local business evidence and links to verifiable official sources; avoid fabricated llms/SEO promises | VibeSEO needs Japanese domain as separate project |
| P1 | E-E-A-T/local trust | Keep honest deposit terms, true NAP and real photos; review 50cc/legal claims individually before publish | Real vehicle images, booking conditions and official legal references need sourcing |
| P2 | Off-page | Genuine tourism, Hanoi travel, local business listings, ethical language-equivalent backlinks | No PBN, purchased links, fake reviews, or automatic reciprocal network |
| P1 | Monitoring/maintenance | `Japan SEO Audit and Monitoring` independent of factory, read-only daily, JSON artifact; per URL issues, incoming links, sitemap, schema, live status | Connect GSC / Bing manually, compare organic impressions, CTR, clicks, pages indexed monthly |

## Nine practical gates
1. Crawling / HTTP / canonical / sitemap / 404 / noindex
2. Silo architecture with genuine parent-child categories; no empty thin archives
3. One primary intent and URL per commercial keyword
4. Unique title, H1, meta and OG field sourced from templates
5. Independent editorial QA: correct Japanese, claims verified by authoritative sources, 50cc legal review
6. Internal-link map: supporting article -> pillar -> commercially relevant page; no generic homepage spam
7. Performance: responsive, script budgets, measure real CWV (not fabricated)
8. Local entity: NAP, Maps, transparent contact and policies, original photos
9. Index monitoring: GSC, Bing, AI citations, traffic and conversion; mark UNKNOWN until connected

## Commercial priority mapping (hypotheses; not search-volume claims)
| Pillar URL | Primary Japanese intent | Support |
| --- | --- | --- |
| / | ハノイ バイクレンタル (transactional/local) | Brand trust + service entry |
| /rental-prices/ | ハノイ バイクレンタル 料金 (commercial) | daily, deposit, delivery, week/month facts |
| /bike-types/ | ハノイ レンタル バイク 種類 (comparison) | manual vs scooter |
| /bike-types/scooters/ | ハノイ スクーター レンタル (commercial) | riding conditions, pricing |
| /bike-types/50cc/ | ハノイ 50cc レンタル (commercial with legal safety needs) | verified regulations only |
| /rental-guide/ | ベトナム バイク レンタル 手順 (informational) | inspections, contracts, returns |
| /contact/ | Nguyễn Tú レンタル ハノイ 住所 (local/nav) | Maps, address, hours, phone |

## Content Factory gate before future batches
- Maintain exact `JP-XXXX` briefs with one distinct primary keyword; duplicate normalized keywords fail before intake.
- Keep existing published URLs stable. Compare new drafts against all published and in-flight intents; qualitative intent review still required.
- Japanese length uses **Unicode characters**, not English word counts. No auto claim about source authenticity; open and inspect each official URL.
- Reject fabricated license exemptions, insurance, zero-deposit/free-delivery, 24/7 service, fake sources or unverified discounts.
- Every publish requires owner-defined batch approval, QA, then pause. Factory currently remains PAUSED.

## Monitoring
Run `node scripts/seo-deep-monitor.mjs --mode=offline --report=seo-deep.json` locally or through the existing read-only workflow. Run `--mode=full` for HTTP status checks of *all* currently published pages; outputs are GitHub Actions artifacts retained 30 days. These checks report crawlability signals, **not Google's actual indexing decisions**. Each P0 is a build/QA blocker; P1 needs scoped repair; P2 opportunities; P3 future work. Do not make unrelated changes merely to make warnings disappear.

## Next approvals required
1. Connect/verify **Japanese** GSC property, submit `https://ja.rentbikehanoi.com/sitemap.xml` and request indexing only where necessary.
2. Approve new real photos and any business-condition wording not already grounded in business data.
3. Connect mobile PageSpeed/CrUX or capture Lighthouse test results.
4. Once ready, explicitly approve first Japanese writer batch; no automatic 200-article rollout.
