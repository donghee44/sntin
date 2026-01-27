/* ===== Common header/footer injector (GitHub Pages friendly) =====
   - Works on GitHub Pages / local server.
   - If opened via file:// and fetch is blocked, the inline fallback inside
     #site-header / #site-footer will remain visible.
*/
async function injectCommon(){
  const headerMount = document.getElementById('site-header');
  const footerMount = document.getElementById('site-footer');

  if (headerMount) {
    try{
      const html = await fetch('partials/header.html').then(r => r.text());
      headerMount.outerHTML = html;
    }catch(e){
      // keep fallback
      console.warn('Header partial load failed, using fallback markup.', e);
    }
  }

  if (footerMount) {
    try{
      const html = await fetch('partials/footer.html').then(r => r.text());
      footerMount.outerHTML = html;
    }catch(e){
      console.warn('Footer partial load failed, using fallback markup.', e);
    }
  }
}


/* site.js (patched)
   - Header scroll + mobile nav
   - Home HERO slider stays as-is (if present)
   - Inner pages: prevent hash (#tabX) from landing deep in content; keep user at tab menu
*/
document.addEventListener('DOMContentLoaded', async () => {
  await injectCommon();
  // Prevent browser restoring a scrolled position (back/forward)
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch(e) {}

  const header = document.querySelector('.site-header');
  const HEADER_OFFSET = 92;

  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 10) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile nav
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => document.body.classList.toggle('nav-open'));
    mainNav.addEventListener('click', (e) => { if (e.target === mainNav) document.body.classList.remove('nav-open'); });
  }

  // === Home HERO slider (existing structure) ===
  const hero = document.querySelector('.hero[data-hero="slides"]');
  if (hero) {
    const titleEl = hero.querySelector('.hero-title');
    const subEl   = hero.querySelector('.hero-sub');
    const dots    = Array.from(hero.querySelectorAll('.hero-dot'));

    const titleNodes = Array.from(hero.querySelectorAll('[data-hero-title]'));
    const subNodes   = Array.from(hero.querySelectorAll('[data-hero-sub]'));
    const bgNodes    = Array.from(hero.querySelectorAll('[data-hero-bg]'));

    const slidesCount = Math.min(titleNodes.length, subNodes.length, bgNodes.length);
    if (slidesCount) {
      const cleanOneLine = (s) => (s || "")
        .replace(/(\/n|\\n|\r?\n)/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const titles = [];
      const subs   = [];
      const bgs    = [];
      for (let i = 0; i < slidesCount; i++) {
        titles.push(cleanOneLine(titleNodes[i].getAttribute('data-hero-title')));
        subs.push(cleanOneLine(subNodes[i].getAttribute('data-hero-sub')));
        bgs.push((bgNodes[i].getAttribute('data-hero-bg') || "").trim());
      }

      const bgLayers = Array.from(hero.querySelectorAll('.hero-bgs .hero-bg'));
      const hasTwoLayers = bgLayers.length >= 2;

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
      let activeLayer = 0;
      let timer = null;
      let isAnimating = false;
      let queuedTarget = null;

      const renderText = (i) => {
        if (titleEl) titleEl.textContent = titles[i] || "";
        if (subEl) subEl.textContent = subs[i] || "";
      };
      const setDots = (i) => dots.forEach((d, idx) => d.classList.toggle('active', idx === i));

      const setBgInstant = (i) => {
        if (!hasTwoLayers) {
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

      const goTo = (target) => {
        if (target === current) return;
        if (isAnimating) { queuedTarget = target; return; }
        if (!hasTwoLayers) {
          current = target; renderText(current); setDots(current); setBgInstant(current); return;
        }

        isAnimating = true;
        queuedTarget = null;

        const dir = (target > current) ? 1 : -1;
        const fromLayer = bgLayers[activeLayer];
        const toLayerIndex = 1 - activeLayer;
        const toLayer = bgLayers[toLayerIndex];

        toLayer.style.transition = 'none';
        toLayer.style.backgroundImage = bgs[target] ? `url('${bgs[target]}')` : 'none';
        toLayer.style.opacity = '1';
        toLayer.style.transform = `translateX(${dir * 18}%)`;
        void toLayer.offsetWidth;

        toLayer.style.transition = 'transform 700ms ease, opacity 700ms ease';
        fromLayer.style.transition = 'transform 700ms ease, opacity 700ms ease';

        renderText(target);
        setDots(target);

        requestAnimationFrame(() => {
          toLayer.style.transform = 'translateX(0)';
          fromLayer.style.transform = `translateX(${-dir * 18}%)`;
          fromLayer.style.opacity = '0';
        });

        let ended = false;
        const endOnce = () => {
          if (ended) return;
          ended = true;
          toLayer.removeEventListener('transitionend', endOnce);

          fromLayer.style.transition = 'none';
          fromLayer.style.transform = 'translateX(0)';
          fromLayer.style.opacity = '0';
          toLayer.style.opacity = '1';
          toLayer.style.transform = 'translateX(0)';
          activeLayer = toLayerIndex;
          current = target;

          requestAnimationFrame(() => {
            fromLayer.style.transition = 'transform 700ms ease, opacity 700ms ease';
          });

          isAnimating = false;
          if (queuedTarget !== null && queuedTarget !== current) {
            const q = queuedTarget; queuedTarget = null; goTo(q);
          }
        };

        toLayer.addEventListener('transitionend', endOnce);
        setTimeout(endOnce, 900);
      };

      const startAuto = () => {
        stopAuto();
        timer = setInterval(() => goTo((current + 1) % slidesCount), 5000);
      };
      const stopAuto = () => { if (timer) clearInterval(timer); timer = null; };

      renderText(current);
      setDots(current);
      setBgInstant(current);
      startAuto();

      dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => { stopAuto(); goTo(idx); startAuto(); });
      });
    }
  }

  // === Inner pages: after everything loads, force position to tab menu/top ===
  if (!document.body.classList.contains('has-hero')) {
    const tabMenu = document.querySelector('.tab-menu');
    const hash = (location.hash || '').trim();

    const snapToMenu = () => {
      if (!tabMenu) return;
      const y = tabMenu.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top: Math.max(0, y), left: 0, behavior: 'auto' });
    };

    window.addEventListener('load', () => {
      // If no hash, always top
      if (!hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        return;
      }
      // If hash is tab, land at menu (not deep in content)
      if (/^#tab\d+$/.test(hash)) {
        // run twice to win against any other scripts that scroll
        snapToMenu();
        setTimeout(snapToMenu, 30);
        setTimeout(snapToMenu, 120);
      }
    });
  }
});
