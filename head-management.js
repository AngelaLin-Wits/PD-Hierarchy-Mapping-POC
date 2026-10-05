/* Employee directory is reused across pages in this browser tab via sessionStorage. */
window.PDHHeads = (() => {
  const directoryKey='pdhEmployeeDirectoryV1';
  let employees=[];
  try{const cached=JSON.parse(sessionStorage.getItem(directoryKey)||'null');if(Array.isArray(cached)&&cached.every(e=>e&&typeof e.id==='string'&&typeof e.name==='string'&&typeof e.email==='string'&&typeof e.department==='string'))employees=cached;}catch{}

  const norm=v=>String(v??'').trim().replace(/\s+/g,' '),key=v=>norm(v).toLowerCase();
  const split=v=>String(v??'').split(/[;；\n]+/).map(norm).filter(Boolean);
  const columns=rows=>(rows[0]||[]).map((h,c)=>({c,level:norm(h).match(/^(BG|PG|MD|PD|PDL)\s*Head$/i)?.[1]?.toUpperCase()})).filter(x=>x.level);
  function load(rows){const h=(rows[0]||[]).map(key),col=n=>h.indexOf(key(n));for(const n of ['EMPLR_ID','EMAIL_ADDR','ENG_NAME','IsActive'])if(col(n)<0)throw Error('員工檔缺少欄位：'+n);employees=rows.slice(1).filter(r=>String(r[col('IsActive')])==='1').map(r=>({id:String(r[col('EMPLR_ID')]??''),name:norm(r[col('ENG_NAME')]),email:norm(r[col('EMAIL_ADDR')]),department:norm(r[col('Department')])})).filter(e=>e.id&&e.name&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email));try{sessionStorage.setItem(directoryKey,JSON.stringify(employees));}catch(err){if(typeof sessionStorage!=='undefined')throw new Error('員工檔已載入，但瀏覽器無法保留至下一頁，請確認儲存空間或瀏覽器設定。');}return employees.length;}
  const search=q=>employees.filter(e=>[e.name,e.email,e.department].some(v=>key(v).includes(key(q)))).slice(0,60);
  const exact=v=>employees.filter(e=>key(e.name)===key(v)||key(e.email)===key(v));
  const unique=list=>[...new Map(list.map(e=>[e.id,e])).values()];
  const text=list=>unique(list).map(e=>e.name).join('; ');
  function identity(list,fallback){return list?unique(list).map(e=>e.id).sort().join('|'):split(fallback).map(key).sort().join('|');}
  function headColumn(rows,level){return columns(rows).find(x=>x.level===level)?.c??-1;}
  function set(sh,r,c,list){sh.heads??={};sh.rows[r][c]=text(list);sh.heads[`${r}:${c}`]={text:sh.rows[r][c],employees:unique(list)};}
  function verified(sh,r,c){const v=sh.heads?.[`${r}:${c}`];return v&&key(v.text)===key(sh.rows[r]?.[c])?v.employees:null;}
  function parse(cmd){let m=norm(cmd).match(/^(?:Set\s+)?(BG|PG|MD|PD|PDL)\s+Head(?:\s+"([^"]+)"\s+to)?\s*(.*)$/i);if(!m)return null;let target=m[3].replace(/^"(.*)"$/,'$1');if(/^(?:clear|none|清空)$/i.test(target))target='';return{valid:true,level:m[1].toUpperCase(),action:'Head',source:m[2]||'',target,message:`${m[1].toUpperCase()} Head ${target||'清空'}`};}
  function entities(book){const result=new Map();for(const sh of book?.sheets||[]){const rows=sh.rows,type=sh.hierarchyType||(/virtual|shadow/i.test(sh.name)?'Virtual':'Standard');for(const {c,level} of columns(rows)){const lc=level==='BG'||level==='PG'?0:level==='MD'?1:level==='PD'?2:3;for(let r=1;r<rows.length;r++){const name=norm(rows[r]?.[lc]);if(!name)continue;const parent=lc?norm(rows[r]?.[lc-1]):'';const id=[type,level,key(name),key(parent)].join('|'),value=norm(rows[r]?.[c]),list=verified(sh,r,c);if(!result.has(id)||value)result.set(id,{type,level,name,parent,value,list});}}}return [...result.values()];}
  function differences(before,after,mappings=[]){const b=entities(before),out=[];for(const x of entities(after)){let old=b.find(y=>y.type===x.type&&y.level===x.level&&key(y.name)===key(x.name)&&key(y.parent)===key(x.parent));if(!old){const m=mappings.find(m=>m.hierarchyType===x.type&&m.level===x.level&&m.decision==='accept'&&m.parsed?.action==='Rename'&&key(m.parsed.target)===key(x.name));old=b.find(y=>y.type===x.type&&y.level===x.level&&key(y.name)===key(m?.parsed.source||x.name));}const equal=x.list&&old?.list?identity(x.list)===identity(old.list):identity(null,x.value)===identity(null,old?.value);if(!equal)out.push({type:x.type,level:x.level,action:'Head',subject:x.name,parent:x.parent,source:old?.value||'',target:x.value,desc:`${x.level} Head ${x.value||'清空'}`});}return out;}
  function numbered(oldText,add){const lines=String(oldText??'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);let n=0;const result=lines.map(line=>{const m=line.match(/^(\d+)\.\s*/);if(m){n=Math.max(n,+m[1]);return line;}return `${++n}. ${line}`;});for(const line of String(add??'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean))result.push(`${++n}. ${line}`);return result.join('\n');}
  return {count:()=>employees.length,load,search,exact,split,columns,headColumn,set,verified,unique,text,parse,differences,numbered,key};
})();
