---
layout: page
title: Successive CLFs
description: Chaining control Lyapunov functions to reach a goal through clutter.
img: assets/img/research/thumb-successive-clfs.png
importance: 3
category: work
related_publications: true
---

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">

<a class="rs-back" href="{{ '/research/' | relative_url }}">Back to research</a>

<p class="rs-lead">Driving a system to a goal through clutter rarely admits a single polynomial control Lyapunov function. Successive CLFs split the job: each certificate only has to bring the system into the region of a lower level, and the last one brings it home.</p>

<div class="rs-demo" id="sclf-demo">
<canvas class="rs-main rs-clickable" role="img" aria-label="A room with a wall, covered by a chain of overlapping elliptical regions leading to a goal. Click to launch a robot."></canvas>
<div class="rs-legend">
<span><i class="rs-sw rs-sw-ramp"></i>level 0 (goal) to level 10</span>
<span><i class="rs-sw rs-sw-hatch"></i>not certified</span>
<span><i class="rs-sw" style="--sw: var(--rs-obstacle)"></i>wall</span>
</div>
<div class="rs-controls">
<button type="button" class="rs-btn" data-role="swarm">Release 36 robots</button>
<label><input type="checkbox" checked data-role="rings"> Show level sets</label>
</div>
<div class="rs-readout" data-role="readout" aria-live="off"></div>
<canvas class="rs-chart" role="img" aria-label="The active Lyapunov function of the selected robot over time."></canvas>
<p class="rs-caption">A toy model, built so the mechanism is visible: a point robot with bounded speed in a room with one wall, and quadratic CLFs whose regions are the ellipses. Each region avoids the wall and contains the centre of the next-lower one. Click a free spot to launch a robot. The chart plots its active Lyapunov function, which decreases inside each level and restarts lower at every hand-over. In the method itself, the CLFs are polynomials for nonlinear systems, synthesized with SOS programming.</p>
</div>

<div class="rs-prose" markdown="1">

## The idea

A control Lyapunov function $$V$$ certifies that a system $$\dot x = f(x, u)$$ can be driven to a goal: $$V$$ is positive away from the goal, and wherever it applies there is an input with

$$
\nabla V(x) \cdot f(x, u) \;\le\; -\alpha\, V(x).
$$

On a cluttered domain, the region where one polynomial $$V$$ can meet this condition while steering clear of obstacles is small.

Successive CLFs use a sequence $$V_0, V_1, \dots, V_N$$ with regions $$\mathcal{D}_k = \{x : V_k(x) \le 1\}$$. The base certificate $$V_0$$ is an ordinary CLF around the goal. For $$k \ge 1$$, $$V_k$$ only needs to decrease on $$\mathcal{D}_k$$ outside the lower regions, and its closed-loop trajectories must enter $$\mathcal{D}_0 \cup \dots \cup \mathcal{D}_{k-1}$$ without becoming unsafe. Every level is a separate SOS program, so the hierarchy grows outward from the goal one certificate at a time.

At run time, the controller selects the lowest level whose region contains the current state and follows that level's CLF until a lower level takes over. Levels only go down, so each level is used at most once and there are at most $$N$$ switches; per-level transit times add up to a bound on the time to reach the goal {% cite wajid2026successive %}.

## What to look for in the demo

- A robot starting at the far end of the room passes through every level in order; its trail changes colour at each hand-over.
- In the chart, each tooth of the sawtooth is one level's $$V_k$$ running down. It never rises within a level.
- The hatched corners are states no level certifies. Adding levels, or richer polynomial certificates, shrinks them.

</div>

<script defer src="{{ '/assets/js/research/common.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/research/successive-clfs.js' | relative_url }}"></script>
<script>
  document.addEventListener("DOMContentLoaded", function () {
    window.Research.successiveCLFs(document.getElementById("sclf-demo"));
  });
</script>
