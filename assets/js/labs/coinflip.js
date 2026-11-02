/* e.casino coin-flip streak lab. © e.casino */
(function () {
  "use strict";
  var EC = window.EC, $ = EC.$, C = window.ECChart;
  var s = { n: 0, h: 0, run: 0, cur: 0, last: null, best: 0, after: 0, afterSame: 0, series: [] };
  function flip(k) {
    var r;
    for (var i = 0; i < k; i++) {
      r = Math.random() < 0.5 ? "H" : "T";
      if (s.cur >= 5) { s.after++; if (r === s.last) s.afterSame++; }
      if (r === s.last) s.cur++; else { s.cur = 1; s.last = r; }
      if (s.cur > s.best) s.best = s.cur;
      s.n++; if (r === "H") s.h++;
      if (s.n <= 200 || s.n % Math.ceil(s.n / 400) === 0) s.series.push(s.h / s.n * 100);
    }
    var c = $("#cf-coin"); c.classList.remove("flip"); void c.offsetWidth; c.classList.add("flip"); c.textContent = r;
    $("#cf-text").textContent = (k === 1 ? (r === "H" ? "Heads" : "Tails") : EC.num(k) + " flips done") + " · current streak: " + s.cur + " × " + (s.last === "H" ? "heads" : "tails");
    $("#ck-n").textContent = EC.num(s.n); $("#ck-h").textContent = EC.pct(s.h / s.n, 1); $("#ck-run").textContent = s.best;
    $("#ck-due").textContent = s.after ? EC.pct(s.afterSame / s.after, 1) : "—";
    C.line($("#cf-chart"), [{ data: s.series, color: C.color("--brand") }], { ref: 50, yfmt: function (v) { return v.toFixed(0) + "%"; }, xlabel: "flips" });
    if (s.after >= 30) $("#cf-sum").textContent = "After a streak of 5+, the very next flip continued the streak " + EC.pct(s.afterSame / s.after, 1) + " of the time (" + s.after + " cases). If the other side were ever “due”, this would be well below 50%.";
  }
  function analyze(seq) {
    var sw = 0, best = 1, cur = 1, h = 0;
    for (var i = 0; i < seq.length; i++) { if (seq[i] === "H") h++; if (i) { if (seq[i] !== seq[i - 1]) { sw++; cur = 1; } else { cur++; best = Math.max(best, cur); } } }
    return { sw: sw, best: best, h: h };
  }
  function fakeUpdate() {
    var ta = $("#cf-fake"), seq = ta.value.toUpperCase().replace(/[^HT]/g, "").slice(0, 100);
    $("#cf-fake-count").textContent = seq.length + " / 100";
    if (seq.length < 100) { $("#cf-fake-result").innerHTML = ""; return; }
    var you = analyze(seq), real = "";
    for (var i = 0; i < 100; i++) real += Math.random() < 0.5 ? "H" : "T";
    var coin = analyze(real), human = you.sw > 60 || you.best <= 4;
    $("#cf-fake-result").innerHTML = '<div class="result-box"><span class="badge ' + (human ? "badge-red" : "badge-brand") + '">' + (human ? "Looks human-made" : "Convincingly random") + "</span>" +
      '<div class="table-wrap mt1" style="margin-bottom:0"><table class="data"><thead><tr><th></th><th>You</th><th>A real coin (just now)</th></tr></thead><tbody>' +
      "<tr><td>Side switches (expect ≈ 50)</td><td>" + you.sw + "</td><td>" + coin.sw + "</td></tr><tr><td>Longest streak (usually 6+)</td><td>" + you.best + "</td><td>" + coin.best + "</td></tr><tr><td>Heads</td><td>" + you.h + "</td><td>" + coin.h + "</td></tr></tbody></table></div>" +
      '<p class="muted mt1 mb0" style="font-size:.9rem">' + (human ? "Real randomness is streakier than people expect. You likely avoided long runs or switched too often." : "Nicely done — your sequence has the streakiness of real chance.") + "</p></div>";
  }
  EC.$$("[data-flip]").forEach(function (b) { b.addEventListener("click", function () { flip(parseInt(b.getAttribute("data-flip"), 10)); }); });
  $("#cf-reset").addEventListener("click", function () { s = { n: 0, h: 0, run: 0, cur: 0, last: null, best: 0, after: 0, afterSame: 0, series: [] }; flip(1); });
  EC.$$("[data-fake]").forEach(function (b) { b.addEventListener("click", function () { var ta = $("#cf-fake"); if (ta.value.replace(/[^HT]/gi, "").length < 100) ta.value += b.getAttribute("data-fake"); fakeUpdate(); }); });
  $("#cf-fake").addEventListener("input", fakeUpdate);
  $("#cf-fake-clear").addEventListener("click", function () { $("#cf-fake").value = ""; fakeUpdate(); });
  flip(1);
  window.addEventListener("resize", function () { if (s.series.length) C.line($("#cf-chart"), [{ data: s.series, color: C.color("--brand") }], { ref: 50, yfmt: function (v) { return v.toFixed(0) + "%"; }, xlabel: "flips" }); });
})();
