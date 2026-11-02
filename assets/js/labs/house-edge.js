/* e.casino house edge & expected loss calculator. © e.casino */
(function () {
  "use strict";
  var EC = window.EC, $ = EC.$, C = window.ECChart;
  var GAMES = [
    ["bj", "Blackjack — basic strategy, good rules", 0.5, 70],
    ["bj65", "Blackjack — 6:5 payout table", 1.9, 70],
    ["bacb", "Baccarat — Banker", 1.06, 70],
    ["bacp", "Baccarat — Player", 1.24, 70],
    ["bact", "Baccarat — Tie (8:1)", 14.36, 70],
    ["cpass", "Craps — Pass / Come", 1.41, 30],
    ["cdont", "Craps — Don't Pass / Don't Come", 1.36, 30],
    ["cp68", "Craps — Place 6 or 8", 1.52, 30],
    ["cfield", "Craps — Field (2 & 12 pay 2:1)", 5.56, 100],
    ["cany7", "Craps — Any Seven", 16.67, 100],
    ["rfr", "Roulette — French, La Partage (even-money)", 1.35, 35],
    ["reu", "Roulette — European", 2.70, 35],
    ["rus", "Roulette — American", 5.26, 35],
    ["rus5", "Roulette — American five-number bet", 7.89, 35],
    ["vp96", "Video poker — 9/6 Jacks or Better (optimal)", 0.46, 500],
    ["vp85", "Video poker — 8/5 Jacks or Better (optimal)", 2.70, 500],
    ["s96", "Slots — 96% RTP", 4, 500],
    ["s92", "Slots — 92% RTP", 8, 500],
    ["s88", "Slots — 88% RTP", 12, 500],
    ["war", "Casino War (go to war on ties)", 2.88, 60],
    ["sicbo", "Sic Bo — Big / Small", 2.78, 60],
    ["tcp", "Three-card poker — ante / play", 3.37, 50],
    ["keno", "Keno (typical)", 25, 12],
    ["custom", "Custom game…", 1, 60]
  ];
  var sel = $("#he-game");
  sel.innerHTML = GAMES.map(function (g) { return '<option value="' + g[0] + '">' + g[1] + (g[0] !== "custom" ? " · " + g[2] + "%" : "") + "</option>"; }).join("");
  function g() { var k = sel.value; for (var i = 0; i < GAMES.length; i++) if (GAMES[i][0] === k) return GAMES[i]; return GAMES[0]; }
  function v(id, d) { var x = parseFloat($(id).value); return isFinite(x) && x >= 0 ? x : d; }
  function calc() {
    var bet = v("#he-bet", 10), pace = v("#he-pace", 60), hrs = v("#he-hours", 3), freq = v("#he-freq", 2), edge = v("#he-edge", 1) / 100;
    var hour = bet * pace * edge, sess = hour * hrs;
    $("#hk-hour").textContent = EC.money(hour); $("#hk-sess").textContent = EC.money(sess);
    $("#hk-month").textContent = EC.money(sess * freq); $("#hk-year").textContent = EC.money(sess * freq * 12, 0);
    $("#hk-wager").textContent = EC.money(bet * pace * hrs, 0);
    $("#he-note").innerHTML = "You'd put <strong>" + EC.money(bet * pace * hrs, 0) + "</strong> through the game each session — about " + Math.round(bet * pace * hrs / Math.max(bet, 0.01)) + " bets — to have an expected cost of <strong>" + EC.money(sess) + "</strong>. That's " + EC.money(sess / Math.max(hrs, 0.01)) + " per hour of entertainment.";
    var list = GAMES.filter(function (x) { return x[0] !== "custom"; }).map(function (x) { return [x[1].replace(" — ", ": "), bet * x[3] * hrs * x[2] / 100, x[0] === sel.value]; }).sort(function (a, b) { return a[1] - b[1]; });
    var cv = $("#he-chart");
    // horizontal bar chart drawn directly for readability
    var r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; cv.width = r.width * dpr; cv.height = r.height * dpr;
    var ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
    var max = Math.max.apply(null, list.map(function (x) { return x[1]; })) || 1, rowH = (r.height - 10) / list.length, lw = Math.min(250, r.width * 0.5);
    ctx.font = "11px Inter, sans-serif"; ctx.textBaseline = "middle";
    list.forEach(function (x, i) {
      var y = 5 + i * rowH + rowH / 2, w = (r.width - lw - 70) * x[1] / max;
      ctx.fillStyle = x[2] ? C.color("--gold") : C.color("--muted"); ctx.textAlign = "right"; ctx.fillText(x[0].length > 40 ? x[0].slice(0, 39) + "…" : x[0], lw - 8, y);
      ctx.fillStyle = x[2] ? C.color("--gold") : C.color("--brand"); ctx.globalAlpha = x[2] ? 1 : .75; ctx.fillRect(lw, y - rowH * .32, Math.max(1, w), rowH * .64); ctx.globalAlpha = 1;
      ctx.fillStyle = C.color("--text"); ctx.textAlign = "left"; ctx.fillText(EC.money(x[1], 0), lw + w + 6, y);
    });
    EC.setParams({ g: sel.value, bet: bet, pace: pace, hrs: hrs, f: freq, e: (edge * 100).toFixed(2) });
  }
  sel.addEventListener("change", function () { var x = g(); if (x[0] !== "custom") { $("#he-edge").value = x[2]; $("#he-pace").value = x[3]; } calc(); });
  ["#he-bet", "#he-pace", "#he-hours", "#he-freq", "#he-edge"].forEach(function (id) { $(id).addEventListener("input", calc); });
  var p = EC.params();
  if (p.g) sel.value = p.g;
  var x = g(); $("#he-edge").value = p.e || x[2]; $("#he-pace").value = p.pace || x[3];
  if (p.bet) $("#he-bet").value = p.bet; if (p.hrs) $("#he-hours").value = p.hrs; if (p.f) $("#he-freq").value = p.f;
  calc();
  window.addEventListener("resize", calc);
})();
