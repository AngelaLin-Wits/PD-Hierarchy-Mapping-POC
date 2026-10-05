const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let mode = new URLSearchParams(location.search).get('view') === 'test' ? 'test' : 'official';
let contentBook = null;
function records() { return PDHRecords.load()[mode === 'test' ? 'tests' : 'official']; }
function render() {
  const test = mode === 'test';
  $('pageTitle').textContent = document.title = `PD Hierarchy ${test ? 'Test' : 'Official'}`;
  $('modeLabel').textContent = test ? 'TEST' : 'OFFICIAL';
  $('modeToggle').classList.toggle('test', test);
  $('modeToggle').setAttribute('aria-pressed', String(test));
  $('modeToggle').setAttribute('aria-label', `切換至 ${test ? 'Official' : 'Test'} 列表`);
  $('addTest').hidden = !test; $('officialImport').hidden = test; $('officialYearLabel').hidden = test;
  document.querySelector('.setting-table').classList.toggle('test', test);
  $('scopeNote').textContent = test ? '新增 Test 後進入 Mapping；SAVE 後回到此列表。資料儲存在目前瀏覽器。' : 'POC 以本機儲存模擬 Official 資料；可載入該年度正式 Excel 作為 Baseline。';
  try {
    const rows = records();
    $('recordsBody').innerHTML = rows.length ? rows.map(x => `<tr><td>${esc(x.year)}</td><td>${esc(x.remark)}</td><td>${esc(x.effectiveDate || '')}</td><td><button class="btn" data-action="content" data-id="${esc(x.id)}">▱ CONTENT</button>${test ? `<button class="btn" data-action="edit" data-id="${esc(x.id)}">✎ EDIT</button><button class="btn" data-action="goLive" data-id="${esc(x.id)}" ${x.goLiveAt ? 'disabled title="此版本已 Go Live"' : ''}>▶ GO LIVE</button>` : ''}</td></tr>`).join('') : `<tr><td colspan="4" class="empty">${test ? '尚無 Test 資料，請按「＋ 新增 Test」開始 Mapping。' : '尚無 Official 資料，請載入正式 Excel 作為 POC Baseline。'}</td></tr>`;
  } catch (err) { $('recordsBody').innerHTML = '<tr><td colspan="4" class="empty">無法讀取已儲存資料，請確認瀏覽器儲存空間與設定。</td></tr>'; console.error(err); }
}
function showSheet(i) {
  const sheet = contentBook.sheets[i];
  $('contentTabs').innerHTML = contentBook.sheets.map((x,n) => `<button class="tab ${n===i?'active':''}" data-sheet="${n}">${esc(x.name)}</button>`).join('');
  const headers = sheet.rows[0];
  const columnClass = header => /^PDL(?:\\s|$)/i.test(String(header).trim()) ? 'content-pdl' : 'content-nowrap';
  $('contentTable').innerHTML = '<table><thead><tr>'+headers.map(x=>`<th class="${columnClass(x)}">${esc(x)}</th>`).join('')+'</tr></thead><tbody>'+sheet.rows.slice(1).map(row=>'<tr>'+headers.map((header,c)=>`<td class="${columnClass(header)}">${esc(row[c])}</td>`).join('')+'</tr>').join('')+'</tbody></table>';
}
$('modeToggle').onclick = () => { mode = mode === 'official' ? 'test' : 'official'; history.replaceState(null,'', mode === 'test' ? '?view=test' : location.pathname); render(); };
$('addTest').onclick = () => { location.href = 'mapping.html?new=1&v=20261005-head2'; };
$('recordsBody').onclick = e => {
  const button = e.target.closest('button[data-action]'); if (!button) return;
  try {
    const record = records().find(x=>x.id===button.dataset.id); if (!record) return;
    if (button.dataset.action === 'edit') { location.href = 'mapping.html?v=20261005-head2&id='+encodeURIComponent(record.id); return; }
    if (button.dataset.action === 'goLive') { localStorage.setItem('pdhGoLivePayload',JSON.stringify(PDHRecords.payload(record))); location.href='go-live.html'; return; }
    if(mode==='official'){location.href='official-content.html?id='+encodeURIComponent(record.id);return;}contentBook = record.state.converted;
    if (!contentBook?.sheets?.length) { alert('尚無階層資料。'); return; }
    $('contentTitle').textContent=`${record.year} ${mode==='test'?'Test':'Official'} Content`;
    showSheet(0); $('contentModal').classList.add('show');
  } catch(err) { alert('無法開啟資料：'+err.message); }
};
$('contentTabs').onclick=e=>{const b=e.target.closest('[data-sheet]');if(b)showSheet(Number(b.dataset.sheet));};
$('closeContent').onclick=()=>$('contentModal').classList.remove('show');
$('officialFile').onchange = e => {
  const file=e.target.files[0]; if(!file)return;
  const year=$('officialYear').value;
  if(PDHRecords.official(year)&&!confirm(`取代 ${year} 年目前的 POC Official Baseline？`)){e.target.value='';return;}
  const reader=new FileReader();
  reader.onerror=()=>alert('讀取 Excel 失敗。');
  reader.onload=async()=>{try{
    const wb=XLSX.read(reader.result,{type:'array',cellStyles:true,cellDates:true});
    const book={name:file.name,sheets:wb.SheetNames.map(name=>({name,hierarchyType:/virtual|shadow/i.test(name)?'Virtual':/hierarchy|standard/i.test(name)?'Standard':'Unknown',rows:PDHHierarchyExcel.rows(wb.Sheets[name])}))};
    const originalBook=JSON.parse(JSON.stringify(book));
    if(!await PDHHeadsUI.validateBook(book))return;
    const data=PDHRecords.load(),old=data.official.find(x=>x.year===year);
    const record={id:old?.id||crypto.randomUUID(),year,remark:file.name,effectiveDate:'',book,originalBook,originalBase64:btoa(Array.from(new Uint8Array(reader.result),b=>String.fromCharCode(b)).join('')),addedRows:[]};
    if(old)data.official[data.official.indexOf(old)]=record;else data.official.unshift(record);
    PDHRecords.save(data);render();
  }catch(err){alert('載入失敗：'+err.message);}finally{e.target.value='';}};
  reader.readAsArrayBuffer(file);
};
render();

$('clearPoc').onclick = () => {
  if (!confirm('確定清除目前瀏覽器的全部 Official 與 Test 資料？\n清除後無法復原。需要保留的 Excel 請先下載。')) return;
  try {
    ['pdhRecordsV1', 'pdhGoLivePayload', 'pdhBaseline'].forEach(key => localStorage.removeItem(key));
    mode = 'official';
    history.replaceState(null, '', location.pathname);
    contentBook = null;
    $('contentModal').classList.remove('show');
    $('officialFile').value = '';
    render();
    alert('已清除。請先選擇 Year，載入 Official Excel，再切換 Test 新增一筆資料。');
  } catch (err) {
    alert('清除失敗：' + err.message);
  }
};
