---
layout: page
title: Successive barriers
description: Stacking barrier certificates, level by level, to certify far more of the state space.
img: assets/img/research/thumb-successive-barriers.png
importance: 1
category: work
related_publications: true
---

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">

<a class="rs-back" href="{{ '/research/' | relative_url }}">Back to research</a>

<p class="rs-lead">A single barrier certificate found by SOS programming is usually far too conservative. Successive barriers keep adding certificates, each of which only has to hold outside the region already certified, so the certified safe set grows level by level.</p>

<div class="rs-links">
<a href="https://doi.org/10.1145/3716863.3718043">Paper (HSCC 2025)</a>
<a href="{{ '/assets/pdf/Successive_Barrier_Functions-6.pdf' | relative_url }}">PDF</a>
<a href="{{ '/assets/pdf/talk_succ_barr_HSCC25.pdf' | relative_url }}">Slides</a>
<a href="https://github.com/rameezw/SuccessiveBarriers">Code</a>
</div>

<div class="rs-demo" id="sb-demo">
<canvas role="img" aria-label="Map of the states certified by each level of the hierarchy for a car around an obstacle. Click to drop a car."></canvas>
<div class="rs-legend">
<span><i class="rs-sw" style="--sw: var(--rs-l0)"></i>level 0</span>
<span><i class="rs-sw" style="--sw: var(--rs-l1)"></i>level 1</span>
<span><i class="rs-sw" style="--sw: var(--rs-l2)"></i>level 2</span>
<span><i class="rs-sw" style="--sw: var(--rs-l3)"></i>level 3</span>
<span><i class="rs-sw" style="--sw: var(--rs-l4)"></i>level 4</span>
<span><i class="rs-sw rs-sw-hatch"></i>not certified</span>
<span><i class="rs-sw rs-sw-obstacle"></i>obstacle</span>
</div>
<div class="rs-controls">
<label>Heading <input type="range" min="-180" max="180" step="5" value="90" data-role="heading" aria-label="Heading of the slice in degrees"> <span class="rs-num" data-role="heading-out">90°</span></label>
<label><input type="checkbox" checked data-role="follow"> Map follows the car's heading</label>
<button type="button" class="rs-btn" data-role="replay">Rebuild the levels</button>
</div>
<div class="rs-readout" data-role="readout" aria-live="polite"></div>
<p class="rs-caption">A car with constant speed and three turn rates (left, straight, right) must stay inside the fence and out of the red disc. The map is a slice of its three-dimensional state space at the heading shown in the top-left badge. Click anywhere to drop a car: it holds its level's turn rate until it enters an earlier level, hands over, and finally settles on a turning circle that is safe forever. The regions are computed in your browser on a grid of positions and headings; in the paper, each level is a polynomial certificate found by SOS programming.</p>
</div>

<div class="rs-prose" markdown="1">

## The idea

Take a system $$\dot x = f(x, u)$$ with an unsafe set $$X_u$$. Fix one input $$u_j$$ from a finite set and look for a polynomial $$B_j$$ that is positive on $$X_u$$ and satisfies

$$
\nabla B_j(x) \cdot f(x, u_j) \;\le\; -\lambda\, B_j(x).
$$

Holding $$u_j$$ then keeps the state inside $$\{B_j \le 0\}$$. Fixing the input keeps the search a tractable SOS program, but the certified region is small. Taking the minimum over several such barriers, $$B^{(0)} = \min_j B_j$$, already certifies more.

A **successive barrier** relaxes the decrease condition: it only has to hold where the previous level does not certify the state,

$$
B^{(k-1)}(x) \ge 0 \;\Longrightarrow\; \nabla B^{(k)}_j(x) \cdot f(x, u_j) \;\le\; -\lambda\, B^{(k)}_j(x).
$$

Inside the earlier region, the earlier level takes over. Each new level is again an SOS program, and the union of all levels is a controlled invariant set that can be far larger than any single certificate.

At run time, a monitor passes the nominal controller while the active certificate is comfortably negative and overrides it with that certificate's input when the state approaches the boundary. A bound on how fast the certificate can rise gives a minimum dwell time, so the monitor can run at a fixed sampling rate {% cite DBLP:conf/hybrid/Wajid025 %}.

## In the paper

The running example is a three-dimensional car model near an obstacle. Each image is a slice of the certified region at one heading; drag the slider to turn the car.

</div>

<figure class="rs-figure" id="sb-scrub">
<div class="rs-plate rs-scrub">
<img src="{{ '/assets/img/research/sb-slice-0.png' | relative_url }}" alt="Certified regions at heading −180 degrees" loading="lazy">
<img src="{{ '/assets/img/research/sb-slice-1.png' | relative_url }}" alt="Certified regions at heading −90 degrees" loading="lazy">
<img src="{{ '/assets/img/research/sb-slice-2.png' | relative_url }}" alt="Certified regions at heading 0 degrees" loading="lazy">
<img src="{{ '/assets/img/research/sb-slice-3.png' | relative_url }}" alt="Certified regions at heading 90 degrees" loading="lazy" class="rs-on">
<img src="{{ '/assets/img/research/sb-slice-4.png' | relative_url }}" alt="Certified regions at heading 180 degrees" loading="lazy">
</div>
<div class="rs-controls">
<label>Heading <input type="range" min="0" max="4" step="1" value="3" aria-label="Heading of the paper's slice"> <span class="rs-num">90°</span></label>
</div>
<figcaption>Shaded: states certified by successive levels. White: not certified. The obstacle sits at the origin.</figcaption>
</figure>

<div class="rs-prose" markdown="1">

The benchmarks go up to six states. On the 4-D polynomial system, the 5-D coordinated-turn model and the 6-D planar multirotor, the neural-certificate tool FOSSIL did not find a certificate, while successive barriers did.

</div>

<div class="rs-gallery">
<figure><div class="rs-plate"><img src="{{ '/assets/img/research/sb-2d-example.png' | relative_url }}" alt="Certified regions for a 2-D nonlinear example" loading="lazy"></div><figcaption>A 2-D nonlinear system with two inputs.</figcaption></figure>
<figure><div class="rs-plate"><img src="{{ '/assets/img/research/sb-coordturn.png' | relative_url }}" alt="Certified regions for the coordinated-turn model" loading="lazy"></div><figcaption>Coordinated-turn aircraft model (5 states), one slice.</figcaption></figure>
<figure><div class="rs-plate"><img src="{{ '/assets/img/research/sb-vanderpol.png' | relative_url }}" alt="Certified regions for the Van der Pol oscillator" loading="lazy"></div><figcaption>Controlled Van der Pol oscillator.</figcaption></figure>
<figure><div class="rs-plate"><img src="{{ '/assets/img/research/sb-pendulum.png' | relative_url }}" alt="Certified regions for the inverted pendulum" loading="lazy"></div><figcaption>Inverted pendulum.</figcaption></figure>
</div>

<script defer src="{{ '/assets/js/research/common.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/research/successive-barriers.js' | relative_url }}"></script>
<script>
  document.addEventListener("DOMContentLoaded", function () {
    window.Research.successiveBarriers(document.getElementById("sb-demo"));
    var fig = document.getElementById("sb-scrub");
    var imgs = fig.querySelectorAll("img");
    var input = fig.querySelector("input");
    var out = fig.querySelector(".rs-num");
    var deg = ["−180°", "−90°", "0°", "90°", "180°"];
    input.addEventListener("input", function () {
      imgs.forEach(function (im, i) {
        im.classList.toggle("rs-on", i === +input.value);
      });
      out.textContent = deg[+input.value];
    });
  });
</script>
