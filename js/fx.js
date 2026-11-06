/* ==========================================================================
   FX — WebGL volumetric smoke + 2D ember particles.
   Both read live values from window.FX.state, which the scroll timeline tweens.
   ========================================================================== */
(function () {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = { smoke: 0.9, warm: 0.6, embers: 0.4, mx: 0.5, my: 0.5, rush: 0 };
  window.FX = { state };

  /* ---------------- Smoke (fbm domain-warped noise) ---------------- */
  const smokeCanvas = document.querySelector(".smoke");
  const gl = smokeCanvas.getContext("webgl", { premultipliedAlpha: false, alpha: true, antialias: false });

  if (gl) {
    const vert = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
    const frag = `
      precision mediump float;
      varying vec2 uv;
      uniform float t, amt, warm, aspect, rush;
      uniform vec2 mouse;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){
        vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a*n(p); p = p*2.03 + 7.1; a *= .5; } return v; }
      void main(){
        vec2 p = vec2(uv.x * aspect, uv.y) * 2.2;
        float tt = t * .045;
        p.x -= rush * 1.4;
        vec2 q = vec2(fbm(p + vec2(0., tt)), fbm(p + vec2(5.2, -tt*.8)));
        vec2 r = vec2(fbm(p + 3.*q + vec2(1.7, 9.2) + tt*1.3), fbm(p + 3.*q + vec2(8.3, 2.8) - tt));
        float f = fbm(p + 3.5*r + (mouse - .5) * .6);
        f = smoothstep(.35, 1.0, f);
        // fade toward the vertical middle so the subject stays readable
        float edge = smoothstep(.0, .55, abs(uv.x - .5) * 1.4 + (1. - uv.y) * .35);
        float a = f * amt * (.35 + .65 * edge);
        vec3 ember = vec3(1., .46, .12);
        vec3 teal  = vec3(.16, .62, .6);
        vec3 col = mix(teal, ember, clamp(warm + (uv.x - .5) * .7 * (1. - warm) + r.x * .3 - .15, 0., 1.));
        col *= .55 + f * .9;
        gl_FragColor = vec4(col * a, a);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = {};
    ["t", "amt", "warm", "aspect", "rush", "mouse"].forEach(k => (u[k] = gl.getUniformLocation(prog, k)));

    const SCALE = innerWidth < 700 ? 0.3 : 0.42; // render at reduced resolution; smoke is soft anyway
    const resize = () => {
      smokeCanvas.width = Math.max(2, Math.round(innerWidth * SCALE));
      smokeCanvas.height = Math.max(2, Math.round(innerHeight * SCALE));
      gl.viewport(0, 0, smokeCanvas.width, smokeCanvas.height);
    };
    resize();
    addEventListener("resize", resize);

    let start = performance.now();
    const loop = now => {
      const t = reduced ? 20 : (now - start) / 1000;
      gl.uniform1f(u.t, t);
      gl.uniform1f(u.amt, state.smoke);
      gl.uniform1f(u.warm, state.warm);
      gl.uniform1f(u.rush, state.rush);
      gl.uniform1f(u.aspect, innerWidth / innerHeight);
      gl.uniform2f(u.mouse, state.mx, state.my);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reduced) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    if (reduced) setInterval(() => requestAnimationFrame(loop), 500);
  } else {
    smokeCanvas.remove();
  }

  /* ---------------- Embers ---------------- */
  const ec = document.querySelector(".embers");
  const ctx = ec.getContext("2d");
  let W, H, dpr;
  const parts = [];
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 64;
  (() => {
    const c = sprite.getContext("2d");
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,214,150,1)");
    g.addColorStop(0.3, "rgba(255,122,26,.6)");
    g.addColorStop(1, "rgba(255,80,0,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  })();
  const MAX = innerWidth < 700 ? 60 : 130;
  const resizeE = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    ec.width = W * dpr; ec.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resizeE();
  addEventListener("resize", resizeE);

  const spawn = p => {
    p.x = Math.random() * W;
    p.y = H + Math.random() * 40;
    p.r = Math.random() * 1.8 + 0.4;
    p.vy = -(Math.random() * 0.9 + 0.35);
    p.vx = (Math.random() - 0.5) * 0.4;
    p.life = 0;
    p.max = 260 + Math.random() * 380;
    p.seed = Math.random() * 100;
    return p;
  };
  for (let i = 0; i < MAX; i++) { const p = spawn({}); p.y = Math.random() * H; p.life = Math.random() * p.max; parts.push(p); }

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const active = Math.round(MAX * Math.min(1, state.embers));
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < active; i++) {
      const p = parts[i];
      p.life++;
      p.x += p.vx + Math.sin((p.life + p.seed) * 0.03) * 0.35 + state.rush * 6;
      p.y += p.vy * (1 + state.rush * 2);
      if (p.life > p.max || p.y < -20 || p.x > W + 40) spawn(p);
      const k = Math.sin(Math.PI * (p.life / p.max));
      const flick = 0.6 + 0.4 * Math.sin(p.life * 0.25 + p.seed);
      const a = k * flick * 0.9;
      const d = p.r * 10;
      ctx.globalAlpha = Math.max(0, a);
      ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
    if (!reduced) requestAnimationFrame(draw);
  };
  if (!reduced) requestAnimationFrame(draw);
})();
