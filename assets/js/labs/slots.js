/* e.casino slot RTP & volatility simulator (simplified model). © e.casino */
(function () {
  "use strict";
  var EC = window.EC, $ = EC.$, C = window.ECChart;
  var BASE = {
    low: { m: [0.5, 1, 2, 3, 5, 10, 25, 50], p: [0.12, 0.10, 0.07, 0.04, 0.025, 0.01, 0.002, 0.0005] },
    medium: { m: [0.5, 1, 2, 5, 10, 25, 50, 100, 250], p: [0.08, 0.07, 0.05, 0.025, 0.012, 0.004, 0.0015, 0.0005, 0.0001] },
    high: { m: [1, 2, 5, 10, 25, 100, 500, 1000], p: [0.08, 0.04, 0.02, 0.008, 0.003, 0.0006, 0.00008, 0.00002] },
    extreme: { m: [1, 2, 5, 20, 100, 1000, 5000], p: [0.06, 0.03, 0.015, 0.004, 0.0008, 0.00005, 0.000006] }
  };
  var SYM = ["🍋", "🍒", "🔔", "🍀", "⭐", "💎", "7️⃣", "👑", "🏆"];
  var model = null;
  function build() {
    var vol = $("#sl-vol").value, rtp = parseFloat($("#sl-rtp").value) / 100, b = BASE[vol];
    var raw = b.m.reduce(function (s, m, i) { return s + m * b.p[i]; }, 0), k = rtp / raw;
    var p = b.p.map(function (x) { return x * k; }), cum = [], c = 0;
    p.forEach(function (x) { c += x; cum.push(c); });
    model = { m: b.m, p: p, cum: cum, rtp: rtp, hit: c };
    $("#sl-rtp-v").textContent = (rtp * 100).toFixed(1).replace(".0", "") + "%";
    $("#sl-table").innerHTML = '<div class="table-wrap" style="margin:0"><table class="data"><thead><tr><th>Symbol</th><th>Pays</th><th>Chance per spin</th><th>Share of RTP</th></tr></thead><tbody>' +
      b.m.map(function (m, i) { return "<tr><td>" + SYM[i] + SYM[i] + SYM[i] + "</td><td>" + m + "×</td><td>1 in " + EC.num(1 / p[i]) + "</td><td>" + EC.pct(m * p[i] / rtp, 1) + "</td></tr>"; }).join("") +
      "<tr><td>No win</td><td>0×</td><td>" + EC.pct(1 - c, 1) + "</td><td>—</td></tr></tbody></table></div>";
  }
  function outcome() {
    var r = Math.random(), cum = model.cum;
    for (var i = 0; i < cum.length; i++) if (r < cum[i]) return i;
    return -1;
  }
  function num(id, d) { var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : d; }
  function run() {
    build();
    var bet = num("#sl-bet", 1), bank0 = num("#sl-bank", 100), spins = Math.min(10000, num("#sl-spins", 500)), sess = Math.min(10000, num("#sl-sess", 1000));
    var ends = [], ahead = 0, bust = 0, hits = 0, ldw = 0, total = 0, big = 0;
    for (var s = 0; s < sess; s++) {
      var bal = bank0;
      for (var k = 0; k < spins; k++) {
        if (bal < bet) { bust++; break; }
        bal -= bet; total++;
        var o = outcome();
        if (o >= 0) { var win = bet * model.m[o]; bal += win; hits++; if (model.m[o] < 1) ldw++; if (win > big) big = win; }
      }
      ends.push(bal); if (bal > bank0) ahead++;
    }
    var sorted = ends.slice().sort(function (a, b) { return a - b; }), med = sorted[Math.floor(sorted.length / 2)];
    $("#sk-hit").textContent = EC.pct(hits / total, 1);
    $("#sk-ldw").textContent = EC.pct(ldw / Math.max(1, hits), 1);
    $("#sk-ahead").textContent = EC.pct(ahead / sess, 1);
    $("#sk-bust").textContent = EC.pct(bust / sess, 1);
    $("#sk-med").textContent = EC.money(med);
    $("#sk-big").textContent = EC.money(big, 0);
    var h = C.hist(ends, 24);
    C.bars($("#sl-hist"), h.labels.map(function (l) { return "$" + l; }), h.counts, { colors: h.counts.map(function (_, i) { return h.min + h.w * (i + .5) < bank0 ? C.color("--red") : C.color("--brand"); }) });
    var avg = ends.reduce(function (a, b) { return a + b; }, 0) / sess;
    $("#sl-verdict").innerHTML = "Average ending balance: <strong>" + EC.money(avg) + "</strong> from " + EC.money(bank0) + ". " +
      "Hit frequency is " + EC.pct(hits / total, 1) + ", yet " + EC.pct(ldw / Math.max(1, hits), 1) + " of those “wins” paid less than the bet. " +
      (ahead / sess < .5 ? "Most sessions lost; a few big winners pull the average up toward the RTP." : "Low volatility kept many sessions close — but the average still drifts down by the house edge.");
  }
  // single spin demo
  var credits = 100;
  function spinOnce(silent) {
    if (!model) build();
    var bet = 1; if (credits < bet) { credits = 100; }
    credits -= bet; var o = outcome(), reels = EC.$$("#sl-reels .reel");
    var syms = o >= 0 ? [SYM[o], SYM[o], SYM[o]] : (function () { var a; do { a = [0, 1, 2].map(function () { return SYM[Math.floor(Math.random() * SYM.length)]; }); } while (a[0] === a[1] && a[1] === a[2]); return a; })();
    var win = o >= 0 ? bet * model.m[o] : 0; credits += win;
    if (!silent) reels.forEach(function (r, i) { r.classList.remove("spin"); void r.offsetWidth; r.classList.add("spin"); r.style.animationDelay = i * 90 + "ms"; r.textContent = syms[i]; });
    else reels.forEach(function (r, i) { r.textContent = syms[i]; });
    var msg = win === 0 ? "No win." : win < bet ? "“Win” of " + win.toFixed(2) + " on a 1.00 bet — a loss disguised as a win." : "Win of " + win.toFixed(2) + "!";
    $("#sl-spin-text").textContent = msg + " Credits: " + credits.toFixed(2) + " · virtual, no value";
    return win;
  }
  $("#sl-spin").addEventListener("click", function () { spinOnce(false); });
  $("#sl-auto").addEventListener("click", function () {
    var start = credits, won = 0; for (var i = 0; i < 100; i++) won += spinOnce(true);
    $("#sl-spin-text").textContent = "100 auto-spins: paid in 100.00, got back " + won.toFixed(2) + ". Credits: " + credits.toFixed(2) + " (started " + start.toFixed(2) + ").";
  });
  $("#sl-rtp").addEventListener("input", build);
  $("#sl-vol").addEventListener("change", run);
  $("#sl-run").addEventListener("click", run);
  run();
})();
