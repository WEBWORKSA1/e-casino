/* e.casino Texas Hold'em equity calculator — 7-card evaluator + Monte Carlo. © e.casino */
(function () {
  "use strict";
  var EC = window.EC, $ = EC.$, C = window.ECChart;
  var R = "23456789TJQKA", S = ["♠", "♥", "♦", "♣"], CATS = ["High card", "One pair", "Two pair", "Trips", "Straight", "Flush", "Full house", "Quads", "Str. flush"];
  var slots = [null, null, null, null, null, null, null], active = 0; // 0-1 hero, 2-6 board

  function straightHigh(m) {
    for (var r = 12; r >= 4; r--) if (((m >> (r - 4)) & 31) === 31) return r;
    if ((m & 0x100F) === 0x100F) return 3; // wheel A-2-3-4-5
    return -1;
  }
  function topN(mask, n, skip) {
    var out = 0, k = 0;
    for (var r = 12; r >= 0 && k < n; r--) if ((mask >> r) & 1 && r !== skip) { out = (out << 4) | r; k++; }
    return out;
  }
  function eval7(c) {
    var rc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], sc = [0, 0, 0, 0], sm = [0, 0, 0, 0], rm = 0, i, r;
    for (i = 0; i < c.length; i++) { r = c[i] >> 2; var s = c[i] & 3; rc[r]++; sc[s]++; sm[s] |= 1 << r; rm |= 1 << r; }
    var fs = -1; for (i = 0; i < 4; i++) if (sc[i] >= 5) fs = i;
    if (fs >= 0) { var sf = straightHigh(sm[fs]); if (sf >= 0) return (8 << 20) | sf; }
    var quad = -1, t1 = -1, t2 = -1, p1 = -1, p2 = -1, p3 = -1;
    for (r = 12; r >= 0; r--) {
      if (rc[r] === 4) quad = r;
      else if (rc[r] === 3) { if (t1 < 0) t1 = r; else if (t2 < 0) t2 = r; }
      else if (rc[r] === 2) { if (p1 < 0) p1 = r; else if (p2 < 0) p2 = r; else if (p3 < 0) p3 = r; }
    }
    if (quad >= 0) return (7 << 20) | (quad << 4) | topN(rm, 1, quad);
    if (t1 >= 0 && (t2 >= 0 || p1 >= 0)) return (6 << 20) | (t1 << 4) | Math.max(t2, p1);
    if (fs >= 0) return (5 << 20) | topN(sm[fs], 5, -1);
    var st = straightHigh(rm); if (st >= 0) return (4 << 20) | st;
    if (t1 >= 0) return (3 << 20) | (t1 << 8) | topN(rm & ~(1 << t1), 2, -1);
    if (p2 >= 0) return (2 << 20) | (p1 << 8) | (p2 << 4) | topN(rm & ~(1 << p1) & ~(1 << p2), 1, -1);
    if (p1 >= 0) return (1 << 20) | (p1 << 12) | topN(rm & ~(1 << p1), 3, -1);
    return topN(rm, 5, -1);
  }
  window.EC_eval7 = eval7; // exposed for testing

  function name(c) { return R[c >> 2].replace("T", "10") + S[c & 3]; }
  function isRed(c) { var s = c & 3; return s === 1 || s === 2; }
  function used(c) { return slots.indexOf(c) >= 0; }
  function renderSlots() {
    function el(i) {
      var c = slots[i], d = document.createElement("button"); d.type = "button";
      d.className = "slot-card" + (c !== null ? " filled" + (isRed(c) ? " red" : "") : "") + (i === active ? " active" : "");
      d.textContent = c !== null ? name(c) : (i < 2 ? "?" : ["F", "F", "F", "T", "R"][i - 2]);
      d.setAttribute("aria-label", c !== null ? "Clear " + name(c) : "Select slot");
      d.addEventListener("click", function () { if (slots[i] !== null) slots[i] = null; active = i; renderSlots(); renderPicker(); });
      return d;
    }
    var h = $("#pk-hero"), b = $("#pk-board"); h.innerHTML = ""; b.innerHTML = "";
    for (var i = 0; i < 2; i++) h.appendChild(el(i));
    for (i = 2; i < 7; i++) b.appendChild(el(i));
  }
  function renderPicker() {
    var p = $("#pk-picker"); p.innerHTML = "";
    for (var s = 0; s < 4; s++) for (var r = 12; r >= 0; r--) {
      (function (c) {
        var b = document.createElement("button"); b.type = "button"; b.textContent = name(c);
        b.className = (isRed(c) ? "red" : "") + (used(c) ? " used" : "");
        b.disabled = used(c);
        b.addEventListener("click", function () {
          slots[active] = c;
          var nxt = slots.indexOf(null); active = nxt >= 0 ? nxt : active;
          renderSlots(); renderPicker();
        });
        p.appendChild(b);
      })(r * 4 + s);
    }
  }
  function run() {
    var hero = [slots[0], slots[1]];
    if (hero[0] === null || hero[1] === null) { $("#pk-text").textContent = "Pick both hole cards first."; return; }
    var board = slots.slice(2).filter(function (c) { return c !== null; });
    if (board.length === 1 || board.length === 2) { $("#pk-text").textContent = "Enter the full flop (3 cards), or leave the board empty."; return; }
    var opp = parseInt($("#pk-opp").value, 10), N = parseInt($("#pk-iter").value, 10);
    var deck = []; for (var c = 0; c < 52; c++) if (hero.indexOf(c) < 0 && board.indexOf(c) < 0) deck.push(c);
    var need = 5 - board.length, win = 0, tie = 0, eq = 0, cats = new Array(9).fill(0), done = 0;
    var btn = $("#pk-run"); btn.disabled = true;
    function chunk() {
      var end = Math.min(N, done + 4000);
      for (; done < end; done++) {
        var k = need + opp * 2, d = deck.slice();
        for (var i = 0; i < k; i++) { var j = i + Math.floor(Math.random() * (d.length - i)), t = d[i]; d[i] = d[j]; d[j] = t; }
        var full = board.concat(d.slice(0, need)), hs = eval7(hero.concat(full)), best = 0, ties = 0;
        cats[hs >> 20]++;
        for (var o = 0; o < opp; o++) {
          var os = eval7([d[need + o * 2], d[need + o * 2 + 1]].concat(full));
          if (os > best) { best = os; ties = 0; }
          if (os === best) ties++;
        }
        if (hs > best) { win++; eq += 1; }
        else if (hs === best) { tie++; eq += 1 / (ties + 1); }
      }
      $("#pk-text").textContent = "Simulating… " + Math.round(done / N * 100) + "%";
      if (done < N) return setTimeout(chunk, 0);
      btn.disabled = false;
      $("#pq-win").textContent = EC.pct(win / N, 1); $("#pq-tie").textContent = EC.pct(tie / N, 1);
      $("#pq-lose").textContent = EC.pct(1 - (win + tie) / N, 1); $("#pq-eq").textContent = EC.pct(eq / N, 1);
      C.bars($("#pk-chart"), CATS, cats.map(function (x) { return x / N * 100; }), { yfmt: function (v) { return v.toFixed(0) + "%"; } });
      var fair = 1 / (opp + 1);
      $("#pk-text").innerHTML = name(hero[0]) + " " + name(hero[1]) + (board.length ? " on " + board.map(name).join(" ") : " preflop") + " vs " + opp + " random opponent" + (opp > 1 ? "s" : "") +
        ": equity <strong>" + EC.pct(eq / N, 1) + "</strong> vs a fair share of " + EC.pct(fair, 1) + " (" + (eq / N > fair ? "+" : "") + ((eq / N - fair) * 100).toFixed(1) + " points). " + EC.num(N) + " simulated deals.";
      EC.setParams({ h: hero.map(name).join(""), o: opp });
    }
    chunk();
  }
  function card(str) { var r = R.indexOf(str[0]), s = "shdc".indexOf(str[1]); return r * 4 + s; }
  var PRE = [["AA", "As Ah"], ["KK", "Ks Kh"], ["AKs", "As Ks"], ["AKo", "As Kd"], ["QQ", "Qs Qh"], ["JTs", "Js Ts"], ["22", "2s 2h"], ["72o", "7s 2d"]];
  $("#pk-presets").innerHTML = PRE.map(function (p, i) { return '<button class="chip" type="button" data-pre="' + i + '">' + p[0] + "</button>"; }).join("");
  EC.$$("[data-pre]").forEach(function (b) {
    b.addEventListener("click", function () { var p = PRE[+b.getAttribute("data-pre")][1].split(" "); slots = [card(p[0]), card(p[1]), null, null, null, null, null]; active = 2; renderSlots(); renderPicker(); run(); });
  });
  $("#pk-run").addEventListener("click", run);
  $("#pk-clear").addEventListener("click", function () { slots = [null, null, null, null, null, null, null]; active = 0; renderSlots(); renderPicker(); });
  $("#pk-rand").addEventListener("click", function () {
    var a = Math.floor(Math.random() * 52), b; do { b = Math.floor(Math.random() * 52); } while (b === a);
    slots = [a, b, null, null, null, null, null]; active = 2; renderSlots(); renderPicker(); run();
  });
  slots = [card("As"), card("Ah"), null, null, null, null, null]; active = 2;
  renderSlots(); renderPicker(); run();
})();
