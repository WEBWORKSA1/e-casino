/* e.casino Roulette & betting-system simulator. © e.casino */
(function () {
  "use strict";
  var EC = window.EC, $ = EC.$, C = window.ECChart;
  var REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  var FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765];
  function pockets(w) { return w === "us" ? 38 : 37; } // 37 = "00"
  function spin(w) { return Math.floor(Math.random() * pockets(w)); }
  function colorOf(n) { return n === 0 || n === 37 ? "green" : REDS.indexOf(n) >= 0 ? "red" : "black"; }
  function label(n) { return n === 37 ? "00" : String(n); }
  // returns net result for a bet of size b
  function settle(betType, wheel, n, b) {
    if (betType === "red") {
      if (REDS.indexOf(n) >= 0) return b;
      if (wheel === "fr" && n === 0) return -b / 2;
      return -b;
    }
    if (betType === "dozen") return n >= 1 && n <= 12 ? 2 * b : -b;
    return n === 17 ? 35 * b : -b;
  }
  function theoEdge(betType, wheel) { if (wheel === "us") return 2 / 38; if (wheel === "fr" && betType === "red") return 1 / 74; return 1 / 37; }
  function nextBet(sys, st, won, base) {
    if (sys === "flat") return base;
    if (sys === "martingale") { st.u = won ? 1 : st.u * 2; return base * st.u; }
    if (sys === "paroli") { if (won) { st.w++; st.u = st.w >= 3 ? 1 : st.u * 2; if (st.w >= 3) st.w = 0; } else { st.u = 1; st.w = 0; } return base * st.u; }
    if (sys === "fibonacci") { st.i = won ? Math.max(0, st.i - 2) : Math.min(FIB.length - 1, st.i + 1); return base * FIB[st.i]; }
    if (sys === "dalembert") { st.u = won ? Math.max(1, st.u - 1) : st.u + 1; return base * st.u; }
    return base;
  }
  function num(id, d) { var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : d; }
  function run() {
    var wheel = $("#rs-wheel").value, betType = $("#rs-bet").value, sys = $("#rs-sys").value;
    var base = num("#rs-base", 10), bank0 = num("#rs-bank", 500), max = num("#rs-max", 1000), spins = Math.min(5000, num("#rs-spins", 200)), sess = Math.min(20000, num("#rs-sess", 1000));
    var stop = parseFloat($("#rs-stop").value) || 0;
    var results = [], paths = [], ahead = 0, bust = 0, wagered = 0, net = 0;
    for (var s = 0; s < sess; s++) {
      var bank = bank0, st = { u: 1, i: 0, w: 0 }, bet = base, path = s < 25 ? [bank] : null;
      for (var k = 0; k < spins; k++) {
        var b = Math.min(bet, max, bank);
        if (b < base && bank < base) { bust++; break; }
        if (b <= 0) { bust++; break; }
        var r = settle(betType, wheel, spin(wheel), b);
        bank += r; wagered += b;
        if (path) path.push(bank);
        if (stop > 0 && bank - bank0 >= stop) break;
        bet = nextBet(sys, st, r > 0, base);
      }
      var res = bank - bank0; results.push(res); net += res; if (res > 0) ahead++;
      if (path) paths.push(path);
    }
    var obs = -net / wagered, theo = theoEdge(betType, wheel);
    $("#rk-ahead").textContent = EC.pct(ahead / sess, 1);
    $("#rk-bust").textContent = EC.pct(bust / sess, 1);
    $("#rk-avg").textContent = EC.money(net / sess);
    $("#rk-edge").textContent = EC.pct(obs, 2) + " (" + EC.pct(theo, 2) + ")";
    var cols = [C.color("--brand"), C.color("--blue"), C.color("--violet"), C.color("--gold"), C.color("--red")];
    C.line($("#rs-paths"), paths.map(function (p, i) { return { data: p, color: cols[i % cols.length], width: 1.4, alpha: .8 }; }), { ref: bank0, xlabel: "spin", yfmt: function (v) { return "$" + Math.round(v); } });
    var h = C.hist(results, 24);
    C.bars($("#rs-hist"), h.labels, h.counts, { colors: h.counts.map(function (_, i) { return h.min + h.w * (i + .5) < 0 ? C.color("--red") : C.color("--brand"); }) });
    var avgW = wagered / sess;
    $("#rs-verdict").innerHTML = "Across " + EC.num(sess) + " sessions you wagered " + EC.money(avgW, 0) + " per session on average. The theory says you should lose about " +
      EC.money(avgW * theo) + " per session; the simulation lost " + EC.money(-net / sess) + ". " +
      (ahead / sess > .5 ? "<strong>Most sessions ended ahead — and the average was still a loss.</strong> That's the betting-system illusion." : "The house edge did exactly what it always does.");
    EC.setParams({ wheel: wheel, bet: betType, sys: sys, base: base, bank: bank0 });
  }
  // single spin
  var hist = [];
  $("#rs-spin").addEventListener("click", function () {
    var w = $("#rs-wheel").value, n = spin(w), c = colorOf(n), el = $("#rs-num");
    el.className = "wheel-num n-" + c; void el.offsetWidth; el.classList.add("spin"); el.textContent = label(n);
    hist.unshift([n, c]); hist = hist.slice(0, 20);
    $("#rs-hist-strip").innerHTML = hist.map(function (h) { return '<span class="n-' + h[1] + '">' + label(h[0]) + "</span>"; }).join("");
    var reds = hist.filter(function (h) { return h[1] === "red"; }).length;
    $("#rs-spin-text").textContent = label(n) + " " + c + ". Last " + hist.length + " spins: " + reds + " red. The next spin is still " + (w === "us" ? "18/38 = 47.37%" : "18/37 = 48.65%") + " red.";
  });
  // restore from URL
  var p = EC.params();
  [["wheel", "#rs-wheel"], ["bet", "#rs-bet"], ["sys", "#rs-sys"], ["base", "#rs-base"], ["bank", "#rs-bank"]].forEach(function (m) { if (p[m[0]]) $(m[1]).value = p[m[0]]; });
  $("#rs-run").addEventListener("click", run);
  window.addEventListener("resize", function () { clearTimeout(window._rsr); window._rsr = setTimeout(run, 250); });
  run();
})();
