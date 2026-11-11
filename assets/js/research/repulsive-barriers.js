/*
 * Repulsive barriers — one certificate, defined in the obstacle's frame, reused wherever the
 * obstacle goes.
 *
 * A Dubins car tracks a loop while a disc obstacle wanders (or is dragged) across it.
 * Every TAU seconds the supervisor samples the obstacle centre and re-expresses the car in
 * obstacle-relative coordinates (x - c, y - c, theta). Safety is judged by a certificate that
 * only depends on those relative coordinates, so it never has to be re-synthesised: it is
 * simply translated with the obstacle. Here the certificate is computed by forward simulation
 * of a small set of held turn rates with a clearance margin that grows with the obstacle's
 * maximum speed; in the paper it is a family of SOS polynomial barriers.
 */
(function () {
  "use strict";
  const R = window.Research;

  const V = 1.6; // car speed
  const WMAX = 1.6; // max turn rate
  const U = [WMAX, WMAX / 2, 0, -WMAX / 2, -WMAX];
  const OBS_R = 0.9;
  const VO_MAX = 0.6; // obstacle speed bound used in the certificate
  const MARGIN = 0.12;
  const TAU = 0.25; // sample-and-hold period
  const HORIZON = 1.2;
  const SAMPLES = 12;
  const BAND = 0.15; // override when nominal clearance drops below this
  const HYST = 0.3;
  const TRACK = { a: 7.2, b: 4.0 };
  const XW = 10,
    YW = 6.2;

  function flow(x, y, th, u, t) {
    if (Math.abs(u) < 1e-9) return [x + V * t * Math.cos(th), y + V * t * Math.sin(th), th];
    const k = V / u,
      th2 = th + u * t;
    return [x + k * (Math.sin(th2) - Math.sin(th)), y - k * (Math.cos(th2) - Math.cos(th)), th2];
  }

  // Certificate value in obstacle-relative coordinates: worst-case clearance over the horizon
  // when holding turn rate u, against an obstacle that may move VO_MAX in any direction.
  function clearance(xr, yr, th, u) {
    let m = Math.hypot(xr, yr) - OBS_R - MARGIN;
    for (let i = 1; i <= SAMPLES; i++) {
      const t = (HORIZON * i) / SAMPLES;
      const q = flow(xr, yr, th, u, t);
      const d = Math.hypot(q[0], q[1]) - OBS_R - MARGIN - VO_MAX * t;
      if (d < m) m = d;
    }
    return m;
  }
  function bestControl(xr, yr, th) {
    let best = -Infinity,
      bi = 2;
    for (let i = 0; i < U.length; i++) {
      const c = clearance(xr, yr, th, U[i]);
      if (c > best) {
        best = c;
        bi = i;
      }
    }
    return { i: bi, c: best };
  }

  function mount(root, opts) {
    opts = opts || {};
    const mini = !!opts.mini;
    const canvas = root.querySelector("canvas");
    const readout = root.querySelector("[data-role=readout]");
    const filterBox = root.querySelector("[data-role=filter]");
    const resetBtn = root.querySelector("[data-role=reset]");

    let col = R.colors();
    let filterOn = filterBox ? filterBox.checked : true;
    const world = R.viewport(-XW, XW, -YW, YW);
    const REL = 6; // half-width of the obstacle-frame panel
    const rel = R.viewport(-REL, REL, -REL, REL);
    let stacked = false;
    let relBox = null;

    let car, obs, sample, mode, hold, uHold, trail, collisions, t, dragging, dragTarget, flash, icr, icrT, nomClear;

    function reset() {
      car = { x: TRACK.a, y: 0, th: Math.PI / 2 };
      obs = { x: -2, y: 3, vx: 0, vy: 0 };
      sample = { x: obs.x, y: obs.y, age: 0 };
      mode = "nominal";
      hold = 0;
      uHold = 0;
      trail = [];
      collisions = 0;
      t = 0;
      dragging = false;
      dragTarget = null;
      flash = 0;
      icr = null;
      icrT = 0;
      nomClear = 1;
    }
    reset();

    const cv = R.setupCanvas(canvas, mini ? 0.63 : 0.41, function () {
      layout();
      draw();
    });

    function layout() {
      if (mini) {
        world.fit(4, 4, cv.w - 8, cv.h - 8);
        relBox = null;
        return;
      }
      stacked = cv.w < 620;
      if (stacked) {
        // world on top, obstacle frame below
        const wh = Math.round(cv.w * 0.62);
        canvas.style.height = Math.round(wh + cv.w * 0.62 + 20) + "px";
        // re-run sizing with the taller box
        const dpr = cv.dpr;
        cv.h = Math.round(wh + cv.w * 0.62 + 20);
        canvas.height = Math.round(cv.h * dpr);
        cv.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        world.fit(6, 6, cv.w - 12, wh - 12);
        relBox = { x: 6, y: wh + 14, w: cv.w - 12, h: cv.w * 0.62 - 6 };
      } else {
        const ww = Math.round(cv.w * 0.64);
        world.fit(6, 6, ww - 12, cv.h - 12);
        relBox = { x: ww + 10, y: 6, w: cv.w - ww - 16, h: cv.h - 12 };
      }
      rel.fit(relBox.x + 8, relBox.y + 26, relBox.w - 16, relBox.h - 34);
    }

    function nominalControl() {
      // pure pursuit on the elliptical track (counter-clockwise)
      const phi = Math.atan2(car.y / TRACK.b, car.x / TRACK.a) + 0.45;
      const tx = TRACK.a * Math.cos(phi),
        ty = TRACK.b * Math.sin(phi);
      const err = R.wrap(Math.atan2(ty - car.y, tx - car.x) - car.th);
      return Math.max(-WMAX, Math.min(WMAX, 2.2 * err));
    }

    function nearestU(u) {
      let bi = 0;
      for (let i = 1; i < U.length; i++) if (Math.abs(U[i] - u) < Math.abs(U[bi] - u)) bi = i;
      return bi;
    }

    function moveObstacle(dt) {
      let tx, ty;
      if (dragging && dragTarget) {
        tx = dragTarget[0];
        ty = dragTarget[1];
      } else {
        tx = 4.6 * Math.sin(0.085 * t + 2.4);
        ty = 3.4 * Math.sin(0.11 * t + 0.6);
      }
      let dx = tx - obs.x,
        dy = ty - obs.y;
      const d = Math.hypot(dx, dy);
      const vmax = VO_MAX * 0.98;
      const step = Math.min(d, vmax * dt * (dragging ? 1 : 4)); // auto path is followed closely
      if (d > 1e-9) {
        obs.x += (dx / d) * Math.min(step, vmax * dt);
        obs.y += (dy / d) * Math.min(step, vmax * dt);
      }
    }

    function step(dt) {
      t += dt;
      moveObstacle(dt);

      // sample-and-hold recentering
      sample.age += dt;
      if (sample.age >= TAU) {
        sample = { x: obs.x, y: obs.y, age: 0 };
        const xr = car.x - sample.x,
          yr = car.y - sample.y;
        const uNom = nominalControl();
        nomClear = clearance(xr, yr, car.th, U[nearestU(uNom)]);
        if (filterOn) {
          if (mode === "nominal" && nomClear < BAND) mode = "override";
          else if (mode === "override" && nomClear > BAND + HYST) mode = "nominal";
          if (mode === "override") uHold = U[bestControl(xr, yr, car.th).i];
        } else mode = "nominal";
      }
      const u = mode === "override" ? uHold : nominalControl();
      const p = flow(car.x, car.y, car.th, u, dt);
      car.x = p[0];
      car.y = p[1];
      car.th = R.wrap(p[2]);
      trail.push([car.x, car.y, mode === "override"]);
      if (trail.length > 1600) trail.shift();

      const dist = Math.hypot(car.x - obs.x, car.y - obs.y);
      if (dist < OBS_R) {
        if (flash <= 0) collisions++;
        flash = 0.6;
      } else flash = Math.max(0, flash - dt);

      // inevitable-collision slice in the obstacle frame, at the car's heading
      icrT -= dt;
      if (icrT <= 0 && !mini) {
        icr = computeICR(car.th, 72);
        icrT = 0.12;
      }
      if (readout && !mini) {
        const chip =
          mode === "override"
            ? '<span class="rs-chip" style="--chip:' + col.obstacle + '">override</span>'
            : '<span class="rs-chip" style="--chip:' + col.levels[1] + '">nominal</span>';
        readout.innerHTML =
          chip +
          " &nbsp;certificate margin " +
          R.fmt(Math.max(-9, nomClear), 2) +
          " &nbsp;·&nbsp; distance " +
          dist.toFixed(2) +
          (filterOn ? "" : " &nbsp;·&nbsp; collisions " + collisions);
      }
    }

    // grid over obstacle-relative positions: 1 where every held turn rate loses clearance
    function computeICR(th, n) {
      const g = new Uint8Array(n * n);
      for (let j = 0; j < n; j++) {
        const y = REL - ((j + 0.5) / n) * 2 * REL;
        for (let i = 0; i < n; i++) {
          const x = -REL + ((i + 0.5) / n) * 2 * REL;
          if (x * x + y * y > REL * REL) continue;
          g[j * n + i] = bestControl(x, y, th).c < 0 ? 1 : 0;
        }
      }
      return { g: g, n: n, th: th };
    }

    const icrCanvas = document.createElement("canvas");
    function icrImage() {
      if (!icr) return null;
      const n = icr.n;
      icrCanvas.width = icrCanvas.height = n;
      const c = icrCanvas.getContext("2d");
      const img = c.createImageData(n, n);
      const rgb = R.hexToRgb(col.obstacle);
      for (let p = 0; p < n * n; p++) {
        if (!icr.g[p]) continue;
        img.data[p * 4] = rgb[0];
        img.data[p * 4 + 1] = rgb[1];
        img.data[p * 4 + 2] = rgb[2];
        img.data[p * 4 + 3] = col.dark ? 70 : 60;
      }
      c.putImageData(img, 0, 0);
      return icrCanvas;
    }

    function drawPredicted(ctx, vp, x, y, th, u, ox, oy, style, width) {
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const q = flow(x, y, th, u, (HORIZON * i) / 24);
        const X = vp.X(q[0] + ox),
          Y = vp.Y(q[1] + oy);
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      }
      ctx.stroke();
    }

    function draw() {
      const ctx = cv.ctx;
      ctx.clearRect(0, 0, cv.w, cv.h);
      const img = icrImage();

      // ---- world frame
      const wx0 = world.X(-XW),
        wy0 = world.Y(YW);
      ctx.save();
      ctx.beginPath();
      ctx.rect(wx0, wy0, world.pw, world.ph);
      ctx.clip();
      // grid
      ctx.strokeStyle = col.grid;
      ctx.lineWidth = 1;
      for (let gx = -XW; gx <= XW; gx += 2) {
        ctx.beginPath();
        ctx.moveTo(world.X(gx), wy0);
        ctx.lineTo(world.X(gx), wy0 + world.ph);
        ctx.stroke();
      }
      for (let gy = -6; gy <= 6; gy += 2) {
        ctx.beginPath();
        ctx.moveTo(wx0, world.Y(gy));
        ctx.lineTo(wx0 + world.pw, world.Y(gy));
        ctx.stroke();
      }
      // track
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = col.textLight;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(world.X(0), world.Y(0), TRACK.a * world.s, TRACK.b * world.s, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
      // certificate's unsafe slice, translated to the sampled centre
      if (img) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, world.X(sample.x - REL), world.Y(sample.y + REL), 2 * REL * world.s, 2 * REL * world.s);
      }
      // trail
      ctx.lineCap = "round";
      ctx.lineWidth = mini ? 2 : 2.6;
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1],
          b = trail[i];
        ctx.strokeStyle = b[2] ? col.obstacle : col.accent;
        ctx.globalAlpha = 0.25 + (0.75 * i) / trail.length;
        ctx.beginPath();
        ctx.moveTo(world.X(a[0]), world.Y(a[1]));
        ctx.lineTo(world.X(b[0]), world.Y(b[1]));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // predicted arc of the action currently applied
      if (!mini) {
        const u = mode === "override" ? uHold : nominalControl();
        ctx.setLineDash([4, 4]);
        drawPredicted(ctx, world, car.x, car.y, car.th, u, 0, 0, R.hexToRgba(mode === "override" ? col.obstacle : col.accent, 0.8), 1.4);
        ctx.setLineDash([]);
      }
      // obstacle (true) and its reachable growth ring
      ctx.beginPath();
      ctx.arc(world.X(obs.x), world.Y(obs.y), OBS_R * world.s, 0, 2 * Math.PI);
      ctx.fillStyle = flash > 0 ? R.hexToRgba(col.obstacle, 0.55) : col.obstacleFill;
      ctx.fill();
      ctx.strokeStyle = col.obstacle;
      ctx.lineWidth = 2;
      ctx.stroke();
      // sampled centre (where the certificate is anchored right now)
      const sx = world.X(sample.x),
        sy = world.Y(sample.y);
      ctx.strokeStyle = col.text;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy - 5);
      ctx.lineTo(sx + 5, sy + 5);
      ctx.moveTo(sx + 5, sy - 5);
      ctx.lineTo(sx - 5, sy + 5);
      ctx.stroke();
      R.drawCar(ctx, world.X(car.x), world.Y(car.y), car.th, mini ? 8 : 11, mode === "override" ? col.obstacle : col.text, col.bg);
      ctx.restore();
      ctx.strokeStyle = col.frame;
      ctx.lineWidth = 1;
      ctx.strokeRect(wx0, wy0, world.pw, world.ph);
      if (!mini) {
        ctx.fillStyle = col.textLight;
        ctx.font = "12px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("World frame — drag the obstacle", wx0 + 8, wy0 + 18);
      }

      if (!relBox) return;
      // ---- obstacle frame
      ctx.fillStyle = col.textLight;
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Obstacle frame — the certificate never moves", relBox.x + 2, relBox.y + 14);
      const rx0 = rel.X(-REL),
        ry0 = rel.Y(REL);
      ctx.save();
      ctx.beginPath();
      ctx.arc(rel.X(0), rel.Y(0), REL * rel.s, 0, 2 * Math.PI);
      ctx.clip();
      ctx.fillStyle = col.dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)";
      ctx.fillRect(rx0, ry0, rel.pw, rel.ph);
      if (img) ctx.drawImage(img, rx0, ry0, rel.pw, rel.ph);
      ctx.strokeStyle = col.grid;
      ctx.lineWidth = 1;
      for (let r = 2; r <= REL; r += 2) {
        ctx.beginPath();
        ctx.arc(rel.X(0), rel.Y(0), r * rel.s, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(rel.X(0), rel.Y(0), OBS_R * rel.s, 0, 2 * Math.PI);
      ctx.fillStyle = col.obstacleFill;
      ctx.fill();
      ctx.strokeStyle = col.obstacle;
      ctx.lineWidth = 2;
      ctx.stroke();
      const xr = car.x - sample.x,
        yr = car.y - sample.y;
      if (Math.hypot(xr, yr) < REL + 0.6) {
        ctx.setLineDash([4, 4]);
        drawPredicted(ctx, rel, xr, yr, car.th, mode === "override" ? uHold : nominalControl(), 0, 0, R.hexToRgba(mode === "override" ? col.obstacle : col.accent, 0.85), 1.4);
        ctx.setLineDash([]);
        R.drawCar(ctx, rel.X(xr), rel.Y(yr), car.th, 10, mode === "override" ? col.obstacle : col.text, col.bg);
      }
      ctx.restore();
      ctx.strokeStyle = col.frame;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rel.X(0), rel.Y(0), REL * rel.s, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = col.textLight;
      ctx.textAlign = "center";
      ctx.fillText("Shaded: no held turn rate keeps clearance at this heading", relBox.x + relBox.w / 2, relBox.y + relBox.h - 2);
    }

    if (!mini) {
      function down(e) {
        const pt = R.pointer(canvas, e);
        const w = world.toWorld(pt[0], pt[1]);
        if (Math.hypot(w[0] - obs.x, w[1] - obs.y) < OBS_R + 1.0) {
          dragging = true;
          dragTarget = w;
          canvas.style.cursor = "grabbing";
          e.preventDefault();
        }
      }
      function move(e) {
        const pt = R.pointer(canvas, e);
        const w = world.toWorld(pt[0], pt[1]);
        if (dragging) {
          dragTarget = [Math.max(-XW, Math.min(XW, w[0])), Math.max(-YW, Math.min(YW, w[1]))];
          e.preventDefault();
        } else {
          canvas.style.cursor = Math.hypot(w[0] - obs.x, w[1] - obs.y) < OBS_R + 1.0 ? "grab" : "default";
        }
      }
      function up() {
        dragging = false;
        canvas.style.cursor = "default";
      }
      canvas.addEventListener("mousedown", down);
      canvas.addEventListener("touchstart", down, { passive: false });
      window.addEventListener("mousemove", move);
      canvas.addEventListener("touchmove", move, { passive: false });
      window.addEventListener("mouseup", up);
      window.addEventListener("touchend", up);
      if (filterBox)
        filterBox.addEventListener("change", function () {
          filterOn = filterBox.checked;
          collisions = 0;
        });
      if (resetBtn)
        resetBtn.addEventListener("click", function () {
          reset();
          anim.kick();
        });
    }

    R.onThemeChange(function () {
      col = R.colors();
      draw();
    });

    const anim = R.loop(canvas, function (dt) {
      const sub = 3;
      for (let i = 0; i < sub; i++) step(dt / sub);
      draw();
    });
    layout();
    draw();
  }

  R.repulsiveBarriers = mount;
})();
