---
layout: page
title: research
permalink: /research/
description: Certificates that prove autonomous systems safe, and proofs a computer can check.
nav: true
nav_order: 1.5
---

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">

<div class="rs-hub">

<p class="rs-lead">I build certificates that prove a controlled system stays safe or reaches its goal, and I make those proofs checkable by a computer.</p>

<div class="rs-prose">
<p>A barrier function certifies safety; a control Lyapunov function certifies that a goal can be reached. Sum-of-squares (SOS) programming finds such certificates automatically as polynomials, but a single polynomial rarely covers all the states you care about. My work chains certificates into hierarchies that hand a system from one to the next, reuses one certificate for obstacles that move, and turns the solver's floating-point output into exact proofs that Lean&nbsp;4 can check.</p>
</div>

<figure class="rs-pipeline">
<svg class="rs-pipe-wide" viewBox="0 0 900 252" role="img" aria-labelledby="rs-pipe-title">
<title id="rs-pipe-title">Three synthesis methods produce SOS certificates in floating point; exact repair turns them into rational certificates that Lean 4 checks.</title>
<defs>
<path id="rs-p1" d="M200 37 C 250 37, 245 126, 290 126"/>
<path id="rs-p2" d="M200 126 L 290 126"/>
<path id="rs-p3" d="M200 215 C 250 215, 245 126, 290 126"/>
<path id="rs-p4" d="M460 126 L 540 126"/>
<path id="rs-p5" d="M690 126 L 760 126"/>
</defs>
<use href="#rs-p1" class="rs-edge"/><use href="#rs-p2" class="rs-edge"/><use href="#rs-p3" class="rs-edge"/><use href="#rs-p4" class="rs-edge"/><use href="#rs-p5" class="rs-edge"/>
<text class="rs-stage-label" x="500" y="150" text-anchor="middle">floating point</text>
<text class="rs-stage-label" x="725" y="150" text-anchor="middle">exact ℚ</text>
<a class="rs-node" href="{{ '/projects/successive-barriers/' | relative_url }}"><rect x="0" y="11" width="200" height="52" rx="6"/><text x="16" y="33">Successive barriers</text><text class="rs-sub" x="16" y="51">stay safe</text></a>
<a class="rs-node" href="{{ '/projects/repulsive-barriers/' | relative_url }}"><rect x="0" y="100" width="200" height="52" rx="6"/><text x="16" y="122">Repulsive barriers</text><text class="rs-sub" x="16" y="140">avoid moving obstacles</text></a>
<a class="rs-node" href="{{ '/projects/successive-clfs/' | relative_url }}"><rect x="0" y="189" width="200" height="52" rx="6"/><text x="16" y="211">Successive CLFs</text><text class="rs-sub" x="16" y="229">reach the goal</text></a>
<g class="rs-node"><rect x="290" y="100" width="170" height="52" rx="6"/><text x="306" y="122">SOS programs</text><text class="rs-sub" x="306" y="140">solved numerically</text></g>
<a class="rs-node" href="{{ '/projects/exact-certificates/' | relative_url }}"><rect x="540" y="100" width="150" height="52" rx="6"/><text x="556" y="122">Exact repair</text><text class="rs-sub" x="556" y="140">rational arithmetic</text></a>
<g class="rs-node rs-final"><rect x="760" y="100" width="140" height="52" rx="6"/><text x="776" y="122">Lean 4</text><text class="rs-sub" x="776" y="140">machine-checked</text></g>
<g class="rs-motion">
<circle r="4.5" class="rs-float"><animateMotion dur="2.4s" repeatCount="indefinite" begin="0s"><mpath href="#rs-p1"/></animateMotion></circle>
<circle r="4.5" class="rs-float"><animateMotion dur="2.4s" repeatCount="indefinite" begin="0.8s"><mpath href="#rs-p2"/></animateMotion></circle>
<circle r="4.5" class="rs-float"><animateMotion dur="2.4s" repeatCount="indefinite" begin="1.6s"><mpath href="#rs-p3"/></animateMotion></circle>
<circle r="4.5" class="rs-float"><animateMotion dur="1.2s" repeatCount="indefinite" begin="0.3s"><mpath href="#rs-p4"/></animateMotion></circle>
<circle r="4.5" class="rs-float"><animateMotion dur="1.2s" repeatCount="indefinite" begin="0.9s"><mpath href="#rs-p4"/></animateMotion></circle>
<circle r="4.5" class="rs-exact"><animateMotion dur="1.2s" repeatCount="indefinite" begin="0.6s"><mpath href="#rs-p5"/></animateMotion></circle>
</g>
</svg>
<svg class="rs-pipe-tall" viewBox="0 0 360 470" role="img" aria-labelledby="rs-pipe-title-2">
<title id="rs-pipe-title-2">Three synthesis methods produce SOS certificates in floating point; exact repair turns them into rational certificates that Lean 4 checks.</title>
<defs>
<path id="rs-q1" d="M55 64 C 55 110, 180 100, 180 140"/>
<path id="rs-q2" d="M180 64 L 180 140"/>
<path id="rs-q3" d="M305 64 C 305 110, 180 100, 180 140"/>
<path id="rs-q4" d="M180 192 L 180 262"/>
<path id="rs-q5" d="M180 314 L 180 384"/>
</defs>
<use href="#rs-q1" class="rs-edge"/><use href="#rs-q2" class="rs-edge"/><use href="#rs-q3" class="rs-edge"/><use href="#rs-q4" class="rs-edge"/><use href="#rs-q5" class="rs-edge"/>
<text class="rs-stage-label" x="192" y="232">floating point</text>
<text class="rs-stage-label" x="192" y="354">exact ℚ</text>
<a class="rs-node" href="{{ '/projects/successive-barriers/' | relative_url }}"><rect x="2" y="8" width="106" height="56" rx="6"/><text x="12" y="30">Successive</text><text x="12" y="48">barriers</text></a>
<a class="rs-node" href="{{ '/projects/repulsive-barriers/' | relative_url }}"><rect x="127" y="8" width="106" height="56" rx="6"/><text x="137" y="30">Repulsive</text><text x="137" y="48">barriers</text></a>
<a class="rs-node" href="{{ '/projects/successive-clfs/' | relative_url }}"><rect x="252" y="8" width="106" height="56" rx="6"/><text x="262" y="30">Successive</text><text x="262" y="48">CLFs</text></a>
<g class="rs-node"><rect x="95" y="140" width="170" height="52" rx="6"/><text x="111" y="162">SOS programs</text><text class="rs-sub" x="111" y="180">solved numerically</text></g>
<a class="rs-node" href="{{ '/projects/exact-certificates/' | relative_url }}"><rect x="95" y="262" width="170" height="52" rx="6"/><text x="111" y="284">Exact repair</text><text class="rs-sub" x="111" y="302">rational arithmetic</text></a>
<g class="rs-node rs-final"><rect x="95" y="384" width="170" height="52" rx="6"/><text x="111" y="406">Lean 4</text><text class="rs-sub" x="111" y="424">machine-checked</text></g>
<g class="rs-motion">
<circle r="4.5" class="rs-float"><animateMotion dur="2.2s" repeatCount="indefinite" begin="0s"><mpath href="#rs-q1"/></animateMotion></circle>
<circle r="4.5" class="rs-float"><animateMotion dur="2.2s" repeatCount="indefinite" begin="0.7s"><mpath href="#rs-q2"/></animateMotion></circle>
<circle r="4.5" class="rs-float"><animateMotion dur="2.2s" repeatCount="indefinite" begin="1.4s"><mpath href="#rs-q3"/></animateMotion></circle>
<circle r="4.5" class="rs-float"><animateMotion dur="1.3s" repeatCount="indefinite" begin="0.3s"><mpath href="#rs-q4"/></animateMotion></circle>
<circle r="4.5" class="rs-exact"><animateMotion dur="1.3s" repeatCount="indefinite" begin="0.8s"><mpath href="#rs-q5"/></animateMotion></circle>
</g>
</svg>
<figcaption class="rs-caption">How the projects fit together. Each synthesis method produces SOS certificates in floating point (hollow dots); exact repair turns them into rational certificates (solid dots) that a proof assistant verifies. Select a box to open that project.</figcaption>
</figure>

<section class="rs-entry">
<div class="rs-entry-visual rs-mini" data-demo="successiveBarriers"><canvas role="img" aria-label="A car hands over between successive barrier levels until it settles on a safe circle around an obstacle."></canvas></div>
<div>
<h3><a href="{{ '/projects/successive-barriers/' | relative_url }}">Successive barriers</a></h3>
<div class="rs-venue">HSCC 2025, with Sriram Sankaranarayanan</div>
<p>A polynomial barrier found by SOS certifies only a small safe region. Successive barriers add certificates level by level, and each new one only has to hold outside the region already certified. The union is a controlled invariant set far larger than any single certificate, and every level is still a tractable SOS program.</p>
<a class="rs-more" href="{{ '/projects/successive-barriers/' | relative_url }}">Build the hierarchy yourself</a>
</div>
</section>

<section class="rs-entry rs-entry-flip">
<div class="rs-entry-visual rs-mini" data-demo="repulsiveBarriers"><canvas role="img" aria-label="A car following a loop swerves around an obstacle that moves across its path."></canvas></div>
<div>
<h3><a href="{{ '/projects/repulsive-barriers/' | relative_url }}">Repulsive barriers</a></h3>
<div class="rs-venue">CDC 2026 (to appear), with Georgios Fainekos, Bardh Hoxha, Hideki Okamoto and Sriram Sankaranarayanan</div>
<p>Moving obstacles usually force certificates that depend on time. Car-like dynamics don't change when you shift them in space, so we synthesize barriers once around an obstacle at the origin and re-anchor them to the obstacle's sampled position at run time, with a margin for how far it can move between samples.</p>
<a class="rs-more" href="{{ '/projects/repulsive-barriers/' | relative_url }}">Drag the obstacle into the car's path</a>
</div>
</section>

<section class="rs-entry">
<div class="rs-entry-visual rs-mini" data-demo="successiveCLFs"><canvas role="img" aria-label="Robots flow along a chain of overlapping regions around a wall to reach a goal."></canvas></div>
<div>
<h3><a href="{{ '/projects/successive-clfs/' | relative_url }}">Successive control Lyapunov functions</a></h3>
<div class="rs-venue">Part of my dissertation</div>
<p>Reaching a goal through clutter rarely admits one polynomial control Lyapunov function. Successive CLFs chain local certificates: each one only has to bring the system into the region of a lower level, and the last one brings it home, with at most one switch per level.</p>
<a class="rs-more" href="{{ '/projects/successive-clfs/' | relative_url }}">Watch the hand-offs</a>
</div>
</section>

<section class="rs-entry rs-entry-flip">
<div class="rs-entry-visual rs-mini" data-demo="exactCertificates">
<div class="rs-mini-repair">
<div class="rs-mx rs-mini-mx" data-role="matrix" aria-hidden="true"></div>
<div><span class="rs-verdict rs-verdict-pending" data-role="verdict">Floating point</span></div>
</div>
</div>
<div>
<h3><a href="{{ '/projects/exact-certificates/' | relative_url }}">Exact SOS certificates</a></h3>
<div class="rs-venue">Part of my dissertation, with Sriram Sankaranarayanan</div>
<p>SOS solvers return certificates that are almost right: the polynomial identity is off by tiny residues and the matrices are only numerically positive semidefinite. We round to rationals, repair the residue exactly, and confirm positive semidefiniteness in exact arithmetic, producing certificates that Lean&nbsp;4 can check.</p>
<a class="rs-more" href="{{ '/projects/exact-certificates/' | relative_url }}">Run the repair on a real Gram matrix</a>
</div>
</section>

</div>

<script defer src="{{ '/assets/js/research/common.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/research/successive-barriers.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/research/repulsive-barriers.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/research/successive-clfs.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/research/exact-certificates.js' | relative_url }}"></script>
<script>
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".rs-mini[data-demo]").forEach(function (el) {
      var mount = window.Research && window.Research[el.dataset.demo];
      if (mount) mount(el, { mini: true });
    });
  });
</script>
