(function(){
  var hasInit = false;

  function getTabs(){
    return Array.from(document.querySelectorAll('.tab-menu li[data-tab]'));
  }

  function initTabs(){
    if (hasInit) return;
    hasInit = true;

    var tabMenu = document.querySelector('.tab-menu');
    if (!tabMenu) return;

    var list = tabMenu.querySelector('ul');
    if (list) list.setAttribute('role', 'tablist');

    var tabs = getTabs();
    tabs.forEach(function(li, idx){
      var id = li.dataset.tab;
      var tabId = li.id || ('tab-' + id);
      li.id = tabId;
      li.setAttribute('role', 'tab');
      li.setAttribute('tabindex', li.classList.contains('active') ? '0' : '-1');
      li.setAttribute('aria-selected', li.classList.contains('active') ? 'true' : 'false');

      var panel = document.getElementById(id);
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tabId);
      }
    });

    tabMenu.addEventListener('keydown', function(e){
      var target = e.target.closest('li[data-tab]');
      if (!target) return;
      var tabsList = getTabs();
      var index = tabsList.indexOf(target);
      if (index === -1) return;

      var nextIndex = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIndex = (index + 1) % tabsList.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextIndex = (index - 1 + tabsList.length) % tabsList.length;
      if (e.key === 'Home') nextIndex = 0;
      if (e.key === 'End') nextIndex = tabsList.length - 1;

      if (nextIndex !== null) {
        e.preventDefault();
        tabsList[nextIndex].focus();
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showTab(target.dataset.tab);
        history.replaceState(null, '', '#' + target.dataset.tab);
      }
    });
  }

  function showTab(id){
    initTabs();
    getTabs().forEach(function(li){
      var active = li.dataset.tab === id;
      li.classList.toggle('active', active);
      li.setAttribute('aria-selected', active ? 'true' : 'false');
      li.setAttribute('tabindex', active ? '0' : '-1');
    });
    document.querySelectorAll('.content-box').forEach(function(b){
      var active = b.id === id;
      b.classList.toggle('active', active);
      b.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    window.scrollTo({top:0,left:0,behavior:'auto'});
  }

  function tabFromHash(def){
    initTabs();
    var h = (location.hash||'').replace('#','');
    if(h && document.getElementById(h)){ showTab(h); return; }
    showTab(def || 'tab1');
  }

  window.SNTTabs = { showTab: showTab, tabFromHash: tabFromHash, init: initTabs };
})();
