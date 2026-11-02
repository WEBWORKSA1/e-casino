/* e.casino bankroll & risk-of-ruin calculator. © e.casino */
(function () {
  "use strict";
  var EC = window.EC, $ = EC.$, C = window.ECChart;
  // Outcome models per $1 bet: [net result, probability]
  var M = {
    eu: [[1, 18 / 37], [-1, 19 / 37]],
    us: [[1, 18 / 38], [-1, 20 / 38]],
    eu35: [[35, 1 / 37], [-1, 36 / 37]],
    pass: [[1, 244 / 495], [-1, 251 / 495]],
    banker: [[0.95, 0.4586], [-1, 0.4462], [0, 0.0952]],
    bj: [[1.5, 0.045], [1, 0.3425], [2, 0.05], [0, 0.085], [-1, 0.4405], [-2, 0.037]],
    slot: (function () {
      var m = [0.5, 1, 2, 5, 10, 25, 50, 100, 250], p = [0.08, 0.07, 0.05, 0.025, 0.012, 0.004, 0.0015, 0.0005, 0.0001];
      var raw = m.reduce(function (s, x, i) { return s + x * p[i]; }, 0), k = 0.96 / raw, out = [], tot = 0;
      m.forEach(function (x, i) { out.push([x - 1, p[i] * k]); tot += p[i] * k; }); out.push([-1, 1 - tot]); return out;
    })()
  };
  function stats(model) {
    var mu = 0, m2 = 0; model.forEach(function (o) { mu += o[0] * o[1]; m2 += o[0] * o[0] * o[1]; });
    return { mu: mu, sd: Math.sqrt(m2 - mu * mu) };
  }
  function sampler(model) {
    var cum = [], c = 0; model.forEach(function (o) { c += o[1]; cum.push(c); });
    return function () { var r = Math.random() * c; for (var i = 0; i < cum.length; i++) if (r < cum[i]) return model[i][0]; return model[model.length - 1][0]; };
  }
  function normCdf(z) { var t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2), p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; }
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function val(id, d) { var x = parseFloat($(id).value); return isFinite(x) && x > 0 ? x : d; }
  function run() {
    var key = $("#br-game").value, bet = val("#br-bet", 10), N = Math.min(20000, Math.round(val("#br-n", 300))), bank = val("#br-bank", 500);
    $("#br-custom").hidden = key !== "custom";
    var st, draw;
    if (key === "custom") { var e = (parseFloat($("#br-edge").value) || 0) / 100, sd = val("#br-sd", 1.1); st = { mu: -e, sd: sd }; draw = function () { return -e + sd * gauss(); }; }
    else { st = stats(M[key]); draw = sampler(M[key]); }
    var ev = bet * N * st.mu, sdT = bet * st.sd * Math.sqrt(N);
    $("#bk-ev").textContent = EC.money(ev); $("#bk-sd").textContent = "±" + EC.money(sdT, 0);
    $("#bk-ahead").textContent = EC.pct(1 - normCdf((0 - ev) / sdT), 1);
    var S = 2000, ruin = 0, res = [];
    for (var s = 0; s < S; s++) {
      var b = bank, broke = false;
      for (var i = 0; i < N; i++) { if (b < bet) { broke = true; break; } b += bet * draw(); }
      if (broke) ruin++; res.push(b - bank);
    }
    $("#bk-ruin").textContent = EC.pct(ruin / S, 1);
    $("#br-range").innerHTML = "Over <strong>" + EC.num(N) + " bets of " + EC.money(bet, 0) + "</strong> (" + EC.money(bet * N, 0) + " wagered) the expected result is " + EC.money(ev) +
      ". About 95% of sessions land between <strong>" + EC.money(ev - 1.96 * sdT, 0) + "</strong> and <strong>" + EC.money(ev + 1.96 * sdT, 0) + "</strong> (normal approximation; long-shot bets are skewed). Per-bet edge " + EC.pct(-st.mu, 2) + ", σ ≈ " + st.sd.toFixed(2) + ".";
    var h = C.hist(res, 26);
    C.bars($("#br-chart"), h.labels.map(function (l) { return "$" + l; }), h.counts, { colors: h.counts.map(function (_, i) { return h.min + h.w * (i + .5) < 0 ? C.color("--red") : C.color("--brand"); }) });
  }
  $("#br-run").addEventListener("click", run);
  $("#br-game").addEventListener("change", run);
  run();
})();
