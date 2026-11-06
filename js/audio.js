/* ==========================================================================
   AUDIO — background score that rides the scroll.
   · The visitor chooses sound on/off on the loader (window.BGM.start).
   · Gapless loop via Web Audio, kept quiet and softened with a low-pass.
   · Dips while idle or while a section panel is open; fades out and stops
     at the bottom of the page, picks up again when scrolling back up.
   · The corner button toggles it at any time.
   ========================================================================== */
(function () {
  const SRC = "assets/audio/bgm.mp3";
  const LEVEL = 0.3;        // overall loudness (0–1) — background, not foreground
  const IDLE_AFTER = 7000;  // ms without scrolling before the music dips
  const IDLE_LEVEL = 0.4;   // fraction of LEVEL while idle
  const PANEL_LEVEL = 0.55; // fraction of LEVEL while a section panel is open

  const btn = document.querySelector(".js-sound");
  const panel = document.querySelector(".panel");
  const AC = window.AudioContext || window.webkitAudioContext;

  let ctx, gain, filter, buffer, source, building;
  let muted = true, atBottom = false, idle = false, hidden = document.hidden;
  let idleTimer, stopTimer;

  // fetch early (no audio context yet — that needs the visitor's tap)
  const raw = fetch(SRC).then(r => r.arrayBuffer()).catch(() => null);

  const render = () => {
    if (!btn) return;
    btn.classList.toggle("is-on", !muted);
    btn.setAttribute("aria-pressed", String(!muted));
    btn.setAttribute("aria-label", muted ? "Turn sound on" : "Turn sound off");
    btn.querySelector(".sound__label").textContent = muted ? "Sound off" : "Sound on";
  };

  // must be first called from inside a click so the context is allowed to run
  function ensure() {
    if (building) return building;
    ctx = new AC();
    ctx.resume();
    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 7000; // takes the edge off brass and hi-hats
    gain = ctx.createGain();
    gain.gain.value = 0;
    filter.connect(gain).connect(ctx.destination);
    building = raw.then(a => a && new Promise((res, rej) => ctx.decodeAudioData(a.slice(0), res, rej)))
      .then(b => { buffer = b; })
      .catch(() => {});
    return building;
  }

  function startSource() {
    if (source || !buffer) return;
    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(filter);
    source.start();
  }

  function target() {
    if (muted || atBottom || hidden) return 0;
    let v = LEVEL;
    if (idle) v *= IDLE_LEVEL;
    if (panel && !panel.hidden) v *= PANEL_LEVEL;
    return v;
  }

  function update() {
    render();
    if (!ctx || !buffer) return;
    const v = target();
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    clearTimeout(stopTimer);
    if (v > 0) {
      if (ctx.state === "suspended") ctx.resume();
      startSource();
      gain.gain.linearRampToValueAtTime(v, now + (gain.gain.value < 0.01 ? 2.5 : 1.2));
    } else {
      gain.gain.linearRampToValueAtTime(0, now + 1.8);
      // fully pause once faded, so the track resumes from the same spot later
      stopTimer = setTimeout(() => { if (target() === 0 && ctx.state === "running") ctx.suspend(); }, 1900);
    }
  }

  window.BGM = {
    // called from the loader's "with sound / without sound" choice
    start(on) {
      muted = !on || !AC;
      render();
      if (!muted) ensure().then(update);
    }
  };

  if (btn) {
    if (!AC) btn.remove();
    else btn.addEventListener("click", () => {
      muted = !muted;
      if (!muted) ensure().then(update); else update();
    });
  }

  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const bottom = scrollY >= max - 4;
    if (idle) { idle = false; update(); }
    if (bottom !== atBottom) { atBottom = bottom; update(); }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { idle = true; update(); }, IDLE_AFTER);
  }, { passive: true });

  document.addEventListener("visibilitychange", () => { hidden = document.hidden; update(); });
  if (panel) new MutationObserver(update).observe(panel, { attributes: true, attributeFilter: ["hidden"] });

  render();
})();
