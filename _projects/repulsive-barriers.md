---
layout: page
title: Repulsive barriers
description: One certificate, synthesized in the obstacle's frame, reused wherever the obstacle goes.
img: assets/img/research/thumb-repulsive-barriers.jpg
importance: 2
category: work
related_publications: true
---

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">

<a class="rs-back" href="{{ '/research/' | relative_url }}">Back to research</a>

<p class="rs-lead">Moving obstacles normally force a certificate that depends on time or on the obstacle's state. For vehicles whose dynamics don't change when you shift them in space, one certificate synthesized around an obstacle at the origin works for an obstacle anywhere: re-express the vehicle relative to where the obstacle is.</p>

<div class="rs-links">
<a href="https://github.com/rameezw/RepulsiveBarriers">Code</a>
</div>

<div class="rs-demo" id="rb-demo">
<canvas role="img" aria-label="Left: a car follows a loop while an obstacle moves across it. Right: the same scene in the obstacle's frame, where the certificate stays fixed."></canvas>
<div class="rs-legend">
<span><i class="rs-sw" style="--sw: var(--global-theme-color)"></i>nominal controller</span>
<span><i class="rs-sw" style="--sw: var(--rs-obstacle)"></i>supervisor override</span>
<span><i class="rs-sw rs-sw-obstacle"></i>obstacle</span>
<span>× sampled obstacle centre</span>
</div>
<div class="rs-controls">
<label><input type="checkbox" checked data-role="filter"> Safety supervisor on</label>
<button type="button" class="rs-btn" data-role="reset">Restart</button>
</div>
<div class="rs-readout" data-role="readout" aria-live="off"></div>
<p class="rs-caption">A car with constant speed and bounded turn rate tracks the dashed loop while an obstacle wanders across it; drag the obstacle to push it into the car's way. Four times a second the supervisor samples the obstacle's centre (×) and re-reads the certificate in obstacle-relative coordinates, shown in the second panel. The shaded region marks relative positions from which no held turn rate keeps clearance for the next 1.2&nbsp;s against an obstacle moving up to 0.6 units per second. It has the same shape in both panels, only translated. Switch the supervisor off to see what happens without it. This browser version uses a simulation-based certificate; the paper uses SOS polynomial barriers.</p>
</div>

<div class="rs-prose" markdown="1">

## The idea

Split the state into a position $$p \in \mathbb{R}^2$$ and everything else, $$\xi$$ (heading, speed, angular rate, …). For car-like and aircraft-like models, the dynamics don't depend on where the vehicle is:

$$
\dot p = g(\xi, u), \qquad \dot \xi = h(\xi, u).
$$

They are unchanged by translations $$p \mapsto p - c$$. So if $$B(p, \xi)$$ is a barrier certificate for an obstacle centred at the origin, then $$B(p - c, \xi)$$ is a barrier certificate for the same obstacle centred at $$c$$. Nothing has to be re-synthesized when the obstacle moves.

To handle motion, the supervisor samples the obstacle's centre $$\hat c$$ every $$\tau$$ seconds and recentres. Between samples the true centre drifts by at most the obstacle's speed times $$\tau$$; that error enters the synthesis as a bounded disturbance, so the certificate stays valid until the next sample. As with [successive barriers]({{ '/projects/successive-barriers/' | relative_url }}), the method synthesizes a family of barriers, each paired with a fixed input, and the supervisor passes the nominal controller until the active certificate enters a band near its boundary, then overrides with that certificate's input {% cite wajid2026repulsive %}.

## Experiments

Three systems from the paper, each with a moving obstacle crossing a reference path. The right-hand plots show the certificate value and the applied control; red marks supervisor overrides.

</div>

<figure class="rs-figure">
<video class="rs-video" src="{{ '/assets/video/research/rb-dubins.mp4' | relative_url }}" poster="{{ '/assets/video/research/rb-dubins-poster.jpg' | relative_url }}" autoplay muted loop playsinline preload="metadata" aria-label="Dubins vehicle avoiding a moving obstacle"></video>
<figcaption>Dubins vehicle. The trajectory, the certificate value with its override band, and the turn rate.</figcaption>
</figure>

<div class="rs-gallery">
<figure><video class="rs-video" src="{{ '/assets/video/research/rb-coordturn.mp4' | relative_url }}" poster="{{ '/assets/video/research/rb-coordturn-poster.jpg' | relative_url }}" autoplay muted loop playsinline preload="metadata" aria-label="Coordinated-turn model avoiding a moving obstacle"></video><figcaption>Coordinated-turn aircraft model.</figcaption></figure>
<figure><video class="rs-video" src="{{ '/assets/video/research/rb-multirotor.mp4' | relative_url }}" poster="{{ '/assets/video/research/rb-multirotor-poster.jpg' | relative_url }}" autoplay muted loop playsinline preload="metadata" aria-label="Planar multirotor avoiding a moving obstacle"></video><figcaption>Planar multirotor.</figcaption></figure>
</div>

<script defer src="{{ '/assets/js/research/common.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/research/repulsive-barriers.js' | relative_url }}"></script>
<script>
  document.addEventListener("DOMContentLoaded", function () {
    window.Research.repulsiveBarriers(document.getElementById("rb-demo"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll("video.rs-video").forEach(function (v) {
        v.removeAttribute("autoplay");
        v.pause();
        v.setAttribute("controls", "");
      });
    }
  });
</script>
