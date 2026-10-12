# AGENTS.md · JAPAN REPOSITORY ONLY

Target repository: **thuexemayhanoi/japan**. Production domain **https://ja.rentbikehanoi.com/**. Language **ja-JP**.

## Non-negotiable safeguards
- Do **not** modify `/spanish`, `/portugal`, `/web`, `/china` or any other repository.
- Preserve CNAME, existing URLs, structured data, SEO fields and NAP.
- Single source of truth: `site/data.json` and `site/taxonomy.json`; never manually patch generated HTML.
- Header, desktop/mobile navigation and footer are rendered from the same taxonomy and labels.
- No Honda logo or claims of affiliation with Honda. A crimson/black/white color palette is fine.
- Factory `enabled:false` and Writer Queue `PAUSED` by default. **Never automatically publish 200 articles**.
- 5 parent categories / 20 child categories / 200 planned capacity, not 200 indexable pages.
- No empty category archive. Child archives only after at least 5 actually accepted published articles.
- Before PR merge run `node scripts/build.mjs --check`, `node scripts/qa-factory.mjs`, `node scripts/smoke-factory.mjs`, and `node scripts/seo-audit.mjs --mode=offline`.
- Correct claims require evidence: legal/licensing/insurance, price, deposit, delivery, opening hours.
- Business NAP name Cho Thuê Xe Máy Nguyễn Tú; phone +84942467674; address 112 Nguyễn Văn Cừ, Bồ Đề, Long Biên, Hà Nội; 09:00–21:00 daily.
- GSC verification content is blank until provided; never invent a meta tag value or claim Search Console is verified.

## Handoff
`factory/WRITER.md` defines the Japanese writer JSON format. Only accepted `JP-XXXX.json` from READY queue may be processed. Treat SEO audit as read-only.
