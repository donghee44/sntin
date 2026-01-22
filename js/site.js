(function(){
  function qs(sel, root){ return (root||document).querySelector(sel); }
  function qsa(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }

  // Mobile nav toggle
  const toggle = qs('.nav-toggle');
  const nav = qs('.main-nav');
  if(toggle && nav){
    toggle.addEventListener('click', function(){
      document.body.classList.toggle('nav-open');
    });
    nav.addEventListener('click', function(e){
      // close when clicking backdrop
      if(e.target === nav){ document.body.classList.remove('nav-open'); }
    });
    // close on link click (mobile)
    qsa('.menu a', nav).forEach(a=>{
      a.addEventListener('click', ()=> document.body.classList.remove('nav-open'));
    });
  }

  // Header scroll behavior (home)
  const header = qs('.site-header');
  function onScroll(){
    if(!header) return;
    if(window.scrollY > 24) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // Home hero slider (text + background)
  const hero = qs('.hero[data-hero="slides"]');
  if(hero){
    const titles = qsa('[data-hero-title]', hero).map(el => el.getAttribute('data-hero-title') || '');
    const subs   = qsa('[data-hero-sub]', hero).map(el => el.getAttribute('data-hero-sub') || '');
    const bgs    = qsa('[data-hero-bg]', hero).map(el => el.getAttribute('data-hero-bg') || '');

    const titleEl = qs('.hero-title', hero);
    const subEl   = qs('.hero-sub', hero);
    const dots    = qsa('.hero-dot', hero);

    const layers = qsa('.hero-bg', hero);

    // normalize linebreak markers so it stays single-line (remove /n, \n, real newlines)
    function oneLine(s){
      return String(s || '')
        .replace(/\\n|\/n|\r?\n/g, ' ')
        .replace(/\s+/g,' ')
        .trim();
    }

    let idx = 0;
    let timer = null;

    function setBg(i, immediate){
      const bg = (bgs[i] || bgs[0] || '').trim();
      if(!bg || layers.length === 0) return;

      if(layers.length === 1){
        layers[0].style.backgroundImage = `url('${bg}')`;
        layers[0].classList.add('is-active');
        return;
      }

      const active = layers.find(l => l.classList.contains('is-active')) || layers[0];
      const next   = layers.find(l => l !== active) || layers[1];

      if(immediate){
        layers.forEach(l => l.classList.remove('is-active','is-exit'));
        layers[0].style.backgroundImage = `url('${bg}')`;
        layers[0].classList.add('is-active');
        return;
      }

      // prepare next layer from right
      next.classList.remove('is-exit','is-active');
      next.style.backgroundImage = `url('${bg}')`;
      // force reflow for transition
      void next.offsetWidth;
      next.classList.add('is-active');

      // move current out to left
      active.classList.add('is-exit');

      window.clearTimeout(hero._bgT);
      hero._bgT = window.setTimeout(()=>{
        active.classList.remove('is-active','is-exit');
      }, 950);
    }

    function setText(i){
      if(titleEl) titleEl.textContent = oneLine(titles[i] || '');
      if(subEl)   subEl.textContent   = oneLine(subs[i]   || '');
      dots.forEach((d,k)=> d.classList.toggle('active', k===i));
    }

    function render(i, immediate){
      const count = Math.max(titles.length, subs.length, bgs.length, 1);
      idx = ((i % count) + count) % count;

      if(immediate){
        hero.classList.remove('is-changing');
        setText(idx);
        setBg(idx, true);
        return;
      }

      hero.classList.add('is-changing');
      window.clearTimeout(hero._t);
      hero._t = window.setTimeout(()=>{
        setText(idx);
        setBg(idx, false);
        hero.classList.remove('is-changing');
      }, 260);
    }

    function next(){
      render(idx + 1, false);
    }

    // dots click
    dots.forEach((d,k)=> d.addEventListener('click', ()=>{
      window.clearInterval(timer);
      render(k, false);
      timer = window.setInterval(next, 5200);
    }));

    // init (important: set first background immediately to avoid black screen)
    render(0, true);
    timer = window.setInterval(next, 5200);
  }
})();