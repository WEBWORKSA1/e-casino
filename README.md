# e.casino — Casino Math Academy

An AdSense-ready, education-first website for the domain **e.casino**: in-depth casino-math guides, ten free interactive labs and calculators (no real money), responsible-gaming resources, and built-in revenue engines — B2B lead generation (domain / sponsorship / advertising / partnership), donations, skill contests and a talent pipeline.

Static site, no dependencies, hosted free on **GitHub Pages** from the `main` branch.

---

## 1. Publish it (one-time, ~2 minutes)

1. **Turn on GitHub Pages:** repo **Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch: `main` / `(root)` → Save.**
   The site goes live at `https://webworksa1.github.io/e-casino/` within a minute or two.
2. **Point the domain** (at your registrar's DNS for `e.casino`):
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` records for `@` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` for `www` → `webworksa1.github.io`
3. **Settings → Pages → Custom domain:** enter `e.casino`, Save, wait for the DNS check, then tick **Enforce HTTPS**.
   (GitHub adds a `CNAME` file to the repo automatically.)
4. **Turn on self-updating (recommended):** **Add file → Create new file**, name it `.github/workflows/build-and-publish.yml`, paste the contents of [`setup/build-and-publish.yml`](setup/build-and-publish.yml), commit.
   From then on the site refreshes its news feed, sitemap and search index daily, and renders PNG social images.

> All links are relative, so the site works both at `webworksa1.github.io/e-casino/` and at `e.casino`. Canonical URLs, `sitemap.xml`, `robots.txt` and `ads.txt` assume `https://e.casino`.

## 2. Google AdSense checklist

- [x] AdSense code in the `<head>` of every content page, plus the `google-adsense-account` meta tag (`ca-pub-6620975821265271`).
- [x] `ads.txt` at the site root: `google.com, pub-6620975821265271, DIRECT, f08c47fec0942fa0`. It is only read at the **root of the domain**, so connect `e.casino` before applying.
- [x] Privacy policy with the required Google/third-party cookie disclosures, cookie policy, terms, about, contact, editorial policy, disclaimer.
- [x] 31 original long-form guides, a 200-term glossary, 10 interactive tools, clear navigation, HTML sitemap and XML sitemap.
- [x] No real-money gambling, no casino affiliate links, no "win money" claims, so content stays in Google's educational category.
- [x] AdSense is excluded on non-content pages (thank-you, 404, embed widgets), per Google's policy.
- [ ] **In AdSense:** Sites → add `e.casino` → request review. Turn on **Auto ads**.
- [ ] **In AdSense → Privacy & messaging:** publish the Google-certified **European regulations** (GDPR) message, and the US state-regulations message. This is required for EEA/UK/Swiss traffic.
- [ ] **In AdSense → Blocking controls → Sensitive categories:** keep **Gambling & betting** blocked. Also consider blocking "Social casino games", which keeps ads aligned with an educational audience.
- [ ] Optional manual ad units: create them in AdSense and paste their slot IDs into `assets/js/config.js` (`adSlots`). Empty slots render nothing.

## 3. Forms, email and donations

- Every form (partner leads, academy, newsletter, contests, careers, contact, pledges) posts through **FormSubmit** to the owner's inbox. The address is stored encoded in `assets/js/site.js` and is **never displayed** on the site.
- **Activate once:** submit any form on the live site. FormSubmit emails an **Activate Form** link to the owner inbox; click it. After activation FormSubmit also offers a random alias string; paste it into `formAlias` in `assets/js/config.js` to stop using the encoded address entirely.
- Partner leads are auto-scored **HOT / WARM / NEW** from budget and timeline, shown in the email subject line.
- **Donations:** the Support page opens PayPal checkout for any amount or purpose, with an optional monthly gift. The address is built only at click time. Add Buy Me a Coffee, Ko-fi, GitHub Sponsors, Patreon, a Stripe link or crypto addresses in `config.js` to show extra buttons.
- The top bar on every page links to `https://web.works/contact` for website, domain, sponsorship, advertising and partnership inquiries.

## 4. Structure

```
index.html, learn/, games/, tools/, …   built pages (served by GitHub Pages)
assets/css/site.css                      design system (light + dark)
assets/js/site.js, config.js             site features, forms, donations, search, chrome
assets/js/labs/*.js                      the interactive labs and calculators
data/                                    videos, news feed, search index
scripts/build.py                         static-site builder (Python 3, stdlib only)
scripts/update_feeds.py                  daily news refresher (used by the workflow)
setup/build-and-publish.yml              workflow to install (see step 1.4)
blueprint/                               strategy memo and phase-wise build prompt
```

## 5. Editing content

- **Edit a page:** change the HTML between `<!--ec:content-->` and `<!--/ec:content-->`, then run `python3 scripts/build.py` (or just push, if the workflow is installed). The builder re-templates every page from the HTML itself, so no separate source files are required.
- **Add an article:** create `content/articles/<slug>.html` with a `<!--meta {…} -->` JSON header, using the format in `blueprint/BUILD-PROMPT.md`, Phase 5. Then run the build. The article is added to the Learn hub, search, sitemap and related links automatically.
- **Change header, footer or SEO markup:** edit `scripts/build.py` (static chrome) or `assets/js/site.js` (rich footer, mobile menu, search box), then rebuild.

## 6. Trademark & copyright

© 2026 e.casino. All rights reserved. Original content, code and design; no license is granted except as stated on the site's [disclaimer page](disclaimer/).
"e.casino" is used as this website's address and name. The site is **not affiliated with any company, product or trademark named "eCasino", "E-Casino" or similar**, nor with any casino operator. Third-party names are used only for identification. Embedded videos remain the property of their creators.
