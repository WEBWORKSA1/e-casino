/* e.casino odds converter & vig calculator. © e.casino */
(function () {
  "use strict";
  var EC = window.EC, $ = EC.$;
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function toFrac(dec) {
    var x = dec - 1; if (x <= 0) return "—";
    var best = [1, 1], err = 1e9;
    for (var d = 1; d <= 100; d++) { var n = Math.round(x * d), e = Math.abs(n / d - x); if (n > 0 && e < err - 1e-12) { err = e; best = [n, d]; } if (e < 1e-9) break; }
    var g = gcd(best[0], best[1]); return best[0] / g + "/" + best[1] / g;
  }
  function toAm(dec) { if (dec <= 1) return "—"; return dec >= 2 ? "+" + Math.round((dec - 1) * 100) : "−" + Math.round(100 / (dec - 1)); }
  function parseAny(s) {
    s = String(s).trim().replace("−", "-"); if (!s) return NaN;
    if (/^[+-]\d+(\.\d+)?$/.test(s)) { var a = parseFloat(s); return a > 0 ? 1 + a / 100 : 1 + 100 / Math.abs(a); }
    if (/^\d+(\.\d+)?\s*[\/:]\s*\d+(\.\d+)?$/.test(s)) { var p = s.split(/[\/:]/); return 1 + parseFloat(p[0]) / parseFloat(p[1]); }
    var d = parseFloat(s); return d > 1 ? d : NaN;
  }
  var lock = false;
  function setAll(dec, from) {
    if (!(dec > 1) || lock) { $("#oc-msg").textContent = dec > 1 ? "" : "Enter valid odds (decimal above 1.00)."; return; }
    lock = true;
    if (from !== "dec") $("#oc-dec").value = dec.toFixed(dec < 10 ? 3 : 2).replace(/0+$/, "").replace(/\.$/, ".0");
    if (from !== "frac") $("#oc-frac").value = toFrac(dec);
    if (from !== "am") $("#oc-am").value = toAm(dec);
    if (from !== "imp") $("#oc-imp").value = (100 / dec).toFixed(2);
    lock = false;
    var st = parseFloat($("#oc-stake").value) || 0;
    $("#oc-profit").textContent = EC.money(st * (dec - 1)); $("#oc-return").textContent = "profit · " + EC.money(st * dec) + " total return";
    $("#oc-msg").innerHTML = "These odds imply a <strong>" + (100 / dec).toFixed(2) + "%</strong> chance. You break even long-term only if the true probability is at least that.";
  }
  $("#oc-dec").addEventListener("input", function () { setAll(parseFloat(this.value), "dec"); });
  $("#oc-frac").addEventListener("input", function () { var p = this.value.split(/[\/:]/); setAll(p.length === 2 ? 1 + parseFloat(p[0]) / parseFloat(p[1]) : NaN, "frac"); });
  $("#oc-am").addEventListener("input", function () { var a = parseFloat(this.value.replace("−", "-")); setAll(isFinite(a) && Math.abs(a) >= 100 ? (a > 0 ? 1 + a / 100 : 1 + 100 / Math.abs(a)) : NaN, "am"); });
  $("#oc-imp").addEventListener("input", function () { var p = parseFloat(this.value); setAll(p > 0 && p < 100 ? 100 / p : NaN, "imp"); });
  $("#oc-stake").addEventListener("input", function () { setAll(parseFloat($("#oc-dec").value), "dec"); });
  function vig() {
    var odds = ["#vg-a", "#vg-b", "#vg-c"].map(function (id) { return parseAny($(id).value); }).filter(function (x) { return x > 1; });
    if (odds.length < 2) { $("#vg-out").innerHTML = '<p class="muted">Enter at least two outcomes.</p>'; return; }
    var imp = odds.map(function (d) { return 1 / d; }), tot = imp.reduce(function (a, b) { return a + b; }, 0);
    var rows = odds.map(function (d, i) { var fair = imp[i] / tot; return "<tr><td>" + "ABC"[i] + "</td><td>" + d.toFixed(3) + " (" + toAm(d) + ")</td><td>" + EC.pct(imp[i], 2) + "</td><td>" + EC.pct(fair, 2) + "</td><td>" + (1 / fair).toFixed(3) + " (" + toAm(1 / fair) + ")</td></tr>"; }).join("");
    $("#vg-out").innerHTML = '<div class="kpis"><div class="kpi gold"><b>' + EC.pct(tot - 1, 2) + '</b><span>Overround</span></div><div class="kpi bad"><b>' + EC.pct(1 - 1 / tot, 2) + '</b><span>Bookmaker margin (hold if balanced)</span></div></div>' +
      '<div class="table-wrap"><table class="data"><thead><tr><th></th><th>Odds</th><th>Implied</th><th>Fair (no-vig)</th><th>Fair odds</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  }
  ["#vg-a", "#vg-b", "#vg-c"].forEach(function (id) { $(id).addEventListener("input", vig); });
  $("#oc-ref").innerHTML = [1.25, 1.5, 1.8, 1.91, 2, 2.5, 3, 4, 5, 11].map(function (d) { return "<tr><td>" + d.toFixed(2) + "</td><td>" + toFrac(d) + "</td><td>" + toAm(d) + "</td><td>" + (100 / d).toFixed(1) + "%</td></tr>"; }).join("");
  setAll(2.5, "dec"); vig();
})();
