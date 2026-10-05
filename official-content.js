const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let officialRecord,activeSheet=0,expandedRows=[];
const normalize=v=>String(v??'').trim().toLowerCase().replace(/[\s_-]+/g,'');
function renderSheet(index){
  activeSheet=index;const sheet=officialRecord.book.sheets[index],headers=sheet.rows[0]||[];
  const hierarchyCols=headers.map((h,c)=>({name:String(h),c,key:normalize(h)})).filter(x=>['bg','pggroup','pg','md','pd','pdl','marketdivision','productdivision','productline'].includes(x.key));
  expandedRows=sheet.rows.slice(1).map(raw=>({values:raw.slice(),raw}));
  $('filters').innerHTML=hierarchyCols.map(x=>`<label for="filter-${x.c}">${esc(x.name)}</label><select id="filter-${x.c}" data-column="${x.c}"><option value="">All</option>${[...new Set(expandedRows.map(r=>String(r.values[x.c]??'').trim()).filter(Boolean))].sort().map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select>`).join('');
  $('sheetTabs').innerHTML=officialRecord.book.sheets.map((s,i)=>`<button class="tab ${i===index?'active':''}" data-sheet="${i}">${esc(s.name)}</button>`).join('');renderData();
}
function renderData(){const headers=officialRecord.book.sheets[activeSheet].rows[0]||[],phaseCol=headers.findIndex(h=>normalize(h)==='phaseout'),pdlCol=headers.findIndex(h=>['pdl','productline'].includes(normalize(h))),hide=document.querySelector('[name="phase"]:checked').value==='hide';const filters=[...$('filters').querySelectorAll('select')].filter(x=>x.value);
  const phased=r=>String(r.values[phaseCol]||'').trim().toUpperCase()==='Y'||/^\(.*\)$/.test(String(r.values[pdlCol]||'').trim());
  const rows=expandedRows.filter(r=>filters.every(x=>String(r.values[Number(x.dataset.column)]??'').trim()===x.value)&&(!hide||!phased(r)));
  $('hierarchyContent').innerHTML='<table><thead><tr>'+headers.map(h=>`<th>${esc(h)}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>`<tr class="${phased(r)?'phased':''}">`+headers.map((_,c)=>`<td>${esc(r.values[c])}</td>`).join('')+'</tr>').join('')+'</tbody></table>';$('rowCount').textContent=`${rows.length} / ${expandedRows.length} rows`;
}
$('filters').onchange=renderData;document.querySelectorAll('[name="phase"]').forEach(x=>x.onchange=renderData);
$('sheetTabs').onclick=e=>{const b=e.target.closest('[data-sheet]');if(b)renderSheet(Number(b.dataset.sheet));};
$('resetFilters').onclick=()=>{$('filters').querySelectorAll('select').forEach(x=>x.value='');document.querySelector('[name="phase"][value="show"]').checked=true;renderData();};
$('downloadAll').onclick=async()=>{const button=$('downloadAll');button.disabled=true;$('downloadStatus').textContent='準備完整 Excel…';try{const blob=await PDHExcelExport.exportRecord(officialRecord);const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`PD_Hierarchy_Official_${officialRecord.year}_${officialRecord.effectiveDate||'All'}.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('downloadStatus').textContent='已下載全部工作表與資料';}catch(err){$('downloadStatus').textContent='下載失敗：'+err.message;}finally{button.disabled=false;}};
try{officialRecord=PDHRecords.load().official.find(x=>x.id===new URLSearchParams(location.search).get('id'));if(!officialRecord?.book?.sheets?.length)throw new Error('找不到 Official 資料，請返回列表。');$('detailYear').textContent=officialRecord.year;$('detailEffective').textContent=officialRecord.effectiveDate||'';$('detailRemark').textContent=officialRecord.remark||'';renderSheet(0);}catch(err){$('hierarchyContent').textContent=err.message;$('downloadAll').disabled=true;}
