/* site.js (patched)
   - Restores HERO text rendering (reads data-hero-title/sub/bg spans)
   - Stable slide transition using 2 background layers (hero-bgs > .hero-bg x2)
   - Handles random dot clicks without glitch
   - Removes '/n' and '\n' by converting to single-line spaces
*/
document.addEventListener('DOMContentLoaded', () => {
  // ================= Header scroll =================
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 10) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ================= Mobile nav toggle =================
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
    });
    // click outside menu to close (mobile overlay)
    mainNav.addEventListener('click', (e) => {
      if (e.target === mainNav) document.body.classList.remove('nav-open');
    });
  }

  // ================= HERO slider =================
  const hero = document.querySelector('.hero[data-hero="slides"]');
  if (!hero) return;

  const titleEl = hero.querySelector('.hero-title');
  const subEl   = hero.querySelector('.hero-sub');
  const dots    = Array.from(hero.querySelectorAll('.hero-dot'));

  const titleNodes = Array.from(hero.querySelectorAll('[data-hero-title]'));
  const subNodes   = Array.from(hero.querySelectorAll('[data-hero-sub]'));
  const bgNodes    = Array.from(hero.querySelectorAll('[data-hero-bg]'));

  const slidesCount = Math.min(titleNodes.length, subNodes.length, bgNodes.length);
  if (!slidesCount) return;

  const titles = [];
  const subs   = [];
  const bgs    = [];

  const cleanOneLine = (s) => (s || "")
    // turn /n, \n, real newline into spaces (single-line intent)
    .replace(/(\/n|\\n|\r?\n)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (let i = 0; i < slidesCount; i++) {
    titles.push(cleanOneLine(titleNodes[i].getAttribute('data-hero-title')));
    subs.push(cleanOneLine(subNodes[i].getAttribute('data-hero-sub')));
    bgs.push((bgNodes[i].getAttribute('data-hero-bg') || "").trim());
  }

  const bgLayers = Array.from(hero.querySelectorAll('.hero-bgs .hero-bg'));
  const hasTwoLayers = bgLayers.length >= 2;

  // Ensure layers are ready (inline safety styles so black screen won't happen)
  if (hasTwoLayers) {
    bgLayers.forEach((layer, idx) => {
      layer.style.backgroundSize = 'cover';
      layer.style.backgroundPosition = 'center';
      layer.style.backgroundRepeat = 'no-repeat';
      layer.style.position = 'absolute';
      layer.style.inset = '0';
      layer.style.willChange = 'transform, opacity';
      layer.style.transition = 'transform 700ms ease, opacity 700ms ease';
      layer.style.opacity = (idx === 0 ? '1' : '0');
      layer.style.transform = 'translateX(0)';
    });
  }

  let current = 0;
  let activeLayer = 0; // 0 or 1
  let timer = null;
  let isAnimating = false;
  let queuedTarget = null;

  const renderText = (i) => {
    if (titleEl) titleEl.textContent = titles[i] || "";
    if (subEl) subEl.textContent = subs[i] || "";
  };

  const setDots = (i) => {
    dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
  };

  const setBgInstant = (i) => {
    if (!hasTwoLayers) {
      // fallback: set hero background
      hero.style.backgroundImage = bgs[i] ? `url('${bgs[i]}')` : 'none';
      hero.style.backgroundSize = 'cover';
      hero.style.backgroundPosition = 'center';
      return;
    }
    bgLayers[activeLayer].style.backgroundImage = bgs[i] ? `url('${bgs[i]}')` : 'none';
    bgLayers[activeLayer].style.opacity = '1';
    bgLayers[activeLayer].style.transform = 'translateX(0)';
    const other = 1 - activeLayer;
    bgLayers[other].style.opacity = '0';
    bgLayers[other].style.transform = 'translateX(0)';
  };

  const goTo = (target, opts = {}) => {
    const { instant = false } = opts;
    if (target === current) return;

    if (isAnimating && !instant) {
      queuedTarget = target;
      return;
    }

    if (instant || !hasTwoLayers) {
      current = target;
      renderText(current);
      setDots(current);
      setBgInstant(current);
      return;
    }

    isAnimating = true;
    queuedTarget = null;

    // determine direction (slide)
    const dir = (target > current) ? 1 : -1; // 1: next comes from right, -1: from left

    const fromLayer = bgLayers[activeLayer];
    const toLayerIndex = 1 - activeLayer;
    const toLayer = bgLayers[toLayerIndex];

    // prepare next layer offscreen
    toLayer.style.transition = 'none';
    toLayer.style.backgroundImage = bgs[target] ? `url('${bgs[target]}')` : 'none';
    toLayer.style.opacity = '1';
    toLayer.style.transform = `translateX(${dir * 18}%)`; // subtle slide distance
    // force reflow
    void toLayer.offsetWidth;

    // animate both
    toLayer.style.transition = 'transform 700ms ease, opacity 700ms ease';
    fromLayer.style.transition = 'transform 700ms ease, opacity 700ms ease';

    // text update slightly after start (keeps motion natural)
    renderText(target);
    setDots(target);

    requestAnimationFrame(() => {
      toLayer.style.transform = 'translateX(0)';
      fromLayer.style.transform = `translateX(${-dir * 18}%)`;
      fromLayer.style.opacity = '0';
    });

    const onEnd = () => {
      // finalize
      fromLayer.style.transition = 'none';
      fromLayer.style.transform = 'translateX(0)';
      fromLayer.style.opacity = '0';
      // keep active layer visible
      toLayer.style.opacity = '1';
      toLayer.style.transform = 'translateX(0)';
      activeLayer = toLayerIndex;
      current = target;

      // restore transitions
      requestAnimationFrame(() => {
        fromLayer.style.transition = 'transform 700ms ease, opacity 700ms ease';
      });

      isAnimating = false;

      if (queuedTarget !== null && queuedTarget !== current) {
        const q = queuedTarget;
        queuedTarget = null;
        goTo(q);
      }
    };

    // transitionend can fire twice (transform + opacity). Use a single timer guard.
    let ended = false;
    const endOnce = () => {
      if (ended) return;
      ended = true;
      toLayer.removeEventListener('transitionend', endOnce);
      onEnd();
    };
    toLayer.addEventListener('transitionend', endOnce);
    // hard fallback
    setTimeout(endOnce, 900);
  };

  const startAuto = () => {
    stopAuto();
    timer = setInterval(() => {
      const next = (current + 1) % slidesCount;
      goTo(next);
    }, 5000);
  };
  const stopAuto = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  // init
  renderText(current);
  setDots(current);
  setBgInstant(current);
  startAuto();

  // dots click (random jump)
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      stopAuto();
      goTo(idx);
      startAuto();
    });
  });
});
