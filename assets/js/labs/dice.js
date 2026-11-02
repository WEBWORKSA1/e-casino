/* e.casino dice & craps lab. © e.casino */
(function () {
  "use strict";
  var EC = window.EC, $ = EC.$, C = window.ECChart;
  var WAYS = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  var PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  var counts = new Array(13).fill(0), n = 0, pass = { n: 0, w: 0 };
  function d6() { return 1 + Math.floor(Math.random() * 6); }
  function dieEl(v) { var d = document.createElement("div"); d.className = "die roll"; for (var i = 0; i < 9; i++) { var p = document.createElement("i"); if (PIPS[v].indexOf(i) >= 0) p.className = "on"; d.appendChild(p); } d.setAttribute("aria-label", "Die showing " + v); return d; }
  function draw() {
    var labels = [], obs = [], exp = [];
    for (var t = 2; t <= 12; t++) { labels.push(String(t)); obs.push(n ? counts[t] / n * 100 : 0); exp.push(WAYS[t] / 36 * 100); }
    C.bars($("#dl-chart"), labels, obs, { compare: exp, yfmt: function (v) { return v.toFixed(0) + "%"; } });
    if (n) {
      var dev = 0; for (var t2 = 2; t2 <= 12; t2++) dev = Math.max(dev, Math.abs(counts[t2] / n - WAYS[t2] / 36));
      $("#dl-sum").textContent = EC.num(n) + " rolls. Sevens: " + EC.pct(counts[7] / n, 2) + " (exact 16.67%). Largest gap from the math on any total: " + (dev * 100).toFixed(2) + " percentage points.";
    }
  }
  function roll(k) {
    var a, b;
    for (var i = 0; i < k; i++) { a = d6(); b = d6(); counts[a + b]++; n++; }
    var box = $("#dl-dice"); box.innerHTML = ""; box.appendChild(dieEl(a)); box.appendChild(dieEl(b));
    $("#dl-text").textContent = k === 1 ? a + " + " + b + " = " + (a + b) + " — " + WAYS[a + b] + " of 36 ways (" + EC.pct(WAYS[a + b] / 36, 1) + ")" : "Last roll: " + a + " + " + b + " = " + (a + b);
    draw();
  }
  function passGame() {
    var t = d6() + d6();
    if (t === 7 || t === 11) return 1; if (t === 2 || t === 3 || t === 12) return 0;
    for (;;) { var r = d6() + d6(); if (r === t) return 1; if (r === 7) return 0; }
  }
  EC.$$("[data-roll]").forEach(function (b) { b.addEventListener("click", function () { roll(parseInt(b.getAttribute("data-roll"), 10)); }); });
  EC.$$("[data-pass]").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = parseInt(b.getAttribute("data-pass"), 10);
      for (var i = 0; i < k; i++) { pass.n++; pass.w += passGame(); }
      $("#pk-n").textContent = EC.num(pass.n); $("#pk-w").textContent = EC.pct(pass.w / pass.n, 2);
      $("#pk-e").textContent = EC.pct((pass.n - 2 * pass.w) / pass.n, 2);
    });
  });
  $("#dl-reset").addEventListener("click", function () { counts = new Array(13).fill(0); n = 0; draw(); $("#dl-sum").textContent = "Reset. Green bars = your rolls. Gold line = the exact expectation."; });
  $("#dl-table").innerHTML = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (t) { return "<tr><td>" + t + "</td><td>" + WAYS[t] + "</td><td>" + EC.pct(WAYS[t] / 36, 2) + "</td><td>" + (36 - WAYS[t]) + " : " + WAYS[t] + "</td></tr>"; }).join("");
  roll(1);
  window.addEventListener("resize", draw);
})();
