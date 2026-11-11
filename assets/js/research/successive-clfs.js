/*
 * Successive CLFs — a chain of control Lyapunov functions that steers a robot around a wall.
 *
 * Toy model: single integrator x' = u, |u| <= VMAX, in a 12 x 8 room with one wall.
 * Level k has a quadratic CLF V_k(x) = (x - c_k)' P_k (x - c_k) and region {V_k <= 1}.
 * Each region is obstacle-free and convex, and its centre c_k lies inside region k-1.
 * In level k the controller drives toward c_k, so V_k strictly decreases, the robot never
 * leaves the (safe) region, and it must enter region k-1 in finite time: then it switches.
 * In the method itself the V_k are polynomial CLFs for nonlinear systems, found by SOS.
 */
(function () {
  "use strict";
  const R = window.Research;

  const W = 12,
    H = 8;
  const WALL = { x0: 0, x1: 8, y0: 3.6, y1: 4.4 };
  // [cx, cy, semi-axis x, semi-axis y], level 0 first (contains the goal at its centre).
  const LEVELS = [
    [1.8, 1.8, 1.6, 1.6],
    [3.2, 1.8, 3.0, 1.6],
    [5.8, 1.8, 3.2, 1.6],
    [8.6, 1.8, 3.2, 1.6],
    [10.2, 2.0, 1.6, 1.8],
    [10.2, 3.5, 1.6, 3.0],
    [10.2, 5.9, 1.6, 1.8],
    [9.0, 6.2, 2.9, 1.6],
    [6.6, 6.2, 3.2, 1.6],
    [4.0, 6.2, 3.2, 1.6],
    [1.9, 6.2, 1.7, 1.6],
  ];
  const N = LEVELS.length;
  const KAPPA = 1.1,
    VMAX = 2.4,
    GOAL_EPS = 0.06;

  function Vk(k, x, y) {
    const e = LEVELS[k];
    const a = (x - e[0]) / e[2],
      b = (y - e[1]) / e[3];
    return a * a + b * b;
  }
  function lowestLevel(x, y) {
    for (let k = 0; k < N; k++) if (Vk(k, x, y) <= 1) return k;
    return -1;
  }
  function inWall(x, y) {
    return x >= WALL.x0 && x <= WALL.x1 && y >= WALL.y0 && y <= WALL.y1;
  }

  function mount(root, opts) {
    opts = opts || {};
    const mini = !!opts.mini;
    const canvas = root.querySelector("canvas.rs-main") || root.querySelector("canvas");
    const chart = root.querySelector("canvas.rs-chart");
    const readout = root.querySelector("[data-role=readout]");
    const swarmBtn = root.querySelector("[data-role=swarm]");
    const ringsBox = root.querySelector("[data-role=rings]");

    let col = R.colors();
    let hatch = null;
    let showRings = ringsBox ? ringsBox.checked : true;
    const vp = R.viewport(0, W, 0, H);
    let robots = [];
    let focus = null; // the robot whose V(t) is charted
    let spawnTimer = 0;
    let t = 0;

    const cv = R.setupCanvas(canvas, mini ? 0.72 : 0.62, function () {
      layout();
      draw();
    });
    const ch = chart ? R.setupCanvas(chart, 0.2, drawChart) : null;

    function layout() {
      const p = mini ? 4 : 10;
      vp.fit(p, p, cv.w - 2 * p, cv.h - 2 * p);
    }

    function newRobot(x, y, focused) {
      const k = lowestLevel(x, y);
      if (k < 0) return null;
      return {
        x: x,
        y: y,
        k: k,
        trail: [[x, y, k]],
        hist: [[0, k, Vk(k, x, y)]],
        t0: t,
        alpha: 1,
        done: false,
        focused: !!focused,
      };
    }

    function randomCovered(minLevel) {
      for (let i = 0; i < 500; i++) {
        const x = 0.2 + Math.random() * (W - 0.4),
          y = 0.2 + Math.random() * (H - 0.4);
        if (inWall(x, y)) continue;
        const k = lowestLevel(x, y);
        if (k >= minLevel) return [x, y];
      }
      return [1.9, 6.6];
    }

    function swarm(n) {
      for (let i = 0; i < n; i++) {
        const p = randomCovered(Math.floor(Math.random() * 4) + (mini ? 6 : 4));
        const r = newRobot(p[0], p[1]);
        if (r) {
          r.delay = Math.random() * 1.5;
          robots.push(r);
        }
      }
    }

    function step(dt) {
      t += dt;
      for (const r of robots) {
        if (r.done) {
          r.alpha -= dt * 0.8;
          continue;
        }
        if (r.delay > 0) {
          r.delay -= dt;
          continue;
        }
        const e = LEVELS[r.k];
        let ux = -KAPPA * (r.x - e[0]),
          uy = -KAPPA * (r.y - e[1]);
        const sp = Math.hypot(ux, uy);
        if (sp > VMAX) {
          ux *= VMAX / sp;
          uy *= VMAX / sp;
        }
        r.x += ux * dt;
        r.y += uy * dt;
        // switch down as soon as a lower level certifies the state
        const k = lowestLevel(r.x, r.y);
        if (k >= 0 && k < r.k) r.k = k;
        r.trail.push([r.x, r.y, r.k]);
        if (r.trail.length > 600) r.trail.shift();
        r.hist.push([t - r.t0, r.k, Vk(r.k, r.x, r.y)]);
        if (r.k === 0 && Vk(0, r.x, r.y) < GOAL_EPS * GOAL_EPS * 4) r.done = true;
        if (r === focus) updateReadout(r);
      }
      robots = robots.filter(function (r) {
        return r.alpha > 0;
      });
    }

    function updateReadout(r) {
      if (!readout) return;
      if (r.done) {
        readout.innerHTML =
          "Reached the goal after " +
          r.hist[r.hist.length - 1][0].toFixed(1) +
          " s, visiting " +
          countLevels(r) +
          " levels. Each sawtooth tooth in the chart is one level's Lyapunov function running down.";
      } else {
        readout.innerHTML =
          'Active: <span class="rs-chip" style="--chip:' +
          R.levelColor(r.k, N, col) +
          '">level ' +
          r.k +
          "</span> &nbsp; V<sub>" +
          r.k +
          "</sub> = " +
          Vk(r.k, r.x, r.y).toFixed(2);
      }
    }
    function countLevels(r) {
      const s = new Set(
        r.hist.map(function (h) {
          return h[1];
        })
      );
      return s.size;
    }

    function ellipsePath(ctx, e, scale) {
      ctx.beginPath();
      ctx.ellipse(vp.X(e[0]), vp.Y(e[1]), e[2] * scale * vp.s, e[3] * scale * vp.s, 0, 0, 2 * Math.PI);
    }

    function draw() {
      const ctx = cv.ctx;
      ctx.clearRect(0, 0, cv.w, cv.h);
      if (!hatch) hatch = R.hatchPattern(ctx, col.hatch);
      const x0 = vp.X(0),
        y0 = vp.Y(H),
        pw = vp.pw,
        ph = vp.ph;

      // uncovered space
      ctx.fillStyle = col.uncovered;
      ctx.fillRect(x0, y0, pw, ph);
      ctx.fillStyle = hatch;
      ctx.fillRect(x0, y0, pw, ph);

      // regions, highest level first so lower levels sit on top
      for (let k = N - 1; k >= 0; k--) {
        const c = R.levelColor(k, N, col);
        ellipsePath(ctx, LEVELS[k], 1);
        ctx.fillStyle = col.bg;
        ctx.fill();
        ctx.fillStyle = R.hexToRgba(c, col.dark ? 0.3 : 0.26);
        ctx.fill();
      }
      for (let k = N - 1; k >= 0; k--) {
        const c = R.levelColor(k, N, col);
        ctx.strokeStyle = R.hexToRgba(c, 0.95);
        ctx.lineWidth = 1.4;
        ellipsePath(ctx, LEVELS[k], 1);
        ctx.stroke();
        if (showRings && !mini) {
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = R.hexToRgba(c, 0.45);
          for (const s of [0.25, 0.5, 0.75]) {
            ellipsePath(ctx, LEVELS[k], s);
            ctx.stroke();
          }
        }
      }

      // wall + room
      ctx.fillStyle = col.obstacleFill;
      ctx.strokeStyle = col.obstacle;
      ctx.lineWidth = 2;
      const wx = vp.X(WALL.x0),
        wy = vp.Y(WALL.y1),
        ww = (WALL.x1 - WALL.x0) * vp.s,
        wh = (WALL.y1 - WALL.y0) * vp.s;
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.strokeStyle = col.text;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x0, y0, pw, ph);

      // goal
      const gx = vp.X(LEVELS[0][0]),
        gy = vp.Y(LEVELS[0][1]);
      ctx.strokeStyle = col.text;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(gx, gy, mini ? 4 : 6, 0, 2 * Math.PI);
      ctx.moveTo(gx - (mini ? 7 : 10), gy);
      ctx.lineTo(gx + (mini ? 7 : 10), gy);
      ctx.moveTo(gx, gy - (mini ? 7 : 10));
      ctx.lineTo(gx, gy + (mini ? 7 : 10));
      ctx.stroke();

      // robots
      for (const r of robots) {
        ctx.globalAlpha = Math.max(0, r.alpha) * (r.focused || mini ? 1 : 0.85);
        ctx.lineCap = "round";
        ctx.lineWidth = r.focused ? 2.8 : 1.6;
        for (let i = 1; i < r.trail.length; i++) {
          const a = r.trail[i - 1],
            b = r.trail[i];
          ctx.strokeStyle = r.focused ? R.levelColor(b[2], N, col) : R.hexToRgba(R.levelColor(b[2], N, col), 0.75);
          ctx.beginPath();
          ctx.moveTo(vp.X(a[0]), vp.Y(a[1]));
          ctx.lineTo(vp.X(b[0]), vp.Y(b[1]));
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(vp.X(r.x), vp.Y(r.y), r.focused ? 6 : mini ? 2.6 : 3.4, 0, 2 * Math.PI);
        ctx.fillStyle = r.focused ? col.text : R.levelColor(r.k, N, col);
        ctx.fill();
        if (r.focused) {
          ctx.strokeStyle = col.bg;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    function drawChart() {
      if (!ch) return;
      const ctx = ch.ctx;
      ctx.clearRect(0, 0, ch.w, ch.h);
      const l = 34,
        rgt = 8,
        top = 8,
        bot = 20;
      const w = ch.w - l - rgt,
        h = ch.h - top - bot;
      ctx.strokeStyle = col.frame;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(l, top);
      ctx.lineTo(l, top + h);
      ctx.lineTo(l + w, top + h);
      ctx.stroke();
      ctx.fillStyle = col.textLight;
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("1", l - 6, top + 8);
      ctx.fillText("0", l - 6, top + h);
      ctx.save();
      ctx.translate(11, top + h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("active V", 0, 0);
      ctx.restore();
      ctx.textAlign = "center";
      if (!focus) {
        ctx.fillText("Click the map to start a robot and chart its active Lyapunov function", l + w / 2, top + h / 2);
        return;
      }
      const hist = focus.hist;
      const T = Math.max(6, hist[hist.length - 1][0]);
      ctx.fillText("time (s)", l + w / 2, top + h + 16);
      ctx.lineWidth = 2;
      let prevK = hist[0][1];
      ctx.beginPath();
      ctx.strokeStyle = R.levelColor(prevK, N, col);
      for (let i = 0; i < hist.length; i++) {
        const px = l + (hist[i][0] / T) * w;
        const py = top + h - Math.min(1, hist[i][2]) * h;
        if (hist[i][1] !== prevK) {
          ctx.stroke();
          // switch marker
          ctx.save();
          ctx.setLineDash([2, 3]);
          ctx.strokeStyle = col.frame;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, top);
          ctx.lineTo(px, top + h);
          ctx.stroke();
          ctx.restore();
          prevK = hist[i][1];
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = R.levelColor(prevK, N, col);
          ctx.moveTo(px, py);
        } else if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    if (!mini) {
      canvas.addEventListener("click", function (e) {
        const pt = R.pointer(canvas, e);
        const w = vp.toWorld(pt[0], pt[1]);
        if (w[0] < 0 || w[0] > W || w[1] < 0 || w[1] > H) return;
        if (inWall(w[0], w[1])) {
          if (readout) readout.textContent = "That's inside the wall. Pick a free spot.";
          return;
        }
        const r = newRobot(w[0], w[1], true);
        if (!r) {
          if (readout)
            readout.textContent =
              "No level covers that spot, so there's no certificate from there. The hatched area is what this hierarchy leaves uncertified.";
          return;
        }
        if (focus) focus.focused = false;
        focus = r;
        robots.push(r);
        updateReadout(r);
        anim.kick();
      });
      if (swarmBtn)
        swarmBtn.addEventListener("click", function () {
          swarm(36);
          anim.kick();
        });
      if (ringsBox)
        ringsBox.addEventListener("change", function () {
          showRings = ringsBox.checked;
          draw();
        });
    }

    R.onThemeChange(function () {
      col = R.colors();
      hatch = null;
      draw();
      drawChart();
    });

    const anim = R.loop(canvas, function (dt) {
      if (R.reducedMotion()) dt *= 4; // skip ahead instead of animating smoothly
      step(dt * (mini ? 1.2 : 1));
      if (mini) {
        spawnTimer += dt;
        if (spawnTimer > 0.45) {
          spawnTimer = 0;
          swarm(1);
        }
      }
      draw();
      if (focus) drawChart();
    });

    // opening: one charted robot from the far end of the U, plus a small swarm
    if (!mini) {
      const r = newRobot(2.2, 6.9, true);
      focus = r;
      robots.push(r);
      updateReadout(r);
      swarm(14);
    } else swarm(10);
    layout();
    draw();
    drawChart();
  }

  R.successiveCLFs = mount;
})();
