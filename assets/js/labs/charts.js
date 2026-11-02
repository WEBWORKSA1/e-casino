/* e.casino tiny canvas charts (line + bars), theme-aware. © e.casino */
(function () {
  "use strict";
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "#888"; }
  function setup(cv) {
    var r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
    var ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    return { ctx: ctx, w: r.width, h: r.height };
  }
  function fmt(v) {
    var a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toFixed(1) + "M";
    if (a >= 1e4) return (v / 1e3).toFixed(0) + "k";
    if (a >= 1e3) return (v / 1e3).toFixed(1) + "k";
    return Math.round(v * 100) / 100 + "";
  }
  function axes(c, x0, y0, x1, y1, min, max, ticks, yfmt) {
    var ctx = c.ctx; ctx.strokeStyle = css("--border"); ctx.fillStyle = css("--faint"); ctx.lineWidth = 1; ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (var i = 0; i <= ticks; i++) {
      var v = min + (max - min) * i / ticks, y = y1 - (y1 - y0) * i / ticks;
      ctx.globalAlpha = .6; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillText((yfmt || fmt)(v), x0 - 6, y);
    }
  }
  window.ECChart = {
    color: css,
    line: function (cv, series, o) {
      o = o || {}; var c = setup(cv), ctx = c.ctx, pad = { l: 52, r: 12, t: 14, b: 26 };
      var all = []; series.forEach(function (s) { all = all.concat(s.data); }); if (o.ref !== undefined) all.push(o.ref);
      var min = Math.min.apply(null, all), max = Math.max.apply(null, all); if (min === max) { min -= 1; max += 1; }
      var span = max - min; min -= span * .05; max += span * .05;
      var x0 = pad.l, x1 = c.w - pad.r, y0 = pad.t, y1 = c.h - pad.b, n = Math.max.apply(null, series.map(function (s) { return s.data.length; }));
      axes(c, x0, y0, x1, y1, min, max, 4, o.yfmt);
      function Y(v) { return y1 - (v - min) / (max - min) * (y1 - y0); }
      function X(i) { return x0 + (x1 - x0) * i / Math.max(1, n - 1); }
      if (o.ref !== undefined) { ctx.setLineDash([5, 4]); ctx.strokeStyle = css("--gold"); ctx.beginPath(); ctx.moveTo(x0, Y(o.ref)); ctx.lineTo(x1, Y(o.ref)); ctx.stroke(); ctx.setLineDash([]); }
      series.forEach(function (s) {
        ctx.strokeStyle = s.color || css("--brand"); ctx.globalAlpha = s.alpha || 1; ctx.lineWidth = s.width || 2; ctx.beginPath();
        s.data.forEach(function (v, i) { if (i) ctx.lineTo(X(i), Y(v)); else ctx.moveTo(X(i), Y(v)); }); ctx.stroke(); ctx.globalAlpha = 1;
      });
      ctx.fillStyle = css("--faint"); ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.font = "11px Inter, sans-serif";
      if (o.xlabel) ctx.fillText(o.xlabel, (x0 + x1) / 2, y1 + 8);
    },
    bars: function (cv, labels, values, o) {
      o = o || {}; var c = setup(cv), ctx = c.ctx, pad = { l: 46, r: 10, t: 14, b: 30 };
      var vals = values.concat(o.compare || []), max = Math.max.apply(null, vals.concat([0])), min = Math.min.apply(null, vals.concat([0]));
      if (max === min) max = min + 1;
      var x0 = pad.l, x1 = c.w - pad.r, y0 = pad.t, y1 = c.h - pad.b, n = values.length, bw = (x1 - x0) / n;
      axes(c, x0, y0, x1, y1, min, max, 4, o.yfmt);
      function Y(v) { return y1 - (v - min) / (max - min) * (y1 - y0); }
      values.forEach(function (v, i) {
        var col = o.colors ? o.colors[i] : (v < 0 && o.signColor ? css("--red") : css("--brand"));
        ctx.fillStyle = col; ctx.globalAlpha = .9;
        var top = Y(Math.max(v, 0)), bot = Y(Math.min(v, 0));
        ctx.fillRect(x0 + i * bw + bw * .12, top, bw * .76, Math.max(1, bot - top)); ctx.globalAlpha = 1;
      });
      if (o.compare) {
        ctx.fillStyle = css("--gold"); ctx.strokeStyle = css("--gold"); ctx.lineWidth = 2; ctx.beginPath();
        o.compare.forEach(function (v, i) { var x = x0 + i * bw + bw / 2, y = Y(v); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke();
        o.compare.forEach(function (v, i) { ctx.beginPath(); ctx.arc(x0 + i * bw + bw / 2, Y(v), 3, 0, 6.3); ctx.fill(); });
      }
      ctx.fillStyle = css("--faint"); ctx.font = "11px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
      var every = Math.ceil(n / Math.max(1, Math.floor((x1 - x0) / 34)));
      labels.forEach(function (l, i) { if (i % every === 0) ctx.fillText(l, x0 + i * bw + bw / 2, y1 + 8); });
    },
    hist: function (values, bins) {
      var min = Math.min.apply(null, values), max = Math.max.apply(null, values); if (min === max) { max = min + 1; }
      var w = (max - min) / bins, counts = new Array(bins).fill(0), labels = [];
      values.forEach(function (v) { var b = Math.min(bins - 1, Math.floor((v - min) / w)); counts[b]++; });
      for (var i = 0; i < bins; i++) labels.push(fmt(min + w * (i + .5)));
      return { labels: labels, counts: counts, min: min, w: w };
    }
  };
})();
