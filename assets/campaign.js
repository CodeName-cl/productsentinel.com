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
    /** Apps Script que guarda los leads en el Google Sheet "Leads campaña Navidad 2026"
     *  (código: marketing/leads-sheet, y copia en el repo web scripts/leads-apps-script.gs). */
    leadEndpoint: "https://script.google.com/macros/s/AKfycbznpkaag95wVwCcjZRoPF2UwNbFMUba15Mq6zxP3XnykorZqfofA2zKM-V5Bgc1PlhV/exec",
    /** Chat de chat.codename.cl con el space de ProductSentinel.
     *  TODO: workspace y space (dashboard → Espacios: la clave bajo el nombre es el space).
     *  Vacíos = no se carga el chat. */
    chat: {
      src: "https://chat.codename.cl/widget.js", workspace: "ws_codename", space: "68d69f4f-fe37-4669-81dd-a257835daf02",
      /** Colores de la marca para la burbuja (el widget no tiene opción de tema). */
      color: "#003F91", hover: "#00347a", rgb: "0, 63, 145",
    },
    /** Video "ProductSentinel en un minuto" (56 s, 1080p). Acepta YouTube, Vimeo o .mp4. */
    videoUrl: "/assets/video/productsentinel-en-un-minuto.mp4",
    /** Miniatura del video (solo para .mp4). */
    videoPoster: "/assets/video/productsentinel-en-un-minuto.jpg",
    /** Precio del plan en USD/mes (el mismo de la Shopify App Store). null = "por confirmar". */
    monthlyUsd: 50,
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
        if (CONFIG.videoPoster) el.poster = CONFIG.videoPoster;
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
        // Sube la burbuja del chat para que no quede tapada por la CTA fija
        document.documentElement.style.setProperty("--chat-lift", visible.size === 0 ? sticky.offsetHeight + "px" : "0px");
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
    var chat = CONFIG.chat;
    if (chat.workspace && chat.space) {
      var c = document.createElement("script");
      c.async = true; c.src = chat.src;
      c.setAttribute("data-workspace", chat.workspace);
      c.setAttribute("data-space", chat.space);
      document.body.appendChild(c);

      // Color de marca: el widget usa Shadow DOM abierto, así que le agregamos una
      // hoja de estilos propia que pisa su morado por defecto.
      var css = ".bubble{background:C;box-shadow:0 8px 24px rgba(R,.28)}.bubble .dot{box-shadow:0 0 0 2px C}"
        + "input:focus,textarea:focus{outline-color:rgba(R,.16);border-color:C}button.primary{background:C}"
        + "button.primary:hover{background:H}.msg.visitor{background:C}.drop-active{outline-color:C}";
      css = css.replace(/C/g, chat.color).replace(/H/g, chat.hover).replace(/R/g, chat.rgb);
      var theme = function () {
        var host = document.querySelector("[data-codename-chat]");
        if (!host || !host.shadowRoot) return false;
        var st = document.createElement("style");
        st.textContent = css;
        host.shadowRoot.appendChild(st);
        return true;
      };
      if (!theme()) {
        var mo = new MutationObserver(function () { if (theme()) mo.disconnect(); });
        mo.observe(document.body, { childList: true });
      }

      // chat_start: el widget no emite eventos. Cuando el visitante deja su correo,
      // el widget guarda la sesión en localStorage; detectamos esa clave nueva.
      var chatKey = "codename.chat." + chat.workspace + "." + chat.space;
      var hasSession = function () { try { return !!localStorage.getItem(chatKey); } catch (e) { return false; } };
      var started = hasSession();

      // Abrir el chat sin esperar al visitante (cerrado, tiende a ignorarse).
      // Escritorio: se abre solo a los 8 s. Teléfono: el panel taparía la página,
      // así que mostramos un aviso junto a la burbuja que lo abre al tocarlo.
      // Una vez por sesión, y nunca si ya tiene una conversación.
      (function () {
        var KEY = "chat_nudged";
        try { if (sessionStorage.getItem(KEY) || localStorage.getItem(chatKey)) return; } catch (e) { return; }
        function root() { var h = document.querySelector("[data-codename-chat]"); return h && h.shadowRoot; }
        function isOpen() { var r = root(); return !!(r && r.querySelector(".panel")); }
        function open() { var r = root(), b = r && r.querySelector(".bubble"); if (b && !isOpen()) b.click(); }
        function done() { try { sessionStorage.setItem(KEY, "1"); } catch (e) {} }
        setTimeout(function () {
          if (!root() || isOpen()) return done();
          done();
          if (matchMedia("(min-width: 768px)").matches) return open();
          var tip = document.createElement("div");
          tip.className = "chat-nudge";
          tip.innerHTML = '<button type="button" class="chat-nudge-open">¿Dudas? Escríbenos</button>'
            + '<button type="button" class="chat-nudge-x" aria-label="Cerrar aviso">×</button>';
          document.body.appendChild(tip);
          tip.querySelector(".chat-nudge-open").onclick = function () { tip.remove(); open(); };
          tip.querySelector(".chat-nudge-x").onclick = function () { tip.remove(); };
          document.addEventListener("click", function (e) {
            if (e.target.closest && e.target.closest("[data-codename-chat]")) tip.remove();
          });
        }, 8000);
      })();
      document.addEventListener("click", function (e) {
        if (started || !(e.target.closest && e.target.closest("[data-codename-chat]"))) return;
        var n = 0;
        var t = setInterval(function () {
          if (hasSession()) { started = true; clearInterval(t); window.landingTrack("chat_start"); }
          else if (++n > 20) clearInterval(t);
        }, 500);
      });
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
