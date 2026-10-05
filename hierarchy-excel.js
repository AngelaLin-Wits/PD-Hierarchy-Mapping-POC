/* Only Excel merge ranges may supply a blank hierarchy cell's value. */
window.PDHHierarchyExcel={
  rows(ws){
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
    for(const merge of ws['!merges']||[]){
      if(merge.s.r===0||merge.s.c!==merge.e.c)continue;
      const header=String(rows[0]?.[merge.s.c]??'').trim().toLowerCase();
      if(!['bg','pg','pg group','md','pd','pdl'].includes(header))continue;
      const value=rows[merge.s.r]?.[merge.s.c]??'';
      for(let r=merge.s.r+1;r<=merge.e.r;r++){rows[r]??=[];if(!String(rows[r][merge.s.c]??'').trim())rows[r][merge.s.c]=value;}
    }
    return rows;
  }
};
