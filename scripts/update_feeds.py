#!/usr/bin/env python3
"""Refresh data/news.json from public news RSS feeds (stdlib only).

Runs daily in GitHub Actions. Keeps the previous file if every feed fails.
Promotional gambling content (bonuses, promo codes, picks) is filtered out so the
news page stays educational and advertiser-friendly.
"""
import datetime as dt
import email.utils
import json
import os
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "data", "news.json")
TOPICS = [
    ("Industry", "casino industry"),
    ("Regulation", "gambling regulation"),
    ("Player protection", "\"problem gambling\" OR \"responsible gambling\""),
    ("Research", "gambling research study"),
]
BLOCK = re.compile(r"bonus|free spins|promo code|no deposit|best (online )?casinos?|top \d+ casinos?|sign[- ]?up offer|"
                   r"odds boost|picks|prediction|parlay|best bets|betting tips|jackpot winner|how to win|sweepstakes casino", re.I)


def fetch(query):
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode(
        {"q": query + " when:7d", "hl": "en-US", "gl": "US", "ceid": "US:en"})
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (e.casino news refresher)"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def main():
    items, seen = [], set()
    for topic, q in TOPICS:
        try:
            root = ET.fromstring(fetch(q))
        except Exception as e:  # network or parse error: skip this topic
            print("feed failed:", topic, e)
            continue
        for it in root.iter("item"):
            title = (it.findtext("title") or "").strip()
            src_el = it.find("source")
            source = (src_el.text or "").strip() if src_el is not None else ""
            if source and title.endswith(" - " + source):
                title = title[: -len(source) - 3].strip()
            key = re.sub(r"\W+", "", title.lower())[:80]
            if not title or key in seen or BLOCK.search(title):
                continue
            seen.add(key)
            try:
                date = email.utils.parsedate_to_datetime(it.findtext("pubDate")).astimezone(dt.timezone.utc).isoformat()
            except Exception:
                date = ""
            items.append({"title": title, "link": it.findtext("link") or "", "source": source, "date": date, "topic": topic})
    if not items:
        print("no items fetched; keeping previous news.json")
        return
    items.sort(key=lambda x: x["date"], reverse=True)
    data = {"updated": dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes"), "items": items[:40]}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print("wrote", len(data["items"]), "headlines")


if __name__ == "__main__":
    main()
