async function loadNotices(listId, limit){
  try{
    const res = await fetch('./data/notices.json', {cache:'no-store'});
    const arr = await res.json();
    const ul = document.getElementById(listId);
    if(!ul) return;
    ul.innerHTML = '';
    const use = (typeof limit === 'number') ? arr.slice(0, limit) : arr;

    if(!use.length){
      const li = document.createElement('li');
      li.textContent = '등록된 공지사항이 없습니다.';
      li.style.color = '#777';
      ul.appendChild(li);
      return;
    }

    use.forEach(function(n){
      const li = document.createElement('li');

      const row = document.createElement('div');
      row.className = 'notice-row';

      const d = document.createElement('span');
      d.className = 'notice-date';
      d.textContent = n.date || '';

      const t = document.createElement('span');
      t.className = 'notice-title';
      t.textContent = n.title || '';

      row.appendChild(d);
      row.appendChild(t);
      li.appendChild(row);

      if(n.content){
        const c = document.createElement('div');
        c.className = 'notice-content';
        c.textContent = n.content;
        li.appendChild(c);
      }

      ul.appendChild(li);
    });
  }catch(e){
    console.log('공지 로드 실패', e);
  }
}