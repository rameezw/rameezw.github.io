---
layout: post
title: "When AI Enters the Physical World, Who Keeps It Safe?"
date: 2026-11-18 11:35:00 -0700
description: "Building an assurance layer for intelligent machines through control certificates, runtime safety filters, and formal verification."
tags: physical-ai safe-autonomy control-theory formal-methods
categories: research
thumbnail: assets/img/research/thumb-repulsive-barriers.jpg
toc:
  sidebar: left
---

*Building an assurance layer for intelligent machines*

Artificial intelligence is moving beyond our screens and into the physical world.

Robots are beginning to work alongside people. Autonomous vehicles must make decisions in unpredictable traffic. Drones navigate changing environments, while learning-based controllers are increasingly being used in machines that interact directly with their surroundings.

These developments are exciting. But they also raise a question that I find both fascinating and deeply consequential:

**How can we allow intelligent machines to learn, adapt, and make decisions while ensuring that they never violate critical safety constraints?**

This question lies at the heart of my research.

I work at the intersection of computer science, control theory, formal verification, and optimization. My broader research vision is what I call **Safe and Reliable Physical AI**: developing computational mechanisms that allow intelligent machines to operate autonomously without making safety entirely dependent on the intelligence of their decision-making systems.

The underlying idea is simple: let intelligent systems do what they do best, but build an independent layer that knows when to intervene.

## The Driving Instructor with a Second Brake Pedal

Consider someone learning to drive.

The student controls the steering wheel, accelerator, and brakes. The instructor generally allows the student to make decisions, including occasional mistakes. But the instructor also has access to a second brake pedal.

Most of the time, that pedal remains untouched.

However, if the student approaches a dangerous situation, the instructor must recognize the threat and intervene before an accident becomes unavoidable.

Now imagine replacing the student with an AI controller and the instructor with a computational safety mechanism.

The AI controller might be trained using reinforcement learning, designed through optimization, or built using some combination of planning and learned models. Its objective could be to navigate efficiently, complete a task quickly, or optimize performance.

The safety mechanism has a different responsibility: to ensure that the system remains within acceptable operating conditions.

This architecture is known as **runtime assurance**. A high-performance controller proposes an action, and a safety filter determines whether that action is permissible. If it is, the system proceeds normally. Otherwise, the filter modifies or replaces the action to preserve safety.

<figure class="rs-figure" style="max-width: 560px; margin: 2rem auto">
  <div class="rs-entry-visual rs-mini" data-demo="repulsiveBarriers">
    <canvas role="img" aria-label="A car following a loop swerves around a moving obstacle when the safety layer steps in."></canvas>
  </div>
  <figcaption>
    The second brake pedal in action: the car follows its loop (blue) until the safety layer steps in (red). Explore it on the
    <a href="{{ '/projects/repulsive-barriers/' | relative_url }}">repulsive barriers page</a>.
  </figcaption>
</figure>

Of course, there is a crucial difference between a human driving instructor and a computational safety monitor.

A human relies on experience, judgment, and intuition.

For an autonomous system, we want something more explicit: **mathematical evidence that an intervention will occur when necessary and that the resulting behavior will remain safe under clearly stated assumptions.**

That is where much of my research begins.

## Safety Certificates: More Than Testing

How do we establish that an autonomous system is safe?

The traditional engineering answer often involves testing. We run simulations, evaluate different scenarios, identify failures, and improve the design.

Testing is indispensable, but it has a fundamental limitation.

A robot might safely navigate a thousand simulated encounters without demonstrating that it will avoid a collision in the thousand-and-first.

My research investigates a complementary approach based on mathematical *certificates*.

A certificate is a mathematical object that provides evidence that a system satisfies a desired property. In control theory, one important example is a **control barrier function (CBF)**, which can help establish conditions under which a dynamical system remains inside a specified safe region.

Another is a **control Lyapunov function (CLF)**, which can help establish whether a system can progress toward a desired target or operating condition.

These functions allow us to reason about whole classes of trajectories rather than only individual simulation runs.

They can also be used operationally.

Imagine a mobile robot navigating around obstacles. Its primary controller decides where to go, while a safety filter evaluates whether the proposed control action is compatible with a certified safe region.

The filter need not design the robot's entire behavior. Its job is narrower: to prevent actions that could compromise a specified safety requirement.

This separation of responsibilities is particularly appealing when the primary controller is learned or otherwise too complex to verify completely.

## What Happens When One Certificate Is Not Enough?

One of the recurring difficulties in safety verification is conservatism.

A mathematical certificate may be valid but unnecessarily restrictive. It might exclude states or actions that are actually safe, simply because the certificate cannot establish their safety.

A single certificate intended to cover a large operating region can be especially limiting.

Much of my doctoral research has focused on addressing this problem through **successive certificates**.

Instead of relying on one global certificate, the idea is to construct multiple certificates that work together in a structured hierarchy.

A relatively simple certificate may handle ordinary operating conditions, while additional certificates establish safety or reachability in other regions.

This has led to my work on successive control barrier functions for safety and successive control Lyapunov functions for reachability.

<figure class="rs-figure" style="max-width: 420px; margin: 2rem auto">
  <div class="rs-entry-visual rs-mini" data-demo="successiveBarriers">
    <canvas role="img" aria-label="A car hands over between certificate levels until it settles on a safe circle."></canvas>
  </div>
  <figcaption>
    Each colour is one certificate. The car hands down from level to level until it reaches one that keeps it safe forever.
    <a href="{{ '/projects/successive-barriers/' | relative_url }}">Build the levels yourself</a>.
  </figcaption>
</figure>

An important question then emerges: when should the system switch from one certificate to another?

And more importantly, what happens between two consecutive safety checks?

Real computers do not monitor physical systems continuously. They sample the environment, perform computations, and update control actions at discrete intervals.

A safety guarantee that holds only at the precise instant of a check is not enough. The system might leave the certified region before the next check occurs.

My work studies conditions that prevent these gaps from undermining safety, allowing monitors to operate at fixed sampling rates while maintaining the required guarantees.

This is an example of a broader theme in my research: **a mathematically elegant safety argument must eventually become a computational mechanism that can operate on a real system.**

## Can We Trust the Software That Proves Safety?

There is another problem that interests me.

Many safety certificates are discovered using numerical optimization, including sum-of-squares techniques for polynomial dynamical systems.

But numerical optimization software is complex. It uses floating-point arithmetic, approximations, and sophisticated solvers.

Suppose an optimizer reports that it has found a valid safety certificate.

Should we simply trust it?

I would prefer not to.

This motivates another direction of my work: **proof-producing computation**.

The idea is to separate the process of discovering a certificate from the process of verifying it.

A sophisticated numerical solver might search for a candidate certificate, but the resulting evidence should be independently checkable, potentially using simpler mathematical procedures or formal proof systems.

<figure class="rs-figure" style="max-width: 420px; margin: 2rem auto">
  <div class="rs-entry-visual rs-mini" data-demo="exactCertificates">
    <div class="rs-mini-repair">
      <div class="rs-mx rs-mini-mx" data-role="matrix" aria-hidden="true"></div>
      <div><span class="rs-verdict rs-verdict-pending" data-role="verdict">Floating point</span></div>
    </div>
  </div>
  <figcaption>
    A solver's matrix is rounded, repaired and checked exactly. Coarse rounding gets rejected; enough precision gets certified.
    <a href="{{ '/projects/exact-certificates/' | relative_url }}">Run it step by step</a>.
  </figcaption>
</figure>

This separation matters because the software responsible for discovering a solution need not itself become part of the trusted foundation.

It also creates an interesting bridge between numerical optimization, autonomous systems, automated reasoning, and formal verification.

I see this as an essential step toward trustworthy autonomy: not merely producing systems that appear to operate safely, but producing evidence that others can independently inspect and verify.

## Beyond Traditional Control: Toward Safe Physical AI

The methods I have described originate primarily in control theory and formal verification.

But the systems we want to build are increasingly driven by machine learning, perception, and autonomous planning.

My next research questions concern how these capabilities can coexist with explicit safety guarantees.

### 1. Learning Can Provide Capability; Assurance Can Enforce Constraints

Learned controllers can be extraordinarily capable, particularly in environments where traditional control design becomes difficult.

But their behavior may also be hard to characterize mathematically.

Rather than insisting that every component of an intelligent system be formally verified, I am interested in a modular alternative.

Allow the learned controller to pursue performance, while a separately designed assurance mechanism checks and, when necessary, constrains its behavior.

The important research challenge is to determine what guarantees such a safety layer can actually provide, especially when the learned controller operates in unfamiliar conditions.

This separation may allow us to benefit from increasingly powerful AI without assuming that the AI itself will always make the correct decision.

### 2. Safety Should Tell Perception What It Needs

A second direction concerns the relationship between safety and perception.

Consider a robot approaching an obstacle.

If the obstacle is far away, knowing its approximate position may be sufficient. But as the robot gets closer, the same level of uncertainty may no longer be acceptable.

An obstacle-location estimate accurate to ten centimeters and one accurate to one meter can have very different implications for safety.

This leads to an idea I call **demand-driven perception**.

Instead of treating sensing as a separate process that continuously supplies information, what if the safety mechanism could explicitly determine how much information it needs?

When the robot is far from danger, lower-rate or less accurate sensing might be sufficient.

As the robot approaches a safety boundary, the monitor could demand more precise measurements, reduced latency, or a different sensing strategy.

In this vision, perception and safety become part of a coordinated computational system.

The safety monitor does not merely consume sensor measurements; it helps determine the quality of information required for continued safe operation.

### 3. Safety in a World That Does Not Stand Still

Many classical safety problems consider fixed obstacles and static safe regions.

The real world is rarely so cooperative.

Vehicles move, pedestrians change direction, other robots make decisions, and the environment evolves.

My recent research on moving obstacles considers situations in which the safe region itself changes over time.

A natural next step is to investigate multi-agent environments, including systems in which several autonomous robots or human participants interact.

In these settings, safety depends not only on a robot's own state but also on uncertainty about what other agents may do.

How should a safety certificate account for another agent's possible future behavior? How conservative must its predictions be? And how can the system update its guarantees as new information arrives?

These are questions I hope to explore further.

## Research Should Be Something We Can Build

Although much of my work involves mathematics, I do not see trustworthy autonomy as a purely theoretical discipline.

A successful research program needs theory, algorithms, software, simulations, experiments, and ultimately physical demonstrations.

It should also offer meaningful ways for students and collaborators with different strengths to participate.

Someone interested in programming might start by implementing robot simulations and visualizing safe and unsafe regions.

A student with systems experience might develop runtime monitors, implement safety filters, or investigate how computation delays affect their performance.

Others might work on new mathematical certificates, uncertainty models, optimization algorithms, or independent verification using formal proof tools.

These activities are not merely supporting tasks. They can each expose limitations, generate research questions, and contribute to a more complete understanding of autonomous-system safety.

I particularly value the interplay between mathematical reasoning and experimentation. Theory tells us what should happen under specified assumptions; experiments help us understand how those assumptions interact with actual implementations and where our methods may be unnecessarily restrictive.

## The Bigger Picture

The capabilities of intelligent machines will continue to improve.

We will build robots that navigate more complex environments, controllers that adapt to changing conditions, and autonomous systems that make decisions in situations their designers could not have anticipated individually.

But capability alone is not sufficient.

When AI controls a physical machine, its mistakes may no longer be confined to an incorrect answer on a screen. They can have immediate consequences for people, equipment, and the environment.

I believe this creates an important opportunity for computer science.

We need systems that can reason not only about what an intelligent machine *wants* to do, but also about what it *can safely be allowed* to do.

That means bringing together learning, control, optimization, verification, perception, and software systems into architectures where performance and assurance complement one another.

My long-term goal is to contribute to an **assurance layer for Physical AI**: computational mechanisms that continuously evaluate what can be guaranteed, monitor the decisions of intelligent systems, and intervene when those guarantees are at risk.

The ultimate aspiration is not to make autonomous systems timid or incapable.

It is to make them powerful enough to be useful and reliable enough to be trusted.

---

*My research focuses on safe autonomous systems, control barrier and Lyapunov functions, formal verification, numerical optimization, and runtime assurance. I am particularly interested in connecting mathematical safety guarantees with the emerging capabilities of learning-enabled physical systems. See my [publications]({{ '/publications/' | relative_url }}) for more technical details.*

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">
<script defer src="{{ '/assets/js/research/common.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/research/successive-barriers.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/research/repulsive-barriers.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/research/exact-certificates.js' | relative_url }}"></script>
<script>
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".rs-mini[data-demo]").forEach(function (el) {
      var mount = window.Research && window.Research[el.dataset.demo];
      if (mount) mount(el, { mini: true });
    });
  });
</script>
