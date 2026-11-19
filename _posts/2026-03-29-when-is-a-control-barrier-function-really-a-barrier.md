---
layout: post
title: "When Is a Control Barrier Function Really a Barrier?"
date: 2026-03-29 10:00:00 -0600
description: "Choosing a function that describes safety is not the same as proving that a system can remain safe. A closer look at barrier synthesis, CBF-QPs, and feasibility."
tags: control-barrier-functions safe-autonomy formal-verification control-theory
categories: research
math: true
---

Suppose I want a robot to avoid an obstacle. I can write down a function that measures how close the robot is to danger, declare its nonnegative region to be safe, and feed that function into a controller.

But have I actually **proved that the robot can stay safe**?

This is a distinction that gets blurred in discussions of **control barrier functions (CBFs)**. A significant body of work is devoted to *synthesizing* functions that come with a safety argument. Another influential approach starts from a *chosen* function, often one suggested by geometry, and asks an online controller to enforce an inequality involving it.

Both approaches have rigorous mathematical foundations. But **choosing a function that describes a safety constraint is not the same as establishing that the constraint can be enforced**.

Let's examine that gap.

## A safe set is a specification, not yet a guarantee

Consider a nonlinear control-affine dynamical system:

$$
\dot{x} = f(x) + g(x)u, \qquad u\in\mathcal U,
$$

where $x$ is the system state, $u$ is the control input, and $\mathcal U$ describes the available control authority.

Suppose our desired safe set is

$$
\mathcal C = \{x : h(x)\geq 0\}.
$$

For a robot, $h(x)$ might represent a signed distance from an obstacle. For a vehicle, it might encode a minimum following distance. The exact choice depends on the problem.

The inequality $h(x)\geq 0$ tells us **which states we would like to permit**. It does *not*, by itself, say whether the robot can remain in those states under its dynamics and actuator limits.

What we want is **forward invariance**: starting in a specified safe region, a trajectory remains there for all future time, under the assumptions of the model.

This is where the distinction between a *safety function*, a *CBF candidate*, and a *certified barrier* becomes important.

## First philosophy: synthesize a certificate

The barrier-certificate tradition in formal verification begins with a different question:

> Can we find a mathematical function whose properties establish that unsafe states are unreachable from the specified initial states?

For instance, suppose a feedback law $u=k(x)$ has already been selected. The closed-loop system becomes

$$
\dot{x} = f(x)+g(x)k(x).
$$

We may search for a function $B(x)$ whose sublevel set

$$
\mathcal S=\{x:B(x)\leq 0\}
$$

contains the initial states and excludes the unsafe states. Under suitable smoothness and regularity assumptions, a condition such as

$$
\nabla B(x)^\top\big(f(x)+g(x)k(x)\big)\leq 0
\quad\text{on } B(x)=0
$$

can be used to establish that the closed-loop trajectories do not leave $\mathcal S$.

Here, the search is organized around the *proof obligations*: the required separation and derivative conditions are part of what makes a candidate acceptable.

Early work by [Prajna and Jadbabaie](https://web.mit.edu/~jadbabai/www/papers/hscc04_2.pdf) made this a practical verification paradigm for nonlinear and hybrid systems. For polynomial dynamics, sum-of-squares optimization provides one way to search for certificates using computationally manageable sufficient conditions.

The compelling feature is that a successful synthesis produces **more than a function with an appealing geometric interpretation**. It produces a function satisfying conditions from which a safety claim follows. That claim can be checked offline against the stated model.

There is a limitation: synthesized certificates can be conservative. A certified invariant region may occupy only a fraction of the states from which safe behavior is actually possible. That limitation motivated my work on [successive control barrier functions](https://doi.org/10.1145/3716863.3718043), where multiple certificates are used to extend what can be certified beyond the limitations of a single one.

Not all certificate-synthesis methods assume a fixed controller; some search for a controller and a certificate together. The point is that **certification is built into the construction**, rather than inferred solely from an online solver returning an answer.

## Second philosophy: choose a candidate, then solve for control

A different and widely used workflow begins with a proposed function $h(x)$.

For the convention $\mathcal C=\{x:h(x)\geq 0\}$, a standard zeroing-CBF condition takes the form

$$
L_f h(x)+L_g h(x)u \geq -\alpha(h(x)),
$$

where $L_fh$ and $L_gh$ are Lie derivatives, and $\alpha$ is an appropriate increasing function with $\alpha(0)=0$.

At the boundary $h(x)=0$, this asks for $\dot h(x)\geq 0$, preventing motion toward the unsafe side. **It does not generally require $h$ to increase everywhere.** The function may decrease inside the safe set, provided it does so in a way compatible with the barrier condition.

A common implementation is a **CBF quadratic program (CBF-QP)**:

$$
\begin{aligned}
u^*(x)=\underset{u}{\operatorname{argmin}}\quad
&\|u-u_{\mathrm{nom}}(x)\|^2\\
\text{subject to}\quad
&L_fh(x)+L_gh(x)u\geq-\alpha(h(x)),\\
&u\in\mathcal U.
\end{aligned}
$$

The nominal controller, $u_{\mathrm{nom}}$, is free to prioritize performance. The QP modifies its command only when needed to satisfy the chosen inequality.

This is an elegant architecture, especially for learning-enabled control: separate the controller that *tries to perform the task* from the filter that *enforces a safety constraint*.

But there is a mathematical question hiding in the workflow:

**What ensures that this optimization problem has a feasible solution at every state where we claim safety?**

## An inequality is not a certificate merely because we write it down

The theoretical definition of a CBF does not ignore this problem. In the Ames-style formulation, one requires an existence condition of the form

$$
\sup_{u\in\mathcal U}
\left[L_fh(x)+L_gh(x)u\right]
\geq-\alpha(h(x))
$$

throughout an appropriate domain.

This requirement matters. It says the proposed function is compatible with the dynamics **and the admissible controls**, not merely with our preferred geometric description of safety.

When the CBF conditions hold and an appropriately regular feedback law selects controls satisfying the barrier constraint, forward invariance follows under the theorem's assumptions. In that sense, a **verified** Ames-style CBF is indeed a legitimate safety certificate for controlled invariance.

My concern is with a shortcut that is easy to make in applications:

1. Choose a function $h(x)$ because its zero level set describes a sensible safety boundary.
2. Put its derivative inequality into a QP.
3. Treat the result as if safety had already been established.

Step 3 does not follow from steps 1 and 2. Before the existence condition has been established, $h$ is a **candidate**, not a verified CBF.

### A one-dimensional counterexample

Consider a simple system moving toward a boundary:

$$
\dot{x}=-1+u,\qquad 0\leq u\leq \tfrac12.
$$

We would like the system to remain in $x\geq0$, so we choose

$$
h(x)=x.
$$

At the safety boundary $x=0$, the CBF condition requires

$$
\dot h=-1+u\geq0,
\qquad\text{so}\qquad u\geq1.
$$

Yet the largest available input is $u=\tfrac12$.

No admissible control can satisfy the boundary condition. The QP is infeasible there. In fact, for this system the state inevitably decreases, so no controller respecting these input limits can keep $x\geq0$ forever.

The function $h(x)=x$ is a perfectly reasonable **description of the desired safe set**. But it is **not a valid CBF for the specified dynamics and input bounds**.

Changing the optimization objective, making the solver faster, or assigning a larger penalty to violating safety does not change that fact.

The difficulty is not computational. It is mathematical and physical.

## What exactly has been proved?

I find it useful to separate three stages:

| Object | What we know |
|:--|:--|
| **Safety function** | Its sign defines a desired safe and unsafe region |
| **Candidate CBF** | We have proposed a derivative condition intended to preserve that region |
| **Verified CBF / barrier certificate** | We have established the relevant conditions for an invariance guarantee, with explicit assumptions |

This is not a claim that every synthesized barrier is superior to every selected barrier. A carefully selected function **can** be verified to be a CBF, and a function found by numerical synthesis **still needs** its conditions to be checked.

Nor do the two paradigms necessarily certify exactly the same proposition. A barrier certificate may prove invariance for a *particular closed-loop controller*. A verified CBF can instead establish the *existence of admissible controls* that preserve a set, with a runtime filter selecting among them.

The distinction is therefore not really **offline good, online bad**. It is:

> **Did we establish that the safety condition is enforceable, or did we merely ask a solver to enforce it?**

That question becomes pressing with actuator saturation, conflicting constraints, higher-relative-degree systems, model error, or disturbances. It also becomes important in digital implementations: a continuous-time safety argument does not automatically cover what happens between sampled control updates.

## Why I work on synthesizing certificates

My own research is closer to the certificate-synthesis tradition. I am interested in computational methods that **construct regions for which safety can be established**, rather than simply assuming a geometric safe set can be made invariant.

One challenge is that finding a single large, useful certified region is hard. In [*Successive Control Barrier Functions for Nonlinear Systems*](https://doi.org/10.1145/3716863.3718043), we investigate how multiple barrier functions can be organized to reduce the conservatism of relying on one certificate.

This research does not make online safety filters irrelevant. In fact, synthesis and online filtering can complement each other: one can construct a certificate offline and then use it to constrain control decisions during execution.

What matters to me is preserving the distinction between **a requirement we would like the machine to obey** and **evidence that the machine can obey it**.

## The question behind the terminology

The word *barrier* suggests something that prevents crossing. But a mathematical function is not a physical wall. Its zero level set cannot stop a robot on its own.

The prevention comes from the interaction between the function, the dynamics, the available control authority, and a controller that actually enforces the necessary conditions.

That is why I think we should be precise about what we call a barrier.

A chosen distance function can encode a useful safety requirement. A QP can be an effective mechanism for selecting actions. But **neither becomes a proof of safety merely by being labeled a CBF**.

For trustworthy autonomous systems, the difference between *specifying* safety and *certifying* safety is not pedantic. It is the entire point.

---

### Further reading

- S. Prajna and A. Jadbabaie, [*Safety Verification of Hybrid Systems Using Barrier Certificates*](https://web.mit.edu/~jadbabai/www/papers/hscc04_2.pdf), HSCC, 2004.
- A. D. Ames et al., [*Control Barrier Functions: Theory and Applications*](https://arxiv.org/abs/1903.11199), ECC, 2019.
- A. D. Ames, X. Xu, J. W. Grizzle, and P. Tabuada, [*Control Barrier Function Based Quadratic Programs for Safety Critical Systems*](https://doi.org/10.1109/TAC.2016.2638961), *IEEE Transactions on Automatic Control*, 2017.
- R. Wajid and S. Sankaranarayanan, [*Successive Control Barrier Functions for Nonlinear Systems*](https://doi.org/10.1145/3716863.3718043), HSCC, 2025.
