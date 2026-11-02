/* e.casino Blackjack Strategy Trainer — 4-8 decks, S17, DAS, no surrender. © e.casino */
(function () {
  "use strict";
  var EC = window.EC, $ = EC.$;
  var UP = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "A"];
  var HARD = { 8: "HHHHHHHHHH", 9: "HDDDDHHHHH", 10: "DDDDDDDDHH", 11: "DDDDDDDDDH", 12: "HHSSSHHHHH", 13: "SSSSSHHHHH", 14: "SSSSSHHHHH", 15: "SSSSSHHHHH", 16: "SSSSSHHHHH", 17: "SSSSSSSSSS" };
  var SOFT = { 2: "HHHDDHHHHH", 3: "HHHDDHHHHH", 4: "HHDDDHHHHH", 5: "HHDDDHHHHH", 6: "HDDDDHHHHH", 7: "SDDDDSSHHH", 8: "SSSSSSSSSS", 9: "SSSSSSSSSS" };
  var PAIRS = { "2": "PPPPPPHHHH", "3": "PPPPPPHHHH", "4": "HHHPPHHHHH", "5": "DDDDDDDDHH", "6": "PPPPPHHHHH", "7": "PPPPPPHHHH", "8": "PPPPPPPPPP", "9": "PPPPPSPPSS", "T": "SSSSSSSSSS", "A": "PPPPPPPPPP" };
  var BUST = { "2": 35, "3": 38, "4": 40, "5": 43, "6": 42, "7": 26, "8": 24, "9": 23, "T": 21, "A": 12 };
  var NAMES = { H: "Hit", S: "Stand", D: "Double", P: "Split" };
  var SUITS = ["♠", "♥", "♦", "♣"];

  var state = { cards: null, up: null, cat: null, answer: null, key: null, done: false, ch: null };
  var stats = EC.store.get("bj-stats", null) || { n: 0, c: 0, streak: 0, best: 0, cats: { hard: [0, 0], soft: [0, 0], pairs: [0, 0] }, miss: {} };

  function val(r) { return r === "A" ? 11 : r === "T" ? 10 : parseInt(r, 10); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function face(r) { return r === "T" ? ["10", "J", "Q", "K"][rnd(4)] : r; }
  function cardEl(r, delay) {
    var s = SUITS[rnd(4)], red = s === "♥" || s === "♦", f = face(r);
    var d = document.createElement("div");
    d.className = "pcard deal" + (red ? " red" : ""); d.style.animationDelay = (delay || 0) + "ms";
    d.innerHTML = "<span>" + f + "</span><span class='s'>" + s + "</span><span class='r2'>" + f + "</span>";
    d.setAttribute("aria-label", f + " of " + { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" }[s]);
    return d;
  }
  function drawUp() { var w = rnd(13); return w >= 8 && w <= 11 ? "T" : w === 12 ? "A" : UP[w]; }

  function deal(mode) {
    var cat = mode;
    if (mode === "all" || mode === "challenge") { var x = Math.random(); cat = x < 0.5 ? "hard" : x < 0.75 ? "soft" : "pairs"; }
    var a, b;
    if (cat === "pairs") { a = b = UP[rnd(10)]; }
    else if (cat === "soft") { a = "A"; b = UP[rnd(8)]; }
    else {
      do { a = UP[rnd(9)]; b = UP[rnd(9)]; } while (a === b || val(a) + val(b) > 19 || (val(a) === 10 && val(b) === 10));
    }
    return { cards: Math.random() < 0.5 ? [a, b] : [b, a], cat: cat };
  }
  function lookup(cards, up) {
    var col = UP.indexOf(up), a = cards[0], b = cards[1];
    if (a === b) return { row: "P" + a, act: PAIRS[a][col], cat: "pairs" };
    if (a === "A" || b === "A") { var o = a === "A" ? b : a; return { row: "A" + o, act: SOFT[val(o)][col], cat: "soft" }; }
    var t = val(a) + val(b), r = t <= 8 ? 8 : t >= 17 ? 17 : t;
    return { row: "H" + r, act: HARD[r][col], cat: "hard", total: t };
  }
  function totalText(cards) {
    var a = cards[0], b = cards[1];
    if (a === b) return "pair of " + (a === "T" ? "10s" : a === "A" ? "aces" : a + "s");
    if (a === "A" || b === "A") { var o = a === "A" ? b : a; return "soft " + (11 + val(o)); }
    return "hard " + (val(a) + val(b));
  }
  function why(L, cards, up) {
    var upN = up === "T" ? "10" : up === "A" ? "an ace" : "a " + up, bust = BUST[up], act = L.act, weak = "23456".indexOf(up) >= 0;
    if (L.cat === "pairs") {
      var p = cards[0];
      if (p === "A") return "Always split aces: each ace starts a fresh hand with a strong chance at 21, instead of one clumsy soft 12.";
      if (p === "8") return "Always split 8s: 16 is the worst total in blackjack. Two hands starting from 8 lose far less.";
      if (p === "T") return "Never split 10s: a 20 wins most of the time. Breaking it up throws away a near-certain winner.";
      if (p === "5") return "Never split 5s — play them as a hard 10, which is a great doubling hand against " + upN + ".";
      if (p === "9") return act === "S" ? "Stand on 9-9 vs " + upN + ": your 18 already beats the dealer's most likely result here." : "Split 9s vs " + upN + ": two hands starting at 9 out-earn a single 18 against this upcard.";
      return act === "P" ? "Split vs " + upN + ": the dealer busts about " + bust + "% of the time, so putting more money out on two decent starts pays." : "Don't split vs " + upN + ": the dealer is strong, and two weak hands would just lose twice. " + (act === "D" ? "Double instead." : "Hit instead.");
    }
    if (L.cat === "soft") {
      if (act === "D") return "Double: a soft hand can't bust on one card, and the dealer's " + upN + " busts about " + bust + "% of the time. Get more money out while the dealer is weak.";
      if (act === "S") return L.row === "A7" ? "Stand on soft 18 vs " + upN + ": 18 holds its own here, and doubling doesn't add enough." : "Stand: soft 19 or better is already a strong total.";
      return "Hit: this soft total is too weak to stand on, and you can't bust with the next card.";
    }
    var t = L.total;
    if (t >= 17) return "Stand: with hard 17 or more, the risk of busting outweighs anything a hit could gain.";
    if (t <= 8) return "Hit: you can't bust on the next card, and this total is too low to stand on.";
    if (act === "D") return "Double: you're the favorite here (" + t + " vs " + upN + "), so getting more money out maximizes expected value.";
    if (t === 11 && up === "A") return "Hit (don't double) 11 vs an ace in a multi-deck, stand-on-soft-17 game: the ace is too strong, so doubling is slightly worse than hitting.";
    if (t >= 12 && act === "S") return "Stand: the dealer must draw to 17 with " + upN + " showing and busts about " + bust + "% of the time. Let the dealer take the risk.";
    if (t === 12 && weak) return "Hit 12 vs " + upN + ": only a 10-value card (about 31% of the deck) busts you, and the dealer's " + up + " busts less often than a 4, 5 or 6.";
    if (t >= 12) return "Hit: against " + upN + " the dealer will usually make 17–21, so standing on " + t + " loses more often than the risk of busting.";
    return "Hit: " + t + " is too weak to double against " + upN + ".";
  }

  /* ---------- chart ---------- */
  function chart() {
    var head = "<tr><th></th>" + UP.map(function (u) { return "<th>" + (u === "T" ? "10" : u) + "</th>"; }).join("") + "</tr>";
    function tbl(title, rows) {
      return '<div class="table-wrap"><table class="data strat-table"><caption>' + title + "</caption><thead>" + head + "</thead><tbody>" +
        rows.map(function (r) { return "<tr><th>" + r[0] + "</th>" + r[2].split("").map(function (a, i) { return '<td class="' + a + '" data-cell="' + r[1] + "-" + UP[i] + '">' + a + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
    }
    var hard = [[ "5–8", "H8", HARD[8]]].concat([9, 10, 11, 12, 13, 14, 15, 16].map(function (t) { return [String(t), "H" + t, HARD[t]]; })).concat([["17+", "H17", HARD[17]]]);
    var soft = [2, 3, 4, 5, 6, 7, 8, 9].map(function (o) { return ["A," + o, "A" + o, SOFT[o]]; });
    var pairs = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "A"].map(function (p) { var l = p === "T" ? "10" : p; return [l + "," + l, "P" + p, PAIRS[p]]; });
    $("#bj-chart").innerHTML = tbl("Hard totals", hard) + tbl("Soft totals", soft) + tbl("Pairs", pairs);
  }
  function highlight(key) {
    EC.$$("#bj-chart td.hit-cell").forEach(function (td) { td.classList.remove("hit-cell"); });
    if (!key) return; var td = document.querySelector('#bj-chart td[data-cell="' + key + '"]'); if (td) td.classList.add("hit-cell");
  }

  /* ---------- render ---------- */
  function newHand() {
    var mode = $("#bj-mode").value;
    if (mode === "challenge" && state.ch && state.ch.i >= 50) return;
    var h = deal(mode), up = drawUp();
    var L = lookup(h.cards, up);
    state.cards = h.cards; state.up = up; state.cat = L.cat; state.answer = L.act; state.key = L.row + "-" + up; state.done = false; state.L = L;
    var d = $("#bj-dealer"), p = $("#bj-player");
    d.innerHTML = ""; p.innerHTML = "";
    d.appendChild(cardEl(up, 0)); var hole = document.createElement("div"); hole.className = "pcard back deal"; hole.style.animationDelay = "80ms"; d.appendChild(hole);
    p.appendChild(cardEl(h.cards[0], 140)); p.appendChild(cardEl(h.cards[1], 220));
    $("#bj-total").textContent = totalText(h.cards);
    EC.$$(".action-btn").forEach(function (b) { b.classList.remove("right", "wrong"); b.disabled = false; });
    var fb = $("#bj-feedback"); fb.className = "feedback"; fb.textContent = "What's the best play?";
    if (!$("#bj-hide").checked) highlight(null);
  }
  function answer(act) {
    if (state.done || !state.answer) return;
    state.done = true;
    var ok = act === state.answer, cat = state.cat;
    stats.n++; stats.cats[cat][1]++;
    if (ok) { stats.c++; stats.cats[cat][0]++; stats.streak++; stats.best = Math.max(stats.best, stats.streak); }
    else { stats.streak = 0; stats.miss[state.key] = (stats.miss[state.key] || 0) + 1; }
    EC.store.set("bj-stats", stats);
    EC.$$(".action-btn").forEach(function (b) {
      var a = b.getAttribute("data-act");
      if (a === state.answer) b.classList.add("right"); else if (a === act) b.classList.add("wrong");
    });
    var fb = $("#bj-feedback");
    fb.className = "feedback " + (ok ? "ok" : "no");
    fb.innerHTML = (ok ? "<strong>✓ Correct — " + NAMES[state.answer] + ".</strong> " : "<strong>✗ The best play is " + NAMES[state.answer] + ".</strong> ") + EC.esc(why(state.L, state.cards, state.up));
    highlight(state.key);
    if (state.ch) challengeStep(ok);
    kpis(); leaks();
    var mode = $("#bj-mode").value;
    if ((ok && $("#bj-auto").checked) || mode === "challenge") setTimeout(function () { if (state.done) newHand(); }, ok ? 900 : 1600);
  }
  function kpis() {
    $("#k-hands").textContent = stats.n;
    $("#k-acc").textContent = stats.n ? Math.round(stats.c / stats.n * 1000) / 10 + "%" : "—";
    $("#k-streak").textContent = stats.streak; $("#k-best").textContent = stats.best;
  }
  function leaks() {
    var box = $("#bj-leaks"); if (!stats.n) return;
    var rows = ["hard", "soft", "pairs"].map(function (k) {
      var c = stats.cats[k], acc = c[1] ? c[0] / c[1] : null;
      return '<div class="leak"><span>' + k[0].toUpperCase() + k.slice(1) + '</span><div class="meter-bar"><i style="width:' + (acc === null ? 0 : acc * 100) + '%;background:' + (acc !== null && acc < 0.9 ? "var(--red)" : "var(--brand)") + '"></i></div><b>' + (acc === null ? "—" : Math.round(acc * 100) + "%") + "</b></div>";
    }).join("");
    var top = Object.keys(stats.miss).sort(function (a, b) { return stats.miss[b] - stats.miss[a]; }).slice(0, 4).map(function (k) {
      var parts = k.split("-"), r = parts[0], up = parts[1], label = r[0] === "H" ? "Hard " + (r.slice(1) === "8" ? "≤8" : r.slice(1) === "17" ? "17+" : r.slice(1)) : r[0] === "A" ? "Soft A," + r.slice(1) : "Pair " + (r.slice(1) === "T" ? "10s" : r.slice(1) + "s");
      return "<li>" + label + " vs " + (up === "T" ? "10" : up) + " — missed " + stats.miss[k] + "×</li>";
    }).join("");
    box.innerHTML = rows + (top ? '<p class="mt1 mb0" style="font-size:.9rem"><strong>Most-missed spots</strong></p><ul style="font-size:.9rem;margin:6px 0 0;padding-left:1.2em">' + top + "</ul>" : "");
  }
  /* ---------- challenge ---------- */
  function startChallenge() { state.ch = { i: 0, c: 0, t0: Date.now() }; $("#bj-challenge").hidden = false; $("#bj-cresult").innerHTML = ""; challengeUI(); }
  function challengeStep(ok) {
    state.ch.i++; if (ok) state.ch.c++; challengeUI();
    if (state.ch.i >= 50) {
      var secs = Math.round((Date.now() - state.ch.t0) / 1000), acc = Math.round(state.ch.c / 50 * 1000) / 10;
      var month = new Date().toISOString().slice(0, 7);
      var code = EC.scoreCode("BJ", { acc: acc, c: state.ch.c, s: secs, m: month });
      $("#bj-cresult").innerHTML = '<div class="result-box"><span class="badge badge-gold">Challenge complete</span><h3 class="mt1">' + state.ch.c + "/50 correct · " + acc + "% · " + secs + 's</h3><p class="muted">Your score code:</p><div class="row"><code id="bj-code" style="font-size:1rem">' + code + '</code><button class="btn btn-ghost btn-sm" type="button" data-copy-text="' + code + '">Copy</button></div><div class="row mt2"><a class="btn btn-primary" href="' + EC.root + "contests/?challenge=Blackjack%20Strategy%20Sprint&score=" + acc + "&time=" + secs + "&code=" + encodeURIComponent(code) + '#enter">Submit to the contest</a><button class="btn btn-ghost" type="button" id="bj-again">Try again</button></div></div>';
      $("#bj-again").addEventListener("click", function () { startChallenge(); newHand(); });
    }
  }
  function challengeUI() { $("#bj-cbar").style.width = (state.ch.i / 50 * 100) + "%"; $("#bj-ctext").textContent = "Hand " + state.ch.i + " of 50 · " + state.ch.c + " correct"; }

  /* ---------- wire up ---------- */
  chart(); kpis(); leaks();
  EC.$$(".action-btn").forEach(function (b) { b.addEventListener("click", function () { answer(b.getAttribute("data-act")); }); });
  $("#bj-next").addEventListener("click", newHand);
  $("#bj-mode").addEventListener("change", function () {
    if (this.value === "challenge") { startChallenge(); $("#bj-hide").checked = true; $("#bj-chart").style.filter = "blur(7px)"; }
    else { state.ch = null; $("#bj-challenge").hidden = true; }
    newHand();
  });
  $("#bj-hide").addEventListener("change", function () { $("#bj-chart").style.filter = this.checked ? "blur(7px)" : ""; });
  $("#bj-reset").addEventListener("click", function () { stats = { n: 0, c: 0, streak: 0, best: 0, cats: { hard: [0, 0], soft: [0, 0], pairs: [0, 0] }, miss: {} }; EC.store.set("bj-stats", stats); kpis(); $("#bj-leaks").innerHTML = '<p class="muted">Stats reset.</p>'; });
  document.addEventListener("keydown", function (e) {
    if (/input|select|textarea/i.test(e.target.tagName)) return;
    var k = e.key.toUpperCase();
    if ("HSDP".indexOf(k) >= 0 && k.length === 1) { e.preventDefault(); answer(k); }
    else if (e.key === "Enter" || e.key === " ") { if (state.done) { e.preventDefault(); newHand(); } }
  });
  if (EC.params().mode) { $("#bj-mode").value = EC.params().mode; $("#bj-mode").dispatchEvent(new Event("change")); } else newHand();
})();
