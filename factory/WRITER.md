# Japanese Article Factory — external writer contract

Repo **thuexemayhanoi/japan** · domain **https://ja.rentbikehanoi.com/**. Language **Japanese (ja-JP)**.

Before writing read `data/editorial-plan.json`, `data/writer-queue.json`, `data/factory-state.json`, `site/data.json`, `site/taxonomy.json`.

Never write to `_factory/inbox/` when state = **PAUSED** or **BLOCKED**. Only process IDs explicitly present in READY queue. Do not change factory state/queue/generator/URLs/sitemap.

Draft path: `_factory/inbox/JP-XXXX.json`, fields:
`id, title, description, h1, intro, sections, faq, related, source_urls, status`.

- Unique Japanese title 12–85 characters. Original meta description 55–220 characters.
- Main intro at least 90 characters.
- 4 or more substantial H2 sections, two paragraphs per section, each paragraph at least 90 Unicode characters.
- Target content **1,000–10,000 Japanese characters** (not whitespace-delimited English words). Do not pad content.
- `sections:[{"heading":"見出し","paragraphs":["第一段落","第二段落"]}]`
- `faq:[{"question":"...","answer":"..."}]` max 8; or [].
- `related` 2–8 existing published internal URLs only (base pages permitted). No future links.
- `source_urls` verified HTTPS resources, mandatory for legal/licence/insurance article topics; factual verification is an editorial responsibility beyond schema validation.
- `status` exactly `READY_FOR_QA`.
- Respect one primary search intent per URL; do not create near-duplicate location or duration variations.
- NAP: Cho Thuê Xe Máy Nguyễn Tú; 112 Nguyễn Văn Cừ, Bồ Đề, Long Biên, Hà Nội, Việt Nam; +84 942 467 674; 09:00–21:00 daily; maps CID 7448790013669858019.
- Never invent availability, free delivery, zero deposit, legal exemption, fees, branch office, reviews or insurance cover.
- Vehicle models such as Honda Wave/Vision are factual product references, not a Honda affiliation.
- Do not publish or queue 200 articles automatically. First secure explicit user approval for any future test batch.
