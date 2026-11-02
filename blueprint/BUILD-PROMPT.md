# e.casino — Phase-wise build prompt

Use these prompts in order with any capable AI coding assistant to build, rebuild or extend the e.casino site. Each phase lists the **prompt**, its **deliverables** and **acceptance criteria**. Shared rules are in Phase 0; paste them at the top of every session.

---

## Phase 0 — Ground rules (paste first, every time)

> You are building **e.casino — Casino Math Academy**, an education-first website about casino games and probability, monetized with Google AdSense (publisher `ca-pub-6620975821265271`). Non-negotiable rules:
> 1. **No real-money gambling, no casino/sportsbook/affiliate links, no bonus codes, no "win money" wording.** Labs use virtual chips with no value. Content must stay in Google's *educational* category.
> 2. **Brand:** always write the name as the web address **"e.casino"**. Never use "eCasino" or "E-Casino" as a brand. Never use casino operator, slot title, game-studio or lottery brand names or logos. Generic game names only.
> 3. **Every page:** the AdSense head tag `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6620975821265271" crossorigin="anonymous"></script>`, a `google-adsense-account` meta tag, and a top bar reading *"Contact, if you are interested in this website / domain name / Sponsorship / Advertisement / Partnership"* linked to `https://web.works/contact`. Exception: no AdSense on thank-you, 404 or embed pages.
> 4. **Email privacy:** the only inbox is the owner's address. It must **never** appear in page text, attributes or source in plain form. Store it encoded (e.g. XOR'd, reversed char codes) and decode only inside the form/donation handlers at submit or click time.
> 5. **Hosting:** static files only, GitHub Pages free plan, `main` branch root. Relative links everywhere so it works at `/e-casino/` and at the domain root.
> 6. **Accuracy:** no fabricated statistics, studies, quotes, testimonials or user counts. Derive every number and show the math.
> 7. Accessible (WCAG AA), responsive from 320px, light and dark themes, no horizontal scroll, fast (no frameworks required).

## Phase 1 — Research & positioning

**Prompt:** "Research at least 35 leading sites in casino education, strategy, odds tools, responsible gambling, industry news and creator donations (e.g. game-math references, strategy trainers, odds-tool hubs, RG charities, regulators, industry media, donation platforms). For each, list standout features, lead-capture tactics, trust signals and monetization. Produce a de-duplicated must-have feature list and 5 gaps an education-first site can own."

**Deliverables:** feature matrix; gap list. Expected gaps include graded trainers with a weak-spot map, variance simulators, expected-loss math built into every game page, an independent no-affiliate stance, embeddable tools, and skill contests.

## Phase 2 — Information architecture & design system

**Prompt:** "Design the IA and a token-based design system for e.casino. Sections: Home, Learn (hub + categories + learning paths), Free Labs, Tools, Videos, News, Glossary, Play Safe (RG + self-check), Partner (lead gen), Support (donations), Contests, Careers, Academy (email course), Embed, About, Editorial policy, Contact, Privacy, Terms, Disclaimer & trademarks, Cookies, Sitemap, Thank-you, 404. Palette: midnight navy, emerald accent, gold secondary; fonts Sora (display) + Inter (body). Components: buttons, cards, badges, callouts, data tables, FAQ accordions, multi-step forms with radio cards, KPI tiles, canvas charts, CSS playing cards, sticky mobile CTA, slide-in, search modal, toasts."

**Acceptance:** CSS variables for both themes; components documented; mobile nav; print styles for the strategy card.

## Phase 3 — Static site engine

**Prompt:** "Write a Python 3 stdlib-only builder. Inputs: article fragments with a `<!--meta {json} -->` header, page fragments, and JSON data (videos, news, glossary). It wraps pages in a shared shell: head SEO (title, description, canonical, Open Graph, Twitter), JSON-LD (Organization, WebSite, Article, BreadcrumbList, WebApplication, FAQPage on non-articles), the AdSense tag, the top bar, header and footer. It generates hubs, related links, learning paths, an HTML sitemap, `sitemap.xml`, `robots.txt`, `ads.txt` and a JSON search index. Each built page embeds its meta and marks its body with `<!--ec:content-->…<!--/ec:content-->` so the site can be rebuilt from the HTML alone (round-trip must be byte-identical)."

**Acceptance:** `python3 scripts/build.py` builds everything. Deleting the sources and rebuilding gives identical output.

## Phase 4 — Interactive labs & calculators (vanilla JS)

**Prompt:** "Build these as dependency-free JS modules with canvas charts, shareable URL parameters and no real money:
1. **Blackjack Strategy Trainer:** 4–8 decks, S17, DAS, no surrender. Graded H/S/D/P decisions with reasons, a live chart with the cell highlighted, a weak-spot map, keyboard shortcuts, and a 50-hand challenge that outputs a tamper-evident score code.
2. **Roulette & Betting-System Simulator:** EU, US and French wheels; flat, Martingale, Paroli, Fibonacci and D'Alembert; 1,000+ sessions; bankroll paths; result histogram; observed vs. theoretical edge.
3. **Slot RTP & Volatility Simulator:** RTP slider, four volatility models scaled to the target RTP, hit frequency, losses disguised as wins, session histogram.
4. **Dice & Craps Lab:** 2d6 histogram vs. exact, and a Pass Line simulator (244/495).
5. **Coin-Flip Streak Lab:** streaks, the 'after 5-in-a-row' frequency, and a 'fake randomness' test.
6. **Hold'em Odds Calculator:** card picker, 7-card evaluator, Monte Carlo vs. 1–9 opponents.
7. **House Edge Calculator:** 20+ bets with typical pace; expected loss per hour, session, month and year; comparison chart.
8. **Odds Converter & Vig Calculator.**
9. **Bankroll & Risk-of-Ruin Calculator:** discrete outcome models plus Monte Carlo.
10. **'At Least Once' Probability Calculator.**
Also an anonymous 10-question RG self-check (original questions, nothing stored)."

**Acceptance:** no console errors; works at 390px; numbers match the published math.

## Phase 5 — Content (AdSense-grade)

**Prompt:** "Write 30+ original 1,100–1,600-word guides in five categories: Casino Math, Game Guides, Psychology & Myths, Responsible Gaming, History & Industry. Each one has: a lede that answers immediately; 5+ H2s with ids; a table or formula; a callout; 3+ internal links to guides and labs; 3–5 FAQs; key takeaways; a final 'The bottom line'. Use only the facts sheet or derived math. No brand names, no phone numbers in articles, no promotion of gambling. Add a 200-term glossary."

Fragment format:
```html
<!--meta
{"title": "≤60 chars", "h1": "…", "description": "140–160 chars", "category": "casino-math",
 "keywords": [], "readingMinutes": 7, "updated": "YYYY-MM-DD", "summary": ["…"],
 "faq": [{"q": "…", "a": "…"}], "related": ["slug", "slug", "slug"], "tool": "blackjack-trainer"}
-->
<p class="lede">…</p><h2 id="…">…</h2>…<h2 id="bottom-line">The bottom line</h2><p>…</p>
```

## Phase 6 — Monetization

**Prompt:** "Implement:
1. AdSense: the head tag on content pages, plus optional manual units that render only when a slot ID is set in `config.js`.
2. A Support page: PayPal checkout (encoded address, any amount, choice of purpose: operations, labs and guides, hiring talent, promotion, contest prizes; monthly option); a pledge/sponsor form; target-allocation bars; an independence promise; a supporters wall; optional extra channels via config.
3. Partner page sponsorship packages with indicative prices.
4. A video library with privacy-enhanced YouTube facades that hide videos that no longer exist."

## Phase 7 — Lead generation (dedicated, high-conversion)

**Prompt:** "Build `/partner/` as the dedicated lead-gen hub:
- Hero value proposition for a one-letter .casino domain.
- Six opportunity cards (acquire, lease, sponsor, advertise, partner, something bigger) that pre-select the form via `?interest=`.
- Packages, process timeline, FAQ, and a sticky mobile CTA.
- A three-step form: interest radio cards → budget, timeline, company, website, role, country → name, business email, phone, message, consent.
- Lead scoring (HOT/WARM/NEW) in the email subject, first-touch attribution (referrer, landing page, UTM), a honeypot, inline validation and a redirect to the thank-you page.
Also add B2C capture: the Academy course form, newsletter forms (footer, home, article slide-in) and the printable strategy kit as the lead magnet."

## Phase 8 — Community: contests & careers

**Prompt:** "Build `/contests/`: a monthly Blackjack Strategy Sprint (score code from the trainer) and a rotating Probability Puzzle. Include a countdown, a prize policy (sponsor-funded), and an entry form that pre-fills from the trainer. Official rules: no purchase necessary, skill-only, 18+, void where prohibited, tie-breaks, verification, notification and privacy. Build `/careers/` with seven remote roles and an application form."

## Phase 9 — Automation & self-updating

**Prompt:** "Add a GitHub Actions workflow (daily cron, on push and manual) that:
1. refreshes `data/news.json` from public news RSS for industry, regulation, player protection and research, filtering promotional items;
2. renders PNG social and app images from SVG;
3. rebuilds pages, sitemap and search index;
4. commits to `main` and requests a Pages rebuild.
On the client side, add a daily-rotating probability puzzle, month countdowns, and news that loads from JSON with a static fallback."

## Phase 10 — Compliance, SEO & QA

**Prompt:** "Write a privacy policy that includes Google's required third-party cookie language and opt-out links, CMP notes for EEA/UK/CH, retention, rights, children and transfers. Write terms, a cookie policy, an editorial policy, and a disclaimer with a full trademark and copyright disclosure: non-affiliation with any 'eCasino'/'E-Casino' marks, nominative use, a copyright notice, and a complaints process. Then QA:
- every page loads with zero console errors at 1360px and 390px;
- no horizontal overflow;
- zero broken internal links;
- the owner's email string appears in no file;
- the top bar is on 100% of pages;
- AdSense is on all content pages."

## Phase 11 — Deploy & launch

**Prompt:** "Push to `github.com/webworksa1/e-casino` on `main`. Enable Pages (main/root). Add DNS records for `e.casino` (four GitHub A records, four AAAA, `www` CNAME). Set the custom domain and enforce HTTPS. Install the workflow. Activate FormSubmit with one test submission. Then:
1. apply to AdSense, publish the Privacy & messaging CMP, and block gambling ad categories;
2. submit the sitemap to Search Console;
3. start the embed-outreach campaign."

**Launch acceptance:**
- the site resolves at `https://e.casino` and `https://e.casino/ads.txt` returns the publisher line;
- forms deliver to the inbox;
- the PayPal button opens checkout;
- the workflow's daily run is green.
