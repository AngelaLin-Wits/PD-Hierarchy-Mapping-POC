/* Patch uploaded OOXML in place so styles, metadata and unrelated sheets survive. */
window.PDHExcelExport=(()=>{
const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const parse=xml=>{const d=new DOMParser().parseFromString(xml,'application/xml');if(d.querySelector('parsererror'))throw new Error('Excel XML 格式錯誤');return d;};
const colName=index=>{let s='';for(let n=index+1;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
const local=(el,name)=>Array.from(el.children).filter(x=>x.localName===name);
function patchSheet(xml,after,before,additions){
 const doc=parse(xml),data=doc.getElementsByTagNameNS(ns,'sheetData')[0];if(!data)return xml;
 const oldRows=local(data,'row'),byRow=new Map(oldRows.map(r=>[Number(r.getAttribute('r'))-1,r]));
 const rowOrigin=Array.from({length:before.length},(_,i)=>i);
 additions.slice().sort((a,b)=>(a.insertAfter??999999)-(b.insertAfter??999999)).forEach(a=>{if(Number.isInteger(a.insertAfter)){const index=Math.max(1,Math.min(a.insertAfter,rowOrigin.length-1));rowOrigin.splice(index+1,0,null);}else rowOrigin.push(null);});
 const rowMap=new Map();rowOrigin.forEach((old,i)=>{if(old!==null)rowMap.set(old+1,i+1);});
 const frag=doc.createDocumentFragment();
 after.forEach((values,r)=>{
  const originalIndex=rowOrigin[r],source=originalIndex!==null?byRow.get(originalIndex):null;
  const template=source||byRow.get(Math.max(1,(rowOrigin.slice(0,r).filter(x=>x!==null).pop()??1)));
  const row=template?template.cloneNode(true):doc.createElementNS(ns,'row');row.setAttribute('r',r+1);
  const cells=local(row,'c');cells.forEach(c=>c.setAttribute('r',c.getAttribute('r').replace(/\d+$/,r+1)));
  if(!source)cells.forEach(c=>{for(const x of [...c.children])if(['v','f','is'].includes(x.localName))c.removeChild(x);});
  values.forEach((v,c)=>{
   if(source&&String(v??'')===String(before[originalIndex]?.[c]??''))return;
   const address=colName(c)+(r+1);let cell=local(row,'c').find(x=>x.getAttribute('r')===address);
   if(!cell){cell=doc.createElementNS(ns,'c');cell.setAttribute('r',address);const next=local(row,'c').find(x=>XLSX.utils.decode_cell(x.getAttribute('r')).c>c);row.insertBefore(cell,next||null);}
   for(const x of [...cell.children])if(['v','f','is'].includes(x.localName))cell.removeChild(x);
   cell.removeAttribute('t');if(v===null||v===undefined||v==='')return;
   if(typeof v==='number'||typeof v==='boolean'){if(typeof v==='boolean')cell.setAttribute('t','b');const el=doc.createElementNS(ns,'v');el.textContent=typeof v==='boolean'?(v?'1':'0'):String(v);cell.appendChild(el);}
   else{cell.setAttribute('t','inlineStr');const inline=doc.createElementNS(ns,'is'),t=doc.createElementNS(ns,'t');t.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');t.textContent=String(v);inline.appendChild(t);cell.appendChild(inline);}
  });frag.appendChild(row);
 });
 // Retain styled trailing rows outside the parsed data range.
 oldRows.filter(x=>Number(x.getAttribute('r'))>before.length).forEach(x=>{const row=x.cloneNode(true),newR=Number(x.getAttribute('r'))+additions.length;row.setAttribute('r',newR);local(row,'c').forEach(c=>c.setAttribute('r',c.getAttribute('r').replace(/\d+$/,newR)));frag.appendChild(row);});
 data.replaceChildren(frag);
 if(additions.length){const remapRef=ref=>ref.replace(/(\$?[A-Z]+\$?)(\d+)/g,(_,col,n)=>col+(rowMap.get(Number(n))??(Number(n)>before.length?Number(n)+additions.length:Number(n))));for(const el of doc.getElementsByTagNameNS(ns,'mergeCell'))el.setAttribute('ref',remapRef(el.getAttribute('ref')));const auto=doc.getElementsByTagNameNS(ns,'autoFilter')[0];if(auto)auto.setAttribute('ref',remapRef(auto.getAttribute('ref')));}
 const dimension=doc.getElementsByTagNameNS(ns,'dimension')[0];if(dimension)dimension.setAttribute('ref',`A1:${colName(Math.max(0,...after.map(x=>x.length-1)))}${Math.max(after.length,...local(data,'row').map(x=>Number(x.getAttribute('r'))))}`);
 return new XMLSerializer().serializeToString(doc);
}
async function exportRecord(record){
 if(!record.originalBase64)throw new Error('缺少原始 Excel 範本，請重新上傳並儲存 Test 後 Go Live。');
 let zip;try{zip=await JSZip.loadAsync(record.originalBase64,{base64:true});}catch{throw new Error('格式保留下載支援 .xlsx，請使用原始 .xlsx 檔案重新上傳。');}
 const workbook=parse(await zip.file('xl/workbook.xml').async('string')),rels=parse(await zip.file('xl/_rels/workbook.xml.rels').async('string'));
 const targets=new Map(Array.from(rels.documentElement.children).map(x=>[x.getAttribute('Id'),x.getAttribute('Target')]));
 for(const [i,sheet]of record.book.sheets.entries()){
  const item=Array.from(workbook.getElementsByTagNameNS(ns,'sheet')).find(x=>x.getAttribute('name')===sheet.name);if(!item)throw new Error('範本缺少工作表：'+sheet.name);
  const target=targets.get(item.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'));
  const filename=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');const file=zip.file(filename);if(!file)throw new Error('找不到範本工作表內容。');
  const original=record.originalBook?.sheets.find(x=>x.name===sheet.name)?.rows;if(!original)throw new Error('缺少原始工作表快照。');
  zip.file(filename,patchSheet(await file.async('string'),sheet.rows,original,(record.addedRows||[]).filter(x=>x.sheet===i)));
 }
 return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
return {exportRecord,patchSheet};
})();
