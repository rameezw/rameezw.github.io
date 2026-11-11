/*
 * Exact certificate repair — runs the real pipeline on a 6 x 6 Gram matrix, in exact
 * rational arithmetic (BigInt), in the browser.
 *
 *   p(x, y) = 12 − 2x − 14y − 7x² + 12xy − 8y² + 2x³ + 18x²y − 2xy² + 2y³
 *             + 12x⁴ − 6x³y + 20x²y² + 13y⁴
 *   p = mᵀ Q m,  m = (1, x, y, x², xy, y²)
 *
 * 1. Solver output: a floating-point Q from an interior-point SDP solver (here: a realistic
 *    stand-in that sits close to the PSD boundary, with ~1e-7 noise).
 * 2. Round every entry to a dyadic rational k/2^b.
 * 3. Project onto { Q : coefficients of mᵀQm equal those of p } exactly, by spreading each
 *    monomial's error evenly over the Gram entries that produce that monomial.
 * 4. Check Q ⪰ 0 exactly with an LDLᵀ factorisation over ℚ. Nonnegative pivots give an exact
 *    sum-of-squares decomposition, which is what a proof assistant can check.
 */
(function () {
  "use strict";
  const R = window.Research;

  // ---------- exact rationals ----------
  function gcd(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a;
  }
  function Q(n, d) {
    if (d === undefined) d = 1n;
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d) || 1n;
    return { n: n / g, d: d / g };
  }
  const add = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
  const sub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
  const mul = (a, b) => Q(a.n * b.n, a.d * b.d);
  const div = (a, b) => Q(a.n * b.d, a.d * b.n);
  const sgn = (a) => (a.n > 0n ? 1 : a.n < 0n ? -1 : 0);
  const toF = (a) => Number(a.n) / Number(a.d);
  const ZERO = Q(0n);
  function qstr(a, max) {
    let s = a.d === 1n ? a.n.toString() : a.n.toString() + "/" + a.d.toString();
    s = s.replace("-", "−");
    if (max && s.length > max) s = s.slice(0, max - 1) + "…";
    return s;
  }

  // ---------- problem data ----------
  const BASIS = [
    [0, 0],
    [1, 0],
    [0, 1],
    [2, 0],
    [1, 1],
    [0, 2],
  ];
  const LABEL = ["1", "x", "y", "x²", "xy", "y²"];
  const NB = BASIS.length;
  const P_COEF = {
    "0,0": 12, "1,0": -2, "0,1": -14, "2,0": -7, "1,1": 12, "0,2": -8,
    "3,0": 2, "2,1": 18, "1,2": -2, "0,3": 2,
    "4,0": 12, "3,1": -6, "2,2": 20, "1,3": 0, "0,4": 13,
  };
  const QF = [
    [12.000000158322509, -0.999999954839353, -7.000000002636381, -9.103365525803255, 3.3264870393914814, -10.354508608560174],
    [-0.999999954839353, 11.206731565800636, 2.6735121000210853, 0.9999998845395617, -1.250931110794505, 1.3987629308404768],
    [-7.000000002636381, 2.6735121000210853, 12.709017411638362, 10.250930366797043, -2.3987631156354245, 0.9999992710292607],
    [-9.103365525803255, 0.9999998845395617, 10.250930366797043, 12.000000492607791, -3.0000000061547643, 4.7096136645709334],
    [3.3264870393914814, -1.250931110794505, -2.3987631156354245, -3.0000000061547643, 10.580773256147266, 1.5326097835270416e-7],
    [-10.354508608560174, 1.3987629308404768, 0.9999992710292607, 4.7096136645709334, 1.5326097835270416e-7, 12.999999934092477],
  ];
  const GROUPS = {};
  for (let i = 0; i < NB; i++)
    for (let j = 0; j < NB; j++) {
      const key = BASIS[i][0] + BASIS[j][0] + "," + (BASIS[i][1] + BASIS[j][1]);
      (GROUPS[key] = GROUPS[key] || []).push([i, j]);
    }

  // ---------- pipeline ----------
  function coefErrorFloat(M) {
    let worst = 0;
    for (const key in GROUPS) {
      let s = 0;
      for (const [i, j] of GROUPS[key]) s += M[i][j];
      worst = Math.max(worst, Math.abs(s - P_COEF[key]));
    }
    return worst;
  }
  function coefErrorExact(M) {
    let worst = ZERO;
    for (const key in GROUPS) {
      let s = ZERO;
      for (const [i, j] of GROUPS[key]) s = add(s, M[i][j]);
      const e = sub(s, Q(BigInt(P_COEF[key])));
      const ae = sgn(e) < 0 ? Q(-e.n, e.d) : e;
      if (toF(ae) > toF(worst)) worst = ae;
    }
    return worst;
  }
  function roundDyadic(bits) {
    const D = 2n ** BigInt(bits);
    const Df = Math.pow(2, bits);
    const M = [];
    for (let i = 0; i < NB; i++) {
      M.push([]);
      for (let j = 0; j < NB; j++) {
        const a = i <= j ? QF[i][j] : QF[j][i];
        M[i].push(Q(BigInt(Math.round(a * Df)), D));
      }
    }
    return M;
  }
  function project(M) {
    const out = M.map((r) => r.slice());
    for (const key in GROUPS) {
      const g = GROUPS[key];
      let s = ZERO;
      for (const [i, j] of g) s = add(s, M[i][j]);
      const e = div(sub(Q(BigInt(P_COEF[key])), s), Q(BigInt(g.length)));
      if (sgn(e) === 0) continue;
      for (const [i, j] of g) out[i][j] = add(out[i][j], e);
    }
    return out;
  }
  // Exact LDLᵀ; returns pivots d, unit-lower L, and whether every pivot is >= 0.
  function ldl(M) {
    const A = M.map((r) => r.slice());
    const L = [];
    for (let i = 0; i < NB; i++) {
      L.push([]);
      for (let j = 0; j < NB; j++) L[i].push(i === j ? Q(1n) : ZERO);
    }
    const d = [];
    for (let k = 0; k < NB; k++) {
      const p = A[k][k];
      d.push(p);
      if (sgn(p) < 0) return { d: d, L: L, ok: false, failAt: k };
      if (sgn(p) === 0) {
        for (let j = k + 1; j < NB; j++) if (sgn(A[k][j]) !== 0) return { d: d, L: L, ok: false, failAt: k };
        continue;
      }
      for (let i = k + 1; i < NB; i++) {
        const f = div(A[i][k], p);
        L[i][k] = f;
        for (let j = k + 1; j < NB; j++) A[i][j] = sub(A[i][j], mul(f, A[k][j]));
      }
    }
    return { d: d, L: L, ok: true };
  }
  function eigFloat(M) {
    // Jacobi eigenvalues of a small symmetric matrix (display only)
    const n = M.length;
    const A = M.map((r) => r.map((x) => (typeof x === "number" ? x : toF(x))));
    for (let sweep = 0; sweep < 60; sweep++) {
      let off = 0;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
      if (off < 1e-22) break;
      for (let p = 0; p < n; p++)
        for (let q = p + 1; q < n; q++) {
          if (Math.abs(A[p][q]) < 1e-15) continue;
          const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
          const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
          const c = 1 / Math.sqrt(t * t + 1),
            s = t * c;
          for (let k = 0; k < n; k++) {
            const akp = A[k][p],
              akq = A[k][q];
            A[k][p] = c * akp - s * akq;
            A[k][q] = s * akp + c * akq;
          }
          for (let k = 0; k < n; k++) {
            const apk = A[p][k],
              aqk = A[q][k];
            A[p][k] = c * apk - s * aqk;
            A[q][k] = s * apk + c * aqk;
          }
        }
    }
    return A.map((r, i) => r[i]).sort((a, b) => a - b);
  }

  function runPipeline(bits) {
    const rounded = roundDyadic(bits);
    const projected = project(rounded);
    const fact = ldl(projected);
    return {
      bits: bits,
      float: { M: QF, err: coefErrorFloat(QF), eig: eigFloat(QF) },
      rounded: { M: rounded, err: coefErrorExact(rounded), eig: eigFloat(rounded) },
      projected: { M: projected, err: coefErrorExact(projected), eig: eigFloat(projected) },
      ldl: fact,
    };
  }

  // ---------- UI ----------
  function mount(root, opts) {
    opts = opts || {};
    const mini = !!opts.mini;
    const grid = root.querySelector("[data-role=matrix]");
    const detail = root.querySelector("[data-role=detail]");
    const bitsIn = root.querySelector("[data-role=bits]");
    const bitsOut = root.querySelector("[data-role=bits-out]");
    const checks = root.querySelector("[data-role=checks]");
    const eigCanvas = root.querySelector("canvas[data-role=eig]");
    const sosOut = root.querySelector("[data-role=sos]");
    const stepBtns = Array.from(root.querySelectorAll("[data-step]"));
    const verdict = root.querySelector("[data-role=verdict]");

    let bits = bitsIn ? parseInt(bitsIn.value, 10) : 10;
    let run = runPipeline(bits);
    let stage = 0; // 0 float, 1 rounded, 2 projected, 3 checked
    let col = R.colors();
    let prevM = null;
    let auto = true;

    // build grid cells
    const cells = [];
    grid.innerHTML = "";
    grid.style.setProperty("--n", NB + (mini ? 0 : 1));
    if (!mini) {
      grid.appendChild(el("div", "rs-mx-corner", ""));
      for (let j = 0; j < NB; j++) grid.appendChild(el("div", "rs-mx-head", LABEL[j]));
    }
    for (let i = 0; i < NB; i++) {
      if (!mini) grid.appendChild(el("div", "rs-mx-head", LABEL[i]));
      cells.push([]);
      for (let j = 0; j < NB; j++) {
        const c = el("button", "rs-mx-cell", "");
        c.type = "button";
        if (mini) c.tabIndex = -1;
        c.dataset.i = i;
        c.dataset.j = j;
        c.addEventListener("mouseenter", () => showDetail(i, j));
        c.addEventListener("focus", () => showDetail(i, j));
        grid.appendChild(c);
        cells[i].push(c);
      }
    }
    function el(tag, cls, text) {
      const e = document.createElement(tag);
      e.className = cls;
      e.textContent = text;
      return e;
    }

    function currentM() {
      return stage === 0 ? run.float.M : stage === 1 ? run.rounded.M : run.projected.M;
    }
    function cellColor(v) {
      const a = Math.min(1, Math.abs(v) / 13);
      const base = v >= 0 ? col.levels[1] : col.obstacle;
      return R.hexToRgba(base, 0.08 + 0.5 * a);
    }
    function showDetail(i, j) {
      if (!detail) return;
      const M = currentM();
      const v = M[i][j];
      const txt =
        typeof v === "number"
          ? v.toPrecision(17).replace("-", "−") + "  (floating point)"
          : qstr(v, 60) + (v.d === 1n ? "" : "  ≈ " + toF(v).toFixed(10).replace("-", "−"));
      detail.textContent = "Q[" + LABEL[i] + ", " + LABEL[j] + "] = " + txt;
    }

    function render() {
      const M = currentM();
      for (let i = 0; i < NB; i++)
        for (let j = 0; j < NB; j++) {
          const v = M[i][j];
          const f = typeof v === "number" ? v : toF(v);
          const c = cells[i][j];
          c.style.background = cellColor(f);
          if (!mini) c.textContent = (Math.abs(f) < 5e-7 ? 0 : f).toFixed(stage === 0 ? 4 : 3).replace("-", "−");
          let changed = false;
          if (prevM) {
            const pv = prevM[i][j];
            const pf = typeof pv === "number" ? pv : toF(pv);
            changed = Math.abs(pf - f) > 1e-12;
          }
          c.classList.toggle("rs-mx-changed", changed);
          c.classList.toggle("rs-mx-exact", stage >= 1);
        }
      stepBtns.forEach((b) => b.setAttribute("aria-pressed", String(parseInt(b.dataset.step, 10) === stage)));
      renderChecks();
      drawEig();
      renderSOS();
    }

    function stat(label, value, state) {
      return (
        '<div class="rs-check ' + { ok: "rs-check-ok", bad: "rs-check-bad", warn: "rs-check-warn" }[state] + '"><span class="rs-check-mark" aria-hidden="true">' +
        (state === "ok" ? "✓" : state === "bad" ? "✗" : "~") +
        '</span><span class="rs-check-label">' + label + '</span><span class="rs-check-value">' + value + "</span></div>"
      );
    }

    function renderChecks() {
      let html = "";
      let v = "";
      if (stage === 0) {
        html += stat("p = mᵀQm", "off by up to " + run.float.err.toExponential(1).replace("-", "−"), "bad");
        html += stat("Q ⪰ 0", "λ<sub>min</sub> ≈ " + run.float.eig[0].toFixed(4) + ", computed in floating point", "warn");
        v = "Looks right, proves nothing: the identity is off and the eigenvalue is itself a rounded number.";
      } else if (stage === 1) {
        const e = run.rounded.err;
        html += stat("p = mᵀQm", sgn(e) === 0 ? "exact" : "off by " + qstr(e, 22) + " (exact)", sgn(e) === 0 ? "ok" : "bad");
        html += stat("Q ⪰ 0", "not yet checked", "warn");
        v = "Every entry is now an exact rational k/2<sup>" + bits + "</sup>, but rounding broke the identity.";
      } else {
        html += stat("p = mᵀQm", "holds exactly (error 0)", "ok");
        if (stage === 2) {
          html += stat("Q ⪰ 0", "λ<sub>min</sub> ≈ " + run.projected.eig[0].toFixed(4) + ", not yet checked exactly", "warn");
          v = "Projection fixed the identity exactly by spreading each monomial's error over its Gram entries.";
        } else {
          const f = run.ldl;
          const piv = f.d
            .map(
              (x, k) =>
                '<span class="' + (sgn(x) < 0 ? "rs-neg" : "") + '">d<sub>' + (k + 1) + "</sub> " + (sgn(x) < 0 ? "<" : "≥") + " 0</span>"
            )
            .join(" ");
          html += stat("Q ⪰ 0 (exact LDLᵀ)", piv, f.ok ? "ok" : "bad");
          v = f.ok
            ? "Certified: p(x, y) ≥ 0 for all x, y. Every number above is exact."
            : "Rejected: pivot d<sub>" + (f.failAt + 1) + "</sub> is negative. Rounding at 2<sup>−" + bits + "</sup> moved Q off the PSD cone. Add bits.";
          if (verdict) {
            verdict.className = "rs-verdict " + (f.ok ? "rs-verdict-ok" : "rs-verdict-bad");
            verdict.textContent = f.ok ? "Certified" : "Rejected";
          }
        }
      }
      if (verdict && stage < 3) {
        verdict.className = "rs-verdict rs-verdict-pending";
        verdict.textContent = stage === 0 ? "Floating point" : "In repair";
      }
      if (checks) checks.innerHTML = html + '<p class="rs-check-note">' + v + "</p>";
    }

    let eigCv = null;
    function drawEig() {
      if (!eigCanvas) return;
      if (!eigCv) eigCv = R.setupCanvas(eigCanvas, 0.36, drawEig);
      const ctx = eigCv.ctx,
        w = eigCv.w,
        h = eigCv.h;
      ctx.clearRect(0, 0, w, h);
      const ev = (stage === 0 ? run.float : stage === 1 ? run.rounded : run.projected).eig;
      // log-ish scale so the smallest eigenvalue is visible next to the largest
      const f = (x) => Math.sign(x) * Math.log10(1 + Math.abs(x) * 100);
      const top = f(40),
        l = 30,
        base = h - 22,
        bw = (w - l - 10) / ev.length;
      const yOf = (x) => base - (f(x) / top) * (base - 8);
      ctx.strokeStyle = col.frame;
      ctx.beginPath();
      ctx.moveTo(l, base);
      ctx.lineTo(w - 6, base);
      ctx.stroke();
      ctx.fillStyle = col.textLight;
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("0", l - 6, base + 4);
      ctx.textAlign = "center";
      ev.forEach((x, k) => {
        const y = yOf(x);
        ctx.fillStyle = x < 0 ? col.obstacle : R.levelColor(k === 0 ? 4 : 1, 6, col);
        ctx.fillRect(l + k * bw + bw * 0.2, Math.min(y, base), bw * 0.6, Math.abs(base - y) || 1);
        ctx.fillStyle = col.textLight;
        ctx.fillText(x < 1 ? x.toFixed(3).replace("-", "−") : x.toFixed(1), l + k * bw + bw / 2, base + 15);
      });
    }

    function renderSOS() {
      if (!sosOut) return;
      if (stage < 3 || !run.ldl.ok) {
        sosOut.innerHTML =
          stage < 3
            ? '<span class="rs-muted">The exact decomposition appears here once the matrix passes the exact check.</span>'
            : '<span class="rs-muted">No certificate at this precision.</span>';
        return;
      }
      const f = run.ldl;
      const terms = [];
      for (let k = 0; k < NB; k++) {
        if (sgn(f.d[k]) === 0) continue;
        const parts = [LABEL[k] === "1" ? "1" : LABEL[k]];
        for (let i = k + 1; i < NB; i++) {
          const c = f.L[i][k];
          if (sgn(c) === 0) continue;
          parts.push((sgn(c) < 0 ? "− " : "+ ") + "(" + qstr(Q(c.n < 0n ? -c.n : c.n, c.d), 16) + ")·" + LABEL[i]);
        }
        terms.push("(" + qstr(f.d[k], 16) + ") · (" + parts.join(" ") + ")²");
      }
      sosOut.textContent =
        "-- p written as a weighted sum of squares, every coefficient exact\n" +
        "theorem p_nonneg (x y : ℝ) : 0 ≤ p x y := by\n" +
        "  have h : p x y =\n      " +
        terms.join("\n    + ") +
        " := by\n    unfold p; ring\n" +
        "  rw [h]; positivity";
    }

    function setStage(s) {
      prevM = currentM();
      stage = s;
      render();
    }

    if (bitsIn)
      bitsIn.addEventListener("input", () => {
        bits = parseInt(bitsIn.value, 10);
        if (bitsOut) bitsOut.textContent = String(bits);
        run = runPipeline(bits);
        prevM = null;
        auto = false;
        render();
      });
    stepBtns.forEach((b) =>
      b.addEventListener("click", () => {
        auto = false;
        setStage(parseInt(b.dataset.step, 10));
      })
    );

    R.onThemeChange(() => {
      col = R.colors();
      render();
    });

    // walk through the stages once when the demo scrolls into view (and keep cycling in mini)
    let timer = 0;
    const anchor = grid;
    R.loop(anchor, (dt) => {
      if (!auto) return;
      timer += dt;
      const wait = R.reducedMotion() ? 0.2 : stage === 3 ? 3.2 : 1.7;
      if (timer > wait) {
        timer = 0;
        if (stage < 3) setStage(stage + 1);
        else if (mini) {
          bits = bits === 10 ? 3 : 10;
          run = runPipeline(bits);
          prevM = null;
          setStage(0);
        } else auto = false;
      }
    });

    render();
  }

  R.exactCertificates = mount;
  R.exactCertificates.pipeline = runPipeline;
})();
