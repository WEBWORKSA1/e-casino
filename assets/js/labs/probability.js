/* e.casino "at least once" probability calculator. © e.casino */
(function () {
  "use strict";
  var EC = window.EC, $ = EC.$, C = window.ECChart;
  var PRE = [["Roulette number (EU)", "onein", 37, 37], ["Roll a 7", "onein", 6, 6], ["Pocket aces", "onein", 221, 100], ["Blackjack natural", "pct", 4.73, 20], ["Royal flush (5-card deal)", "onein", 649740, 100000], ["6/49 lottery jackpot", "onein", 13983816, 520]];
  $("#pc-presets").innerHTML = PRE.map(function (p, i) { return '<button class="chip" type="button" data-pp="' + i + '">' + p[0] + "</button>"; }).join("");
  function prob() { var v = parseFloat($("#pc-p").value); if (!(v > 0)) return NaN; return $("#pc-mode").value === "pct" ? v / 100 : 1 / v; }
  function fmtN(x) { return !isFinite(x) ? "—" : x < 1e6 ? EC.num(Math.ceil(x)) : (x / 1e6).toFixed(1) + "M"; }
  function calc() {
    var p = prob(), n = Math.max(1, Math.round(parseFloat($("#pc-n").value) || 1));
    if (!(p > 0 && p < 1)) { $("#pq-atl").textContent = "—"; return; }
    var never = Math.exp(n * Math.log1p(-p));
    $("#pq-atl").textContent = EC.pct(1 - never, 2); $("#pq-never").textContent = EC.pct(never, 2); $("#pq-exp").textContent = (n * p).toFixed(n * p < 10 ? 2 : 0);
    $("#pc-need").innerHTML = [0.5, 0.9, 0.95, 0.99].map(function (t) { return '<div class="kpi"><b>' + fmtN(Math.log(1 - t) / Math.log1p(-p)) + "</b><span>" + (t * 100) + "% chance</span></div>"; }).join("");
    var max = Math.max(n * 2, Math.ceil(Math.log(0.01) / Math.log1p(-p))), pts = [], steps = 120;
    for (var i = 0; i <= steps; i++) { var k = max * i / steps; pts.push((1 - Math.exp(k * Math.log1p(-p))) * 100); }
    C.line($("#pc-chart"), [{ data: pts, color: C.color("--brand") }], { ref: 50, yfmt: function (v) { return v.toFixed(0) + "%"; }, xlabel: "tries (0 → " + fmtN(max) + ")" });
    EC.setParams({ m: $("#pc-mode").value, p: $("#pc-p").value, n: n });
  }
  EC.$$("[data-pp]").forEach(function (b) { b.addEventListener("click", function () { var p = PRE[+b.getAttribute("data-pp")]; $("#pc-mode").value = p[1]; $("#pc-p").value = p[2]; $("#pc-n").value = p[3]; calc(); }); });
  ["#pc-mode", "#pc-p", "#pc-n"].forEach(function (id) { $(id).addEventListener("input", calc); });
  var q = EC.params(); if (q.m) $("#pc-mode").value = q.m; if (q.p) $("#pc-p").value = q.p; if (q.n) $("#pc-n").value = q.n;
  calc();
  window.addEventListener("resize", calc);
})();
