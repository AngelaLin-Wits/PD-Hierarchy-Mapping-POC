/* Port of ordinary BG/MD/PD boundary sequencing from clean_sbu_hierarchy.py.
 * Special PG-Other, MD wo, WISE-IoT, AKTC and Denodo logic is NOT ported here.
 * Never label this output as fully cleansed. */
window.PDHCleansingCore={
 normalize(x){return String(x??'').trim().replace(/\s+/g,' ')},
 key(x){return this.normalize(x).toLowerCase()},
 calculate(input){
 const rows=input.map(x=>({...x,pdSort:null,mdSort:null,bgSort:null}));
 let next=0,mdStart=0,bgStart=0;
 const warnings=[];
 rows.forEach((r,i)=>{
   if(/\btotal\b/i.test(r.bg)){warnings.push('PG Total special rule requires Python parity: row '+r.sourceRow);mdStart=i+1;bgStart=i+1;return}
   if(/\bwo\b/i.test(r.md)||/\bwo\b/i.test(r.bg))warnings.push('wo group special rule requires Python parity: row '+r.sourceRow);
   if(r.pd)r.pdSort=++next;
   const following=rows[i+1];
   const mdEnds=!!r.md&&(!following||!following.md||this.key(following.md)!==this.key(r.md));
   const bgEnds=!!r.bg&&(!following||!following.bg||this.key(following.bg)!==this.key(r.bg));
   if(mdEnds){
     const seg=rows.slice(mdStart,i+1).filter(x=>x.md&&x.pdSort);
     if(seg.length){let val=++next;seg.forEach(x=>{if(this.key(x.md)===this.key(r.md))x.mdSort=val})}
     mdStart=i+1;
   }
   if(bgEnds){
     const seg=rows.slice(bgStart,i+1).filter(x=>x.bg);
     if(seg.some(x=>x.pdSort||x.mdSort)){let val=++next;seg.forEach(x=>{if(this.key(x.bg)===this.key(r.bg))x.bgSort=val})}
     bgStart=i+1;
   }
 });
 return {rows,warnings,complete:false};
 }
};