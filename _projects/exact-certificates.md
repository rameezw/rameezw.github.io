---
layout: page
title: Exact SOS certificates
description: Repairing floating-point SOS solutions into exact certificates a proof assistant can check.
img: assets/img/research/thumb-exact-certificates.png
importance: 4
category: work
related_publications: true
---

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">

<a class="rs-back" href="{{ '/research/' | relative_url }}">Back to research</a>

<p class="rs-lead">SOS solvers work in floating point, so the certificates they return are almost right: the polynomial identity is off by tiny residues, and the Gram matrices are only numerically positive semidefinite. This project turns those near-misses into exact rational certificates that a proof assistant can check.</p>

<div class="rs-links">
<a href="{{ '/assets/pdf/poster_proof_repair.pdf' | relative_url }}">Poster</a>
<a href="{{ '/assets/pdf/Verification_for_reals__slides_.pdf' | relative_url }}">Seminar talk</a>
<a href="https://www.proquest.com/docview/3376855082">Dissertation</a>
</div>

<div class="rs-demo" id="ec-demo">
<div class="rs-repair">
<div>
<div class="rs-steps" role="group" aria-label="Pipeline step">
<button type="button" class="rs-btn" data-step="0">1. Solver output</button>
<button type="button" class="rs-btn" data-step="1">2. Round</button>
<button type="button" class="rs-btn" data-step="2">3. Repair</button>
<button type="button" class="rs-btn" data-step="3">4. Check exactly</button>
</div>
<div class="rs-mx" data-role="matrix" aria-label="Gram matrix Q, rows and columns indexed by the monomials 1, x, y, x squared, xy, y squared"></div>
<div class="rs-detail" data-role="detail" aria-live="polite">Hover or focus a cell to see its exact value.</div>
<div class="rs-controls">
<label>Rounding precision <input type="range" min="1" max="20" step="1" value="10" data-role="bits" aria-label="Rounding precision in bits"> <span class="rs-nowrap">2<sup>−<span data-role="bits-out">10</span></sup></span></label>
</div>
</div>
<div>
<span class="rs-verdict rs-verdict-pending" data-role="verdict">Floating point</span>
<div data-role="checks" aria-live="polite"></div>
<div class="rs-eig-title">Eigenvalues of Q (log scale, for orientation only)</div>
<canvas data-role="eig" role="img" aria-label="Bar chart of the eigenvalues of the current Gram matrix"></canvas>
</div>
</div>
<pre class="rs-sos" data-role="sos" aria-label="Sketch of the statement handed to Lean 4"></pre>
<p class="rs-caption">Exact arithmetic, live in your browser. The polynomial is written as \(p = m^\top Q\, m\) with \(m = (1, x, y, x^2, xy, y^2)\):</p>
<div class="rs-poly">\[\begin{aligned} p(x,y) = {} & 12 - 2x - 14y - 7x^2 + 12xy - 8y^2 \\ & + 2x^3 + 18x^2y - 2xy^2 + 2y^3 \\ & + 12x^4 - 6x^3y + 20x^2y^2 + 13y^4 \end{aligned}\]</div>
<p class="rs-caption">The starting matrix stands in for an interior-point solver's answer: close to the boundary of the PSD cone, with errors around \(10^{-7}\). Step through the pipeline or change the rounding precision. This demo uses the simplest repair (spread each coefficient's residue evenly over its Gram entries, then test with an exact LDLᵀ factorization), which can fail when rounding is coarse; try 1 or 3 bits. The repair in my dissertation instead solves for a diagonally dominant correction as a linear program over the rationals, so positive semidefiniteness holds by construction. The Lean block is a sketch, with long fractions shortened.</p>
</div>

<div class="rs-prose" markdown="1">

## Where the certificates come from

A barrier certificate for a polynomial system is a set of polynomial identities. Schematically, over a semialgebraic domain described by polynomials $$p_i, q_i, r_i$$,

$$
B \equiv \textstyle\sum_i \alpha_i\, p_i + \alpha_0, \qquad
-B \equiv \textstyle\sum_i \beta_i\, q_i + \beta_0, \qquad
-\nabla B \cdot f + \lambda B \equiv \textstyle\sum_i \sigma_i\, r_i + \sigma_0,
$$

where every multiplier $$\alpha, \beta, \sigma$$ is a sum of squares: $$m(x)^\top Q\, m(x)$$ for some positive semidefinite Gram matrix $$Q$$. If the identities hold exactly and every $$Q$$ is PSD, the barrier conditions follow (a Positivstellensatz argument). The successive and repulsive certificates on the other project pages are all of this form.

## What goes wrong

A solver that reports success can still hand back something that is not a proof:

- **Identity drift.** Rounding the solution leaves a small nonzero residue $$r(x) = p(x) - m(x)^\top Q\, m(x)$$. This is the most common failure.
- **Borderline definiteness.** The smallest eigenvalue of $$Q$$ is near zero, or slightly negative, and the margin is below the solver's tolerance.
- **No rational solution nearby.** $$Q$$ may be PSD but irrational, so any rational rounding breaks the identity.
- **Tight margins.** Nearly active constraints give nearly singular Gram matrices, and rounding amplifies the drift.

## The repair

1. Solve the SOS program in double precision to get $$Q_{\mathrm{fp}}$$.
2. Round to rationals and compute the residue $$r(x)$$ exactly; it becomes the target of the repair.
3. Absorb the residue with a slack whose Gram matrix is constrained to be diagonally dominant, which is a linear program in the matrix entries.
4. Re-solve that linear program in exact rational arithmetic (CDDLib, from Julia). The result $$Q_{\mathbb{Q}}$$ satisfies $$m^\top Q_{\mathbb{Q}}\, m = p$$ exactly, and diagonal dominance implies $$Q_{\mathbb{Q}} \succeq 0$$ with no eigenvalue computation at all.
5. Factor $$Q_{\mathbb{Q}} = L D L^\top$$ to write $$p$$ as an explicit sum of squares with rational coefficients, and export it.

The exported certificate is checked in Lean 4: the polynomial identities close by normalizing both sides, the coefficient signs by exact arithmetic, and the Positivstellensatz entailment from those facts. What used to rest on a solver's tolerance becomes a machine-checked proof {% cite wajid2026successive %}.

</div>

<script defer src="{{ '/assets/js/research/common.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/research/exact-certificates.js' | relative_url }}"></script>
<script>
  document.addEventListener("DOMContentLoaded", function () {
    window.Research.exactCertificates(document.getElementById("ec-demo"));
  });
</script>
