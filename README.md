# 日本語バイクレンタルサイト · Nguyễn Tú

- **公開ドメイン:** https://ja.rentbikehanoi.com/
- **GitHub Pages CNAME:** `ja.rentbikehanoi.com` — preserve this file.
- **言語:** Japanese / ja-JP.
- **デザイン:** Sport-inspired red, black, white. Independent motorcycle rental site, **not Honda's official website**. No Honda logo or trademark copied.
- **店舗:** Cho Thuê Xe Máy Nguyễn Tú · 112 Nguyễn Văn Cừ, Bồ Đề, Long Biên, Hà Nội, Việt Nam
- **電話/Zalo:** +84 942 467 674 · **営業時間:** 毎日09:00–21:00.
- **Google Maps:** https://maps.google.com/maps?cid=7448790013669858019

## Architecture

`site/data.json` manages the business NAP, global nav labels, FAQs and all base-page content. `site/taxonomy.json` is the shared **5-parent/20-child** category tree with **200 planned article slots**. Header, mobile menu and footer use the same taxonomy menu generator.

`scripts/build.mjs` generates static pages, sitemap, robots and local schema. The CMS-free HTML is checked into GitHub Pages. `scripts/qa-factory.mjs` and `scripts/seo-audit.mjs` verify website SEO. The separate article factory is manual/external-writer-driven.

`data/editorial-plan.json`: **24 seed Japanese topic briefs**, not published posts. The long-term plan is up to 200 high-quality articles, NOT an automatic quota. `data/factory-state.json` starts `enabled:false`, and `data/writer-queue.json` is `PAUSED`.

### Commands

```bash
node scripts/build.mjs
node scripts/build.mjs --check
node scripts/qa-factory.mjs
node scripts/smoke-factory.mjs
node scripts/seo-audit.mjs --mode=offline
node scripts/factory.mjs status
```

Only enable the writer after the owner's separate authorization. Do not fabricate source references, review ratings, legal exemptions, prices, discounts or delivery promises. No future location pages without unique real local visitor value. The 24 seed topics are proposals, not proven GSC/SERP demand.

Static pages and schema are created once on first deploy; thereafter the generator updates shared content. Do not modify CNAME/DNS or use paid AI calls without authorization.
