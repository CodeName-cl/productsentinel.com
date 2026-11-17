/*
 * Landings de campaña de ProductSentinel (Black Friday / Navidad 2026).
 * Lo usan /black y /navidad. Se carga en el <head>, sin defer.
 *
 * Todo lo marcado con TODO depende de las preguntas abiertas de la campaña.
 * Mientras un valor esté vacío la página sigue funcionando: ese bloque se oculta
 * o muestra un placeholder.
 *
 * Eventos (dataLayer + Meta): form_submit → Lead, chat_start → Contact,
 * schedule_click → Schedule, install_click → InstallClick (custom).
 * Todos llevan product="ps", cta_location y los utm_* de la visita.
 */
(function () {
  var CONFIG = {
    /** Contenedor de GTM. Es el mismo de codename.cl, para que el reporte semanal vea ambos productos. */
    gtmId: "GTM-5CWP9SPQ",
    /** TODO: ID del píxel de Meta. Vacío = no se carga. */
    metaPixelId: "",
    /** TODO: URL /exec del Apps Script que guarda los leads en el Google Sheet
     *  (código en el repo web: scripts/leads-apps-script.gs). */
    leadEndpoint: "",
    /** TODO: script del widget de chat. Debe llamar a window.landingTrack("chat_start"). */
    chatScriptSrc: "",
    /** TODO: video del producto (YouTube, Vimeo o .mp4). */
    videoUrl: "",
    /** TODO: precio nuevo ajustado a Latinoamérica, en USD/mes. null = "por confirmar". */
    monthlyUsd: null,
    /** TODO: oferta de Black Friday, ej. { monthlyUsd: 9, label: "Oferta Black Friday" }. null = sin oferta. */
    blackFriday: null,
    blackFridayEnds: "2026-12-01T03:00:00Z", // 30 nov 23:59, hora de Chile
    christmas: "2026-12-25T03:00:00Z", // 25 dic 00:00, hora de Chile
  };
  window.PS_CAMPAIGN = CONFIG;

  var product = "ps";
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var DEFAULT_UTM = { utm_source: "productsentinel.com", utm_medium: "landing", utm_campaign: "navidad-2026-ps" };

  // ---- UTMs de la visita (se mantienen al navegar dentro de la sesión) ----
  var params = new URLSearchParams(location.search);
  var utm = {};
  try { utm = JSON.parse(sessionStorage.getItem("landing_utm") || "{}"); } catch (e) {}
  if (KEYS.some(function (k) { return params.get(k); })) {
    utm = {};
    KEYS.forEach(function (k) { if (params.get(k)) utm[k] = params.get(k); });
    try { sessionStorage.setItem("landing_utm", JSON.stringify(utm)); } catch (e) {}
  }
  window.landingUtm = utm;

  // ---- dataLayer + helper de eventos ----
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(Object.assign({ landing_product: product }, utm));
  var META = {
    form_submit: ["track", "Lead"],
    chat_start: ["track", "Contact"],
    schedule_click: ["track", "Schedule"],
    install_click: ["trackCustom", "InstallClick"],
  };
  window.landingTrack = function (name, extra) {
    var data = Object.assign({ product: product }, utm, extra || {});
    window.dataLayer.push(Object.assign({ event: name }, data));
    var m = META[name];
    if (m && typeof window.fbq === "function") window.fbq(m[0], m[1], data);
  };

  // ---- GTM ----
  if (CONFIG.gtmId) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtm.js?id=" + CONFIG.gtmId;
    document.head.appendChild(g);
  }

  // ---- Píxel de Meta ----
  if (CONFIG.metaPixelId) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", CONFIG.metaPixelId);
    window.fbq("track", "PageView");
  }

  document.addEventListener("DOMContentLoaded", function () {
    // ---- Enlaces de instalación con UTMs (de la visita o por defecto) ----
    var linkUtm = Object.keys(utm).length ? utm : DEFAULT_UTM;
    document.querySelectorAll('a[data-track="install_click"]').forEach(function (a) {
      try {
        var u = new URL(a.href);
        Object.keys(linkUtm).forEach(function (k) { u.searchParams.set(k, linkUtm[k]); });
        a.href = u.toString();
      } catch (e) {}
    });
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("[data-track]");
      if (a) window.landingTrack(a.getAttribute("data-track"), { cta_location: a.getAttribute("data-loc") || "" });
    });

    // ---- Precio y oferta de Black Friday ----
    var bfActive = CONFIG.blackFriday && Date.now() < Date.parse(CONFIG.blackFridayEnds);
    document.querySelectorAll("[data-price]").forEach(function (el) {
      if (CONFIG.monthlyUsd == null) return; // deja el placeholder "por confirmar"
      var show = el.hasAttribute("data-bf") && bfActive ? CONFIG.blackFriday.monthlyUsd : CONFIG.monthlyUsd;
      el.innerHTML = "USD " + show + '<span class="price-unit"> /mes</span>';
    });
    document.querySelectorAll("[data-bf-only]").forEach(function (el) {
      if (!bfActive || CONFIG.monthlyUsd == null) return;
      el.hidden = false;
      el.querySelectorAll("[data-bf-label]").forEach(function (l) { l.textContent = CONFIG.blackFriday.label; });
      el.querySelectorAll("[data-old-price]").forEach(function (l) { l.textContent = "USD " + CONFIG.monthlyUsd + "/mes"; });
    });

    // ---- Video ----
    document.querySelectorAll("[data-video]").forEach(function (box) {
      var url = CONFIG.videoUrl;
      if (!url) return;
      var title = box.getAttribute("data-video") || "Video";
      var yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/);
      var vm = url.match(/vimeo\.com\/(\d+)/);
      var el;
      if (/\.(mp4|webm)(\?|$)/i.test(url)) {
        el = document.createElement("video");
        el.src = url; el.controls = true; el.playsInline = true; el.preload = "metadata";
        el.setAttribute("aria-label", title);
      } else if (yt || vm) {
        el = document.createElement("iframe");
        el.src = yt ? "https://www.youtube-nocookie.com/embed/" + yt[1] + "?rel=0&modestbranding=1" : "https://player.vimeo.com/video/" + vm[1] + "?dnt=1";
        el.title = title; el.loading = "lazy"; el.allowFullscreen = true;
        el.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      } else return;
      el.className = "absolute inset-0 h-full w-full border-0";
      box.innerHTML = "";
      box.appendChild(el);
    });

    // ---- Cuenta regresiva a Navidad ----
    document.querySelectorAll("[data-countdown]").forEach(function (el) {
      var days = Math.ceil((Date.parse(CONFIG.christmas) - Date.now()) / 86400000);
      if (days > 1) el.textContent = "Quedan " + days + " días para Navidad";
      else if (days === 1) el.textContent = "Mañana es Navidad";
    });

    // ---- CTA fija en el teléfono: se oculta mientras hay otra CTA o el formulario en pantalla ----
    var sticky = document.getElementById("sticky-cta");
    var watch = document.querySelectorAll("[data-hide-sticky]");
    if (sticky && "IntersectionObserver" in window && watch.length) {
      var visible = new Set();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.isIntersecting ? visible.add(en.target) : visible.delete(en.target); });
        sticky.classList.toggle("translate-y-0", visible.size === 0);
        sticky.classList.toggle("translate-y-[110%]", visible.size !== 0);
      });
      watch.forEach(function (el) { io.observe(el); });
    }

    // ---- Animación suave al hacer scroll (como la portada) ----
    if ("IntersectionObserver" in window) {
      var rv = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rv.unobserve(e.target); } });
      }, { threshold: 0.12 });
      document.querySelectorAll(".reveal").forEach(function (el) { rv.observe(el); });
    } else {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    }

    // ---- Formulario de lead → Google Sheet ----
    var form = document.getElementById("leadForm");
    if (form) initForm(form);

    // ---- Chat ----
    if (CONFIG.chatScriptSrc) {
      var c = document.createElement("script");
      c.async = true; c.src = CONFIG.chatScriptSrc;
      document.body.appendChild(c);
    }
  });

  function initForm(form) {
    var err = form.querySelector("[data-form-error]");
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function normalizeStore(v) {
      v = (v || "").trim().toLowerCase();
      if (!v) return "";
      if (!/^https?:\/\//.test(v)) v = "https://" + v;
      return v.replace(/\/+$/, "");
    }

    function validate() {
      var ok = true;
      form.querySelectorAll("input[required][type=text], input[required][type=email]").forEach(function (i) {
        var bad = !i.value.trim() || (i.type === "email" && !EMAIL.test(i.value.trim()));
        i.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad) ok = false;
      });
      ["shopify_plus", "qualifier"].forEach(function (n) {
        var fs = form.querySelector('input[name="' + n + '"]').closest("fieldset");
        var bad = !form.querySelector('input[name="' + n + '"]:checked');
        fs.setAttribute("data-invalid", bad ? "true" : "false");
        if (bad) ok = false;
      });
      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        err.hidden = false;
        var first = form.querySelector('[aria-invalid="true"], fieldset[data-invalid="true"] input');
        if (first) first.focus();
        return;
      }
      err.hidden = true;
      var fd = new FormData(form);
      var payload = Object.assign({
        product: product,
        name: String(fd.get("name")).trim(),
        email: String(fd.get("email")).trim(),
        store_url: normalizeStore(fd.get("store_url")),
        shopify_plus: fd.get("shopify_plus"),
        qualifier: { question: form.getAttribute("data-qualifier-label"), answer: fd.get("qualifier") },
        landing_url: location.origin + location.pathname,
        referrer: document.referrer || "",
        submitted_at: new Date().toISOString(),
        website: String(fd.get("website") || ""), // campo trampa antispam
      }, utm);

      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Enviando…";

      // text/plain: Apps Script no responde el preflight CORS de application/json
      var send = CONFIG.leadEndpoint
        ? fetch(CONFIG.leadEndpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), keepalive: true }).catch(function () {})
        : Promise.resolve(console.warn("[landing] leadEndpoint vacío; payload:", payload));

      window.landingTrack("form_submit", { shopify_plus: payload.shopify_plus, qualifier: payload.qualifier.answer });

      send.finally(function () {
        var done = document.getElementById("leadDone");
        form.hidden = true;
        done.hidden = false;
        done.focus();
      });
    });
  }
})();
