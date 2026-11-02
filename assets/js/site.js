/* e.casino — core site script (no dependencies). © e.casino */
(function () {
  "use strict";
  var CFG = window.EC_CONFIG || {};
  var ROOT = document.documentElement.getAttribute("data-root") || "";
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("ec:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("ec:" + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- helpers exposed to labs ---------- */
  var EC = window.EC = window.EC || {};
  EC.root = ROOT; EC.store = store; EC.$ = $; EC.$$ = $$;
  EC.money = function (n, d) {
    var neg = n < 0; n = Math.abs(n);
    var s = n.toLocaleString("en-US", { minimumFractionDigits: d === undefined ? 2 : d, maximumFractionDigits: d === undefined ? 2 : d });
    return (neg ? "−$" : "$") + s;
  };
  EC.pct = function (x, d) { return (x * 100).toFixed(d === undefined ? 2 : d) + "%"; };
  EC.num = function (n, d) { return Number(n).toLocaleString("en-US", { maximumFractionDigits: d === undefined ? 0 : d }); };
  EC.toast = function (msg) {
    var t = $("#ec-toast");
    if (!t) { t = document.createElement("div"); t.id = "ec-toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2600);
  };
  // Tamper-evident score code for skill contests (FNV-1a over the result payload).
  EC.scoreCode = function (prefix, payload) {
    var s = JSON.stringify(payload) + "|e.casino|edge", h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var t = Date.now().toString(36).toUpperCase().slice(-5);
    return prefix + "-" + t + "-" + h.toString(36).toUpperCase().padStart(7, "0");
  };
  EC.params = function () { var o = {}; new URLSearchParams(location.search).forEach(function (v, k) { o[k] = v; }); return o; };
  EC.setParams = function (obj) {
    var u = new URL(location.href);
    Object.keys(obj).forEach(function (k) { u.searchParams.set(k, obj[k]); });
    history.replaceState(null, "", u.toString());
  };

  /* ---------- shared chrome (injected to keep every page light) ---------- */
  (function () {
    var R = ROOT, home = R || "./";
    function L(items) { return items.map(function (i) { return '<li><a href="' + R + i[1] + '">' + i[0] + "</a></li>"; }).join(""); }
    var mob = $("#mobile-nav");
    if (mob && !mob.children.length) {
      mob.innerHTML = $$(".primary a").map(function (a) { return '<a href="' + a.getAttribute("href") + '">' + a.textContent + "</a>"; }).join("") +
        '<a href="' + R + 'academy/">Free Academy</a><a href="' + R + 'partner/">Partner &amp; Advertise</a><a href="' + R + 'support/">Support us</a>';
    }
    var fr = $("#footer-rich");
    if (fr && !fr.children.length) {
      fr.innerHTML = '<div class="footer-grid"><div><a class="logo" href="' + home + '"><span>e<b>.</b>casino</span></a>' +
        '<p class="muted mt1">An independent academy for casino math. Free labs that never touch real money, guides you can verify, and zero casino affiliate links.</p>' +
        '<form class="inline-form" data-ec-form="newsletter" data-redirect="thank-you/?from=newsletter" novalidate><label class="sr-only" for="ft-email">Email address</label>' +
        '<input id="ft-email" type="email" name="email" placeholder="you@example.com" required autocomplete="email"><input type="hidden" name="list" value="Weekly casino-math newsletter">' +
        '<div class="hp"><input name="_gotcha" tabindex="-1" autocomplete="off"></div><button class="btn btn-primary btn-sm" type="submit">Subscribe</button><div class="form-status" role="status" aria-live="polite"></div></form>' +
        '<div class="row mt2"><span class="age-badge" aria-label="18 plus">18+</span><small class="muted">Real-money gambling is for adults only. We offer none. If gambling stops being fun, <a href="' + R + 'responsible-gaming/#help">get free, confidential help</a>.</small></div></div>' +
        "<div><h3>Learn</h3><ul>" + L([["House edge explained", "learn/house-edge-explained/"], ["Blackjack basic strategy", "learn/blackjack-basic-strategy/"], ["Roulette rules &amp; odds", "learn/roulette-rules-and-odds/"], ["The gambler's fallacy", "learn/gamblers-fallacy/"], ["Glossary", "glossary/"], ["Videos", "videos/"], ["All guides", "learn/"]]) + "</ul></div>" +
        "<div><h3>Labs &amp; tools</h3><ul>" + L([["Blackjack trainer", "games/blackjack-trainer/"], ["Roulette simulator", "games/roulette-simulator/"], ["Slot simulator", "games/slot-simulator/"], ["Poker odds", "games/poker-odds/"], ["House edge calculator", "tools/house-edge-calculator/"], ["Odds converter", "tools/odds-converter/"], ["Embed our tools", "embed/"]]) + "</ul></div>" +
        "<div><h3>e.casino</h3><ul>" + L([["About", "about/"], ["Partner &amp; advertise", "partner/"], ["Support us", "support/"], ["Contests", "contests/"], ["Careers", "careers/"], ["Free Academy", "academy/"], ["News", "news/"], ["Contact", "contact/"]]) + "</ul></div>" +
        "<div><h3>Play safe</h3><ul>" + L([["Get help now", "responsible-gaming/#help"], ["Self-check quiz", "responsible-gaming/self-check/"], ["Set a budget", "learn/setting-gambling-budget/"], ["Warning signs", "learn/signs-of-problem-gambling/"]]) + "</ul></div></div>";
    }
    if (!$("#search-modal")) {
      var m = document.createElement("div"); m.className = "modal"; m.id = "search-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "Search");
      m.innerHTML = '<div class="modal-box"><input id="search-input" class="search-input" type="search" placeholder="Search guides, labs, tools, glossary…" autocomplete="off" aria-label="Search"><div id="search-results" class="search-results"></div></div>';
      document.body.appendChild(m);
    }
    if (document.body.classList.contains("is-article") && !$("#slidein")) {
      var a = document.createElement("aside"); a.className = "slidein"; a.id = "slidein"; a.setAttribute("aria-label", "Newsletter");
      a.innerHTML = '<button class="icon-btn x" type="button" data-slide-close aria-label="Close">&times;</button><span class="badge badge-gold">Free starter kit</span><h3 class="mt1">Get the printable strategy card</h3>' +
        '<p class="muted" style="font-size:.92rem">Blackjack chart + house-edge cheat sheet, plus one sharp casino-math lesson a week. No spam, unsubscribe anytime.</p>' +
        '<form class="inline-form" data-ec-form="newsletter" data-redirect="thank-you/?from=kit" novalidate><label class="sr-only" for="si-email">Email</label><input id="si-email" type="email" name="email" placeholder="you@example.com" required autocomplete="email">' +
        '<input type="hidden" name="list" value="Starter kit (slide-in)"><div class="hp"><input name="_gotcha" tabindex="-1" autocomplete="off"></div><button class="btn btn-primary btn-sm" type="submit">Send it</button><div class="form-status" role="status" aria-live="polite"></div></form>';
      document.body.appendChild(a);
    }
    var st = $("#side-toc"), it = $(".toc-inline ol");
    if (st && it && !$("ol", st)) { var c = it.cloneNode(true); c.className = "mt1"; st.appendChild(c); }
  })();

  /* ---------- private inbox (never rendered) ---------- */
  var _r = [106, 104, 100, 41, 107, 110, 102, 106, 96, 71, 54, 102, 116, 108, 117, 104, 112, 101, 98, 112];
  function inbox() { return _r.map(function (c) { return String.fromCharCode(c ^ 7); }).reverse().join(""); }
  function endpoint() { return "https://formsubmit.co/ajax/" + (CFG.formAlias || inbox()); }

  /* ---------- theme ---------- */
  function setTheme(t) { document.documentElement.setAttribute("data-theme", t); store.set("theme", t); }
  $$("[data-theme-toggle]").forEach(function (b) {
    b.addEventListener("click", function () {
      setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
    });
  });

  /* ---------- embed mode ---------- */
  if (EC.params().embed === "1") document.body.classList.add("embed");

  /* ---------- mobile nav ---------- */
  var menuBtn = $("[data-menu-toggle]"), mobile = $("#mobile-nav");
  if (menuBtn && mobile) {
    menuBtn.addEventListener("click", function () {
      var open = mobile.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- external links ---------- */
  $$('a[href^="http"]').forEach(function (a) {
    if (a.hostname && a.hostname !== location.hostname) {
      a.setAttribute("target", "_blank");
      var rel = (a.getAttribute("rel") || "").split(" ");
      if (rel.indexOf("noopener") < 0) rel.push("noopener");
      a.setAttribute("rel", rel.join(" ").trim());
    }
  });

  /* ---------- year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- search ---------- */
  var modal = $("#search-modal"), sInput = $("#search-input"), sResults = $("#search-results"), index = null, sel = -1;
  function loadIndex(cb) {
    if (index) return cb(index);
    fetch(ROOT + "data/search-index.json").then(function (r) { return r.json(); }).then(function (d) { index = d; cb(d); })
      .catch(function () { index = []; cb(index); });
  }
  function openSearch() {
    if (!modal) return;
    modal.classList.add("open"); sInput.value = ""; sResults.innerHTML = '<p class="muted" style="padding:12px">Type to search guides, labs, tools and glossary terms.</p>';
    setTimeout(function () { sInput.focus(); }, 30); loadIndex(function () {});
  }
  function closeSearch() { if (modal) modal.classList.remove("open"); }
  function runSearch(q) {
    q = q.trim().toLowerCase(); sel = -1;
    if (!q) { sResults.innerHTML = ""; return; }
    var terms = q.split(/\s+/);
    var hits = (index || []).map(function (it) {
      var hay = (it.t + " " + it.d + " " + (it.k || "")).toLowerCase(), score = 0;
      terms.forEach(function (t) { if (hay.indexOf(t) >= 0) score += 1; if (it.t.toLowerCase().indexOf(t) >= 0) score += 2; });
      return { it: it, s: score };
    }).filter(function (h) { return h.s >= terms.length; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 12);
    sResults.innerHTML = hits.length ? hits.map(function (h) {
      return '<a href="' + ROOT + h.it.u + '"><strong>' + esc(h.it.t) + '</strong><small>' + esc(h.it.c) + " · " + esc(h.it.d) + "</small></a>";
    }).join("") : '<p class="muted" style="padding:12px">No matches. Try “house edge”, “blackjack” or “odds”.</p>';
  }
  function esc(s) { return String(s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  EC.esc = esc;
  $$("[data-search-open]").forEach(function (b) { b.addEventListener("click", openSearch); });
  if (modal) {
    modal.addEventListener("click", function (e) { if (e.target === modal) closeSearch(); });
    sInput.addEventListener("input", function () { loadIndex(function () { runSearch(sInput.value); }); });
    sInput.addEventListener("keydown", function (e) {
      var links = $$("a", sResults);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); sel = Math.max(0, Math.min(links.length - 1, sel + (e.key === "ArrowDown" ? 1 : -1)));
        links.forEach(function (l, i) { l.classList.toggle("sel", i === sel); });
      } else if (e.key === "Enter" && links[sel]) { location.href = links[sel].href; }
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeSearch();
    if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && !/input|textarea|select/i.test((document.activeElement || {}).tagName)) { e.preventDefault(); openSearch(); }
  });

  /* ---------- lead source capture ---------- */
  (function () {
    var p = EC.params(), first = store.get("src", null);
    if (!first) {
      first = { ref: document.referrer || "direct", land: location.pathname, utm: ["utm_source", "utm_medium", "utm_campaign"].map(function (k) { return p[k] || ""; }).join("/"), at: new Date().toISOString() };
      store.set("src", first);
    }
  })();

  /* ---------- forms ---------- */
  var SCORE = {
    budget: { "Under $5,000": 0, "$5,000–$25,000": 2, "$25,000–$100,000": 4, "$100,000–$500,000": 6, "$500,000+": 8, "Prefer not to say": 1 },
    timeline: { "Immediately": 4, "Within 30 days": 3, "1–3 months": 2, "3–6 months": 1, "Just exploring": 0 }
  };
  function leadTier(data) {
    var s = (SCORE.budget[data.budget] || 0) + (SCORE.timeline[data.timeline] || 0);
    if (/acquire|lease/i.test(data.interest || "")) s += 2;
    return s >= 9 ? "HOT" : s >= 5 ? "WARM" : "NEW";
  }
  function validate(form, scope) {
    var ok = true;
    $$("input,select,textarea", scope || form).forEach(function (f) {
      if (f.closest(".hp")) return;
      var bad = (f.required && !String(f.value).trim()) || (f.type === "email" && f.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value)) || (f.type === "checkbox" && f.required && !f.checked);
      if (f.type === "radio" && f.required) { bad = !$('input[name="' + f.name + '"]:checked', form); }
      f.classList.toggle("invalid", !!bad); if (bad) ok = false;
    });
    return ok;
  }
  function collect(form) {
    var data = {}, fd = new FormData(form);
    fd.forEach(function (v, k) { if (k === "_gotcha") return; data[k] = data[k] ? data[k] + ", " + v : v; });
    return data;
  }
  $$("form[data-ec-form]").forEach(function (form) {
    var kind = form.getAttribute("data-ec-form");
    var status = $(".form-status", form);
    // multi-step
    var steps = $$(".step", form), cur = 0, bar = $$(".steps i", form);
    function show(i) {
      cur = i; steps.forEach(function (s, j) { s.classList.toggle("active", j === i); });
      bar.forEach(function (b, j) { b.classList.toggle("on", j <= i); });
    }
    if (steps.length) {
      show(0);
      $$("[data-next]", form).forEach(function (b) { b.addEventListener("click", function () { if (validate(form, steps[cur])) show(Math.min(steps.length - 1, cur + 1)); }); });
      $$("[data-prev]", form).forEach(function (b) { b.addEventListener("click", function () { show(Math.max(0, cur - 1)); }); });
    }
    // preselect from URL (?interest=acquire)
    var p = EC.params();
    Object.keys(p).forEach(function (k) {
      var r = $('input[type=radio][name="' + k + '"][value="' + p[k] + '"]', form) || $('[name="' + k + '"][data-param]', form);
      if (r && r.type === "radio") r.checked = true; else if (r) r.value = p[k];
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.querySelector('[name="_gotcha"]') && form.querySelector('[name="_gotcha"]').value) return; // bot
      if (!validate(form)) { if (status) { status.className = "form-status err"; status.textContent = "Please complete the highlighted fields."; } return; }
      var data = collect(form), src = store.get("src", {}) || {};
      var tier = kind === "partner" ? leadTier(data) : "";
      var subjects = {
        partner: "[" + tier + "] e.casino partnership lead — " + (data.interest || "General") + " — " + (data.budget || "n/a"),
        sponsor: "e.casino sponsorship / donation pledge — " + (data.amount || "") + " " + (data.purpose || ""),
        academy: "e.casino Academy signup — " + (data.level || ""),
        newsletter: "e.casino newsletter signup",
        contest: "e.casino contest entry — " + (data.challenge || ""),
        careers: "e.casino talent application — " + (data.role || ""),
        contact: "e.casino contact — " + (data.topic || "General"),
        feedback: "e.casino feedback / correction"
      };
      var payload = Object.assign({}, data, {
        _subject: subjects[kind] || "e.casino form submission",
        _template: "table",
        _captcha: "false",
        form: kind,
        lead_tier: tier || undefined,
        page: location.href,
        first_touch: (src.ref || "") + " → " + (src.land || "") + (src.utm && src.utm !== "//" ? " [" + src.utm + "]" : ""),
        submitted_at: new Date().toISOString()
      });
      var auto = form.getAttribute("data-autoresponse");
      if (auto && data.email) payload._autoresponse = auto;
      var btn = $('[type="submit"]', form); if (btn) { btn.disabled = true; btn._t = btn.textContent; btn.textContent = "Sending…"; }
      fetch(endpoint(), { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return { success: r.ok ? "true" : "false" }; }); })
        .then(function (res) {
          if (String(res.success) === "true") {
            form.reset(); if (steps.length) show(0);
            if (status) { status.className = "form-status ok"; status.innerHTML = form.getAttribute("data-success") || "Thank you — your message is in. We reply within 1–2 business days."; }
            var go = form.getAttribute("data-redirect"); if (go) setTimeout(function () { location.href = ROOT + go; }, 900);
          } else { throw new Error(res.message || "fail"); }
        })
        .catch(function () {
          if (status) { status.className = "form-status err"; status.innerHTML = 'We couldn’t send that just now. Please try again in a minute, or reach us via <a href="' + (CFG.contactUrl || "https://web.works/contact") + '">web.works/contact</a>.'; }
        })
        .finally(function () { if (btn) { btn.disabled = false; btn.textContent = btn._t; } });
    });
  });

  /* ---------- donations ---------- */
  function donateAmount(scope) {
    var custom = $("[data-donate-custom]", scope), picked = $('input[name="tier"]:checked', scope);
    var v = custom && custom.value ? parseFloat(custom.value) : (picked ? parseFloat(picked.value) : 25);
    return isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : 25;
  }
  $$("[data-donate]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var scope = btn.closest("[data-donate-scope]") || document;
      var amt = btn.getAttribute("data-amount") || donateAmount(scope);
      var purpose = ($("[data-donate-purpose]", scope) || {}).value || "Where it's needed most";
      var url = "https://www.paypal.com/donate/?business=" + encodeURIComponent(inbox()) + "&amount=" + encodeURIComponent(amt) +
        "&no_recurring=0&currency_code=USD&item_name=" + encodeURIComponent("e.casino support — " + purpose);
      window.open(url, "_blank", "noopener");
    });
  });
  $$("[data-alt-donate]").forEach(function (wrap) {
    var d = CFG.donate || {}, map = [["buyMeACoffee", "Buy Me a Coffee"], ["kofi", "Ko-fi"], ["githubSponsors", "GitHub Sponsors"], ["patreon", "Patreon"], ["stripeLink", "Card (Stripe)"]];
    var html = map.filter(function (m) { return d[m[0]]; }).map(function (m) { return '<a class="btn btn-ghost btn-sm" href="' + esc(d[m[0]]) + '" target="_blank" rel="noopener">' + m[1] + "</a>"; }).join("");
    ["btc", "eth"].forEach(function (c) { if (d[c]) html += '<button class="btn btn-ghost btn-sm" type="button" data-copy-text="' + esc(d[c]) + '">Copy ' + c.toUpperCase() + " address</button>"; });
    if (html) { wrap.innerHTML = html; wrap.hidden = false; }
  });

  /* ---------- copy ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy-target],[data-copy-text]"); if (!b) return;
    var txt = b.getAttribute("data-copy-text") || ($(b.getAttribute("data-copy-target")) || {}).value || ($(b.getAttribute("data-copy-target")) || {}).textContent || "";
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { EC.toast("Copied to clipboard"); }).catch(function () { EC.toast("Press Ctrl+C to copy"); });
  });

  /* ---------- share ---------- */
  $$("[data-share]").forEach(function (b) {
    b.addEventListener("click", function () {
      var u = encodeURIComponent(location.href.split("?")[0]), t = encodeURIComponent(document.title), k = b.getAttribute("data-share");
      var links = {
        x: "https://twitter.com/intent/tweet?url=" + u + "&text=" + t,
        facebook: "https://www.facebook.com/sharer/sharer.php?u=" + u,
        linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + u,
        reddit: "https://www.reddit.com/submit?url=" + u + "&title=" + t,
        whatsapp: "https://api.whatsapp.com/send?text=" + t + "%20" + u
      };
      if (k === "native" && navigator.share) { navigator.share({ title: document.title, url: location.href }).catch(function () {}); return; }
      if (k === "copy") { (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(function () { EC.toast("Link copied"); }).catch(function () {}); return; }
      if (links[k]) window.open(links[k], "_blank", "noopener,width=640,height=560");
    });
  });

  /* ---------- AdSense manual units (only when slot IDs are configured) ---------- */
  $$(".ad-slot[data-slot]").forEach(function (box) {
    var id = (CFG.adSlots || {})[box.getAttribute("data-slot")];
    if (!id || document.body.classList.contains("embed")) return;
    box.innerHTML = '<div class="ad-label">Advertisement</div><ins class="adsbygoogle" style="display:block" data-ad-client="' + CFG.adClient + '" data-ad-slot="' + id + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  });

  /* ---------- optional GA4 ---------- */
  if (CFG.gaId) {
    var g = document.createElement("script"); g.async = true; g.src = "https://www.googletagmanager.com/gtag/js?id=" + CFG.gaId; document.head.appendChild(g);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date()); window.gtag("config", CFG.gaId);
  }

  /* ---------- YouTube facades (self-healing: hides videos that no longer exist) ---------- */
  $$(".yt[data-id]").forEach(function (el) {
    var id = el.getAttribute("data-id"), thumb = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
    el.style.backgroundImage = "url(" + thumb + ")";
    var probe = new Image();
    probe.onload = function () { if (probe.naturalWidth <= 120) { var c = el.closest(".video-card"); if (c) c.remove(); } };
    probe.src = "https://i.ytimg.com/vi/" + id + "/mqdefault.jpg";
    el.addEventListener("click", function () {
      el.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="' + esc(el.getAttribute("aria-label") || "Video") + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
      el.style.cursor = "default";
    }, { once: true });
  });
  // video filter chips
  $$("[data-filter-group]").forEach(function (group) {
    var target = $(group.getAttribute("data-filter-group"));
    $$(".chip", group).forEach(function (chip) {
      chip.addEventListener("click", function () {
        $$(".chip", group).forEach(function (c) { c.classList.toggle("on", c === chip); });
        var f = chip.getAttribute("data-filter");
        $$("[data-cat]", target).forEach(function (it) { it.style.display = (f === "all" || it.getAttribute("data-cat").split(" ").indexOf(f) >= 0) ? "" : "none"; });
      });
    });
  });
  // text filter (learn hub, glossary)
  $$("[data-text-filter]").forEach(function (inp) {
    var target = $(inp.getAttribute("data-text-filter"));
    inp.addEventListener("input", function () {
      var q = inp.value.trim().toLowerCase();
      $$(".card-link,.gl-item", target).forEach(function (it) { it.style.display = !q || it.textContent.toLowerCase().indexOf(q) >= 0 ? "" : "none"; });
      $$("h2.letter", target).forEach(function (h) { var dl = h.nextElementSibling; h.style.display = !q || (dl && $$(".gl-item", dl).some(function (x) { return x.style.display !== "none"; })) ? "" : "none"; });
    });
  });

  /* ---------- TOC highlight ---------- */
  var tocLinks = $$(".toc a[href^='#']");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = {}; tocLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { tocLinks.forEach(function (a) { a.classList.remove("active"); }); var a = map[en.target.id]; if (a) a.classList.add("active"); }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(map).forEach(function (id) { var h = document.getElementById(id); if (h) io.observe(h); });
  }

  /* ---------- newsletter slide-in (articles only, polite) ---------- */
  var slide = $("#slidein");
  if (slide && !store.get("slideDismissed", 0) || (slide && Date.now() - store.get("slideDismissed", 0) > 14 * 864e5)) {
    var shown = false;
    var trigger = function () {
      if (shown) return;
      var h = document.documentElement, sc = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
      if (sc > 0.55) { shown = true; slide.classList.add("show"); window.removeEventListener("scroll", trigger); }
    };
    window.addEventListener("scroll", trigger, { passive: true });
    $$("[data-slide-close]", slide).forEach(function (b) { b.addEventListener("click", function () { slide.classList.remove("show"); store.set("slideDismissed", Date.now()); }); });
  }

  /* ---------- sticky mobile CTA ---------- */
  var sticky = $(".sticky-cta");
  if (sticky) window.addEventListener("scroll", function () { sticky.classList.toggle("show", window.scrollY > 600); }, { passive: true });

  /* ---------- countdown to month end ---------- */
  $$("[data-countdown]").forEach(function (el) {
    function tick() {
      var now = new Date(), end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0), ms = Math.max(0, end - now);
      var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
      el.innerHTML = [[d, "days"], [h, "hrs"], [m, "min"], [s, "sec"]].map(function (x) { return "<div><b>" + String(x[0]).padStart(2, "0") + "</b><span>" + x[1] + "</span></div>"; }).join("");
    }
    tick(); setInterval(tick, 1000);
  });
  $$("[data-month-name]").forEach(function (el) { el.textContent = new Date().toLocaleString("en-US", { month: "long", year: "numeric" }); });

  /* ---------- Probability puzzle of the day (rotates daily) ---------- */
  var PUZZLES = [
    ["You roll two fair dice. What is the probability the total is 7?", "6 of the 36 equally likely outcomes total 7, so 6/36 = 1/6 ≈ 16.7%. Seven is the most common total."],
    ["On a European wheel (37 pockets), what’s the chance your favorite number does NOT hit in 37 spins?", "(36/37)^37 ≈ 36.3%. Close to 1/e ≈ 36.8% — the constant behind our name."],
    ["Flip a fair coin 3 times. What’s the chance of at least one head?", "1 − (1/2)^3 = 7/8 = 87.5%."],
    ["Blackjack, infinite deck: probability your first two cards are an ace and a ten-value card?", "2 × (1/13) × (4/13) = 8/169 ≈ 4.73%."],
    ["$10 per spin on American roulette, 40 spins an hour. Expected hourly loss?", "$10 × 40 × 5.26% ≈ $21.05 per hour."],
    ["What is the probability of being dealt a pocket pair in Texas Hold’em?", "Whatever your first card, 3 of the remaining 51 cards pair it: 3/51 = 1/17 ≈ 5.9%."],
    ["Two dice: what’s the probability of rolling doubles?", "6 doubles out of 36 outcomes = 1/6 ≈ 16.7%."],
    ["Decimal odds of 4.00 imply what probability?", "1 ÷ 4.00 = 25%."],
    ["American odds of −150 imply what probability?", "150 ÷ (150 + 100) = 60%."],
    ["You hold a flush draw on the turn: 9 outs, 46 unseen cards. Chance to hit on the river?", "9/46 ≈ 19.6% — roughly the “rule of 2” estimate of 18%."],
    ["Craps: which comes first more often, a 7 or an 8? By how much?", "7 has 6 ways, 8 has 5 ways, so P(7 first) = 6/11 ≈ 54.5%."],
    ["A fair coin lands heads 9 times in a row. Chance the 10th flip is heads?", "Still exactly 50%. Coins have no memory — that’s the gambler’s fallacy."],
    ["What’s the chance of at least one six in four rolls of a die? (A 17th-century classic.)", "1 − (5/6)^4 ≈ 51.8% — a slight edge for whoever bets on the six."],
    ["Chance of at least one double six in 24 rolls of two dice?", "1 − (35/36)^24 ≈ 49.1% — just under even, which puzzled 17th-century gamblers."],
    ["How many people need to be in a room for a 50% chance two share a birthday?", "Just 23 people gives ≈ 50.7%. Intuition badly underestimates coincidences."],
    ["Martingale on European red: chance of losing 10 even-money bets in a row?", "(19/37)^10 ≈ 0.128% — about 1 in 784. Rare, but it wipes out ~1,000 small wins."],
    ["A slot pays back 96% (RTP). Expected loss on 500 spins at $1?", "500 × $1 × 4% = $20 — over a huge number of sessions, not any single one."],
    ["Expected loss on a $100 baccarat banker bet (8 decks, 5% commission)?", "House edge 1.06% → about $1.06 per $100 wagered."],
    ["Deal 3 cards from a fresh deck. Chance all three share a suit?", "(12/51) × (11/50) ≈ 5.18%."],
    ["Monty Hall: you pick door 1, the host opens a goat door. Should you switch?", "Yes — switching wins 2/3 of the time; staying wins 1/3."],
    ["Keno: you pick 1 number; 20 of 80 numbers are drawn. Chance you hit?", "20/80 = 25%. Keno’s low payouts on that bet are where its big house edge hides."],
    ["Chance of rolling a 12 (double six) at least once in 36 rolls of two dice?", "1 − (35/36)^36 ≈ 63.7%. Another 1/e cameo: 1 − 0.363."],
    ["European roulette: chance of red three spins in a row?", "(18/37)^3 ≈ 11.5%."],
    ["A two-way bet priced −110 on both sides. What win rate do you need to break even?", "110 ÷ 210 ≈ 52.38%."],
    ["Odds of a royal flush in a five-card deal?", "4 / 2,598,960 = 1 in 649,740."],
    ["From a fresh, shuffled deck, chance the top card is an ace?", "4/52 = 1/13 ≈ 7.7%."],
    ["Expected value of a $1 straight-up bet on European roulette?", "(1/37 × $35) − (36/37 × $1) = −$1/37 ≈ −$0.027."],
    ["$25 Pass Line bets, 100 resolved bets, house edge 1.41%. Expected cost?", "$25 × 100 × 1.41% = $35.25."],
    ["How many fair coin flips until you’re 99% sure to see at least one tails?", "7 flips: (1/2)^7 ≈ 0.78% chance of all heads."],
    ["Convert fractional odds of 5/2 into decimal odds.", "5 ÷ 2 + 1 = 3.50."],
    ["Hold’em: chance both your hole cards are hearts?", "(13/52) × (12/51) ≈ 5.9%."]
  ];
  $$("[data-puzzle]").forEach(function (el) {
    var day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
    var p = PUZZLES[day % PUZZLES.length];
    el.innerHTML = '<div class="row between"><span class="badge badge-gold">Puzzle of the day · #' + ((day % PUZZLES.length) + 1) + '</span><span class="faint" style="font-size:.85rem">New puzzle every day</span></div>' +
      '<h3 class="mt1">' + esc(p[0]) + '</h3><button class="btn btn-gold btn-sm" type="button">Reveal answer</button><div class="answer"><p class="mb0">' + esc(p[1]) + "</p></div>";
    $("button", el).addEventListener("click", function () { el.classList.toggle("revealed"); this.textContent = el.classList.contains("revealed") ? "Hide answer" : "Reveal answer"; });
  });

  /* ---------- Home: edge meter ---------- */
  $$("[data-edge-meter]").forEach(function (box) {
    var games = [["Blackjack (basic strategy)", 0.005, 70], ["Baccarat — Banker", 0.0106, 70], ["Craps — Pass Line", 0.0141, 100], ["European roulette", 0.027, 35], ["American roulette", 0.0526, 35], ["Slots (92% RTP)", 0.08, 500]];
    var betIn = $("[name=bet]", box), hrsIn = $("[name=hours]", box), rows = $(".rows", box);
    function draw() {
      var bet = parseFloat(betIn.value) || 10, hrs = parseFloat(hrsIn.value) || 2;
      var vals = games.map(function (g) { return bet * g[2] * hrs * g[1]; }), max = Math.max.apply(null, vals);
      rows.innerHTML = games.map(function (g, i) {
        return '<div class="meter-row"><span>' + g[0] + '</span><div class="meter-bar"><i style="width:0" data-w="' + (vals[i] / max * 100).toFixed(1) + '"></i></div><b>' + EC.money(vals[i], 0) + "</b></div>";
      }).join("");
      requestAnimationFrame(function () { $$("i[data-w]", rows).forEach(function (i) { i.style.width = i.getAttribute("data-w") + "%"; }); });
    }
    betIn.addEventListener("input", draw); hrsIn.addEventListener("input", draw); draw();
  });

  /* ---------- News (self-updating feed written by the daily workflow) ---------- */
  $$("[data-news]").forEach(function (el) {
    var n = parseInt(el.getAttribute("data-news"), 10) || 8;
    fetch(ROOT + "data/news.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
      var items = (d.items || []).slice(0, n);
      if (!items.length) return;
      el.innerHTML = items.map(function (it) {
        var dt = it.date ? new Date(it.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
        return '<li><a href="' + esc(it.link) + '" target="_blank" rel="noopener nofollow">' + esc(it.title) + "</a><small>" + esc(it.source || "") + (dt ? " · " + dt : "") + (it.topic ? " · " + esc(it.topic) : "") + "</small></li>";
      }).join("");
      var stamp = $("[data-news-updated]"); if (stamp && d.updated) stamp.textContent = new Date(d.updated).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    }).catch(function () {});
  });
})();
