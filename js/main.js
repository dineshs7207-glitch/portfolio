/* ==========================================================================
   MAIN — content binding, preloader, scroll-scrubbed film, blades, panels.
   ========================================================================== */
(function () {
  gsap.registerPlugin(ScrollTrigger);
  history.scrollRestoration = "manual";

  const D = window.PORTFOLIO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => innerWidth < 700;
  const FX = window.FX.state;

  /* Blade → section mapping (order of flight) */
  const BLADES = [
    { layer: "blade1", key: "experience" },
    { layer: "blade2", key: "projects" },
    { layer: "blade3", key: "skills" },
    { layer: "blade4", key: "education" },
    { layer: "blade5", key: "writing" }
  ];
  const ORDER = BLADES.map(b => b.key);

  /* Scene list — `at` is the timeline time where the scene has cut in */
  const SCENES = [
    { id: "hero",    name: "Prologue",     at: 0 },
    { id: "profile", name: "Identity",     at: 1 },
    { id: "hand",    name: "The craft",    at: 2.4 },
    { id: "face",    name: "Focus",        at: 3.6 },
    { id: "windup",  name: "Wind-up",      at: 4.8 },
    { id: "throw",   name: "Release",      at: 5.6 },
    { id: "blade1",  name: "Blade I",      at: 6.8 },
    { id: "blade2",  name: "Blade II",     at: 8.0 },
    { id: "blade3",  name: "Blade III",    at: 9.2 },
    { id: "blade4",  name: "Blade IV",     at: 10.4 },
    { id: "blade5",  name: "Blade V",      at: 11.6 },
    { id: "wide",    name: "Return",       at: 12.8 },
    { id: "front",   name: "The front",    at: 13.8 },
    { id: "title",   name: "Transmission", at: 14.8 }
  ];
  const END = 16.2;
  const sceneById = id => SCENES.find(s => s.id === id);
  const nextAt = id => { const i = SCENES.findIndex(s => s.id === id); return SCENES[i + 1] ? SCENES[i + 1].at : END; };

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

    // Hero line: split into words, *word* → ember
    const words = D.heroLine.split(" ");
    let ember = false;
    $(".js-hero-line").innerHTML = words.map(w => {
      const open = w.startsWith("*"), close = w.replace(/[.,!?]$/, "").endsWith("*");
      if (open) ember = true;
      const clean = esc(w.replace(/\*/g, ""));
      const out = `<span class="w"><span>${ember ? `<em>${clean}</em>` : clean}</span></span>`;
      if (close) ember = false;
      return out;
    }).join(" ");

    // Name: split into chars
    const chars = s => [...s].map(c => `<span class="ch">${esc(c)}</span>`).join("");
    $(".js-first").innerHTML = chars(D.name.first);
    $(".js-last").innerHTML = chars(D.name.last);

    $(".js-stats").innerHTML = D.stats.map(s =>
      `<li><b><span class="js-num" data-v="${s.value}">0</span><sup>${esc(s.suffix)}</sup></b><span>${esc(s.label)}</span></li>`).join("");

    $(".js-blade-index").innerHTML = BLADES.map((b, i) =>
      `<li><button class="js-jump" data-label="${b.layer}"><em>0${i + 1}</em>${esc(D.sections[b.key].title)}</button></li>`).join("");

    $(".js-links").innerHTML = D.links.map(l =>
      `<li><a href="${esc(l.url)}"${/^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : ""}>${esc(l.label)} <small>${esc(l.handle)} ↗</small></a></li>`).join("");

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
     2. Layout: object-position per layer + blade target geometry
     ====================================================================== */
  const IMG_RATIO = 1344 / 576;
  function coverRect(W, H, fx, fy) {
    let rw, rh;
    if (W / H > IMG_RATIO) { rw = W; rh = W / IMG_RATIO; } else { rh = H; rw = H * IMG_RATIO; }
    return { rw, rh, ox: (W - rw) * fx, oy: (H - rh) * fy };
  }

  function layout() {
    const W = innerWidth, H = innerHeight;
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
      if (isMobile()) {
        cx = 16; cy = H - ch - H * 0.11;
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
      line.dataset.ang = ang;
    });
  }

  /* ======================================================================
     3. Preloader
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
      .then(() => new Promise(r => gsap.delayedCall(0.8, r)));
  }

  /* ======================================================================
     4. Smooth scroll
     ====================================================================== */
  let lenis = null;
  function initScroll() {
    if (!reduced && window.Lenis) {
      lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
  const scrollTo = (y, dur = 2.2) => lenis ? lenis.scrollTo(y, { duration: dur, easing: t => 1 - Math.pow(1 - t, 4) }) : scrollTo_native(y);
  const scrollTo_native = y => window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });

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
      tl.fromTo(opts.targets || kids(el), { y: 60, autoAlpha: 0, filter: "blur(10px)" },
        { y: 0, autoAlpha: 1, filter: "blur(0px)", stagger: 0.06, duration: 0.45, ease: "power3.out" }, t);
    };
    const ovOut = (id, t) => {
      const el = OV(id);
      tl.to(kids(el), { y: -50, autoAlpha: 0, filter: "blur(8px)", stagger: 0.03, duration: 0.3, ease: "power2.in" }, t);
      tl.set(el, { autoAlpha: 0 }, t + 0.42);
    };
    const fx = (t, vals, d = 0.6) => tl.to(FX, { ...vals, duration: d, ease: "sine.inOut" }, t);
    // hide the previous layer once the new one fully covers it (keeps compositing cheap)
    const retire = (id, t) => tl.set(L(id), { autoAlpha: 0 }, t);
    const drift = (id, from, to, t0, t1, extra = {}) =>
      tl.fromTo(IMG(id), { scale: from, ...extra.from }, { scale: to, duration: t1 - t0, ...extra.to }, t0);

    /* --- Hero (opening frame) --- */
    const heroOv = OV("hero");
    gsap.set(heroOv, { autoAlpha: 1 });
    drift("hero", 1.06, 1.22, 0, 1.3, { from: { yPercent: 0 }, to: { yPercent: -2 } });
    tl.fromTo(heroOv, { y: 0, autoAlpha: 1 }, { y: -80, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 0.35);
    tl.fromTo(".scroll-cue", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 }, 0.05);

    /* --- Profile: wipe in from the right --- */
    let s = sceneById("profile").at;
    tl.set(L("profile"), { autoAlpha: 1 }, s - 0.5);
    tl.fromTo(L("profile"), { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.55, ease: "power3.inOut" }, s - 0.5);
    drift("profile", 1.3, 1.06, s - 0.5, s + 0.2, { to: { ease: "power3.out" } });
    drift("profile", 1.06, 1.14, s + 0.2, nextAt("profile"));
    retire("hero", s + 0.1);
    fx(s - 0.5, { smoke: 1, warm: 0.45, embers: 0.25 });
    ovIn("profile", s, { targets: $(".ov--profile .kicker, .ov--profile .role, .ov--profile .lede, .ov--profile .cta-row") });
    tl.fromTo(".ov--profile .ch", { yPercent: 115, rotate: 8 }, { yPercent: 0, rotate: 0, stagger: 0.025, duration: 0.45, ease: "power4.out" }, s - 0.05);
    tl.to(".ov--profile .ch", { yPercent: -115, stagger: 0.012, duration: 0.3, ease: "power2.in" }, nextAt("profile") - 0.55);
    ovOut("profile", nextAt("profile") - 0.5);

    /* --- Hand with blades: blur-dissolve --- */
    s = sceneById("hand").at;
    tl.set(L("hand"), { autoAlpha: 0 }, s - 0.5);
    tl.to(L("hand"), { autoAlpha: 1, duration: 0.5 }, s - 0.5);
    drift("hand", 1.25, 1.06, s - 0.5, s + 0.1, { from: { filter: "blur(18px) brightness(1.6)" }, to: { filter: "blur(0px) brightness(1)", ease: "power2.out" } });
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
    drift("throw", 1.3, 1.06, s - 0.3, s + 0.3, { from: { xPercent: -6, filter: "blur(6px)" }, to: { xPercent: 0, filter: "blur(0px)", ease: "power3.out" } });
    drift("throw", 1.06, 1.18, s + 0.3, nextAt("throw"), { to: { transformOrigin: "75% 55%" } });
    retire("windup", s);
    tl.to(FX, { rush: 1, duration: 0.25, ease: "power2.in" }, s - 0.3);
    tl.to(FX, { rush: 0, duration: 0.6, ease: "power2.out" }, s - 0.05);
    fx(s - 0.3, { smoke: 0.8, warm: 0.4, embers: 1 });
    tl.fromTo(".stage", { x: 0 }, { keyframes: { x: [0, -10, 8, -5, 3, 0] }, duration: 0.3 }, s - 0.15);
    ovIn("throw", s + 0.1);
    ovOut("throw", nextAt("throw") - 0.5);

    /* --- The five blades: zoom-through + target card --- */
    BLADES.forEach((b, i) => {
      const id = b.layer;
      s = sceneById(id).at;
      const end = nextAt(id);
      const prev = SCENES[SCENES.findIndex(x => x.id === id) - 1].id;
      tl.set(L(id), { autoAlpha: 0 }, s - 0.45);
      tl.to(L(id), { autoAlpha: 1, duration: 0.35 }, s - 0.45);
      tl.to(IMG(prev), { scale: "+=0.5", filter: "blur(14px)", duration: 0.45, ease: "power2.in" }, s - 0.45);
      tl.set(IMG(prev), { filter: "blur(0px)" }, s + 0.01);
      drift(id, 1.9, 1.08, s - 0.45, s + 0.1, { from: { filter: "blur(16px)", rotate: i % 2 ? -6 : 6 }, to: { filter: "blur(0px)", rotate: 0, ease: "power3.out" } });
      drift(id, 1.08, 1.32, s + 0.1, end, { to: { ease: "power1.in" } });
      retire(prev, s);
      fx(s - 0.45, { smoke: 0.7, warm: i % 2 ? 0.7 : 0.4, embers: 0.6 }, 0.45);

      const t = $(`.target[data-for="${id}"]`);
      const ring = $(".target__ring", t), line = $(".target__line", t), card = $(".target__card", t);
      tl.set(t, { autoAlpha: 1 }, s + 0.05);
      tl.fromTo(ring, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.2, ease: "back.out(2)" }, s + 0.05);
      tl.fromTo(line, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.2, ease: "power2.out" }, s + 0.15);
      tl.fromTo(card, { autoAlpha: 0, y: 30, clipPath: "inset(0% 0% 100% 0%)" }, { autoAlpha: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 0.3, ease: "power3.out" }, s + 0.2);
      tl.fromTo($$(".target__meta, .target__title, .target__desc, .target__btn", card), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.25 }, s + 0.28);
      tl.to([card, ring, line], { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, end - 0.42);
      tl.set(t, { autoAlpha: 0 }, end - 0.2);
    });

    /* --- Wide: dramatic zoom-out --- */
    s = sceneById("wide").at;
    tl.set(L("wide"), { autoAlpha: 0 }, s - 0.45);
    tl.to(L("wide"), { autoAlpha: 1, duration: 0.4 }, s - 0.45);
    tl.to(IMG("blade5"), { scale: 0.85, filter: "blur(10px)", duration: 0.45, ease: "power2.in" }, s - 0.45);
    drift("wide", 2.2, 1.06, s - 0.45, s + 0.35, { to: { ease: "power3.out" } });
    drift("wide", 1.06, 1.1, s + 0.35, nextAt("wide"));
    retire("blade5", s);
    tl.set(IMG("blade5"), { filter: "blur(0px)" }, s + 0.01);
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

    /* --- Title: cyberpunk glitch reveal --- */
    s = sceneById("title").at;
    const g = $$(".layer[data-id='title'] img");
    tl.to(".flash", { opacity: 0.7, duration: 0.08 }, s - 0.3);
    tl.set(L("title"), { autoAlpha: 1 }, s - 0.22);
    tl.to(".flash", { opacity: 0, duration: 0.3 }, s - 0.22);
    retire("front", s - 0.1);
    const slices = [[12, 70], [55, 20], [30, 50], [70, 8], [5, 82], [40, 35]];
    slices.forEach(([top, bottom], k) => {
      const at = s - 0.22 + k * 0.05;
      tl.set(g[1], { opacity: 1, x: (k % 2 ? -1 : 1) * (18 - k * 2), clipPath: `inset(${top}% 0 ${bottom}% 0)` }, at);
      tl.set(g[2], { opacity: 1, x: (k % 2 ? 1 : -1) * (14 - k * 2), clipPath: `inset(${bottom}% 0 ${top}% 0)` }, at);
      tl.set(g[0], { x: (k % 2 ? 6 : -6) }, at);
    });
    tl.set(g.slice(1), { opacity: 0, x: 0, clipPath: "inset(0% 0 0% 0)" }, s + 0.1);
    tl.set(g[0], { x: 0 }, s + 0.1);
    drift("title", 1.25, 1.06, s - 0.22, s + 0.4, { to: { ease: "power3.out" } });
    tl.to(".bars i", { scaleY: 0, duration: 0.4, ease: "power2.inOut" }, s);
    fx(s - 0.22, { smoke: 0.9, warm: 0.55, embers: 1 });
    ovIn("title", s + 0.2);
    tl.call(scramble, [$(".js-glitch-tag")], s + 0.25);
    tl.to({}, { duration: END - (s + 0.4) }, s + 0.4); // hold the title frame

    film = tl;
    filmST = ScrollTrigger.create({
      trigger: ".track",
      start: "top top",
      end: "bottom bottom",
      scrub: reduced ? true : 0.8,
      animation: tl,
      onUpdate: self => updateChapter(self.progress)
    });

    // Contact section: chapter + idle glitch on the title
    ScrollTrigger.create({
      trigger: ".contact", start: "top 60%", end: "bottom bottom",
      onEnter: () => setChapter(SCENES.length, "Contact"),
      onLeaveBack: () => updateChapter(filmST.progress)
    });
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
    const final = el.dataset.final || (el.dataset.final = el.textContent);
    let f = 0;
    const id = setInterval(() => {
      el.textContent = [...final].map((c, k) => (k < f / 2 || c === " ") ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join("");
      if (++f > final.length * 2) { clearInterval(id); el.textContent = final; }
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
    const t = sc.at + 0.45;
    scrollTo(filmST.start + (t / END) * (filmST.end - filmST.start), 2.4);
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
     10. Menu, cursor, parallax, form
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

    // Cursor + parallax
    if (matchMedia("(hover: hover)").matches) {
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
    }

    // Contact form
    const form = $(".js-form"), status = $(".js-status");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      let ok = true;
      $$("input[required], textarea[required]", form).forEach(f => {
        const bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value));
        f.closest(".field").classList.toggle("is-invalid", bad);
        if (bad) ok = false;
      });
      if (!ok) { status.textContent = "Fill in your name, a valid email and a message."; return; }
      const data = Object.fromEntries(new FormData(form));
      if (D.formEndpoint) {
        status.textContent = "Transmitting…";
        try {
          const res = await fetch(D.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
          if (!res.ok) throw new Error(res.status);
          form.reset();
          status.textContent = "Transmission received. I'll be in touch soon.";
        } catch {
          status.textContent = `Couldn't send — email me directly at ${D.email}.`;
        }
      } else {
        const body = `${data.message}\n\n— ${data.name} (${data.email})`;
        location.href = `mailto:${D.email}?subject=${encodeURIComponent(`[${data.topic}] from ${data.name}`)}&body=${encodeURIComponent(body)}`;
        status.textContent = "Opening your email app…";
      }
    });

    // Contact reveal
    gsap.from(".contact__head > *, .form", {
      y: 70, autoAlpha: 0, stagger: 0.08, duration: 1.2, ease: "power4.out",
      scrollTrigger: { trigger: ".contact__inner", start: "top 80%" }
    });

    let rT;
    addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(() => { layout(); ScrollTrigger.refresh(); }, 150); });
  }

  /* ======================================================================
     11. Intro
     ====================================================================== */
  function intro() {
    const tl = gsap.timeline();
    tl.to(".loader__mark, .loader__count, .loader__label, .loader__bar", { y: -30, autoAlpha: 0, stagger: 0.05, duration: 0.6, ease: "power3.in" })
      .to(".loader", { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "power4.inOut" }, "-=0.2")
      .set(".loader", { display: "none" })
      .from(".layer[data-id='hero'] .layer__move", { scale: 1.35, filter: "brightness(0) blur(12px)", duration: 2.6, ease: "power3.out", clearProps: "filter" }, "-=0.9")
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
  gsap.set(".layer[data-id='hero'] img", { scale: 1.06 });
  layout();
  window.scrollTo(0, 0);
  initScroll();
  lenis && lenis.stop();
  initInteractions();
  preload().then(() => {
    layout();
    buildFilm();
    ScrollTrigger.refresh();
    updateChapter(0);
    intro();
    gsap.delayedCall(3, idleGlitch);
  });
})();
