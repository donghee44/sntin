async function loadNotices(listId, limit){
  try{
    const res = await fetch('./data/notices.json');
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


/* Support page: board style notice list (static site / no DB) */
async function loadNoticeBoard(tbodyId, detailWrapId){
  try{
    const res = await fetch('./data/notices.json');
    const arr = await res.json();
    const tbody = document.getElementById(tbodyId);
    if(!tbody) return;

    tbody.innerHTML = '';

    if(!Array.isArray(arr) || !arr.length){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="3" style="text-align:center;color:#777;padding:18px;">등록된 공지사항이 없습니다.</td>`;
      tbody.appendChild(tr);
      return;
    }

    // 최신글이 위로 오도록(작성일 기준, 동일하면 기존 순서)
    const sorted = [...arr].sort((a,b)=>{
      const ad = (a.date || '').replace(/[^0-9]/g,'');
      const bd = (b.date || '').replace(/[^0-9]/g,'');
      return bd.localeCompare(ad);
    });

    sorted.forEach((n, idx)=>{
      const tr = document.createElement('tr');
      const no = idx + 1;
      const title = n.title || '';
      const date = n.date || '';

      tr.innerHTML = `
        <td class="col-no">${no}</td>
        <td class="col-title"><a href="javascript:void(0)" class="notice-link" data-idx="${idx}">${title}</a></td>
        <td class="col-date">${date}</td>
      `;
      tbody.appendChild(tr);
    });

    // click handler
    tbody.addEventListener('click', (e)=>{
      const link = e.target.closest('a.notice-link');
      if(!link) return;
      const idx = Number(link.getAttribute('data-idx'));
      const n = sorted[idx];
      openNoticeDetail(n, detailWrapId);
    }, { once:false });

  }catch(e){
    console.log('공지 게시판 로드 실패', e);
  }
}

function openNoticeDetail(notice, detailWrapId){
  const wrap = document.getElementById(detailWrapId);
  if(!wrap) return;

  const t = document.getElementById('noticeDetailTitle');
  const d = document.getElementById('noticeDetailDate');
  const c = document.getElementById('noticeDetailContent');

  if(t) t.textContent = notice?.title || '';
  if(d) d.textContent = notice?.date || '';
  if(c) c.textContent = notice?.content || '';

  wrap.hidden = false;
  wrap.scrollIntoView({behavior:'smooth', block:'start'});
}
