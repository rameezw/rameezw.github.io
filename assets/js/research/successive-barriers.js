/*
 * Successive barriers — a live hierarchy for a Dubins car in a fenced box with a round obstacle.
 *
 * As in the HSCC'25 paper, every certificate is paired with ONE fixed control input:
 *   Level 0: holding a fixed turn rate keeps the car safe forever
 *            (its turning circle stays inside the fence and clear of the obstacle).
 *   Level k: holding a fixed turn rate keeps the car safe for as long as it is outside the
 *            region certified by levels 0..k-1, and brings it into that region.
 *            The certificate only has to hold outside what is already certified.
 * The union of levels is controlled invariant: the runtime simply holds the active level's input
 * and hands over when the car enters an earlier level.
 *
 * Here the regions are computed numerically on a 100 x 100 x 72 grid of (x, y, heading),
 * level by level, in the browser. In the paper, each level is a polynomial barrier
 * certificate found by SOS programming, which is what lets the method scale to 5-6 states.
 */
(function () {
  "use strict";
  const R = window.Research;

  const V = 1.0; // speed
  const U = [0.4, 0.0, -0.4]; // available turn rates (rad/s)
  const U_NAME = ["turn left", "go straight", "turn right"];
  const HORIZON = 3.0; // how long a level may take to hand over (s)
  const DT = 0.1; // sampling of trajectories inside the certificate checks
  const STEPS = Math.round(HORIZON / DT);
  const OBS = 1.5; // obstacle radius (centred at origin)
  const BOX = 6.0; // fence half-width
  const MAXLEV = 4;
  // state grid: N x N positions, NT headings
  const N = 100,
    NT = 72;
  const CELL = (2 * BOX) / N,
    DTH = (2 * Math.PI) / NT;

  function flow(x, y, th, u, t) {
    if (Math.abs(u) < 1e-9) return [x + V * t * Math.cos(th), y + V * t * Math.sin(th), th];
    const k = V / u;
    const th2 = th + u * t;
    return [x + k * (Math.sin(th2) - Math.sin(th)), y - k * (Math.cos(th2) - Math.cos(th)), th2];
  }

  function safePoint(x, y, m) {
    m = m || 0;
    const r = OBS + m;
    return Math.abs(x) <= BOX - m && Math.abs(y) <= BOX - m && x * x + y * y >= r * r;
  }
  // The grid certifies with a small margin so the continuous car, which is never exactly at a
  // cell centre, stays safe when it follows the grid's decisions.
  const MARGIN = 0.2;

  // Index into U of a fixed control whose turning circle is invariant and safe, or -1.
  function level0(x, y, th, m) {
    m = m || 0;
    for (let i = 0; i < U.length; i++) {
      const u = U[i];
      if (Math.abs(u) < 1e-9) continue; // straight lines always leave the fence
      const rad = V / Math.abs(u);
      const s = Math.sign(u);
      const cx = x - s * rad * Math.sin(th);
      const cy = y + s * rad * Math.cos(th);
      if (Math.abs(cx) + rad > BOX - m || Math.abs(cy) + rad > BOX - m) continue;
      const d = Math.hypot(cx, cy);
      if (d >= rad + OBS + m || d <= rad - OBS - m) return i;
    }
    return -1;
  }

  const cx = (i) => -BOX + (i + 0.5) * CELL;
  const cy = (j) => -BOX + (j + 0.5) * CELL;
  const cth = (t) => t * DTH - Math.PI;
  const idx = (i, j, t) => (t * N + j) * N + i;
  function cellOf(x, y, th) {
    const i = Math.floor((x + BOX) / CELL),
      j = Math.floor((y + BOX) / CELL);
    let t = Math.round((th + Math.PI) / DTH) % NT;
    if (t < 0) t += NT;
    if (i < 0 || j < 0 || i >= N || j >= N) return -1;
    return idx(i, j, t);
  }

  // The flow commutes with translation, so a held input moves every cell of a heading slice by
  // the same offset: precompute those offsets once per (heading, input).
  const OFFS = [];
  for (let t = 0; t < NT; t++) {
    OFFS.push([]);
    for (let u = 0; u < U.length; u++) {
      const o = [];
      for (let s = 1; s <= STEPS; s++) {
        const q = flow(0, 0, cth(t), U[u], s * DT);
        let tt = Math.round((q[2] + Math.PI) / DTH) % NT;
        if (tt < 0) tt += NT;
        o.push([q[0] / CELL, q[1] / CELL, tt]);
      }
      OFFS[t].push(o);
    }
  }

  // Table of levels: -2 unsafe, -1 not (yet) certified, k >= 0 lowest certifying level.
  const LEV = new Int8Array(N * N * NT).fill(-1);
  const ACT = new Int8Array(N * N * NT).fill(-1); // input index the level holds
  let builtLevel = -1;

  // Holding input u from cell (i,j,t): safe until it reaches a cell of level < k ?
  function handsOver(i, j, t, u, k) {
    const o = OFFS[t][u];
    for (let s = 0; s < o.length; s++) {
      const ii = Math.round(i + o[s][0]),
        jj = Math.round(j + o[s][1]);
      if (ii < 0 || jj < 0 || ii >= N || jj >= N) return false;
      const L = LEV[idx(ii, jj, o[s][2])];
      if (L === -2) return false;
      if (L >= 0 && L < k) return true;
    }
    return false;
  }

  // Builds one level (or one chunk of it). Returns true once everything is built.
  let buildT = 0;
  function buildStep(budgetCells) {
    if (builtLevel >= MAXLEV) return true;
    const k = builtLevel + 1;
    let done = 0;
    for (; buildT < NT && done < budgetCells; buildT++) {
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N; i++) {
          const c = idx(i, j, buildT);
          if (k === 0) {
            if (!safePoint(cx(i), cy(j), MARGIN)) {
              LEV[c] = -2;
              continue;
            }
            const u0 = level0(cx(i), cy(j), cth(buildT), MARGIN);
            if (u0 >= 0) {
              LEV[c] = 0;
              ACT[c] = u0;
            }
          } else if (LEV[c] === -1) {
            for (let u = 0; u < U.length; u++)
              if (handsOver(i, j, buildT, u, k)) {
                LEV[c] = k;
                ACT[c] = u;
                break;
              }
          }
        }
      done += N * N;
    }
    if (buildT >= NT) {
      buildT = 0;
      builtLevel = k;
    }
    return builtLevel >= MAXLEV;
  }

  // Continuous-state planner for the animated car. It follows the exact arc from the car's true
  // state, uses the table to spot where a lower level begins, and re-verifies from that exact
  // point (recursively), so the car never relies on a grid cell's centre.
  // Returns the hand-over time (s), or 0 if holding U[u] does not hand over safely.
  function handsOverFrom(x, y, th, u, k) {
    for (let s = 1; s <= STEPS; s++) {
      const q = flow(x, y, th, U[u], s * DT);
      if (!safePoint(q[0], q[1], 0.04)) return 0;
      if (level0(q[0], q[1], q[2], 0.02) >= 0) return s * DT;
      if (k <= 1) continue;
      const c = cellOf(q[0], q[1], q[2]);
      const L = c < 0 ? -2 : LEV[c];
      if (L >= 1 && L < k && planAt(q[0], q[1], q[2], k - 1) >= 0) return s * DT;
    }
    return 0;
  }
  function planAt(x, y, th, kmax) {
    if (level0(x, y, th, 0.02) >= 0) return 0;
    for (let k = 1; k <= kmax; k++) for (let u = 0; u < U.length; u++) if (handsOverFrom(x, y, th, u, k)) return k;
    return -1;
  }
  function plan(x, y, th) {
    if (!safePoint(x, y)) return { level: -2, u: -1 };
    const e0 = level0(x, y, th, 0.02);
    if (e0 >= 0) return { level: 0, u: e0 };
    for (let k = 1; k <= MAXLEV; k++)
      for (let u = 0; u < U.length; u++) {
        const t = handsOverFrom(x, y, th, u, k);
        if (t > 0) return { level: k, u: u, t: t };
      }
    return { level: -1, u: -1 };
  }

  function classify(x, y, th) {
    if (!safePoint(x, y)) return { level: -2, u: -1 };
    const e0 = level0(x, y, th, 0.02);
    if (e0 >= 0) return { level: 0, u: e0 };
    const c = cellOf(x, y, th);
    if (c < 0) return { level: -2, u: -1 };
    const L = LEV[c];
    // a level-0 cell whose exact circle fails here (grid snapping) behaves like level 1
    return L === 0 ? { level: -1, u: -1 } : { level: L, u: ACT[c] };
  }

  // ---------------------------------------------------------------- UI
  function mount(root, opts) {
    opts = opts || {};
    const mini = !!opts.mini;
    const canvas = root.querySelector("canvas");
    const slider = root.querySelector("[data-role=heading]");
    const headingOut = root.querySelector("[data-role=heading-out]");
    const readout = root.querySelector("[data-role=readout]");
    const followBox = root.querySelector("[data-role=follow]");
    const replayBtn = root.querySelector("[data-role=replay]");

    let theta = slider ? (parseFloat(slider.value) * Math.PI) / 180 : Math.PI / 2;
    let follow = followBox ? followBox.checked : true;
    let col = R.colors();
    let hatch = null;
    const vp = R.viewport(-BOX, BOX, -BOX, BOX);

    const off = document.createElement("canvas");
    off.width = off.height = N;
    const offCtx = off.getContext("2d");
    let shownLevel = builtLevel; // levels <= shownLevel are painted
    let revealT = 0;
    let paintedT = -1;
    let car = null;
    let idle = 0;

    function sliceIndex(th) {
      let t = Math.round((th + Math.PI) / DTH) % NT;
      if (t < 0) t += NT;
      return t;
    }

    function paint() {
      const t = sliceIndex(theta);
      paintedT = t;
      const img = offCtx.createImageData(N, N);
      const lv = col.levels.map(R.hexToRgb);
      const a = col.dark ? 175 : 205;
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N; i++) {
          const L = LEV[idx(i, j, t)];
          const o = ((N - 1 - j) * N + i) * 4; // image rows run top-down
          if (L >= 0 && L <= shownLevel) {
            img.data[o] = lv[L][0];
            img.data[o + 1] = lv[L][1];
            img.data[o + 2] = lv[L][2];
            img.data[o + 3] = a;
          }
        }
      offCtx.putImageData(img, 0, 0);
    }

    const cv = R.setupCanvas(canvas, mini ? 1.0 : 0.82, function () {
      layout();
      draw();
    });

    function layout() {
      const pad = mini ? 6 : 34;
      vp.fit(pad, mini ? 6 : 10, cv.w - pad - (mini ? 6 : 12), cv.h - (mini ? 12 : 44));
    }

    function draw() {
      const ctx = cv.ctx;
      ctx.clearRect(0, 0, cv.w, cv.h);
      if (!hatch) hatch = R.hatchPattern(ctx, col.hatch);
      const x0 = vp.X(-BOX),
        y0 = vp.Y(BOX),
        S = vp.pw;

      ctx.fillStyle = col.uncovered;
      ctx.fillRect(x0, y0, S, S);
      ctx.fillStyle = hatch;
      ctx.fillRect(x0, y0, S, S);
      ctx.imageSmoothingEnabled = !mini;
      ctx.drawImage(off, x0, y0, S, S);

      if (!mini) {
        ctx.strokeStyle = col.grid;
        ctx.lineWidth = 1;
        for (let t = -BOX; t <= BOX; t += 2) {
          ctx.beginPath();
          ctx.moveTo(vp.X(t), y0);
          ctx.lineTo(vp.X(t), y0 + S);
          ctx.moveTo(x0, vp.Y(t));
          ctx.lineTo(x0 + S, vp.Y(t));
          ctx.stroke();
        }
        ctx.fillStyle = col.textLight;
        ctx.font = "11px system-ui, sans-serif";
        ctx.textAlign = "center";
        for (let t = -BOX; t <= BOX; t += 3) ctx.fillText(String(t).replace("-", "−"), vp.X(t), y0 + S + 15);
        ctx.textAlign = "right";
        for (let t = -BOX; t <= BOX; t += 3) ctx.fillText(String(t).replace("-", "−"), x0 - 6, vp.Y(t) + 4);
      }

      ctx.strokeStyle = col.text;
      ctx.lineWidth = mini ? 1.2 : 1.5;
      ctx.strokeRect(x0, y0, S, S);

      ctx.beginPath();
      ctx.arc(vp.X(0), vp.Y(0), OBS * vp.s, 0, 2 * Math.PI);
      ctx.fillStyle = col.obstacleFill;
      ctx.fill();
      ctx.strokeStyle = col.obstacle;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (car && car.trail.length) {
        ctx.lineWidth = mini ? 2 : 2.8;
        ctx.lineCap = "round";
        for (let i = 1; i < car.trail.length; i++) {
          const a = car.trail[i - 1],
            b = car.trail[i];
          ctx.strokeStyle = b[2] >= 0 ? col.levels[b[2]] : col.textLight;
          ctx.beginPath();
          ctx.moveTo(vp.X(a[0]), vp.Y(a[1]));
          ctx.lineTo(vp.X(b[0]), vp.Y(b[1]));
          ctx.stroke();
          // white halo keeps the trail readable over same-coloured regions
        }
        if (car.level === 0 && car.u >= 0) {
          const u = U[car.u],
            rad = V / Math.abs(u),
            sg = Math.sign(u);
          const ccx = car.x - sg * rad * Math.sin(car.th),
            ccy = car.y + sg * rad * Math.cos(car.th);
          ctx.setLineDash([3, 5]);
          ctx.strokeStyle = col.text;
          ctx.globalAlpha = 0.6;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(vp.X(ccx), vp.Y(ccy), rad * vp.s, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
        R.drawCar(ctx, vp.X(car.x), vp.Y(car.y), car.th, mini ? 7 : 10, col.text, col.bg);
      }

      if (!mini) {
        // heading of the slice being shown
        const hx = x0 + 22,
          hy = y0 + 22;
        ctx.beginPath();
        ctx.arc(hx, hy, 15, 0, 2 * Math.PI);
        ctx.fillStyle = col.bg;
        ctx.fill();
        ctx.strokeStyle = col.frame;
        ctx.lineWidth = 1;
        ctx.stroke();
        R.drawCar(ctx, hx, hy, cth(paintedT < 0 ? sliceIndex(theta) : paintedT), 9, col.accent);
      }
    }

    function setReadout(html) {
      if (readout) readout.innerHTML = html;
    }
    function chip(l) {
      return '<span class="rs-chip" style="--chip:' + col.levels[l] + '">level ' + l + "</span>";
    }

    function describe() {
      if (!car) return;
      const chain = car.path.map(chip).join(' <span class="rs-arrow">›</span> ');
      const now =
        car.level === 0
          ? "Holding <strong>" + U_NAME[car.u] + "</strong>: its turning circle is safe forever."
          : "Holding <strong>" + U_NAME[car.u] + "</strong> until the car enters level " + (car.level - 1) + " or lower.";
      setReadout(chain + "<br>" + now);
    }

    function spawn(x, y, th) {
      const c = plan(x, y, th);
      if (c.level === -2) return false;
      if (c.level < 0) {
        car = null;
        setReadout(
          classify(x, y, th).level >= 0
            ? "That spot is right on a region boundary at this grid's resolution. Try a little further inside."
            : "No level certifies this state at this heading: whichever turn rate the car holds, it eventually hits the obstacle or the fence."
        );
        draw();
        return false;
      }
      car = { x: x, y: y, th: th, level: c.level, u: c.u, until: c.t || Infinity, held: 0, trail: [[x, y, c.level]], path: [c.level], lap: 0, done: false };
      describe();
      return true;
    }

    function stepCar(dt) {
      if (!car || car.done) return;
      // never step past the verified hand-over instant
      const h = car.level > 0 ? Math.min(dt, Math.max(0, car.until - car.held)) : dt;
      const p = flow(car.x, car.y, car.th, U[car.u], h);
      car.x = p[0];
      car.y = p[1];
      car.th = R.wrap(p[2]);
      car.held += h;
      car.trail.push([car.x, car.y, car.level]);
      if (car.trail.length > 900) car.trail.shift();
      if (!safePoint(car.x, car.y)) {
        car.done = true; // should not happen: every hold is verified before it starts
        return;
      }
      if (car.level === 0) {
        car.lap += h * Math.abs(U[car.u]);
        if (car.lap > 2 * Math.PI * 1.05) car.done = true;
        return;
      }
      if (car.held >= car.until - 1e-9) {
        const c = plan(car.x, car.y, car.th);
        if (c.level < 0 || c.level >= car.level) {
          car.done = true; // planner could not continue (does not occur in testing)
          return;
        }
        car.level = c.level;
        car.u = c.u;
        car.until = c.t || Infinity;
        car.held = 0;
        car.path.push(c.level);
        describe();
      }
    }

    function randomStart(minL) {
      for (let tries = 0; tries < 600; tries++) {
        const x = (Math.random() * 2 - 1) * (BOX - 0.3);
        const y = (Math.random() * 2 - 1) * (BOX - 0.3);
        const th = Math.random() * 2 * Math.PI - Math.PI;
        if (classify(x, y, th).level >= minL && plan(x, y, th).level >= minL) return [x, y, th];
      }
      return null;
    }

    function syncSlider() {
      if (!slider) return;
      const deg = Math.round((theta * 180) / Math.PI);
      slider.value = deg;
      if (headingOut) headingOut.textContent = deg + "°";
    }

    function autoCar() {
      const s = randomStart(mini ? 2 : 3);
      if (!s) return;
      theta = s[2];
      syncSlider();
      spawn(s[0], s[1], s[2]);
      paint();
    }

    if (!mini) {
      canvas.classList.add("rs-clickable");
      canvas.addEventListener("click", function (e) {
        if (builtLevel < MAXLEV) return;
        const pt = R.pointer(canvas, e);
        const w = vp.toWorld(pt[0], pt[1]);
        if (Math.abs(w[0]) > BOX || Math.abs(w[1]) > BOX) return;
        theta = cth(sliceIndex(theta));
        spawn(w[0], w[1], theta);
        draw();
        anim.kick();
      });
      if (slider)
        slider.addEventListener("input", function () {
          theta = (parseFloat(slider.value) * Math.PI) / 180;
          if (headingOut) headingOut.textContent = slider.value + "°";
          car = null;
          paint();
          draw();
          if (builtLevel >= MAXLEV) setReadout("Click anywhere in the box to drop a car with this heading.");
        });
      if (followBox)
        followBox.addEventListener("change", function () {
          follow = followBox.checked;
        });
      if (replayBtn)
        replayBtn.addEventListener("click", function () {
          car = null;
          shownLevel = -1;
          revealT = 0;
          anim.kick();
        });
    }

    R.onThemeChange(function () {
      col = R.colors();
      hatch = null;
      paint();
      draw();
    });

    const anim = R.loop(canvas, function (dt) {
      // 1) build the table level by level (a few slices per frame), then reveal each level
      if (builtLevel < MAXLEV) {
        buildStep(mini ? 6000 : 14000);
      }
      if (shownLevel < builtLevel) {
        revealT += dt;
        if (revealT > 0.7 || R.reducedMotion() || mini) {
          revealT = 0;
          shownLevel++;
          paint();
          if (!mini) {
            setReadout(
              shownLevel === 0
                ? chip(0) + " Holding one turn rate keeps the car safe forever."
                : chip(shownLevel) +
                    " Holding one turn rate keeps the car safe until it enters a region from levels 0–" +
                    (shownLevel - 1) +
                    "."
            );
          }
        }
        draw();
        return;
      }
      if (builtLevel < MAXLEV) {
        draw();
        return;
      }
      if (!mini && !car && shownLevel === MAXLEV && root.dataset.intro !== "done") {
        root.dataset.intro = "done";
        autoCar();
      }
      if (car && !car.done) {
        stepCar(dt * (mini ? 1.8 : 1.3));
        if (follow) {
          const t = sliceIndex(car.th);
          if (t !== paintedT) {
            theta = car.th;
            syncSlider();
            paint();
          }
        }
        draw();
      } else if (mini) {
        idle += dt;
        if (idle > 1.0) {
          idle = 0;
          autoCar();
        }
      } else if (car && car.done && !car.announced) {
        car.announced = true;
        setReadout(
          car.path.map(chip).join(' <span class="rs-arrow">›</span> ') +
            "<br>Handed down " +
            (car.path.length - 1) +
            " times and settled on a safe circle. Click to drop another car."
        );
      }
    });

    if (!mini) setReadout("Building the hierarchy one level at a time…");
    shownLevel = -1;
    paint();
    layout();
    draw();
  }

  R.successiveBarriers = mount;
  R.successiveBarriers.model = { classify: classify, plan: plan, build: buildStep, LEV: LEV };
})();
