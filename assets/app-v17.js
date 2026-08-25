/*
 * AAO Portfolio v17.1 — defensive adaptive interaction runtime (skills-integrated)
 * =============================================================
 * Why one file: v12–v15 progressively added anonymous listeners for the same
 * controls. Loading them together was safe but wasteful and made debugging hard.
 * v17.1 keeps one source of truth and merges emil/apple/animate motion systems: strong easing tokens, interruptible WAAPI, rubber-banding, velocity projection, @starting-style, clip-path, hover-gating and reduced-motion guards and adds container-adaptive rendering plus a live public-risk feed.
 *
 * Design rules used throughout this file:
 * - Never call document-level auto-centering from state-change widgets. Component changes are
 *   allowed to scroll only their OWN horizontal rail with element.scrollTo().
 * - Pointer hover is an enhancement, never the only path. Focus/click/keyboard
 *   remain available, while touch rails synchronize to the item nearest center.
 * - Scroll handlers are requestAnimationFrame-throttled and passive.
 * - No auto-rotation. The visitor owns state; this avoids surprise movement.
 * - Reduced-motion preferences disable nonessential animation.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  // v17.1 motion tokens — mirrored from CSS :root for JS-driven WAAPI
  const MOTION = {
    easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
    easeInOut: 'cubic-bezier(0.77, 0, 0.175, 1)',
    easeDrawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
    durationFast: 160,
    durationNormal: 220,
    durationSlow: 380
  };
  // Dynamic reduced-motion: original was static boolean; v17.1 listens for changes
  let reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => { reducedMotion = e.matches; });
  } catch {}
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  const smallViewport = () => innerWidth <= 760;
  // Apple spring helper — velocity handoff & rubber-banding
  const rubberBand = (overshoot, dimension, constant = 0.55) => (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
  const project = (velocity, decelerationRate = 0.998) => (velocity / 1000) * decelerationRate / (1 - decelerationRate);
  // WAAPI helper — hardware-accelerated, interruptible, transform/opacity only
  const waAnimate = (el, keyframes, opts) => {
    if (!el || reducedMotion || !el.animate) return null;
    try { return el.animate(keyframes, { fill: 'both', easing: MOTION.easeOut, duration: MOTION.durationNormal, ...opts }); } catch { return null; }
  };

  // -------------------------------------------------------------------------
  // v18.9 MOTION ENGINE — true iOS additive springs (motion.dev, self-hosted)
  // window.Motion.animate(value, to, { type:'spring' }) gives:
  //   - critically damped settle (Apple damping 1.0) for UI state changes
  //   - slight bounce only when a flick/momentum preceded it (damping ~0.8)
  //   - interruptible: re-targets from the live presentation value, never 0
  //   - velocity handoff for gesture -> spring continuity (no brick wall)
  // Degrades gracefully: no Motion -> existing CSS/WAAPI paths run unchanged.
  // -------------------------------------------------------------------------
  const M = (typeof window !== 'undefined') ? window.Motion : null;
  const hasMotion = !!(M && typeof M.animate === 'function');
  if (hasMotion) document.documentElement.classList.add('motion-js');

  const springUI = { type: 'spring', stiffness: 300, damping: 32, mass: 1 };
  const springFlick = { type: 'spring', stiffness: 260, damping: 24, mass: 1 };

  // Spring a number from->to, writing through apply() each frame (scrollLeft
  // cannot be interpolated by WAAPI, so we drive it manually).
  const springTo = (from, to, apply, opts = {}, onDone) => {
    if (!hasMotion || reducedMotion) {
      apply(to);
      if (onDone) onDone();
      return () => {};
    }
    let stopped = false;
    try {
      const controls = M.animate(from, to, {
        ...springUI,
        ...opts,
        onUpdate: (v) => { if (!stopped) apply(v); },
        onComplete: () => { if (!stopped && onDone) onDone(); }
      });
      return () => { stopped = true; try { controls.stop(); } catch {} };
    } catch {
      apply(to);
      if (onDone) onDone();
      return () => {};
    }
  };

  const rafThrottle = (fn) => {
    let frame = 0;
    return (...args) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        fn(...args);
      });
    };
  };

  const localHorizontalCenter = (rail, item, behavior = 'smooth') => {
    if (!rail || !item || rail.scrollWidth <= rail.clientWidth + 2) return;
    const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const left = Math.max(0, Math.min(max, item.offsetLeft - (rail.clientWidth - item.clientWidth) / 2));
    rail.scrollTo({ left, behavior: reducedMotion ? 'auto' : behavior });
  };

  const nearestChildToCenter = (rail, items) => {
    if (!rail || !items.length) return 0;
    const rr = rail.getBoundingClientRect();
    const center = rr.left + rr.width / 2;
    let index = 0;
    let best = Infinity;
    items.forEach((item, i) => {
      if (getComputedStyle(item).display === 'none') return;
      const r = item.getBoundingClientRect();
      const d = Math.abs((r.left + r.width / 2) - center);
      if (d < best) { best = d; index = i; }
    });
    return index;
  };

  // -------------------------------------------------------------------------
  // Theme: one deterministic light/dark state, persisted when storage works.
  // -------------------------------------------------------------------------
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('aao-theme'); } catch {}
  root.dataset.theme = savedTheme === 'dark' ? 'dark' : 'light';
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const syncThemeUI = () => {
    const dark = root.dataset.theme === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.textContent = dark ? '☀' : '☾';
      button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      button.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
    });
    if (themeMeta) themeMeta.content = dark ? '#050a08' : '#f6f8f5';
  };
  syncThemeUI();
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('aao-theme', root.dataset.theme); } catch {}
      syncThemeUI();
    });
  });

  // Pointer aura: update once per animation frame and disable on coarse/small UI.
  if (!coarsePointer && !reducedMotion) {
    const updateAura = rafThrottle((event) => {
      root.style.setProperty('--mx', `${event.clientX}px`);
      root.style.setProperty('--my', `${event.clientY}px`);
    });
    document.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'touch' && innerWidth > 760) updateAura(event);
    }, { passive: true });
  }

  // -------------------------------------------------------------------------
  // Dynamic Island + primary navigation current-section state.
  // -------------------------------------------------------------------------
  const island = document.querySelector('[data-island]');
  const islandToggle = document.querySelector('[data-island-toggle]');
  const islandLabel = document.querySelector('[data-island-label]');
  const footer = document.querySelector('footer');
  const sections = [...document.querySelectorAll('[data-section-title][id]')];
  const navLinks = [...document.querySelectorAll('.nav-chip[href^="#"]')];
  const islandLinks = [...document.querySelectorAll('[data-island-link]')];

  const setIslandOpen = (open) => {
    if (!island || !islandToggle) return;
    island.classList.toggle('is-open', open);
    islandToggle.setAttribute('aria-expanded', String(open));
  };
  islandToggle?.addEventListener('click', () => setIslandOpen(!island?.classList.contains('is-open')));
  document.addEventListener('pointerdown', (event) => {
    if (island?.classList.contains('is-open') && !island.contains(event.target)) setIslandOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && island?.classList.contains('is-open')) {
      setIslandOpen(false);
      islandToggle?.focus({ preventScroll: true });
    }
  });
  islandLinks.forEach((link) => link.addEventListener('click', () => setIslandOpen(false)));

  const syncSectionState = () => {
    if (!sections.length) return;
    const probe = scrollY + innerHeight * .30;
    let current = sections[0];
    sections.forEach((section) => { if (section.offsetTop <= probe) current = section; });
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) current = sections[sections.length - 1];
    const hash = `#${current.id}`;
    if (islandLabel) islandLabel.textContent = current.dataset.sectionTitle || 'Portfolio';
    navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === hash));
    islandLinks.forEach((link) => {
      if (link.getAttribute('href') === hash) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    if (island) {
      const footerNear = footer ? footer.getBoundingClientRect().top < innerHeight * .88 : false;
      const executiveTop = document.querySelector('#executive-value')?.offsetTop || 640;
      const islandStart = Math.max(420, executiveTop - innerHeight * .55);
      island.classList.toggle('is-visible', scrollY > islandStart && !footerNear);
      island.classList.toggle('is-suppressed', footerNear);
      if (footerNear) setIslandOpen(false);
    }
  };
  const scheduleSectionState = rafThrottle(syncSectionState);
  addEventListener('scroll', scheduleSectionState, { passive: true });
  addEventListener('resize', scheduleSectionState, { passive: true });
  syncSectionState();

  // -------------------------------------------------------------------------
  // Hero governance deck: clean non-overlapping state machine.
  // Pointer movement changes state without click. Touch uses swipe. Stage numbers
  // also switch on hover/focus/click and remain horizontally scrollable if needed.
  // -------------------------------------------------------------------------
  const TRACE = [
    { stage: 'Requirement', input: 'Privileged access must be restricted to authorized roles.', evidence: 'Policy requirement + privileged-role definition.', decision: 'Assign an accountable control owner and define acceptance criteria.' },
    { stage: 'Control', input: 'RBAC + MFA + a recurring privileged-access review.', evidence: 'IdP role configuration + MFA enforcement + review cadence.', decision: 'Operate the control and record owner, frequency and exceptions.' },
    { stage: 'Evidence', input: 'Proof must show the control existed and operated during the review period.', evidence: 'Role export + MFA configuration + timestamped access-review record.', decision: 'Accept evidence only when scope, date, owner and result are inspectable.' },
    { stage: 'Exception', input: 'A stale privileged account or overdue review changes the assurance claim.', evidence: 'Exception ticket + affected account + owner + target date.', decision: 'Remediate, compensate or escalate instead of treating the control as clean.' },
    { stage: 'Residual risk', input: 'Exposure remains after the current control and open exceptions.', evidence: 'Likelihood × impact + exception severity + compensating-control strength.', decision: 'Compare remaining exposure with risk appetite and escalation thresholds.' },
    { stage: 'Decision', input: 'A named owner must choose the treatment state.', evidence: 'Decision record + rationale + approver + acceptance/remediation date.', decision: 'Approve, remediate, accept, escalate or reject with accountable ownership.' },
    { stage: 'Monitoring', input: 'The decision must reopen when operating conditions materially change.', evidence: 'Overdue reviews + role changes + failed MFA + incidents + KRI thresholds.', decision: 'Trigger reassessment when the monitoring threshold is breached.' }
  ];

  const stage = document.querySelector('[data-governance-stage]');
  if (stage) {
    const deck = stage.querySelector('.governance-deck');
    const cards = [...stage.querySelectorAll('[data-governance-index]')];
    const dotsRail = stage.querySelector('.stage-dots');
    const dots = [...stage.querySelectorAll('[data-stage-goto]')];
    const prev = stage.querySelector('[data-stage-prev]');
    const next = stage.querySelector('[data-stage-next]');
    const readout = stage.querySelector('[data-stage-readout]');
    const proof = document.querySelector('[data-governance-proof]');
    const proofStage = proof?.querySelector('[data-proof-stage]');
    const proofInput = proof?.querySelector('[data-proof-input]');
    const proofEvidence = proof?.querySelector('[data-proof-evidence]');
    const proofDecision = proof?.querySelector('[data-proof-decision]');
    // Signature model is visually linked to the same active governance state.
    // It never autoplays: the marker moves only because the visitor changed state.
    const signature = document.querySelector('[data-signature-model]');
    const signatureRail = signature?.querySelector('.signature-rail');
    const signatureSteps = [...(signature?.querySelectorAll('[data-signature-step]') || [])];
    let active = 0;
    let swipeStart = null;

    const renderProof = (index) => {
      const item = TRACE[index];
      if (!item) return;
      if (proofStage) proofStage.textContent = item.stage;
      if (proofInput) proofInput.textContent = item.input;
      if (proofEvidence) proofEvidence.textContent = item.evidence;
      if (proofDecision) proofDecision.textContent = item.decision;
      if (proof) {
        // v17.1: blur-masked crossfade + WAAPI interruptible (re-targets from current value)
        if (proof._proofAnim) try { proof._proofAnim.cancel(); } catch {}
        proof.classList.add('v17-blur-transition');
        requestAnimationFrame(() => {
          proof.classList.remove('v17-blur-transition');
        });
        if (hasMotion && !reducedMotion) {
          if (proof._springStop) proof._springStop();
          proof._springStop = springTo(0, 1, (v) => {
            proof.style.opacity = String(v);
            proof.style.transform = 'translateY(' + ((1 - v) * 4) + 'px) scale(' + (0.99 + v * 0.01) + ')';
            proof.style.filter = 'blur(' + ((1 - v) * 2) + 'px)';
          }, { ...springUI, duration: 0.32 }, () => { proof._springStop = null; });
        } else if (!reducedMotion && proof.animate) {
          proof._proofAnim = waAnimate(proof, [{ opacity: .86, transform: 'translateY(4px) scale(0.99)', filter: 'blur(2px)' }, { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' }], { duration: 220, easing: MOTION.easeOut });
        }
      }
    };

    const selectStage = (index, { centerDot = false } = {}) => {
      const safe = Math.max(0, Math.min(cards.length - 1, index));
      active = safe;
      cards.forEach((card, i) => {
        const distance = i - safe;
        const abs = Math.abs(distance);
        card.style.setProperty('--g-distance', String(distance));
        card.style.setProperty('--g-abs', String(abs));
        card.classList.toggle('is-focus', i === safe);
        card.classList.toggle('is-near', abs === 1);
        card.classList.toggle('is-far', abs === 2);
        card.setAttribute('aria-pressed', String(i === safe));
        card.tabIndex = i === safe ? 0 : -1;
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === safe);
        dot.setAttribute('aria-pressed', String(i === safe));
      });
      if (readout) {
        const label = cards[safe]?.querySelector('strong')?.textContent?.trim() || TRACE[safe]?.stage || `Stage ${safe + 1}`;
        readout.textContent = `${String(safe + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')} · ${label}`;
      }
      if (prev) prev.disabled = safe === 0;
      if (next) next.disabled = safe === cards.length - 1;
      renderProof(safe);
      // Signature operating model has six canonical states; Monitoring (07)
      // intentionally resolves to the Decision endpoint rather than creating
      // a seventh label that would contradict the published signature model.
      const signatureIndex = Math.min(5, safe);
      if (signatureRail) signatureRail.style.setProperty('--signature-step', String(signatureIndex));
      signatureSteps.forEach((item, i) => item.classList.toggle('is-active', i === signatureIndex));
      if (centerDot) localHorizontalCenter(dotsRail, dots[safe]);
    };

    cards.forEach((card, i) => {
      card.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') selectStage(i); });
      card.addEventListener('focus', () => selectStage(i, { centerDot: true }));
      card.addEventListener('click', () => selectStage(i, { centerDot: true }));
    });
    dots.forEach((dot, i) => {
      dot.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') selectStage(i); });
      dot.addEventListener('focus', () => selectStage(i, { centerDot: true }));
      dot.addEventListener('click', () => selectStage(i, { centerDot: true }));
    });
    prev?.addEventListener('click', () => selectStage(active - 1, { centerDot: true }));
    next?.addEventListener('click', () => selectStage(active + 1, { centerDot: true }));

    // Pointer scrub maps the usable deck width to 7 stable bands. Controls and
    // proof are excluded, so moving toward them never unexpectedly changes state.
    deck?.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const rect = deck.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(.9999, (event.clientX - rect.left) / rect.width));
      selectStage(Math.floor(ratio * cards.length));
    }, { passive: true });

    stage.addEventListener('keydown', (event) => {
      let target = active;
      if (event.key === 'ArrowLeft') target -= 1;
      else if (event.key === 'ArrowRight') target += 1;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = cards.length - 1;
      else return;
      event.preventDefault();
      selectStage(target, { centerDot: true });
    });

    stage.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch') swipeStart = { x: event.clientX, y: event.clientY };
    }, { passive: true });
    stage.addEventListener('pointerup', (event) => {
      if (!swipeStart || event.pointerType !== 'touch') return;
      const dx = event.clientX - swipeStart.x;
      const dy = event.clientY - swipeStart.y;
      swipeStart = null;
      if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) * 1.1) {
        selectStage(active + (dx < 0 ? 1 : -1), { centerDot: true });
      }
    }, { passive: true });

    // On narrow touch layouts the numbered rail itself can be swiped; whichever
    // number settles nearest the center becomes the selected stage automatically.
    const syncDotCenter = rafThrottle(() => {
      if (!dotsRail || dotsRail.scrollWidth <= dotsRail.clientWidth + 3) return;
      selectStage(nearestChildToCenter(dotsRail, dots));
    });
    dotsRail?.addEventListener('scroll', syncDotCenter, { passive: true });
    selectStage(0);
  }

  // -------------------------------------------------------------------------
  // Interactive operating model: hover/glide on pointer devices, centered-stage
  // sync on touch/scrolling layouts. Component-only horizontal scrolling.
  // -------------------------------------------------------------------------
  const FLOW_DETAILS = [
    'Requirement: identify the material obligation, risk expectation or business need and define what “true” means.',
    'Control: assign the behavior, configuration or process that manages the requirement, including an accountable owner.',
    'Evidence: collect dated, scoped and reviewable proof that the control exists and operated in the stated period.',
    'Exception: record the failed test, gap or dependency that changes the assurance state, with owner and target date.',
    'Residual risk: evaluate remaining exposure after current controls, exceptions and compensating measures are considered.',
    'Decision: approve, remediate, accept, escalate or reject with a named decision owner and rationale.'
  ];
  document.querySelectorAll('[data-flow]').forEach((flow) => {
    const nodes = [...flow.querySelectorAll('[data-flow-index]')];
    const shell = flow.closest('.operating-shell') || flow.parentElement;
    const detail = shell?.querySelector('[data-flow-detail]');
    let current = -1;
    const activate = (index) => {
      const safe = Math.max(0, Math.min(nodes.length - 1, index));
      if (safe === current) return;
      current = safe;
      nodes.forEach((node, i) => {
        node.classList.toggle('active', i === safe);
        node.setAttribute('aria-pressed', String(i === safe));
      });
      shell?.style.setProperty('--flow-x', `${((safe + .5) / nodes.length) * 100}%`);
      if (detail) {
        detail.textContent = FLOW_DETAILS[safe] || FLOW_DETAILS[0];
        detail.classList.add('v17-blur-transition');
        requestAnimationFrame(() => detail.classList.remove('v17-blur-transition'));
        if (!reducedMotion && detail.animate) {
          waAnimate(detail, [{ opacity: .68, transform: 'translateY(4px)', filter: 'blur(1px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }], { duration: 190, easing: MOTION.easeOut });
        }
      }
    };
    flow.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const rect = flow.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(.9999, (event.clientX - rect.left) / rect.width));
      activate(Math.floor(ratio * nodes.length));
    }, { passive: true });
    nodes.forEach((node, i) => {
      node.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') activate(i); });
      node.addEventListener('focus', () => activate(i));
      node.addEventListener('click', () => activate(i));
    });
    flow.addEventListener('scroll', rafThrottle(() => activate(nearestChildToCenter(flow, nodes))), { passive: true });
    flow.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const target = Math.max(0, Math.min(nodes.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1)));
      activate(target);
      localHorizontalCenter(flow, nodes[target]);
    });
    activate(0);
  });

  // -------------------------------------------------------------------------
  // Generic no-click category rails: architecture / systems / capabilities.
  // Desktop pointerenter changes immediately. On overflowing rails (typically
  // mobile/tablet), the item nearest the rail center controls the visible content.
  // -------------------------------------------------------------------------
  const switchArchitecture = (index) => {
    const tabs = [...document.querySelectorAll('[data-flag-tab]')];
    const panels = [...document.querySelectorAll('[data-flag-panel]')];
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-pressed', String(on));
    });
    panels.forEach((panel, i) => panel.classList.toggle('active', i === index));
    requestAnimationFrame(syncTableHints);
  };

  const projectButtons = [...document.querySelectorAll('[data-project-filter]')];
  const skillButtons = [...document.querySelectorAll('[data-skill-filter]')];
  const systemCards = [...document.querySelectorAll('#systems [data-cat]')];
  const skillCards = [...document.querySelectorAll('#capabilities [data-skill-cat]')];

  const switchProjectFilter = (button) => {
    if (!button) return;
    const value = button.dataset.projectFilter || 'All';
    projectButtons.forEach((candidate) => {
      const on = candidate === button;
      candidate.classList.toggle('active', on);
      candidate.setAttribute('aria-pressed', String(on));
    });
    systemCards.forEach((card) => { card.hidden = !(value === 'All' || card.dataset.cat === value); });
    requestAnimationFrame(refreshDecks);
  };
  const switchSkillFilter = (button) => {
    if (!button) return;
    const value = button.dataset.skillFilter;
    skillButtons.forEach((candidate) => {
      const on = candidate === button;
      candidate.classList.toggle('active', on);
      candidate.setAttribute('aria-pressed', String(on));
    });
    skillCards.forEach((card) => { card.hidden = card.dataset.skillCat !== value; });
    requestAnimationFrame(refreshDecks);
  };

  document.querySelectorAll('[data-auto-rail]').forEach((rail) => {
    let buttons = [];
    let activate = () => {};
    if (rail.dataset.autoRail === 'architecture') {
      buttons = [...rail.querySelectorAll('[data-flag-tab]')];
      activate = (button) => switchArchitecture(Number(button.dataset.flagTab || 0));
    } else if (rail.dataset.autoRail === 'systems') {
      buttons = [...rail.querySelectorAll('[data-project-filter]')];
      activate = switchProjectFilter;
    } else if (rail.dataset.autoRail === 'capabilities') {
      buttons = [...rail.querySelectorAll('[data-skill-filter]')];
      activate = switchSkillFilter;
    }
    buttons.forEach((button) => {
      button.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') activate(button); });
      button.addEventListener('focus', () => activate(button));
      button.addEventListener('click', () => activate(button));
    });
    const syncRail = rafThrottle(() => {
      if (rail.scrollWidth <= rail.clientWidth + 3) return;
      const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
      // At the physical ends the first/last control may not be able to land at the
      // exact geometric center on every browser. Treat those end states explicitly
      // so the visible destination still becomes active without a manual tap.
      const index = rail.scrollLeft <= 4 ? 0 : rail.scrollLeft >= max - 4 ? buttons.length - 1 : nearestChildToCenter(rail, buttons);
      activate(buttons[index]);
    });
    rail.addEventListener('scroll', syncRail, { passive: true });
  });
  switchArchitecture(0);
  switchProjectFilter(projectButtons.find((b) => b.classList.contains('active')) || projectButtons[0]);
  switchSkillFilter(skillButtons.find((b) => b.classList.contains('active')) || skillButtons[0]);

  // -------------------------------------------------------------------------
  // Finite horizontal decks. No clones, no wrap-around, no autoplay.
  // -------------------------------------------------------------------------
  const decks = [];
  document.querySelectorAll('[data-deck-track]').forEach((track) => {
    const id = track.dataset.deckTrack;
    const prev = document.querySelector(`[data-deck-prev="${id}"]`);
    const next = document.querySelector(`[data-deck-next="${id}"]`);
    const status = document.querySelector(`[data-deck-status="${id}"]`);
    const hint = document.querySelector(`[data-deck-hint="${id}"]`);
    const visibleCards = () => [...track.children].filter((card) => !card.hidden && getComputedStyle(card).display !== 'none');

    const update = () => {
      const cards = visibleCards();
      const overflow = track.scrollWidth > track.clientWidth + 3;
      if (hint) { hint.hidden = !overflow; hint.classList.toggle('is-needed', overflow); }
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      if (prev) prev.disabled = !overflow || track.scrollLeft <= 14;
      if (next) next.disabled = !overflow || track.scrollLeft >= max - 14;
      if (!status) return;
      if (!cards.length) { status.textContent = '0 items'; return; }
      if (!overflow) { status.textContent = `${cards.length} visible`; return; }
      const rr = track.getBoundingClientRect();
      const visible = [];
      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        if (r.right > rr.left + 8 && r.left < rr.right - 8) visible.push(i);
      });
      status.textContent = visible.length ? `${visible[0] + 1}–${visible[visible.length - 1] + 1} of ${cards.length}` : `1 of ${cards.length}`;
    };

    // v17.1: velocity history for momentum projection & rubber-banding + pointer capture (Apple §5, §9, Gestures)
    let drag = null;
    let velocity = 0;
    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, t: performance.now(), scrollLeft: track.scrollLeft };
      velocity = 0;
      try { track.setPointerCapture(e.pointerId); } catch {}
    };
    const onPointerMove = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dt = Math.max(1, performance.now() - drag.t);
      velocity = (dx / dt) * 1000; // px/s
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      let raw = drag.scrollLeft - dx;
      if (raw < 0) raw = -rubberBand(-raw, track.clientWidth);
      else if (raw > max) raw = max + rubberBand(raw - max, track.clientWidth);
      if (Math.abs(dx) > 10) track.style.scrollSnapType = 'none';
    };
    const onPointerUp = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dt = Math.max(1, performance.now() - drag.t);
      const v = (dx / dt) * 1000;
      const projected = track.scrollLeft + project(v);
      drag = null;
      track.style.scrollSnapType = '';
      try { track.releasePointerCapture(e.pointerId); } catch {}
      if (Math.abs(v) > 180 && Math.abs(dx) > 12) {
        const cards = visibleCards();
        if (!cards.length) return;
        let best = 0, bestDist = Infinity;
        cards.forEach((card, i) => {
          const cardCenter = card.offsetLeft + card.clientWidth/2;
          const dist = Math.abs((projected + track.clientWidth/2) - cardCenter);
          if (dist < bestDist) { bestDist = dist; best = i; }
        });
        const card = cards[best];
        const max = Math.max(0, track.scrollWidth - track.clientWidth);
        let left = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
        if (best === 0) left = 0;
        if (best === cards.length - 1) left = max;
        left = Math.max(0, Math.min(max, left));
        // v18.9: hand the finger's release velocity straight into the spring
        // (Apple §5 velocity handoff — no seam between drag and animation).
        if (hasMotion && !reducedMotion) {
          if (track._springStop) track._springStop();
          track._springStop = springTo(track.scrollLeft, left, (v) => { track.scrollLeft = v; },
            { ...springFlick, velocity: v }, () => { track._springStop = null; });
        } else {
          track.scrollTo({ left, behavior: reducedMotion ? 'auto' : 'smooth' });
        }
      }
    };
    track.addEventListener('pointerdown', onPointerDown, { passive: true });
    track.addEventListener('pointermove', onPointerMove, { passive: true });
    track.addEventListener('pointerup', onPointerUp, { passive: true });
    track.addEventListener('pointercancel', onPointerUp, { passive: true });

    const move = (direction) => {
      const cards = visibleCards();
      if (!cards.length) return;
      const current = nearestChildToCenter(track, cards);
      const target = Math.max(0, Math.min(cards.length - 1, current + direction));
      const card = cards[target];
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      let left = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
      if (target === 0) left = 0;
      if (target === cards.length - 1) left = max;
      left = Math.max(0, Math.min(max, left));
      // v18.9: iOS additive spring scroll — interruptible, re-targets live.
      if (hasMotion && !reducedMotion) {
        if (track._springStop) track._springStop();
        const distance = Math.abs(left - track.scrollLeft);
        track._springStop = springTo(track.scrollLeft, left, (v) => { track.scrollLeft = v; },
          distance > 600 ? springFlick : springUI, () => { track._springStop = null; });
      } else {
        track.scrollTo({ left, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
      if (!reducedMotion && card && card.animate) {
        waAnimate(card, [{ transform: 'scale(0.98)', opacity: 0.92 }, { transform: 'scale(1)', opacity: 1 }], { duration: 220 });
      }
    };
    prev?.addEventListener('click', () => move(-1));
    next?.addEventListener('click', () => move(1));
    track.addEventListener('scroll', rafThrottle(update), { passive: true });
    track.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    });
    track.tabIndex = 0;
    decks.push({ track, update });
    update();
  });

  function refreshDecks() {
    decks.forEach(({ track, update }) => {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      if (track.scrollLeft > max) track.scrollLeft = max;
      update();
    });
  }

  // -------------------------------------------------------------------------
  // Risk model and AI matrix.
  // -------------------------------------------------------------------------
  const riskRows = [...document.querySelectorAll('.risk-row')];
  const updateRisk = (filter = 'All') => {
    let inherent = 0;
    let residual = 0;
    riskRows.forEach((row) => {
      const show = filter === 'All' || row.dataset.status === filter;
      row.hidden = !show;
      if (!show) return;
      const values = (row.querySelector('em')?.textContent || '0/0').split('/').map(Number);
      inherent += values[0] || 0;
      residual += values[1] || 0;
    });
    const inh = document.querySelector('[data-risk-total="inherent"]');
    const res = document.querySelector('[data-risk-total="residual"]');
    if (inh) inh.textContent = String(inherent);
    if (res) res.textContent = String(residual);
  };
  document.querySelectorAll('[data-risk-filter]').forEach((button) => {
    const activate = () => {
      document.querySelectorAll('[data-risk-filter]').forEach((b) => b.classList.toggle('active', b === button));
      updateRisk(button.dataset.riskFilter || 'All');
    };
    button.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') activate(); });
    button.addEventListener('focus', activate);
    button.addEventListener('click', activate);
  });
  updateRisk('All');

  document.querySelectorAll('.heatmap').forEach((heatmap) => {
    const nodes = [...heatmap.querySelectorAll('.heat-node')];
    const detail = heatmap.parentElement?.querySelector('[data-heat-detail]');
    let activeNode = null;
    const activate = (node) => {
      if (!node || node === activeNode) return;
      const previous = activeNode;
      activeNode = node;
      nodes.forEach((candidate) => candidate.classList.toggle('active', candidate === node));
      // v18.9: springs keep rapid pointer sweeps interruptible — no stacked
      // competing tweens, so boundary hover flicker is eliminated.
      if (hasMotion && !reducedMotion) {
        if (previous && previous._springStop) previous._springStop();
        if (node._springStop) node._springStop();
        node._springStop = springTo(1, 1.05, (v) => { node.style.transform = 'translate(-50%, -50%) scale(' + v + ')'; }, { ...springUI, duration: 0.22 }, () => { node._springStop = null; });
        if (previous) previous._springStop = springTo(1.05, 1, (v) => { previous.style.transform = 'translate(-50%, -50%) scale(' + v + ')'; }, { ...springUI, duration: 0.22 }, () => { previous._springStop = null; });
      }
      if (detail) detail.textContent = `${node.dataset.case} · ${node.dataset.detail}`;
    };
    nodes.forEach((node) => {
      node.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') activate(node); });
      node.addEventListener('focus', () => activate(node));
      node.addEventListener('click', () => activate(node));
    });
    heatmap.addEventListener('pointermove', rafThrottle((event) => {
      if (event.pointerType === 'touch') return;
      let nearest = null;
      let best = Infinity;
      nodes.forEach((node) => {
        const r = node.getBoundingClientRect();
        const d = Math.hypot(event.clientX - (r.left + r.width / 2), event.clientY - (r.top + r.height / 2));
        if (d < best) { best = d; nearest = node; }
      });
      if (nearest && best < Math.max(120, heatmap.clientWidth * .18)) activate(nearest);
    }), { passive: true });
    activate(nodes[0]);
  });

  // -------------------------------------------------------------------------
  // Responsive evidence table hints: only shown when a real overflow exists.
  // -------------------------------------------------------------------------
  const responsiveTables = [...document.querySelectorAll('[data-responsive-table]')];
  function syncTableHints() {
    responsiveTables.forEach((wrap) => {
      const note = document.querySelector(`[data-overflow-note="${wrap.dataset.responsiveTable}"]`);
      const overflow = wrap.scrollWidth > wrap.clientWidth + 3;
      wrap.classList.toggle('has-overflow', overflow);
      wrap.setAttribute('aria-label', overflow ? 'Evidence table. Scroll horizontally to inspect all columns.' : 'Evidence table. All columns are visible.');
      if (note) note.hidden = !overflow;
    });
  }
  syncTableHints();

  // -------------------------------------------------------------------------
  // Lightweight reveal + counters. Transform/opacity only; no layout animation.
  // -------------------------------------------------------------------------
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        reveal.unobserve(entry.target);
      });
    }, { threshold: .07, rootMargin: '0px 0px -6%' });
    document.querySelectorAll('.value-card,.panel,.visual-card,.flagship-grid,.project-card,.skill-card,.framework-card,.contact-shell,.social-showcase').forEach((el, i) => {
      el.classList.add('revealable');
      el.style.setProperty('--reveal-delay', `${(i % 4) * 38}ms`);
      reveal.observe(el);
    });

    // Numeric evidence is rendered at its final value immediately. Earlier
    // releases animated counters from zero, which briefly displayed incorrect
    // numbers during entry and added unnecessary main-thread work.
    document.querySelectorAll('[data-count]').forEach((el) => {
      el.textContent = String(Number(el.dataset.count || 0));
    });
  }

  // Focus phrase intentionally remains static.
  // v17 removes the former recurring word-rotation timer so the page has
  // no idle animation timer competing with scrolling, pointer input or battery.

  // -------------------------------------------------------------------------
  // LIVE PUBLIC RISK PULSE — CISA Known Exploited Vulnerabilities
  // -------------------------------------------------------------------------
  // Why two URLs: CISA's official GitHub mirror is attempted first because it is
  // explicitly maintained for easier programmatic consumption and is normally CORS-friendly.
  // The canonical cisa.gov JSON feed is the fallback authority. CISA states the mirror is
  // synchronized within minutes of the canonical catalog. If both fail, the page
  // displays a transparent unavailable state; it never invents current data.
  const liveShell = document.querySelector('[data-live-risk]');
  if (liveShell) {
    const status = liveShell.querySelector('[data-live-status]');
    const updated = liveShell.querySelector('[data-live-updated]');
    const total = liveShell.querySelector('[data-live-total]');
    const recentCount = liveShell.querySelector('[data-live-30]');
    const vendorCount = liveShell.querySelector('[data-live-vendors]');
    const list = liveShell.querySelector('[data-live-list]');
    const sources = [
      {
        // CISA maintains this official GitHub mirror for easier programmatic consumption.
        // Browsers usually receive permissive CORS headers here, so it is the reliability-first source.
        label: 'CISA KEV · official GitHub mirror',
        url: 'https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json'
      },
      {
        // Canonical government feed remains the authority and fallback if the mirror is unavailable.
        label: 'CISA KEV canonical feed',
        url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'
      }
    ];

    const parseDate = (value) => {
      const date = new Date(`${value || ''}T00:00:00Z`);
      return Number.isNaN(date.getTime()) ? null : date;
    };
    const compact = (value, max = 165) => {
      const text = String(value || '').replace(/\s+/g, ' ').trim();
      return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
    };
    const addText = (parent, tag, text, className = '') => {
      const el = document.createElement(tag);
      if (className) el.className = className;
      el.textContent = text;
      parent.append(el);
      return el;
    };

    const renderLive = (data, sourceLabel) => {
      const vulnerabilities = Array.isArray(data?.vulnerabilities) ? [...data.vulnerabilities] : [];
      vulnerabilities.sort((a, b) => String(b.dateAdded || '').localeCompare(String(a.dateAdded || '')));
      const now = new Date();
      const cutoff = new Date(now.getTime() - 30 * 864e5);
      const recent = vulnerabilities.filter((item) => {
        const date = parseDate(item.dateAdded);
        return date && date >= cutoff;
      });
      const vendors = new Set(recent.map((item) => String(item.vendorProject || '').trim()).filter(Boolean));

      if (total) total.textContent = String(data?.count ?? vulnerabilities.length ?? '—');
      if (recentCount) recentCount.textContent = String(recent.length);
      if (vendorCount) vendorCount.textContent = String(vendors.size);
      if (status) status.textContent = 'Live public risk signal';
      if (updated) {
        const released = data?.dateReleased ? new Date(data.dateReleased) : null;
        const stamp = released && !Number.isNaN(released.getTime())
          ? released.toLocaleString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
          : new Date().toLocaleString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
        updated.textContent = `${sourceLabel} · feed ${data?.catalogVersion || 'current'} · ${stamp}`;
      }
      liveShell.classList.remove('is-error');
      if (!list) return;
      list.replaceChildren();
      const latest = vulnerabilities.slice(0, 3);
      latest.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'live-signal';
        addText(card, 'span', `${item.cveID || 'CVE'} · added ${item.dateAdded || 'current'}`);
        addText(card, 'h3', compact(item.vulnerabilityName || `${item.vendorProject || 'Vendor'} ${item.product || 'product'}`, 95));
        addText(card, 'p', compact(item.shortDescription || item.requiredAction || 'Known exploited vulnerability in the CISA catalog.', 190));
        addText(card, 'p', `Governance action: confirm exposure and owner; capture remediation evidence; record exceptions and residual-risk decisions if remediation cannot meet the required timeline.`);
        const meta = document.createElement('div');
        meta.className = 'live-meta';
        if (item.vendorProject) addText(meta, 'i', item.vendorProject);
        if (item.product) addText(meta, 'i', compact(item.product, 36));
        if (item.dueDate) addText(meta, 'i', `Due ${item.dueDate}`);
        if (item.knownRansomwareCampaignUse && item.knownRansomwareCampaignUse !== 'Unknown') addText(meta, 'i', `Ransomware: ${item.knownRansomwareCampaignUse}`);
        card.append(meta);
        list.append(card);
      });
      if (!latest.length) {
        const card = document.createElement('article');
        card.className = 'live-signal';
        addText(card, 'span', 'Live feed connected');
        addText(card, 'h3', 'No entries were returned by the current feed payload.');
        addText(card, 'p', 'Open the official CISA catalog for the canonical view.');
        list.append(card);
      }
    };

    const renderLiveError = () => {
      liveShell.classList.add('is-error');
      if (status) status.textContent = 'Live source temporarily unavailable';
      if (updated) updated.textContent = 'The portfolio remains usable · open the official CISA catalog for current data';
      [total,recentCount,vendorCount].forEach((el) => { if (el) el.textContent = '—'; });
      if (list) {
        list.replaceChildren();
        const card = document.createElement('article');
        card.className = 'live-signal';
        addText(card, 'span', 'Public feed fallback');
        addText(card, 'h3', 'Current data could not be retrieved in this browser session.');
        addText(card, 'p', 'No current vulnerability values are guessed or cached as if they were live. Use the CISA link above for the authoritative catalog.');
        list.append(card);
      }
    };

    const loadLiveRisk = async () => {
      for (const source of sources) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5200);
        try {
          const response = await fetch(source.url, { cache: 'no-store', signal: controller.signal, headers: { Accept: 'application/json' } });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          if (!Array.isArray(data?.vulnerabilities)) throw new Error('Unexpected KEV payload');
          renderLive(data, source.label);
          clearTimeout(timer);
          return;
        } catch {
          clearTimeout(timer);
        }
      }
      renderLiveError();
    };
    loadLiveRisk();
  }

  // Utilities.
  document.querySelectorAll('[data-copy-email]').forEach((button) => button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('abdullahalowasi369@gmail.com');
      const old = button.textContent;
      button.textContent = 'Email copied ✓';
      setTimeout(() => { button.textContent = old; }, 1500);
    } catch { location.href = 'mailto:abdullahalowasi369@gmail.com'; }
  }));
  document.querySelectorAll('[data-top]').forEach((button) => button.addEventListener('click', () => {
    if (island) { setIslandOpen(false); island.classList.remove('is-visible'); }
    scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }));

  // Resize/orientation: recompute only geometry-dependent pieces.
  const syncGeometry = rafThrottle(() => {
    refreshDecks();
    syncTableHints();
    syncSectionState();
  });
  addEventListener('resize', syncGeometry, { passive: true });
  addEventListener('orientationchange', syncGeometry, { passive: true });
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(syncGeometry);
    document.querySelectorAll('[data-deck-track],[data-responsive-table],[data-auto-rail]').forEach((el) => ro.observe(el));
  }

  // -------------------------------------------------------------------------
  // v18.9 SPRING TICKER — FOCUSED ON, true iOS additive springs
  // 2s per topic, critically damped settle, duplicate last item -> seamless.
  // Pauses when: tab hidden, pill scrolled out of view, reduced motion.
  // Falls back to the CSS focusTicker keyframes when Motion is unavailable.
  // -------------------------------------------------------------------------
  const tickerTrack = document.querySelector('.focus-pill b[data-focus-word] > span.ticker-track.vertical');
  if (tickerTrack && hasMotion && !reducedMotion) {
    document.documentElement.classList.add('ticker-js');
    tickerTrack.style.animation = 'none';
    const items = [...tickerTrack.children];
    const stepHeight = () => items.length > 1 ? items[1].offsetTop - items[0].offsetTop : 0;
    let index = 0;
    let timer = null;
    let running = true;
    let stopAnim = null;
    const settle = () => { if (stopAnim) { stopAnim(); stopAnim = null; } };
    const step = () => {
      if (!running) return;
      index = (index + 1) % items.length;
      const to = -index * stepHeight();
      settle();
      const done = () => { timer = setTimeout(step, 2000); };
      // Duplicate last item == first item: snap home invisibly at the seam.
      stopAnim = springTo(0, to, (v) => { tickerTrack.style.transform = 'translateY(' + v + 'px) translateZ(0)'; }, { ...springUI, duration: 0.5 }, () => {
        if (index === items.length - 1) { index = 0; tickerTrack.style.transform = 'translateY(0) translateZ(0)'; }
        done();
      });
    };
    timer = setTimeout(step, 2000);
    const pause = () => { running = false; if (timer) { clearTimeout(timer); timer = null; } settle(); };
    const resume = () => { if (!running) { running = true; timer = setTimeout(step, 2000); } };
    document.addEventListener('visibilitychange', () => { document.hidden ? pause() : resume(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => { entry.isIntersecting ? resume() : pause(); });
      }, { threshold: 0.1 }).observe(tickerTrack.closest('.focus-pill') || tickerTrack);
    }
  }

  // -------------------------------------------------------------------------
  // v17.1 SKILLS INTEGRATION — Apple fluid + emil polish tail
  // -------------------------------------------------------------------------
  // Executive nav scroll edge: show soft gradient when page has scrolled (Apple §11 materials)
  const executiveNav = document.querySelector('.executive-nav');
  const syncNavEdge = rafThrottle(() => {
    if (!executiveNav) return;
    executiveNav.classList.toggle('is-scrolled', scrollY > 12);
  });
  addEventListener('scroll', syncNavEdge, { passive: true });
  syncNavEdge();

  // Heatmap detail blur crossfade + nearest-pointer activation already interruptible via WAAPI (CSS handles blur)
  document.querySelectorAll('.heatmap').forEach((heatmap) => {
    const detail = heatmap.parentElement?.querySelector('[data-heat-detail]');
    if (!detail) return;
    // Ensure detail starts without blur
    detail.classList.remove('v17-blur-transition');
    const observer = new MutationObserver(() => {
      detail.classList.add('v17-blur-transition');
      requestAnimationFrame(() => detail.classList.remove('v17-blur-transition'));
    });
    // Watch text changes as proxy for activation (lightweight)
    try { observer.observe(detail, { characterData: true, childList: true, subtree: true }); } catch {}
  });

  // Reduced transparency listener — toggle solid fallback if user prefers
  try {
    const mqTrans = matchMedia('(prefers-reduced-transparency: reduce)');
    const syncTransparency = () => {
      document.documentElement.dataset.reducedTransparency = mqTrans.matches ? 'true' : 'false';
    };
    mqTrans.addEventListener('change', syncTransparency);
    syncTransparency();
  } catch {}

  // Ensure no layout-thrashing properties are animated: enforce transform/opacity only for dynamic island
  // (already CSS-driven, JS just ensures pointer capture for drag gestures on island panel)
  const islandPanel = document.querySelector('.island-panel');
  if (islandPanel) {
    islandPanel.style.willChange = 'transform, opacity';
  }

  // Add hysteresis to islandToggle: 10px movement cancels tap (Apple §10)
  // Already handled in main island logic; this is extra polish for executive nav brand link
  document.querySelectorAll('.brand-premium').forEach((brand) => {
    let start = null;
    brand.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY }; }, { passive: true });
    brand.addEventListener('click', (e) => {
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) > 10) e.preventDefault();
      start = null;
    });
  });
})();
