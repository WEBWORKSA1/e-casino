#!/usr/bin/env python3
"""e.casino static site builder — Python 3 standard library only.

Sources (all optional — the built pages are self-describing, so the site can always be
re-templated from the HTML already in the repository):
  content/articles/<slug>.html   article fragments with a <!--meta {...} --> JSON header
  src/pages/**/<name>.html       page fragments (same header format)
  data/*.json                    glossary, videos, news, site data

Every generated page embeds its own meta (<script id="ec-meta">) and marks its body with
<!--ec:content--> ... <!--/ec:content-->. If a fragment is missing, the builder reads the
page back from the built HTML, so editing the HTML between the markers is a valid workflow.

Usage:  python3 scripts/build.py
"""
import datetime as dt
import glob
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SITE_URL = os.environ.get("SITE_URL", "https://e.casino").rstrip("/")
PUB = "ca-pub-6620975821265271"
TODAY = dt.date.today().isoformat()
VERSION = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%d")
ADSENSE = ('<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
           '?client=ca-pub-6620975821265271" crossorigin="anonymous"></script>')
CONTACT_URL = "https://web.works/contact"
TOPBAR_TEXT = ("Contact, if you are interested in this website / domain name / Sponsorship / "
               "Advertisement / Partnership")

CATEGORIES = {
    "casino-math": ("Casino Math", "The numbers behind every bet: house edge, EV, variance and probability."),
    "game-guides": ("Game Guides", "Rules, odds and optimal play for every major casino game."),
    "psychology": ("Psychology & Myths", "How casinos shape behavior, and the myths math destroys."),
    "responsible-gaming": ("Responsible Gaming", "Practical tools for keeping gambling a form of entertainment."),
    "industry": ("History & Industry", "How casinos began, how they make money and how they are regulated."),
}
PATHS = [
    ("Start here", "New to casino math? Read these six in order.",
     ["house-edge-explained", "expected-value-for-beginners", "blackjack-rules-beginners",
      "roulette-rules-and-odds", "gamblers-fallacy", "responsible-gambling-guide"]),
    ("Math deep-dive", "Variance, risk of ruin and why betting systems fail.",
     ["law-of-large-numbers-casino", "rtp-vs-volatility", "risk-of-ruin-bankroll",
      "martingale-system-math", "betting-systems-tested", "random-number-generators"]),
    ("Table-game mastery", "Optimal play for the games with the lowest edges.",
     ["blackjack-basic-strategy", "card-counting-explained", "craps-for-beginners",
      "baccarat-rules-strategy", "video-poker-basics", "poker-hand-rankings"]),
    ("Play safe", "Budgets, warning signs and the psychology working against you.",
     ["setting-gambling-budget", "signs-of-problem-gambling", "near-miss-effect", "casino-psychology-design"]),
]
LAB_INFO = {
    "blackjack-trainer": ("Blackjack Strategy Trainer", "games/blackjack-trainer/", "🂡", "Drill perfect basic strategy with instant feedback and a weak-spot map."),
    "roulette-simulator": ("Roulette & Betting-System Simulator", "games/roulette-simulator/", "🎡", "Run thousands of spins and watch Martingale meet the house edge."),
    "slot-simulator": ("Slot RTP & Volatility Simulator", "games/slot-simulator/", "🎰", "See what 96% RTP really means across thousands of sessions."),
    "dice-lab": ("Dice & Craps Probability Lab", "games/dice-lab/", "🎲", "Roll two dice thousands of times and compare against the math."),
    "coin-flip-lab": ("Coin-Flip Streak Lab", "games/coin-flip-lab/", "🪙", "Test the gambler's fallacy and try to fake randomness."),
    "poker-odds": ("Texas Hold'em Odds Calculator", "games/poker-odds/", "♠", "Monte Carlo equity for any hand against up to 9 opponents."),
    "house-edge-calculator": ("House Edge & Expected Loss Calculator", "tools/house-edge-calculator/", "📉", "What a session really costs, per hour and per year."),
    "odds-converter": ("Odds Converter & Vig Calculator", "tools/odds-converter/", "⇄", "Decimal, fractional, American and implied probability."),
    "bankroll-calculator": ("Bankroll & Risk-of-Ruin Calculator", "tools/bankroll-calculator/", "🛡", "Variance, chance of finishing ahead and risk of ruin."),
    "probability-calculator": ("“At Least Once” Probability Calculator", "tools/probability-calculator/", "％", "Chance of hitting at least once in N tries."),
}
NAV = [("learn", "Learn", "learn/"), ("games", "Free Labs", "games/"), ("tools", "Tools", "tools/"),
       ("videos", "Videos", "videos/"), ("contests", "Contests", "contests/"), ("rg", "Play Safe", "responsible-gaming/")]

META_RE = re.compile(r"<!--meta\s*(\{.*?\})\s*-->", re.S)
EMBED_META_RE = re.compile(r'<script type="application/json" id="ec-meta">(.*?)</script>', re.S)
CONTENT_RE = re.compile(r"<!--ec:content-->(.*?)<!--/ec:content-->", re.S)
ITEM_BREAK = re.compile(r'(?<!\n)(?=<(?:a class="card|article class="video-card|div class="gl-item|h2 class="letter|li>|li class|div class="card"|/dl>|dl>|ol>|/ol>))')
REGION_RE = re.compile(r"<!--ec:([a-z0-9-]+)-->(.*?)<!--/ec:\1-->", re.S)


def esc(s):
    return html.escape(str(s or ""), quote=True)


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)


def load_json(name, default):
    p = os.path.join(REPO, "data", name)
    try:
        return json.loads(read(p))
    except Exception:
        return default


def parse_fragment(text):
    m = META_RE.search(text)
    if not m:
        raise ValueError("missing meta block")
    return json.loads(m.group(1)), text[m.end():].strip()


def parse_built(text):
    m, c = EMBED_META_RE.search(text), CONTENT_RE.search(text)
    if not (m and c):
        return None
    return json.loads(m.group(1)), c.group(1).strip()


def out_file(path):
    if path.endswith(".html"):
        return os.path.join(REPO, path.lstrip("/"))
    return os.path.join(REPO, path.strip("/"), "index.html") if path != "/" else os.path.join(REPO, "index.html")


def depth_of(path):
    if path in ("/", "/404.html") or path.endswith(".html") and path.count("/") == 1:
        return 0
    return len([p for p in path.strip("/").split("/") if p])


# ----------------------------------------------------------------------------------------
# Collect pages
# ----------------------------------------------------------------------------------------
def collect():
    pages = {}
    # 1) built pages already in the repo (fallback source of truth)
    for f in glob.glob(os.path.join(REPO, "**", "index.html"), recursive=True) + [os.path.join(REPO, "404.html")]:
        if not os.path.exists(f) or "/node_modules/" in f:
            continue
        parsed = parse_built(read(f))
        if parsed:
            meta, body = parsed
            body = unprocess(body, "../" * depth_of(meta["path"]), meta.get("kind") == "article")
            pages[meta["path"]] = {"meta": meta, "body": body}
    # 2) page fragments override
    for f in glob.glob(os.path.join(REPO, "src", "pages", "**", "*.html"), recursive=True):
        meta, body = parse_fragment(read(f))
        meta.setdefault("kind", "page")
        pages[meta["path"]] = {"meta": meta, "body": body}
    # 3) article fragments override
    for f in sorted(glob.glob(os.path.join(REPO, "content", "articles", "*.html"))):
        slug = os.path.splitext(os.path.basename(f))[0]
        try:
            meta, body = parse_fragment(read(f))
        except Exception as e:  # keep building even if one article is malformed
            print("!! skipped", slug, e)
            continue
        meta.update({"kind": "article", "slug": slug, "path": "/learn/%s/" % slug})
        pages[meta["path"]] = {"meta": meta, "body": body}
    return pages


# ----------------------------------------------------------------------------------------
# Shared chrome
# ----------------------------------------------------------------------------------------
SVG_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
SVG_THEME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
SVG_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'


def header(root, nav):
    items = "".join('<li><a href="%s%s"%s>%s</a></li>' % (root, href, ' aria-current="page"' if key == nav else "", label)
                    for key, label, href in NAV)
    return f'''<a class="skip" href="#main">Skip to content</a>
<div class="topbar"><a href="{CONTACT_URL}" target="_blank" rel="noopener">{TOPBAR_TEXT} &rarr;</a></div>
<header class="site-header">
  <div class="wrap nav-row">
    <a class="logo" href="{root or './'}" aria-label="e.casino home"><span>e<b>.</b>casino</span><small>Casino Math Academy</small></a>
    <nav class="primary" aria-label="Primary"><ul>{items}</ul></nav>
    <div class="nav-actions">
      <button class="icon-btn" type="button" data-search-open aria-label="Search the site">{SVG_SEARCH}</button>
      <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch light or dark theme">{SVG_THEME}</button>
      <a class="btn btn-gold btn-sm" href="{root}partner/">Partner</a>
      <button class="icon-btn menu-btn" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">{SVG_MENU}</button>
    </div>
  </div>
  <nav id="mobile-nav" class="mobile-nav" aria-label="Mobile"></nav>
</header>'''


LEGAL_LINKS = [("About", "about/"), ("Contact", "contact/"), ("Editorial policy", "editorial-policy/"), ("Privacy", "privacy/"),
               ("Terms", "terms/"), ("Disclaimer &amp; trademarks", "disclaimer/"), ("Cookies", "cookies/"),
               ("Responsible gaming", "responsible-gaming/"), ("Sitemap", "sitemap/")]


def footer(root):
    legal = " · ".join('<a href="%s%s">%s</a>' % (root, h, t) for t, h in LEGAL_LINKS)
    return f'''<footer class="site-footer">
  <div class="wrap">
    <div id="footer-rich"></div>
    <nav class="footer-links" aria-label="Footer">{legal}</nav>
    <div class="footer-legal">
      <span>&copy; <span data-year>{dt.date.today().year}</span> e.casino. All rights reserved. Educational only &mdash; no real-money gambling, no affiliate links. 18+. Not affiliated with any casino operator or any business named &ldquo;eCasino&rdquo; or &ldquo;E-Casino&rdquo;. <a href="{root}disclaimer/">Trademark &amp; copyright disclosure</a>.</span>
      <span><a href="{CONTACT_URL}" target="_blank" rel="noopener">Domain, sponsorship &amp; partnership inquiries</a></span>
    </div>
  </div>
</footer>'''


# ----------------------------------------------------------------------------------------
# JSON-LD
# ----------------------------------------------------------------------------------------
def _img(name, fallback):
    """Prefer a rendered PNG when present (the workflow renders them from SVG), else the SVG."""
    return name if os.path.exists(os.path.join(REPO, "assets", "img", name)) else fallback


OG_IMG = _img("og-image.png", "og-image.svg")
LOGO_IMG = _img("logo-512.png", "logo.svg")
ORG = {"@type": "Organization", "name": "e.casino", "url": SITE_URL + "/",
       "logo": {"@type": "ImageObject", "url": SITE_URL + "/assets/img/" + LOGO_IMG}}


def ld(obj):
    return '<script type="application/ld+json">%s</script>' % json.dumps(obj, ensure_ascii=False, indent=0).replace("</", "<\\/")


def crumbs_ld(crumbs):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE_URL + u} for i, (n, u) in enumerate(crumbs)]}


def faq_ld(faq):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q["q"], "acceptedAnswer": {"@type": "Answer", "text": q["a"]}} for q in faq]}


# ----------------------------------------------------------------------------------------
# Page shell
# ----------------------------------------------------------------------------------------
def shell(meta, inner, root, extra_ld=()):
    path = meta["path"]
    title = meta["title"] if meta.get("rawTitle") else "%s | e.casino" % meta["title"]
    desc = meta.get("description", "")
    canon = SITE_URL + ("/" if path == "/" else path)
    robots = "noindex,follow" if meta.get("noindex") else "index,follow,max-image-preview:large"
    ads = meta.get("ads", True)
    og_type = "article" if meta.get("kind") == "article" else "website"
    scripts = "".join('<script src="%sassets/js/%s?v=%s" defer></script>' % (root, s, VERSION) for s in meta.get("scripts", []))
    lds = [ld(x) for x in extra_ld]
    if meta.get("crumbs"):
        lds.append(ld(crumbs_ld([("Home", "/")] + [tuple(c) for c in meta["crumbs"]])))
    if meta.get("faq") and meta.get("kind") != "article":
        lds.append(ld(faq_ld(meta["faq"])))
    base_fix = ""
    if path == "/404.html":  # served at arbitrary depths: compute base at runtime
        base_fix = ("<script>(function(){var h=location.hostname,p=location.pathname.split('/');"
                    "var b=/github\\.io$/.test(h)&&p[1]?'/'+p[1]+'/':'/';document.write('<base href=\"'+b+'\">');})();</script>")
    stored = dict(meta)
    meta_json = json.dumps(stored, ensure_ascii=False, indent=0).replace("</", "<\\/")
    body_class = meta.get("bodyClass", "") + (" is-article" if meta.get("kind") == "article" else "")
    return f'''<!doctype html>
<html lang="en" data-root="{root}" data-theme="dark">
<head>
{base_fix}<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{canon}">
<meta name="robots" content="{robots}">
<meta name="google-adsense-account" content="{PUB}">
<meta name="theme-color" content="#0a0f1c">
<meta property="og:site_name" content="e.casino">
<meta property="og:type" content="{og_type}">
<meta property="og:title" content="{esc(meta.get('ogTitle', meta.get('h1', meta['title'])))}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{SITE_URL}/assets/img/{OG_IMG}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{root}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{root}assets/img/{LOGO_IMG}">
<link rel="manifest" href="{root}site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;family=Sora:wght@600;700;800&amp;display=swap">
<link rel="stylesheet" href="{root}assets/css/site.css?v={VERSION}">
<script>(function(){{try{{var t=JSON.parse(localStorage.getItem('ec:theme'));}}catch(e){{}}if(!t)t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.setAttribute('data-theme',t);}})();</script>
{ADSENSE if ads else "<!-- ads disabled on this page -->"}
{"".join(lds)}
<script type="application/json" id="ec-meta">{meta_json}</script>
</head>
<body class="{body_class}">
{header(root, meta.get("nav"))}
<main id="main">
{inner}
</main>
{footer(root)}
<script src="{root}assets/js/config.js?v={VERSION}" defer></script>
<script src="{root}assets/js/site.js?v={VERSION}" defer></script>
{scripts}
</body>
</html>
'''


# ----------------------------------------------------------------------------------------
# Regions generated from data (refilled on every build)
# ----------------------------------------------------------------------------------------
def article_card(a, root):
    m = a["meta"]
    cat = CATEGORIES.get(m.get("category"), ("Guide", ""))[0]
    return ('<a class="card card-link" href="%slearn/%s/" data-cat="%s">'
            '<div class="tags"><span class="badge badge-brand">%s</span><span class="badge">%s min</span></div>'
            '<h3>%s</h3><p class="muted">%s</p><span class="go">Read guide &rarr;</span></a>') % (
        root, m["slug"], esc(m.get("category")),
        esc(cat), m.get("readingMinutes", 6), esc(m.get("h1", m["title"])), esc(m.get("description", "")))


def lab_card(key, root):
    t, href, icon, d = LAB_INFO[key]
    return ('<a class="card card-link" href="%s%s"><div class="card-icon" aria-hidden="true">%s</div><h3>%s</h3>'
            '<p class="muted">%s</p><span class="go">Open &rarr;</span></a>') % (root, href, icon, esc(t), esc(d))


def video_card(v, root):
    return ('<article class="video-card" data-cat="%s"><button class="yt" type="button" data-id="%s" aria-label="Play: %s"><span class="play"></span></button>'
            '<div class="body"><div class="tags"><span class="badge">%s</span></div><h3>%s</h3><p class="muted" style="font-size:.9rem;margin:0">%s · %s</p></div></article>') % (
        esc(v["tag"]), esc(v["id"]), esc(v["title"]), esc(v["tag"].replace("-", " ")), esc(v["title"]), esc(v["channel"]), esc(v.get("why", "")))


def news_items(news, n):
    out = []
    for it in (news.get("items") or [])[:n]:
        d = it.get("date", "")[:10]
        out.append('<li><a href="%s" target="_blank" rel="noopener nofollow">%s</a><small>%s%s%s</small></li>' % (
            esc(it.get("link")), esc(it.get("title")), esc(it.get("source", "")), (" · " + d) if d else "",
            (" · " + esc(it.get("topic"))) if it.get("topic") else ""))
    return "".join(out)


def fill_regions(body, ctx, root):
    articles, videos, news, glossary = ctx["articles"], ctx["videos"], ctx["news"], ctx["glossary"]

    def region(m):
        key = m.group(1)
        if key == "latest-articles":
            items = sorted(articles.values(), key=lambda a: (a["meta"].get("updated", ""), a["meta"]["slug"]), reverse=True)[:6]
            inner = "".join(article_card(a, root) for a in items)
        elif key == "all-articles":
            items = sorted(articles.values(), key=lambda a: (list(CATEGORIES).index(a["meta"].get("category", "casino-math")) if a["meta"].get("category") in CATEGORIES else 9, a["meta"].get("h1", "")))
            inner = "".join(article_card(a, root) for a in items)
        elif key == "learning-paths":
            blocks = []
            for title, sub, slugs in PATHS:
                lis = "".join('<li><a href="%slearn/%s/">%s</a></li>' % (root, s, esc(articles["/learn/%s/" % s]["meta"].get("h1", articles["/learn/%s/" % s]["meta"]["title"])))
                              for s in slugs if "/learn/%s/" % s in articles)
                blocks.append('<div class="card"><h3>%s</h3><p class="muted">%s</p><ol>%s</ol></div>' % (esc(title), esc(sub), lis))
            inner = '<div class="grid g4">%s</div>' % "".join(blocks)
        elif key == "category-counts":
            inner = "".join('<button class="chip" type="button" data-filter="%s">%s (%d)</button>' % (
                k, v[0], sum(1 for a in articles.values() if a["meta"].get("category") == k)) for k, v in CATEGORIES.items())
        elif (key == "videos" or re.match(r"videos-\d+$", key)) and not videos:
            return m.group(0)
        elif key == "videos" or re.match(r"videos-\d+$", key):
            n = int(key.split("-")[1]) if "-" in key else 999
            inner = "".join(video_card(v, root) for v in videos[:n])
        elif (key == "news" or re.match(r"news-\d+$", key)) and not news.get("items") and m.group(2).strip():
            return m.group(0)
        elif key == "news" or re.match(r"news-\d+$", key):
            n = int(key.split("-")[1]) if "-" in key else 40
            inner = news_items(news, n) or ('<li class="muted">Fresh headlines load here automatically each day. '
                                            'Meanwhile, see the research and regulator sources below.</li>')
        elif key == "news-updated":
            inner = esc(news.get("updated", "")[:16].replace("T", " ")) or "pending first refresh"
        elif key in ("glossary", "glossary-count") and not glossary:
            return m.group(0)  # no data file: keep what the page already has
        elif key == "glossary":
            inner = glossary_html(glossary)
        elif key == "glossary-count":
            inner = str(len(glossary))
        elif key == "article-count":
            inner = str(len(articles))
        elif key == "sitemap-list":
            inner = ctx["sitemap_html"]
        else:
            return m.group(0)
        inner = ITEM_BREAK.sub("\n", inner)  # one item per line keeps files diff- and tool-friendly
        return "<!--ec:%s-->%s<!--/ec:%s-->" % (key, inner, key)
    return REGION_RE.sub(region, body)


def glossary_html(terms):
    if not terms:
        return '<p class="muted">Glossary loading.</p>'
    letters, out, cur = [], [], None
    for t in sorted(terms, key=lambda x: x["term"].lower()):
        L = t["term"][0].upper()
        if not L.isalpha():
            L = "#"
        if L != cur:
            if cur is not None:
                out.append("</dl>")
            out.append('<h2 class="letter" id="letter-%s">%s</h2><dl>' % (L.lower() if L != "#" else "num", L))
            letters.append(L)
            cur = L
        out.append('<div class="gl-item"><dt id="%s">%s</dt><dd>%s</dd></div>' % (esc(t["id"]), esc(t["term"]), esc(t["def"])))
    out.append("</dl>")
    az = "".join('<a href="#letter-%s">%s</a>' % (L.lower() if L != "#" else "num", L) for L in letters)
    return '<nav class="az" aria-label="Jump to letter">%s</nav>%s' % (az, "".join(out))


# ----------------------------------------------------------------------------------------
# Article page
# ----------------------------------------------------------------------------------------
def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def render_article(page, ctx, root):
    m, body = page["meta"], page["body"]
    cat_label = CATEGORIES.get(m.get("category"), ("Guides", ""))[0]
    body = body.replace("{{ROOT}}", root)
    # make sure every h2 has an id; build TOC
    toc = []

    def fix_h2(mm):
        attrs, text = mm.group(1), mm.group(2)
        idm = re.search(r'id="([^"]+)"', attrs)
        hid = idm.group(1) if idm else slugify(re.sub("<[^>]+>", "", text))
        toc.append((hid, re.sub("<[^>]+>", "", text)))
        return '<h2 id="%s">%s</h2>' % (hid, text)
    body = re.sub(r"<h2([^>]*)>(.*?)</h2>", fix_h2, body, flags=re.S)
    body = re.sub(r"<table", '<div class="table-wrap"><table', body)
    body = re.sub(r"</table>", "</table></div>", body)
    # one optional manual ad unit before the third h2 (renders only when configured)
    parts = re.split(r"(?=<h2 )", body)
    if len(parts) > 3:
        parts.insert(3, '<div class="ad-slot" data-slot="inArticle"></div>')
    body = "".join(parts)
    toc_html = "".join('<li><a href="#%s">%s</a></li>' % (esc(h), esc(t)) for h, t in toc)
    updated = m.get("updated", TODAY)
    try:
        upd_h = dt.date.fromisoformat(updated).strftime("%b %-d, %Y")
    except Exception:
        upd_h = updated
    take = "".join("<li>%s</li>" % esc(x) for x in m.get("summary", []))
    faq = m.get("faq", [])
    faq_html = "".join('<details><summary>%s</summary><div><p>%s</p></div></details>' % (esc(q["q"]), esc(q["a"])) for q in faq)
    rel = [ctx["articles"].get("/learn/%s/" % s) for s in m.get("related", [])]
    rel = [r for r in rel if r][:3]
    if len(rel) < 3:
        same = [a for a in ctx["articles"].values() if a["meta"].get("category") == m.get("category") and a["meta"]["slug"] != m["slug"] and a not in rel]
        rel += same[: 3 - len(rel)]
    rel_html = "\n".join(article_card(a, root) for a in rel)
    tool = m.get("tool")
    tool_html = ""
    if tool in LAB_INFO:
        t, href, icon, d = LAB_INFO[tool]
        tool_html = ('<div class="band mt3"><div><span class="badge badge-brand">Free lab · no money</span><h2 class="mt1" style="margin-top:10px">%s</h2>'
                     '<p class="muted mb0">%s Put this guide into practice right now.</p></div><div><a class="btn btn-primary btn-lg btn-block" href="%s%s">%s Open the lab</a></div></div>') % (
            esc(t), esc(d), root, href, icon)
    side_tool = lab_card(tool, root) if tool in LAB_INFO else lab_card("house-edge-calculator", root)
    crumbs = [("Learn", "/learn/"), (cat_label, "/learn/#%s" % m.get("category", "")), (m.get("h1", m["title"]), m["path"])]
    m["crumbs"] = crumbs
    inner = f'''<div class="wrap section-tight">
<div class="article-layout">
<article>
  <ol class="breadcrumb" aria-label="Breadcrumb"><li><a href="{root or './'}">Home</a></li><li><a href="{root}learn/">Learn</a></li><li><a href="{root}learn/#{esc(m.get('category'))}">{esc(cat_label)}</a></li></ol>
  <div class="tags"><span class="badge badge-brand">{esc(cat_label)}</span><span class="badge">Math-checked</span><span class="badge">No affiliate links</span></div>
  <h1>{esc(m.get("h1", m["title"]))}</h1>
  <p class="lead">{esc(m.get("description", ""))}</p>
  <div class="article-meta"><span>By <a href="{root}about/">e.casino Editorial Team</a></span><span>Updated <time datetime="{esc(updated)}">{esc(upd_h)}</time></span><span>{m.get("readingMinutes", 6)} min read</span></div>
  <div class="share mt1 no-print"><button class="btn btn-ghost btn-sm" data-share="x" type="button">Share on X</button><button class="btn btn-ghost btn-sm" data-share="facebook" type="button">Facebook</button><button class="btn btn-ghost btn-sm" data-share="linkedin" type="button">LinkedIn</button><button class="btn btn-ghost btn-sm" data-share="copy" type="button">Copy link</button></div>
  {('<section class="takeaways" aria-label="Key takeaways"><h2>Key takeaways</h2><ul>%s</ul></section>' % take) if take else ""}
  <details class="toc toc-inline card"><summary><strong>On this page</strong></summary><ol class="mt1">{toc_html}</ol></details>
  <div class="prose">
<!--ec:content-->
{page["body"]}
<!--/ec:content-->
  </div>
  {tool_html}
  {('<section class="faq mt3"><h2>Frequently asked questions</h2>%s</section>' % faq_html) if faq_html else ""}
  <div class="ad-slot" data-slot="articleEnd"></div>
  <div class="card mt3 author-box"><div class="author-avatar" aria-hidden="true">e</div><div><strong>e.casino Editorial Team</strong><p class="muted mb0" style="font-size:.93rem">Every figure in this guide is derived from first principles or standard published game math and cross-checked in our simulators. We take no money from casinos and publish no affiliate links. Spotted an error? <a href="{root}contact/?topic=Correction">Send a correction</a> — see our <a href="{root}editorial-policy/">editorial policy</a>.</p></div></div>
  <section class="mt3"><h2>Keep learning</h2><div class="grid g3">{rel_html}</div></section>
  <div class="rg-strip mt3"><span class="age-badge">18+</span><span><strong>Educational content only.</strong> e.casino offers no real-money gambling. If gambling is causing problems for you or someone you know, <a href="{root}responsible-gaming/#help">free, confidential help is available 24/7</a>.</span></div>
</article>
<aside class="sidebar" aria-label="Sidebar">
  <div class="card toc" id="side-toc"><strong>On this page</strong></div>
  {side_tool}
  <div class="ad-slot" data-slot="sidebar"></div>
  <div class="card card-gold"><span class="badge badge-gold">Free kit</span><h3 class="mt1">Printable strategy card</h3><p class="muted" style="font-size:.92rem">Blackjack chart + house-edge cheat sheet.</p><a class="btn btn-gold btn-sm btn-block" href="{root}academy/">Get it free</a></div>
</aside>
</div>
</div>'''
    # store body (not the processed one) so rebuilds round-trip; the visible prose uses processed body
    inner = inner.replace(page["body"], body, 1)
    art_ld = {"@context": "https://schema.org", "@type": "Article", "headline": m.get("h1", m["title"]),
              "description": m.get("description", ""), "datePublished": m.get("published", updated), "dateModified": updated,
              "author": {"@type": "Organization", "name": "e.casino Editorial Team", "url": SITE_URL + "/about/"},
              "publisher": ORG, "mainEntityOfPage": SITE_URL + m["path"], "image": SITE_URL + "/assets/img/" + OG_IMG,
              "articleSection": cat_label, "isAccessibleForFree": True}
    lds = [art_ld]
    return inner, lds


# ----------------------------------------------------------------------------------------
# Generic page
# ----------------------------------------------------------------------------------------
def render_page(page, ctx, root):
    m = page["meta"]
    shown = fill_regions(page["body"], ctx, root).replace("{{ROOT}}", root)
    inner = "<!--ec:content-->\n%s\n<!--/ec:content-->" % shown
    lds = []
    if m["path"] == "/":
        lds = [dict({"@context": "https://schema.org"}, **ORG),
               {"@context": "https://schema.org", "@type": "WebSite", "name": "e.casino", "url": SITE_URL + "/",
                "description": m.get("description", "")}]
    for s in m.get("schema", []):
        if s == "WebApplication":
            lds.append({"@context": "https://schema.org", "@type": "WebApplication", "name": m.get("h1", m["title"]),
                        "url": SITE_URL + m["path"], "applicationCategory": "EducationalApplication", "operatingSystem": "Any",
                        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}, "description": m.get("description", "")})
        elif s in ("AboutPage", "ContactPage", "CollectionPage"):
            lds.append({"@context": "https://schema.org", "@type": s, "name": m.get("h1", m["title"]), "url": SITE_URL + m["path"]})
    return inner, lds


# ----------------------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------------------
def glossary_from_page():
    """Recover glossary terms from the built glossary page when data/glossary.json is absent."""
    p = os.path.join(REPO, "glossary", "index.html")
    if not os.path.exists(p):
        return []
    return [{"id": i, "term": html.unescape(t), "def": html.unescape(d)} for i, t, d in
            re.findall(r'<dt id="([^"]+)">(.*?)</dt><dd>(.*?)</dd>', read(p), re.S)]


def unprocess(body, root, article=False):
    """Undo render-time processing on a body re-read from built HTML, so rebuilds round-trip."""
    if article:  # only articles get table wrappers and an in-article ad slot added at render time
        body = body.replace('<div class="table-wrap"><table', "<table").replace("</table></div>", "</table>")
        body = body.replace('<div class="ad-slot" data-slot="inArticle"></div>', "")
    if not root:
        return body
    return re.sub(r'((?:href|src)=")' + re.escape(root), r"\1{{ROOT}}", body)


def main():
    pages = collect()
    articles = {k: v for k, v in pages.items() if v["meta"].get("kind") == "article"}
    ctx = {"articles": articles, "videos": load_json("videos.json", []), "news": load_json("news.json", {"items": []}),
           "glossary": load_json("glossary.json", []) or glossary_from_page()}
    # HTML sitemap
    groups = {}
    for p in pages.values():
        m = p["meta"]
        if m.get("noindex"):
            continue
        g = "Guides" if m.get("kind") == "article" else m.get("group", "Pages")
        groups.setdefault(g, []).append((m.get("h1", m["title"]), m["path"]))
    ctx["sitemap_html"] = "".join('<div class="card"><h2 style="font-size:1.15rem">%s</h2><ul>%s</ul></div>' % (
        esc(g), "".join('<li><a href="{{ROOT}}%s">%s</a></li>' % (u.lstrip("/"), esc(t)) for t, u in sorted(items)))
        for g, items in sorted(groups.items()))
    search = []
    urls = []
    for path, page in sorted(pages.items()):
        m = page["meta"]
        root = "../" * depth_of(path)
        if m.get("embedOf") and m["embedOf"] in pages:
            page["body"] = pages[m["embedOf"]]["body"]
        if m.get("kind") == "article":
            inner, lds = render_article(page, ctx, root)
        else:
            inner, lds = render_page(page, ctx, root)
        write(out_file(path), shell(m, inner, root, lds))
        if not m.get("noindex"):
            cat = CATEGORIES.get(m.get("category"), (m.get("group", "Page"),))[0]
            search.append({"t": m.get("h1", m["title"]), "d": m.get("description", ""), "u": "" if path == "/" else path.lstrip("/"),
                           "c": cat, "k": " ".join(m.get("keywords", []))})
            urls.append((path, m.get("updated", TODAY), m.get("priority", 0.8 if m.get("kind") == "article" else 0.6)))
    for t in ctx["glossary"]:
        search.append({"t": t["term"], "d": t["def"][:70], "u": "glossary/#" + t["id"], "c": "Glossary"})
    write(os.path.join(REPO, "data", "search-index.json"), "[\n" + ",\n".join(json.dumps(x, ensure_ascii=False, separators=(",", ":")) for x in search) + "\n]\n")
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, lastmod, pr in sorted(urls, key=lambda x: (-x[2], x[0])):
        if path.endswith(".html"):
            continue
        sm.append("  <url><loc>%s%s</loc><lastmod>%s</lastmod><priority>%.1f</priority></url>" % (SITE_URL, path, lastmod[:10], pr))
    sm.append("</urlset>")
    write(os.path.join(REPO, "sitemap.xml"), "\n".join(sm) + "\n")
    write(os.path.join(REPO, "robots.txt"), "User-agent: *\nAllow: /\nDisallow: /scripts/\nDisallow: /blueprint/\nDisallow: /src/\nDisallow: /content/\nDisallow: /embed/\nDisallow: /thank-you/\n\nSitemap: %s/sitemap.xml\n" % SITE_URL)
    write(os.path.join(REPO, "ads.txt"), "google.com, pub-6620975821265271, DIRECT, f08c47fec0942fa0\n")
    print("built %d pages (%d articles), %d search entries" % (len(pages), len(articles), len(search)))


if __name__ == "__main__":
    main()
