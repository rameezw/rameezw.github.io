/* Shared helpers for the research demos (theme colours, HiDPI canvases, visibility-aware loops). */
(function () {
  "use strict";

  const R = (window.Research = window.Research || {});

  R.isDark = function () {
    return document.documentElement.getAttribute("data-theme") === "dark";
  };

  // Level ramp: deep → light, the same order on every page (level 0 is the base certificate).
  const PALETTE = {
    light: {
      levels: ["#1c3d78", "#2f86b8", "#33a985", "#9cc340", "#e3b23c", "#e2733a"],
      obstacle: "#b23a48",
      obstacleFill: "rgba(178,58,72,0.16)",
      uncovered: "rgba(90,90,100,0.10)",
      hatch: "rgba(90,90,100,0.28)",
    },
    dark: {
      levels: ["#4b8fe0", "#40c0dc", "#45c99a", "#a9db6a", "#f2cf6b", "#f59a5a"],
      obstacle: "#ff7b86",
      obstacleFill: "rgba(255,123,134,0.18)",
      uncovered: "rgba(200,200,210,0.06)",
      hatch: "rgba(200,200,210,0.22)",
    },
  };

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  R.colors = function () {
    const dark = R.isDark();
    const p = dark ? PALETTE.dark : PALETTE.light;
    return Object.assign({}, p, {
      dark: dark,
      text: cssVar("--global-text-color", dark ? "#e8e8e8" : "#1b1b1b"),
      textLight: cssVar("--global-text-color-light", "#828282"),
      accent: cssVar("--global-theme-color", dark ? "#2698ba" : "#b509ac"),
      bg: cssVar("--global-bg-color", dark ? "#1c1c1d" : "#ffffff"),
      grid: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
      frame: dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)",
    });
  };

  // Colour for level i of n, interpolated along the level ramp.
  R.levelColor = function (i, n, col) {
    const ramp = (col || R.colors()).levels;
    if (n <= 1) return ramp[0];
    const t = (i / (n - 1)) * (ramp.length - 1);
    const a = Math.floor(t),
      b = Math.min(a + 1, ramp.length - 1),
      f = t - a;
    const A = R.hexToRgb(ramp[a]),
      B = R.hexToRgb(ramp[b]);
    const c = A.map(function (v, k) {
      return Math.round(v + (B[k] - v) * f);
    });
    return "#" + c.map(function (v) {
      return v.toString(16).padStart(2, "0");
    }).join("");
  };

  R.hexToRgba = function (hex, a) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  };

  R.hexToRgb = function (hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  R.reducedMotion = function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  // Calls cb() whenever the site's light/dark toggle flips.
  R.onThemeChange = function (cb) {
    const obs = new MutationObserver(function () {
      cb();
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", cb);
    }
  };

  // Sizes a canvas to its CSS box at device pixel ratio. aspect = height / width.
  R.setupCanvas = function (canvas, aspect, onResize) {
    const ctx = canvas.getContext("2d");
    const state = { w: 0, h: 0, dpr: 1, ctx: ctx };
    function resize(initial) {
      const w = canvas.parentElement.clientWidth;
      if (!w) return;
      const h = Math.round(w * aspect);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.height = h + "px";
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.w = w;
      state.h = h;
      state.dpr = dpr;
      if (onResize && initial !== true) onResize(state);
    }
    if (window.ResizeObserver) {
      let last = 0;
      new ResizeObserver(function () {
        const w = canvas.parentElement.clientWidth;
        if (w !== last) {
          last = w;
          resize();
        }
      }).observe(canvas.parentElement);
    } else {
      window.addEventListener("resize", resize);
    }
    resize(true); // callers lay out and draw once they hold the returned state
    return state;
  };

  // requestAnimationFrame loop that only runs while the element is on screen.
  R.loop = function (el, step) {
    let visible = false;
    let running = false;
    let last = 0;
    function frame(t) {
      if (!visible) {
        running = false;
        return;
      }
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;
      step(dt, t / 1000);
      requestAnimationFrame(frame);
    }
    function start() {
      if (running) return;
      running = true;
      last = 0;
      requestAnimationFrame(frame);
    }
    if (window.IntersectionObserver) {
      new IntersectionObserver(
        function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) start();
        },
        { rootMargin: "120px" }
      ).observe(el);
    } else {
      visible = true;
      start();
    }
    return {
      kick: function () {
        if (visible) start();
      },
    };
  };

  // Maps world coordinates [xmin,xmax]x[ymin,ymax] onto a canvas box, y up.
  R.viewport = function (xmin, xmax, ymin, ymax) {
    const vp = { xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax, ox: 0, oy: 0, s: 1 };
    vp.fit = function (x, y, w, h) {
      const s = Math.min(w / (xmax - xmin), h / (ymax - ymin));
      vp.s = s;
      vp.ox = x + (w - s * (xmax - xmin)) / 2;
      vp.oy = y + (h - s * (ymax - ymin)) / 2;
      vp.pw = s * (xmax - xmin);
      vp.ph = s * (ymax - ymin);
      return vp;
    };
    vp.X = function (x) {
      return vp.ox + (x - xmin) * vp.s;
    };
    vp.Y = function (y) {
      return vp.oy + (ymax - y) * vp.s;
    };
    vp.toWorld = function (px, py) {
      return [xmin + (px - vp.ox) / vp.s, ymax - (py - vp.oy) / vp.s];
    };
    return vp;
  };

  R.hatchPattern = function (ctx, color) {
    const c = document.createElement("canvas");
    c.width = c.height = 8;
    const g = c.getContext("2d");
    g.strokeStyle = color;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, 8);
    g.lineTo(8, 0);
    g.stroke();
    return ctx.createPattern(c, "repeat");
  };

  R.pointer = function (canvas, e) {
    const r = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return [p.clientX - r.left, p.clientY - r.top];
  };

  R.wrap = function (a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  };

  // Small car glyph pointing along heading th (screen coordinates, y down).
  R.drawCar = function (ctx, x, y, th, size, fill, stroke) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-th);
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, size * 0.62);
    ctx.lineTo(-size * 0.35, 0);
    ctx.lineTo(-size * 0.7, -size * 0.62);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  };

  R.fmt = function (x, d) {
    return (x < 0 ? "−" : "") + Math.abs(x).toFixed(d == null ? 2 : d);
  };
})();
