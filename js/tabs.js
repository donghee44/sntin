(function(){
  function showTab(id){
    document.querySelectorAll('.tab-menu li').forEach(function(li){
      li.classList.toggle('active', li.dataset.tab === id);
    });
    document.querySelectorAll('.content-box').forEach(function(b){
      b.classList.toggle('active', b.id === id);
    });
    window.scrollTo({top:0,left:0,behavior:'instant'});
  }
  function tabFromHash(def){
    var h = (location.hash||'').replace('#','');
    if(h && document.getElementById(h)){ showTab(h); return; }
    showTab(def || 'tab1');
  }
  window.SNTTabs = { showTab: showTab, tabFromHash: tabFromHash };
})();