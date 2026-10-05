window.PDHHeadsUI = (() => {
  const H=PDHHeads,escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const panel=document.createElement('section');panel.className='card';panel.innerHTML='<div class="hd">Head 員工驗證</div><div class="bd"><label id="headStaffUpload"><span id="headStaffLabel">載入員工基本檔（CSV，此瀏覽器共用）</span> <input id="headStaffFile" type="file" accept=".csv"></label><span id="headStaffStatus" class="hint">尚未載入；Head 空白可直接通過。</span><button id="headStaffReplace" type="button" class="btn" hidden>更換員工檔</button><div class="hint">多位 Head 請以分號分隔；找不到、同名多位或缺少 Email 時需指定員工。</div></div>';document.querySelector('main').prepend(panel);
  document.getElementById('headStaffFile').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;const wb=XLSX.read(await f.text(),{type:'string',raw:true});const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:'',raw:true});const n=H.load(rows);updateDirectoryStatus();if(typeof validateBatch==='function'){validateBatch();renderAll();}}catch(err){alert(err.message);}};
  const modal=document.createElement('div');modal.className='modal';modal.innerHTML='<div class="modal-box" style="width:min(1000px,96vw)"><h3>確認 Head</h3><div id="headContext"></div><label id="headDialogStaffLabel">載入員工基本檔 <input id="headDialogStaff" type="file" accept=".csv"></label><div id="headMissing" class="hint"></div><div id="headSelected" style="margin:12px 0"></div><input id="headSearch" placeholder="輸入部分姓名或 Email 搜尋" style="width:100%;box-sizing:border-box"><div id="headResults" style="max-height:38vh;overflow:auto;margin:12px 0"></div><div class="actions"><button class="btn primary" id="headResolveOk">確認指定</button><button class="btn" id="headResolveClear">設為沒有 Head</button><button class="btn" id="headResolveCancel">取消</button></div></div>';document.body.append(modal);document.getElementById('headDialogStaff').onchange=async e=>{await document.getElementById('headStaffFile').onchange(e);render();};
  document.getElementById('headStaffReplace').onclick=()=>document.getElementById('headStaffFile').click();
  function updateDirectoryStatus(){H.restore();const n=H.count();document.getElementById('headStaffUpload').hidden=n>0;document.getElementById('headStaffReplace').hidden=!n;if(n){document.getElementById('headStaffStatus').textContent=`已載入 ${n} 位員工，首頁與 Test 共用，不需再次上傳`;document.getElementById('headStaffLabel').textContent='更換員工基本檔（CSV）';}document.getElementById('headDialogStaffLabel').hidden=n>0;}
  updateDirectoryStatus();
  let selected=[],missing=[],done=null;
  let visibleEmployees=[];
  function render(){
    document.getElementById('headSelected').textContent=`已選 ${selected.length} 位 Head（藍色為已選，再點一次取消；變更搜尋條件會保留已選員工）`;
    const q=document.getElementById('headSearch').value;
    visibleEmployees=H.unique([...selected,...(q?H.search(q):[])]);
    document.getElementById('headResults').innerHTML=visibleEmployees.map(e=>{
      const chosen=selected.some(x=>x.id===e.id);
      return `<button type="button" class="btn ${chosen?'primary':''}" aria-pressed="${chosen}" style="display:block;width:100%;text-align:left;margin-bottom:5px;background:${chosen?'#06477e':'#fff'};color:${chosen?'#fff':'#26384f'};border:1px solid #b9c9d8" data-employee="${escape(e.id)}">${chosen?'✓ ':''}${escape(e.name)} | ${escape(e.email)} | ${escape(e.department)}</button>`;
    }).join('')||(q?'查無可選取員工，請確認員工基本檔與搜尋條件。':'請輸入姓名或 Email。');
  }
  document.getElementById('headSearch').oninput=render;
  document.getElementById('headResults').onclick=e=>{const b=e.target.closest('[data-employee]');if(b){const item=visibleEmployees.find(x=>x.id===b.dataset.employee);if(item)selected=selected.some(x=>x.id===item.id)?selected.filter(x=>x.id!==item.id):H.unique([...selected,item]);render();}};
  function finish(value){modal.classList.remove('show');const cb=done;done=null;cb(value);}
  document.getElementById('headResolveOk').onclick=()=>{if(!selected.length){alert('請指定員工，或按「設為沒有 Head」。');return;}finish(selected);};
  document.getElementById('headResolveClear').onclick=()=>finish([]);
  document.getElementById('headResolveCancel').onclick=()=>finish(null);
  async function resolve(value,context,force=false){updateDirectoryStatus();const names=H.split(value);selected=[];missing=[];for(const name of names){const matches=H.exact(name);if(matches.length===1)selected.push(matches[0]);else missing.push(name);}selected=H.unique(selected);if(!force&&!missing.length)return selected;document.getElementById('headContext').textContent=context;document.getElementById('headMissing').textContent='原填 Head：'+(value||'空白')+(missing.length?'；待確認：'+missing.join('; '):'');document.getElementById('headSearch').value=missing[0]||'';render();modal.classList.add('show');return new Promise(r=>done=r);}
  async function validateBook(book){for(const sh of book?.sheets||[])for(const {c,level}of H.columns(sh.rows))for(let r=1;r<sh.rows.length;r++){if(H.verified(sh,r,c))continue;const list=await resolve(sh.rows[r]?.[c],`${sh.name} / Excel Row ${r+1} / ${level} Head`);if(list===null)return false;H.set(sh,r,c,list);}return true;}
  return {resolve,validateBook};
})();
