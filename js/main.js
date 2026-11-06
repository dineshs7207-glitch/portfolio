/* ==========================================================================
   MAIN — content binding, preloader + sound choice, scroll-scrubbed film,
   blades, panels, contact.
   ========================================================================== */
(function () {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  history.scrollRestoration = "manual";

  const D = window.PORTFOLIO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const FX = window.FX.state;

  // layout modes — kept in sync with the CSS media queries
  const isPhone = () => innerWidth < 700;
  const dockCards = () => innerWidth < 1000 || innerWidth / innerHeight < 1.1; // cards sit at the bottom
  const narrowTitle = () => innerWidth / innerHeight < 1.4;                     // title art can't fit → HTML name

  /* Blade → section mapping (order of flight) */
  const BLADES = [
    { layer: "blade1", key: "experience" },
    { layer: "blade2", key: "projects" },
    { layer: "blade3", key: "skills" },
    { layer: "blade4", key: "education" },
    { layer: "blade5", key: "writing" }
  ];
  const ORDER = BLADES.map(b => b.key);

  /* Scene list — `at` is the timeline time where the scene has cut in.
     Blade scenes get a longer span so the card can be read and clicked. */
  const SCENES = [
    { id: "hero",    name: "Prologue",     at: 0 },
    { id: "profile", name: "Identity",     at: 1.3 },
    { id: "hand",    name: "The craft",    at: 2.8 },
    { id: "face",    name: "Focus",        at: 4.0 },
    { id: "windup",  name: "Wind-up",      at: 5.2 },
    { id: "throw",   name: "Release",      at: 6.0 },
    { id: "blade1",  name: "Blade I",      at: 7.2 },
    { id: "blade2",  name: "Blade II",     at: 8.8 },
    { id: "blade3",  name: "Blade III",    at: 10.4 },
    { id: "blade4",  name: "Blade IV",     at: 12.0 },
    { id: "blade5",  name: "Blade V",      at: 13.6 },
    { id: "wide",    name: "Return",       at: 15.2 },
    { id: "front",   name: "The front",    at: 16.2 },
    { id: "title",   name: "Transmission", at: 17.2 }
  ];
  const END = 18.8;
  const VH_PER_UNIT = 0.92; // scroll distance per timeline unit, in viewport heights
  const sceneById = id => SCENES.find(s => s.id === id);
  const nextAt = id => { const i = SCENES.findIndex(s => s.id === id); return SCENES[i + 1] ? SCENES[i + 1].at : END; };

  /* Points where the visitor is asked to act — scrolling settles onto these */
  const HOLDS = [
    { t: 2.05, win: 0.5 }, // profile: contact / know more
    ...BLADES.map(b => {
      const s = sceneById(b.layer).at, e = nextAt(b.layer);
      return { t: (s + 0.5 + e - 0.45) / 2, win: (e - s) / 2 - 0.05 };
    })
  ];

  /* ======================================================================
     1. Bind content
     ====================================================================== */
  function bindContent() {
    const full = `${D.name.first} ${D.name.last}`;
    $(".js-initials").textContent = (D.name.first[0] + D.name.last[0]).toUpperCase();
    $(".js-location").textContent = D.location;
    $(".js-role").textContent = D.role;
    $(".js-intro").textContent = D.intro;
    $(".js-about").textContent = D.about;
    $(".js-motto").innerHTML = D.motto;
    $(".js-contact-blurb").textContent = D.contactBlurb;
    $(".js-year").textContent = new Date().getFullYear();
    $(".js-fullname").textContent = D.fullName || full;
    $(".js-ch-total").textContent = String(SCENES.length + 1).padStart(2, "0");
    const ma = $(".js-mname-a"), mb = $(".js-mname-b");
    ma.textContent = ma.dataset.text = D.name.first;
    mb.textContent = mb.dataset.text = D.name.last;

    // Hero line: split into words, *word* → ember
    let ember = false;
    $(".js-hero-line").innerHTML = D.heroLine.split(" ").map(w => {
      const open = w.startsWith("*"), close = w.replace(/[.,!?]$/, "").endsWith("*");
      if (open) ember = true;
      const clean = esc(w.replace(/\*/g, ""));
      const out = `<span class="w"><span>${ember ? `<em>${clean}</em>` : clean}</span></span>`;
      if (close) ember = false;
      return out;
    }).join(" ");

    const chars = s => [...s].map(c => `<span class="ch">${esc(c)}</span>`).join("");
    $(".js-first").innerHTML = chars(D.name.first);
    $(".js-last").innerHTML = chars(D.name.last);

    $(".js-stats").innerHTML = D.stats.map(s =>
      `<li><b><span class="js-num" data-v="${s.value}">0</span><sup>${esc(s.suffix)}</sup></b><span>${esc(s.label)}</span></li>`).join("");

    $(".js-blade-index").innerHTML = BLADES.map((b, i) =>
      `<li><button class="js-jump" data-label="${b.layer}"><em>0${i + 1}</em>${esc(D.sections[b.key].title)}</button></li>`).join("");

    // Contact links with hover cards
    const ICONS = {
      Email: `<path d="M3 6h18v12H3z"/><path d="M3 7l9 6 9-6"/>`,
      LinkedIn: `<path d="M4 9h3v11H4zM5.5 4.2a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zM10 9h3v1.6c.5-.9 1.7-1.8 3.4-1.8 3 0 3.6 2 3.6 4.6V20h-3v-5.8c0-1.4 0-3.1-1.9-3.1s-2.1 1.5-2.1 3V20h-3z"/>`,
      Phone: `<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>`
    };
    $(".js-links").innerHTML = D.links.map(l => {
      const ext = /^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : "";
      return `<li class="clink">
        <a href="${esc(l.url)}"${ext}>${esc(l.label)} <small>${esc(l.handle)} ↗</small></a>
        ${l.note ? `<div class="clink__pop" role="tooltip">
          <div class="clink__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${ICONS[l.label] || ICONS.Email}</svg></div>
          <div class="clink__body">
            <span class="clink__note">${esc(l.note)}</span>
            <b class="clink__val">${esc(l.handle)}</b>
            <div class="clink__acts">
              <a href="${esc(l.url)}"${ext} class="clink__act">${esc(l.action || "Open")} ↗</a>
              ${l.copy ? `<button type="button" class="clink__act js-copy" data-copy="${esc(l.copy)}">Copy</button>` : ""}
            </div>
          </div>
        </div>` : ""}
      </li>`;
    }).join("");

    // Blade target cards
    const arrow = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 13L13 3M5 3h8v8"/></svg>`;
    $(".js-targets").innerHTML = BLADES.map((b, i) => {
      const s = D.sections[b.key];
      return `<div class="target" data-for="${b.layer}">
        <i class="target__line"></i>
        <i class="target__ring"></i>
        <div class="target__card">
          <div class="target__meta"><span>Blade 0${i + 1}</span><span>0${i + 1} / 0${BLADES.length}</span></div>
          <h3 class="target__title">${esc(s.title)}</h3>
          <p class="target__desc">${esc(s.teaser)}</p>
          <button class="target__btn js-open" data-panel="${b.key}"><span>${esc(s.cta)}</span>${arrow}</button>
        </div>
      </div>`;
    }).join("");
  }

  /* ======================================================================
     2. Layout: object-position per layer, title fit, blade target geometry
     ====================================================================== */
  const IMG_RATIO = 1344 / 576;
  function coverRect(W, H, fx, fy) {
    let rw, rh;
    if (W / H > IMG_RATIO) { rw = W; rh = W / IMG_RATIO; } else { rh = H; rw = H * IMG_RATIO; }
    return { rw, rh, ox: (W - rw) * fx, oy: (H - rh) * fy };
  }

  let lastW = 0;
  function sizeTrack() {
    if (innerWidth === lastW) return; // ignore mobile URL-bar height changes
    lastW = innerWidth;
    $(".track").style.height = Math.round(END * VH_PER_UNIT * innerHeight) + "px";
  }

  function layout() {
    const W = innerWidth, H = innerHeight;
    document.body.classList.toggle("is-docked", dockCards());

    // Title card: shrink so the full name fits; on narrow screens keep it full-bleed
    // wide screens: show the whole image (contain) so the full name is in frame
    const fit = narrowTitle() ? 1 : 0.96;
    $(".layer__fit").style.transform = `scale(${fit})`;
    $(".layer__fit").classList.toggle("is-fit", fit < 1);

    $$(".layer").forEach(layer => {
      const fx = +layer.dataset.fx, fy = +layer.dataset.fy;
      $$("img", layer).forEach(img => (img.style.objectPosition = `${fx * 100}% ${fy * 100}%`));
      if (layer.dataset.bx == null) return;
      const r = coverRect(W, H, fx, fy);
      const px = r.ox + +layer.dataset.bx * r.rw;
      const py = r.oy + +layer.dataset.by * r.rh;
      $("img", layer).style.transformOrigin = `${px}px ${py}px`;

      const t = $(`.target[data-for="${layer.dataset.id}"]`);
      const ring = $(".target__ring", t), card = $(".target__card", t), line = $(".target__line", t);
      ring.style.left = px + "px"; ring.style.top = py + "px";
      const cw = card.offsetWidth, ch = card.offsetHeight;
      let cx, cy;
      if (dockCards()) {
        cx = (W - cw) / 2; cy = H - ch - Math.max(H * 0.08, 56);
      } else {
        // park the card in the empty half of the frame, well clear of the blade
        const g = 40;
        cx = px < W * 0.55 ? Math.max(px + W * 0.25, W * 0.56) : W * 0.07;
        cx = Math.min(Math.max(cx, g), W - cw - g);
        cy = Math.min(Math.max(py - ch / 2, 100), H - ch - 110);
      }
      card.style.left = cx + "px"; card.style.top = cy + "px";
      const ex = cx > px ? cx : cx + cw, ey = cy + ch / 2;
      const len = Math.hypot(ex - px, ey - py), ang = Math.atan2(ey - py, ex - px);
      Object.assign(line.style, { left: px + "px", top: py + "px", width: Math.max(0, len - 34) + "px",
        transform: `rotate(${ang}rad) translateX(34px)` });
    });
  }

  /* ======================================================================
     3. Preloader + sound choice
     ====================================================================== */
  function preload() {
    const srcs = [...new Set($$(".layer img").map(i => i.getAttribute("src")))];
    let done = 0;
    const counter = { v: 0 };
    const tick = () => {
      gsap.to(counter, { v: (done / srcs.length) * 100, duration: 0.6, ease: "power2.out", overwrite: true,
        onUpdate: () => {
          $(".js-count").textContent = String(Math.round(counter.v)).padStart(3, "0");
          $(".js-bar").style.width = counter.v + "%";
        } });
    };
    return Promise.all(srcs.map(src => new Promise(res => {
      const im = new Image();
      im.onload = im.onerror = () => { done++; tick(); res(); };
      im.src = src;
      if (im.decode) im.decode().catch(() => {});
    }))).then(() => document.fonts ? document.fonts.ready : null)
      .then(() => new Promise(r => gsap.delayedCall(0.9, r)));
  }

  function askSound() {
    return new Promise(resolve => {
      const box = $(".loader__choice");
      gsap.timeline()
        .to(".loader__count, .loader__label, .loader__bar", { y: -24, autoAlpha: 0, stagger: 0.05, duration: 0.5, ease: "power3.in" })
        .to(".loader__mark", { scale: 0.6, y: -10, duration: 0.6, ease: "power3.inOut" }, "<")
        .set(".loader__count, .loader__label, .loader__bar", { display: "none" })
        .add(() => { box.hidden = false; })
        .fromTo($$(".kicker, .loader__q, .loader__hint, .loader__btns .btn", box), { y: 40, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.8, ease: "power4.out" })
        .add(() => $(".js-enter", box).focus({ preventScroll: true }));
      $$(".js-enter", box).forEach(b => b.addEventListener("click", () => {
        window.BGM && window.BGM.start(b.dataset.sound === "on"); // inside the click → audio may start
        resolve();
      }, { once: true }));
    });
  }

  /* ======================================================================
     4. Smooth scroll + settle-on-choice
     ====================================================================== */
  let lenis = null;
  function initScroll() {
    if (!reduced && window.Lenis) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.85, touchMultiplier: 1.4 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
  let autoScrolling = false;
  function scrollTo(y, dur = 2.2) {
    autoScrolling = true;
    const done = () => { autoScrolling = false; };
    if (lenis) lenis.scrollTo(y, { duration: dur, easing: t => 1 - Math.pow(1 - t, 4), onComplete: done });
    else { window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" }); setTimeout(done, dur * 1000); }
  }
  const timeToY = t => filmST.start + (t / END) * (filmST.end - filmST.start);

  // When the visitor stops scrolling just before a decision point, glide onto it.
  // Only pulls in the direction of travel, so it never drags anyone backwards.
  let settleTimer, lastY = 0, dir = 1;
  function scheduleSettle() {
    const y = scrollY;
    if (y !== lastY) dir = y > lastY ? 1 : -1;
    lastY = y;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (autoScrolling || panelOpen || !filmST || reduced) return;
      const p = filmST.progress;
      if (p <= 0 || p >= 1) return;
      const t = p * END;
      const h = HOLDS.find(h => {
        const d = h.t - t;
        return (d * dir > 0 && Math.abs(d) < 0.55) || Math.abs(d) < 0.08;
      });
      if (h && Math.abs(t - h.t) > 0.03) scrollTo(timeToY(h.t), 0.9);
    }, 200);
  }

  /* ======================================================================
     5. The film — one master timeline scrubbed by the scroll track
     ====================================================================== */
  let film, filmST;

  function buildFilm() {
    // immediateRender:false — later fromTo's on the same element must not stomp earlier start states
    const tl = gsap.timeline({ defaults: { ease: "none", immediateRender: false } });
    const L = id => $(`.layer[data-id="${id}"]`);
    const IMG = id => $(`.layer[data-id="${id}"] img`);
    const OV = id => $(`.ov[data-ov="${id}"]`);
    const kids = el => $$(".kicker, h1, h2, .role, .lede, .cta-row, .stats li, .blade-index li, .glitch-tag", el);

    const ovIn = (id, t, opts = {}) => {
      const el = OV(id);
      tl.set(el, { autoAlpha: 1 }, t);
      tl.fromTo(opts.targets || kids(el), { y: 60, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.45, ease: "power3.out" }, t);
      const k = $(".kicker", el);
      if (k) tl.call(scramble, [k], t + 0.05);
    };
    const ovOut = (id, t) => {
      const el = OV(id);
      tl.to(kids(el), { y: -50, autoAlpha: 0, stagger: 0.03, duration: 0.3, ease: "power2.in" }, t);
      tl.set(el, { autoAlpha: 0 }, t + 0.42);
    };
    const fx = (t, vals, d = 0.6) => tl.to(FX, { ...vals, duration: d, ease: "sine.inOut" }, t);
    const retire = (id, t) => tl.set(L(id), { autoAlpha: 0 }, t);
    const drift = (id, from, to, t0, t1, extra = {}) =>
      tl.fromTo(IMG(id), { scale: from, ...extra.from }, { scale: to, duration: t1 - t0, ...extra.to }, t0);
    // anamorphic streak that sweeps across the frame on a cut
    const flare = (t, dir = 1) => tl.fromTo(".flare", { xPercent: -60 * dir, autoAlpha: 0 },
      { keyframes: { autoAlpha: [0, 1, 0.8, 0] }, xPercent: 60 * dir, duration: 0.55, ease: "power1.inOut" }, t);

    /* --- Hero: distant portrait → 3D orbit into the profile --- */
    const heroOv = OV("hero");
    gsap.set(heroOv, { autoAlpha: 1 });
    // pulled back on wide screens; portrait screens are too narrow to shrink it
    const heroBase = narrowTitle() ? 1 : 0.72;
    drift("hero", heroBase, heroBase + 0.08, 0, 0.6);
    tl.fromTo(heroOv, { y: 0, autoAlpha: 1 }, { y: -80, autoAlpha: 0, duration: 0.45, ease: "power2.in" }, 0.25);
    tl.fromTo(".scroll-cue", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 }, 0.05);
    // camera orbits: the hero swings away on Y while the profile swings in from the other side
    tl.fromTo(L("hero"), { rotateY: 0, rotateZ: 0, xPercent: 0, z: 0 },
      { rotateY: -82, rotateZ: -3, xPercent: -38, z: -380, duration: 0.75, ease: "power2.in" }, 0.55);
    tl.to(L("hero"), { autoAlpha: 0, duration: 0.25 }, 1.05);
    let s = sceneById("profile").at;
    tl.set(L("profile"), { autoAlpha: 1 }, 0.85);
    tl.fromTo(L("profile"), { rotateY: 82, rotateZ: 3, xPercent: 38, z: -380, opacity: 0 },
      { rotateY: 0, rotateZ: 0, xPercent: 0, z: 0, opacity: 1, duration: 0.75, ease: "power2.out" }, 0.85);
    flare(0.8);
    drift("profile", 1.22, 1.06, 0.85, s + 0.2, { to: { ease: "power3.out" } });
    drift("profile", 1.06, 1.14, s + 0.2, nextAt("profile"));
    fx(0.6, { smoke: 1, warm: 0.45, embers: 0.25, rush: 0.5 }, 0.4);
    fx(1.0, { rush: 0 }, 0.5);
    ovIn("profile", s, { targets: $$(".ov--profile .kicker, .ov--profile .role, .ov--profile .lede, .ov--profile .cta-row") });
    tl.fromTo(".ov--profile .ch", { yPercent: 115, rotate: 8 }, { yPercent: 0, rotate: 0, stagger: 0.025, duration: 0.45, ease: "power4.out" }, s - 0.05);
    tl.to(".ov--profile .ch", { yPercent: -115, stagger: 0.012, duration: 0.3, ease: "power2.in" }, nextAt("profile") - 0.55);
    ovOut("profile", nextAt("profile") - 0.5);

    /* --- Hand with blades: soft dissolve --- */
    s = sceneById("hand").at;
    tl.set(L("hand"), { autoAlpha: 0 }, s - 0.5);
    tl.to(L("hand"), { autoAlpha: 1, duration: 0.5 }, s - 0.5);
    drift("hand", 1.25, 1.06, s - 0.5, s + 0.1, { from: { filter: "brightness(1.8)" }, to: { filter: "brightness(1)", ease: "power2.out" } });
    drift("hand", 1.06, 1.16, s + 0.1, nextAt("hand"), { from: { xPercent: 0 }, to: { xPercent: -2 } });
    retire("profile", s + 0.05);
    fx(s - 0.5, { smoke: 0.75, warm: 0.6, embers: 0.35 });
    ovIn("hand", s);
    ovOut("hand", nextAt("hand") - 0.5);

    /* --- Blades to face: iris open --- */
    s = sceneById("face").at;
    tl.set(L("face"), { autoAlpha: 1 }, s - 0.5);
    tl.fromTo(L("face"), { clipPath: "circle(0% at 38% 45%)" }, { clipPath: "circle(120% at 38% 45%)", duration: 0.6, ease: "power2.inOut" }, s - 0.5);
    drift("face", 1.35, 1.06, s - 0.5, s + 0.15, { to: { ease: "power3.out" } });
    drift("face", 1.06, 1.12, s + 0.15, nextAt("face"));
    retire("hand", s + 0.15);
    fx(s - 0.5, { smoke: 0.9, warm: 0.35, embers: 0.4 });
    ovIn("face", s);
    $$(".js-num").forEach(n => {
      const o = { v: 0 };
      tl.to(o, { v: +n.dataset.v, duration: 0.5, ease: "power2.out", onUpdate: () => (n.textContent = Math.round(o.v)) }, s + 0.1);
    });
    ovOut("face", nextAt("face") - 0.5);

    /* --- Wind-up: hard cut with flash --- */
    s = sceneById("windup").at;
    tl.to(".flash", { opacity: 0.9, duration: 0.08 }, s - 0.15);
    tl.set(L("windup"), { autoAlpha: 1 }, s - 0.07);
    tl.to(".flash", { opacity: 0, duration: 0.3 }, s - 0.07);
    drift("windup", 1.2, 1.08, s - 0.07, nextAt("windup"), { from: { rotate: -1.5 }, to: { rotate: 0 } });
    retire("face", s);
    fx(s - 0.15, { smoke: 1.1, warm: 0.85, embers: 0.8 }, 0.3);
    ovIn("windup", s + 0.05);
    ovOut("windup", nextAt("windup") - 0.4);

    /* --- Throw: whip + smoke rush --- */
    s = sceneById("throw").at;
    tl.set(L("throw"), { autoAlpha: 1 }, s - 0.3);
    tl.fromTo(L("throw"), { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.3, ease: "power4.inOut" }, s - 0.3);
    drift("throw", 1.3, 1.06, s - 0.3, s + 0.3, { from: { xPercent: -6 }, to: { xPercent: 0, ease: "power3.out" } });
    drift("throw", 1.06, 1.18, s + 0.3, nextAt("throw"), { to: { transformOrigin: "75% 55%" } });
    retire("windup", s);
    flare(s - 0.3, -1);
    tl.to(FX, { rush: 1, duration: 0.25, ease: "power2.in" }, s - 0.3);
    tl.to(FX, { rush: 0, duration: 0.6, ease: "power2.out" }, s - 0.05);
    fx(s - 0.3, { smoke: 0.8, warm: 0.4, embers: 1 });
    tl.fromTo(".stage", { x: 0 }, { keyframes: { x: [0, -10, 8, -5, 3, 0] }, duration: 0.3 }, s - 0.15);
    ovIn("throw", s + 0.1);
    ovOut("throw", nextAt("throw") - 0.5);

    /* --- The five blades: zoom-through, then a calm hold with the card --- */
    BLADES.forEach((b, i) => {
      const id = b.layer;
      s = sceneById(id).at;
      const end = nextAt(id);
      const last = id === "blade5";
      const prev = SCENES[SCENES.findIndex(x => x.id === id) - 1].id;
      tl.set(L(id), { autoAlpha: 0 }, s - 0.45);
      tl.to(L(id), { autoAlpha: 1, duration: 0.35 }, s - 0.45);
      tl.to(IMG(prev), { scale: "+=0.45", duration: 0.45, ease: "power2.in" }, s - 0.45);
      // light blur only — heavy full-screen blur is what made these moments stutter
      drift(id, 1.75, last ? 1.0 : 1.08, s - 0.45, s + 0.1,
        { from: { rotate: i % 2 ? -6 : 6, filter: "blur(4px)" }, to: { rotate: 0, filter: "blur(0px)", ease: "power3.out" } });
      // hold: barely moving while the card is up (blade V eases *out* so the full figure is in frame)
      drift(id, last ? 1.0 : 1.08, last ? 0.88 : 1.14, s + 0.1, end - 0.45, { to: { ease: "sine.inOut" } });
      // (the next blade's entrance pushes this one out; the last one recedes into the wide shot)
      if (last) tl.to(IMG(id), { scale: 0.8, duration: 0.45, ease: "power1.in" }, end - 0.45);
      retire(prev, s);
      flare(s - 0.4, i % 2 ? -1 : 1);
      fx(s - 0.45, { smoke: 0.7, warm: i % 2 ? 0.7 : 0.4, embers: 0.6 }, 0.45);

      const t = $(`.target[data-for="${id}"]`);
      const ring = $(".target__ring", t), line = $(".target__line", t), card = $(".target__card", t);
      tl.set(t, { autoAlpha: 1 }, s + 0.05);
      tl.fromTo(ring, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.2, ease: "back.out(2)" }, s + 0.05);
      tl.fromTo(line, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.2, ease: "power2.out" }, s + 0.15);
      tl.fromTo(card, { autoAlpha: 0, y: 30, clipPath: "inset(0% 0% 100% 0%)" }, { autoAlpha: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 0.3, ease: "power3.out" }, s + 0.2);
      tl.fromTo($$(".target__meta, .target__title, .target__desc, .target__btn", card), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.25 }, s + 0.28);
      tl.call(scramble, [$(".target__meta span", card)], s + 0.3);
      tl.to([card, ring, line], { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, end - 0.45);
      tl.set(t, { autoAlpha: 0 }, end - 0.25);
    });

    /* --- Wide: dramatic zoom-out --- */
    s = sceneById("wide").at;
    tl.set(L("wide"), { autoAlpha: 0 }, s - 0.45);
    tl.to(L("wide"), { autoAlpha: 1, duration: 0.4 }, s - 0.45);
    drift("wide", 2.2, 1.06, s - 0.45, s + 0.35, { to: { ease: "power3.out" } });
    drift("wide", 1.06, 1.1, s + 0.35, nextAt("wide"));
    retire("blade5", s);
    fx(s - 0.45, { smoke: 1.1, warm: 0.5, embers: 0.3 });
    ovIn("wide", s + 0.1);
    ovOut("wide", nextAt("wide") - 0.45);

    /* --- Front: push in toward the camera --- */
    s = sceneById("front").at;
    tl.set(L("front"), { autoAlpha: 1 }, s - 0.5);
    tl.fromTo(L("front"), { clipPath: "circle(0% at 50% 38%)" }, { clipPath: "circle(120% at 50% 38%)", duration: 0.6, ease: "power2.inOut" }, s - 0.5);
    drift("front", 1.5, 1.06, s - 0.5, s + 0.15, { to: { ease: "power3.out" } });
    drift("front", 1.06, 1.3, s + 0.15, nextAt("front"), { to: { ease: "power1.in", transformOrigin: "50% 38%" } });
    retire("wide", s + 0.15);
    fx(s - 0.5, { smoke: 1.2, warm: 0.95, embers: 0.9 });
    ovIn("front", s + 0.05);
    ovOut("front", nextAt("front") - 0.45);

    /* --- Title: cyberpunk glitch reveal, framed so the whole name fits --- */
    s = sceneById("title").at;
    const g = $$(".layer[data-id='title'] img");
    tl.to(".flash", { opacity: 0.7, duration: 0.08 }, s - 0.3);
    tl.set(L("title"), { autoAlpha: 1 }, s - 0.22);
    tl.to(".flash", { opacity: 0, duration: 0.3 }, s - 0.22);
    retire("front", s - 0.1);
    flare(s - 0.2);
    [[12, 70], [55, 20], [30, 50], [70, 8], [5, 82], [40, 35]].forEach(([top, bottom], k) => {
      const at = s - 0.22 + k * 0.05;
      tl.set(g[1], { opacity: 1, x: (k % 2 ? -1 : 1) * (18 - k * 2), clipPath: `inset(${top}% 0 ${bottom}% 0)` }, at);
      tl.set(g[2], { opacity: 1, x: (k % 2 ? 1 : -1) * (14 - k * 2), clipPath: `inset(${bottom}% 0 ${top}% 0)` }, at);
      tl.set(g[0], { x: (k % 2 ? 6 : -6) }, at);
    });
    tl.set(g.slice(1), { opacity: 0, x: 0, clipPath: "inset(0% 0 0% 0)" }, s + 0.1);
    tl.set(g[0], { x: 0 }, s + 0.1);
    drift("title", 1.3, 1.0, s - 0.22, s + 0.45, { to: { ease: "power3.out" } });
    tl.to(".bars i", { scaleY: 0, duration: 0.4, ease: "power2.inOut" }, s);
    fx(s - 0.22, { smoke: 0.9, warm: 0.55, embers: 1 });
    ovIn("title", s + 0.2, { targets: $$(".ov--title .m-name span, .ov--title .glitch-tag") });
    tl.call(scramble, [$(".js-glitch-tag")], s + 0.25);
    tl.to({}, { duration: END - (s + 0.45) }, s + 0.45); // hold the title frame

    film = tl;
    filmST = ScrollTrigger.create({
      trigger: ".track",
      start: "top top",
      end: "bottom bottom",
      scrub: reduced ? true : 0.6,
      animation: tl,
      onUpdate: self => updateChapter(self.progress)
    });

    ScrollTrigger.create({
      trigger: ".contact", start: "top 60%", end: "bottom bottom",
      onEnter: () => setChapter(SCENES.length, "Contact"),
      onLeaveBack: () => updateChapter(filmST.progress)
    });
    // get the chapter counter out of the footer's way
    ScrollTrigger.create({
      trigger: ".footer", start: "top bottom",
      onEnter: () => gsap.to(".chapter", { autoAlpha: 0, duration: 0.4 }),
      onLeaveBack: () => gsap.to(".chapter", { autoAlpha: 1, duration: 0.4 })
    });

    // velocity → type leans into the motion, smoke streams with it
    if (lenis && !reduced) {
      const skew = gsap.quickTo(".overlays", "skewY", { duration: 0.6, ease: "power3" });
      lenis.on("scroll", e => {
        const v = gsap.utils.clamp(-1, 1, e.velocity / 60);
        skew(v * -2.5);
        scheduleSettle();
      });
    } else {
      addEventListener("scroll", scheduleSettle, { passive: true });
    }
  }

  /* ======================================================================
     6. Chapter HUD
     ====================================================================== */
  let curChapter = -1;
  function setChapter(i, name) {
    if (i === curChapter) return;
    curChapter = i;
    const num = $(".js-ch-num"), nm = $(".js-ch-name");
    gsap.timeline()
      .to([num, nm], { y: -10, autoAlpha: 0, duration: 0.18, ease: "power2.in" })
      .add(() => { num.textContent = String(i + 1).padStart(2, "0"); nm.textContent = name; })
      .fromTo([num, nm], { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: "power3.out", stagger: 0.04 });
  }
  function updateChapter(p) {
    const t = p * END;
    let i = 0;
    SCENES.forEach((s, k) => { if (t >= s.at - 0.25) i = k; });
    setChapter(i, SCENES[i].name);
    $(".js-ch-fill").style.width = (p * 100).toFixed(2) + "%";
    titleActive = t > sceneById("title").at + 0.2;
  }

  /* ======================================================================
     7. Glitch helpers
     ====================================================================== */
  const GLYPHS = "!<>-_\\/[]{}—=+*^?#01ΔΣ";
  function scramble(el) {
    if (!el || reduced) return;
    const final = el.dataset.final || (el.dataset.final = el.textContent);
    clearInterval(el._scr);
    let f = 0;
    el._scr = setInterval(() => {
      el.textContent = [...final].map((c, k) => (k < f / 2 || c === " ") ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join("");
      if (++f > final.length * 2) { clearInterval(el._scr); el.textContent = final; }
    }, 28);
  }

  let titleActive = false;
  function idleGlitch() {
    if (titleActive && !panelOpen && !reduced) {
      const g = $$(".layer[data-id='title'] img");
      const t = gsap.timeline();
      for (let k = 0; k < 4; k++) {
        const top = Math.random() * 80, h = 4 + Math.random() * 16;
        t.set(g[1], { opacity: 1, x: gsap.utils.random(-22, 22), clipPath: `inset(${top}% 0 ${100 - top - h}% 0)` }, k * 0.06)
         .set(g[2], { opacity: 1, x: gsap.utils.random(-16, 16), clipPath: `inset(${100 - top - h}% 0 ${top}% 0)` }, k * 0.06);
      }
      t.set(g.slice(1), { opacity: 0, x: 0 }, 0.26);
      $(".m-name").classList.add("is-glitch");
      gsap.delayedCall(0.3, () => $(".m-name").classList.remove("is-glitch"));
    }
    gsap.delayedCall(gsap.utils.random(2.2, 4.5), idleGlitch);
  }

  /* ======================================================================
     8. Jumps (nav, CTAs, blade index)
     ====================================================================== */
  function jumpTo(label) {
    if (label === "contact") return scrollTo($("#contact").offsetTop + innerHeight * 0.25, 2.8);
    if (label === "hero") return scrollTo(0, 2.8);
    const sc = sceneById(label);
    if (!sc || !filmST) return;
    const hold = HOLDS.find(h => h.t > sc.at && h.t < nextAt(label));
    scrollTo(timeToY(hold ? hold.t : sc.at + 0.45), 2.4);
  }

  /* ======================================================================
     9. Panels
     ====================================================================== */
  let panelOpen = null, lastFocus = null;
  const panel = $(".panel");

  const tagList = tags => tags && tags.length ? `<ul class="tags">${tags.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
  const RENDER = {
    experience: s => `<ol class="xp">${s.items.map(x => `
      <li>
        <div><div class="xp__when">${esc(x.when)}</div><div class="xp__where">${esc(x.where)}</div></div>
        <div><h3>${esc(x.company)}</h3><h4>${esc(x.role)}</h4>
          <ul>${x.points.map(p => `<li>${esc(p)}</li>`).join("")}</ul>${tagList(x.tags)}</div>
      </li>`).join("")}</ol>`,

    projects: s => `<div class="projects">${s.items.map((p, i) => `
      <article class="proj">
        <div class="proj__n">0${i + 1}${p.client ? ` — ${esc(p.client)}` : ""}${p.metric ? ` · <span style="color:var(--bone)">${esc(p.metric)}</span>` : ""}</div>
        <h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>${tagList(p.tags)}
        ${(p.live || p.code) ? `<div class="proj__links">${p.live ? `<a href="${esc(p.live)}" target="_blank" rel="noopener">Live ↗</a>` : ""}${p.code ? `<a href="${esc(p.code)}" target="_blank" rel="noopener">Code ↗</a>` : ""}</div>` : ""}
      </article>`).join("")}</div>`,

    skills: s => `<div class="arsenal">${s.groups.map(g => `
      <div><h3>${esc(g.name)}</h3><ul>${g.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}</div>`,

    education: s => `<div class="edu-grid">
      <div><h3 class="sub">Degree</h3><ol class="xp">${s.degrees.map(d => `
        <li style="grid-template-columns:1fr"><div>
          <div class="xp__when">${esc(d.when)}</div>
          <h3 style="margin-top:10px">${esc(d.degree)}</h3>
          ${d.school ? `<h4>${esc(d.school)}${d.where ? ` · ${esc(d.where)}` : ""}</h4>` : ""}
          ${d.points && d.points.length ? `<ul>${d.points.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
        </div></li>`).join("")}</ol></div>
      <div><h3 class="sub">Certifications</h3><ul class="cert">${s.certifications.map(c => `
        <li><div><b>${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.name)} ↗</a>` : esc(c.name)}</b><span>${esc(c.issuer)}</span></div><time>${esc(c.when)}</time></li>`).join("")}</ul></div>
    </div>`,

    writing: s => `
      ${s.posts.length ? `<ul class="posts">${s.posts.map(p => `
        <li><a href="${esc(p.url)}" target="_blank" rel="noopener"><time>${esc(p.when)}</time><b>${esc(p.title)}</b><span>${esc(p.where)} ↗</span></a></li>`).join("")}</ul>`
        : `<div class="posts" style="border-top:1px solid var(--line);padding:40px 0;margin-bottom:40px">
             <p class="kicker">// Incoming</p>
             <p class="big" style="font-size:clamp(36px,5vw,72px);margin:0 0 14px">First dispatch<br>is being forged.</p>
             <p class="lede">Articles on .NET architecture, cloud-native delivery and AI-driven workflows are on the way.</p></div>`}
      ${s.subscribeUrl ? `<a class="btn btn--solid" href="${esc(s.subscribeUrl)}" target="_blank" rel="noopener"><span>Subscribe to the newsletter</span></a>`
        : `<a class="btn btn--ghost js-jump" href="#contact" data-label="contact"><span>Ask me to notify you</span></a>`}`
  };

  function fillPanel(key) {
    const s = D.sections[key];
    const b = BLADES.find(x => x.key === key);
    const layer = $(`.layer[data-id="${b.layer}"]`);
    const img = $(".js-panel-img");
    img.src = $("img", layer).getAttribute("src");
    img.style.objectPosition = `${layer.dataset.fx * 100}% ${layer.dataset.fy * 100}%`;
    $(".js-panel-kicker").textContent = `Blade 0${ORDER.indexOf(key) + 1} — ${s.title}`;
    $(".js-panel-title").textContent = s.title;
    $(".js-panel-lede").textContent = s.lede;
    $(".js-panel-body").innerHTML = RENDER[key](s);
    const i = ORDER.indexOf(key);
    const prev = ORDER[(i - 1 + ORDER.length) % ORDER.length], next = ORDER[(i + 1) % ORDER.length];
    const pb = $(".js-panel-prev"), nb = $(".js-panel-next");
    pb.dataset.panel = prev; $("span", pb).textContent = D.sections[prev].title;
    nb.dataset.panel = next; $("span", nb).textContent = D.sections[next].title;
    $(".panel__scroll").scrollTop = 0;
    $$(".proj").forEach(c => c.addEventListener("pointermove", e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px");
      c.style.setProperty("--my", e.clientY - r.top + "px");
    }));
  }

  function animatePanelIn() {
    gsap.fromTo(".js-panel-img", { scale: 1.3 }, { scale: 1.05, duration: 1.6, ease: "power3.out" });
    gsap.fromTo([".js-panel-kicker", ".js-panel-title", ".js-panel-lede"], { y: 60, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, stagger: 0.08, duration: 1, ease: "power4.out", delay: 0.2 });
    gsap.fromTo(".js-panel-body > *, .js-panel-body .xp > li, .js-panel-body .proj, .js-panel-body .arsenal > div", { y: 40, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.8, ease: "power3.out", delay: 0.35 });
  }

  function openPanel(key, origin) {
    if (!D.sections[key]) return;
    closeMenu();
    if (panelOpen) { // switching between panels
      panelOpen = key;
      gsap.to(".panel__scroll", { autoAlpha: 0, duration: 0.25, onComplete: () => {
        fillPanel(key);
        gsap.to(".panel__scroll", { autoAlpha: 1, duration: 0.3 });
        animatePanelIn();
      } });
      return;
    }
    panelOpen = key;
    lastFocus = document.activeElement;
    fillPanel(key);
    panel.hidden = false;
    lenis && lenis.stop();
    document.documentElement.style.overflow = "hidden";
    const r = origin ? origin.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    gsap.fromTo(panel, { clipPath: `circle(0px at ${cx}px ${cy}px)` },
      { clipPath: `circle(${Math.hypot(innerWidth, innerHeight)}px at ${cx}px ${cy}px)`, duration: reduced ? 0.01 : 1.1, ease: "power3.inOut" });
    gsap.set(".panel__scroll", { autoAlpha: 1 });
    animatePanelIn();
    setTimeout(() => $(".js-close").focus({ preventScroll: true }), 50);
  }

  function closePanel() {
    if (!panelOpen) return;
    panelOpen = null;
    gsap.to(panel, { clipPath: `circle(0px at ${innerWidth - 50}px 50px)`, duration: reduced ? 0.01 : 0.8, ease: "power3.inOut",
      onComplete: () => {
        panel.hidden = true;
        document.documentElement.style.overflow = "";
        lenis && lenis.start();
        lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
      } });
  }

  /* ======================================================================
     10. Contact form — send with a thrown-blade animation
     ====================================================================== */
  function initForm() {
    const form = $(".js-form"), status = $(".js-status"), send = $(".js-send"), done = $(".js-done");
    const fields = () => $$(".field, .form__send, .form__status", form);

    async function deliver(data) {
      if (!D.formEndpoint) return "mailto";
      const res = await fetch(D.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(res.status);
      return "sent";
    }

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (form.classList.contains("is-sending")) return;
      let ok = true;
      $$("input[required], textarea[required]", form).forEach(f => {
        const bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value));
        f.closest(".field").classList.toggle("is-invalid", bad);
        if (bad) { ok = false; gsap.fromTo(f.closest(".field"), { x: 0 }, { keyframes: { x: [0, -8, 7, -4, 2, 0] }, duration: 0.4 }); }
      });
      if (!ok) { status.textContent = "Fill in your name, a valid email and a message."; return; }

      const data = Object.fromEntries(new FormData(form));
      form.classList.add("is-sending");
      status.textContent = "";
      const star = $(".form__send-star", send);
      const label = $(".form__send-label", send);

      // 1 — button collapses into a spinning blade
      const w = send.offsetWidth;
      const charge = gsap.timeline()
        .to(label, { autoAlpha: 0, y: -10, duration: 0.25 })
        .to(send, { width: 56, duration: 0.5, ease: "power3.inOut" }, "<0.1")
        .fromTo(star, { autoAlpha: 0, scale: 0.4, rotate: 0 }, { autoAlpha: 1, scale: 1, duration: 0.3 }, "-=0.2")
        .to(star, { rotate: 720, duration: 1.2, ease: "power2.in" }, "<");

      let result;
      try { [result] = await Promise.all([deliver(data), new Promise(r => charge.eventCallback("onComplete", r))]); }
      catch {
        charge.kill();
        gsap.set(star, { autoAlpha: 0 });
        gsap.to(send, { width: w, duration: 0.4, ease: "power3.out", onComplete: () => gsap.set(send, { clearProps: "width" }) });
        gsap.to(label, { autoAlpha: 1, y: 0, duration: 0.3 });
        form.classList.remove("is-sending");
        status.textContent = `Couldn't send — email me directly at ${D.email}.`;
        return;
      }

      // 2 — the blade is thrown off the top-right, fields fall away
      const sr = send.getBoundingClientRect();
      const ghost = star.cloneNode(true);
      ghost.classList.add("form__ghost");
      Object.assign(ghost.style, { left: sr.left + sr.width / 2 - 14 + "px", top: sr.top + sr.height / 2 - 14 + "px" });
      document.body.appendChild(ghost);
      gsap.set(star, { autoAlpha: 0 });
      gsap.timeline({ onComplete: () => ghost.remove() })
        .fromTo(ghost, { x: 0, y: 0, rotate: 0, scale: 1 },
          { x: innerWidth - sr.left + 80, y: -sr.top - 120, rotate: 1440, scale: 1.6, duration: 0.9, ease: "power2.in" })
        .to(ghost, { autoAlpha: 0, duration: 0.2 }, "-=0.2");
      await gsap.timeline()
        .to(fields(), { y: 30, autoAlpha: 0, stagger: 0.05, duration: 0.4, ease: "power2.in" }, 0.15)
        .then();

      // 3 — success card draws itself
      $(".js-done-title").textContent = result === "sent" ? "Message sent." : "Almost there.";
      $(".js-done-text").textContent = result === "sent"
        ? "Thanks for reaching out — I'll get back to you soon."
        : "Your email app is opening with the message ready — just hit send.";
      done.hidden = false;
      const ring = $(".form__check-ring", done), tick = $(".form__check-tick", done);
      [ring, tick].forEach(p => { const l = p.getTotalLength(); gsap.set(p, { strokeDasharray: l, strokeDashoffset: l }); });
      gsap.timeline()
        .to(ring, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" })
        .to(tick, { strokeDashoffset: 0, duration: 0.45, ease: "power3.out" }, "-=0.2")
        .fromTo($$(".kicker, .form__done-title, .lede, .btn", done), { y: 24, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.07, duration: 0.6, ease: "power3.out" }, "-=0.35")
        .fromTo(done, { "--burst": 0 }, { "--burst": 1, duration: 0.9, ease: "power2.out" }, 0.6);

      if (result === "mailto") {
        const body = `${data.message}\n\n— ${data.name} (${data.email})`;
        location.href = `mailto:${D.email}?subject=${encodeURIComponent(`[${data.topic}] from ${data.name}`)}&body=${encodeURIComponent(body)}`;
      } else {
        form.reset();
      }
    });

    $(".js-again").addEventListener("click", () => {
      gsap.to(done, { autoAlpha: 0, duration: 0.3, onComplete: () => {
        done.hidden = true;
        gsap.set(done, { clearProps: "opacity,visibility" });
        form.reset();
        form.classList.remove("is-sending");
        gsap.set(send, { clearProps: "width" });
        gsap.set($(".form__send-label", send), { autoAlpha: 1, y: 0 });
        gsap.fromTo(fields(), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.5, ease: "power3.out" });
      } });
    });
  }

  /* ======================================================================
     11. Menu, cursor, parallax, magnetics, tilt, copy
     ====================================================================== */
  const menu = $(".menu"), menuBtn = $(".js-menu");
  function closeMenu() { if (menu.hidden) return; menu.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); }
  function toggleMenu() {
    const open = menu.hidden;
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    if (open) gsap.fromTo(".menu li", { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.6, ease: "power3.out" });
  }

  function initInteractions() {
    document.addEventListener("click", e => {
      const copy = e.target.closest(".js-copy");
      if (copy) {
        e.preventDefault();
        const flash = txt => { copy.textContent = txt; setTimeout(() => (copy.textContent = "Copy"), 1600); };
        (navigator.clipboard ? navigator.clipboard.writeText(copy.dataset.copy) : Promise.reject())
          .then(() => flash("Copied ✓"), () => flash("Copy failed"));
        return;
      }
      const open = e.target.closest(".js-open");
      if (open) { e.preventDefault(); return openPanel(open.dataset.panel, open); }
      const jump = e.target.closest(".js-jump");
      if (jump) {
        e.preventDefault();
        if (panelOpen) { closePanel(); setTimeout(() => jumpTo(jump.dataset.label), 850); }
        else { closeMenu(); jumpTo(jump.dataset.label); }
        return;
      }
      if (e.target.closest(".js-close")) return closePanel();
      if (e.target.closest(".js-menu")) return toggleMenu();
    });
    addEventListener("keydown", e => {
      if (e.key === "Escape") { closePanel(); closeMenu(); }
      if (e.key === "Tab" && panelOpen) { // keep focus inside the panel
        const f = $$("button, a[href], input", panel).filter(el => el.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });

    if (canHover) {
      // cursor + layered parallax
      const cur = $(".cursor");
      const cx = gsap.quickTo(cur, "x", { duration: 0.25, ease: "power3" });
      const cy = gsap.quickTo(cur, "y", { duration: 0.25, ease: "power3" });
      const moves = $$(".layer__move, .targets");
      const px = gsap.quickTo(moves, "x", { duration: 1.4, ease: "power3" });
      const py = gsap.quickTo(moves, "y", { duration: 1.4, ease: "power3" });
      addEventListener("pointermove", e => {
        cx(e.clientX); cy(e.clientY);
        const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
        if (!reduced) { px(-nx * 22); py(-ny * 14); }
        FX.mx = e.clientX / innerWidth; FX.my = 1 - e.clientY / innerHeight;
      });
      document.addEventListener("pointerover", e => cur.classList.toggle("is-hover", !!e.target.closest("a, button, input, textarea, select")));

      if (!reduced) {
        // magnetic buttons
        $$(".btn, .target__btn, .topnav__cta, .sound, .panel__close").forEach(el => {
          const mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
          const my = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
          el.addEventListener("pointermove", e => {
            if (el.closest(".is-sending")) return;
            const r = el.getBoundingClientRect();
            mx((e.clientX - r.left - r.width / 2) * 0.25);
            my((e.clientY - r.top - r.height / 2) * 0.35);
          });
          el.addEventListener("pointerleave", () => { mx(0); my(0); });
        });
        // blade cards tilt toward the cursor
        $$(".target__card").forEach(card => {
          gsap.set(card, { transformPerspective: 900 });
          const rx = gsap.quickTo(card, "rotationX", { duration: 0.8, ease: "power3" });
          const ry = gsap.quickTo(card, "rotationY", { duration: 0.8, ease: "power3" });
          card.addEventListener("pointermove", e => {
            const r = card.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - 0.5) * 12);
            rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
          });
          card.addEventListener("pointerleave", () => { rx(0); ry(0); });
        });
      }
    }

    gsap.from(".contact__head > *, .form", {
      y: 70, autoAlpha: 0, stagger: 0.08, duration: 1.2, ease: "power4.out",
      scrollTrigger: { trigger: ".contact__inner", start: "top 80%" }
    });

    let rT;
    addEventListener("resize", () => {
      clearTimeout(rT);
      rT = setTimeout(() => { sizeTrack(); layout(); ScrollTrigger.refresh(); }, 150);
    });
  }

  /* ======================================================================
     12. Intro
     ====================================================================== */
  function intro() {
    const tl = gsap.timeline();
    tl.to(".loader__mark, .loader__choice", { y: -30, autoAlpha: 0, stagger: 0.05, duration: 0.6, ease: "power3.in" })
      .to(".loader", { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "power4.inOut" }, "-=0.2")
      .set(".loader", { display: "none" })
      .from(".layer[data-id='hero'] .layer__move", { scale: 1.5, filter: "brightness(0) blur(12px)", duration: 2.6, ease: "power3.out", clearProps: "filter" }, "-=0.9")
      .from(FX, { smoke: 0, embers: 0, duration: 2.5, ease: "sine.out" }, "<")
      .from(".bars i", { scaleY: 6, duration: 1.8, ease: "power4.inOut" }, "<")
      .from(".hero-line .w > span", { yPercent: 110, stagger: 0.06, duration: 1.2, ease: "power4.out" }, "-=1.6")
      .from(".ov--hero .kicker, .ov--hero .hero-sub, .topbar, .chapter, .scroll-cue", { autoAlpha: 0, y: 20, stagger: 0.08, duration: 1, ease: "power3.out" }, "-=1")
      .add(() => { document.body.classList.remove("is-loading"); lenis && lenis.start(); }, "-=1.5");
  }

  /* ======================================================================
     Boot
     ====================================================================== */
  bindContent();
  sizeTrack();
  gsap.set(".layer[data-id='hero'] img", { scale: narrowTitle() ? 1 : 0.72 });
  layout();
  window.scrollTo(0, 0);
  initScroll();
  lenis && lenis.stop();
  initInteractions();
  initForm();
  preload()
    .then(() => { layout(); buildFilm(); ScrollTrigger.refresh(); updateChapter(0); })
    .then(askSound)
    .then(() => { intro(); gsap.delayedCall(3, idleGlitch); });
})();
