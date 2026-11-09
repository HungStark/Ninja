const villageIds=new Set(['nameless','water','fire','lightning','earth','wind','wood','ice','light','dark']);
export function readTreaties(raw){
  const result=[];
  for(const entry of Array.isArray(raw)?raw:[]){
    if(!villageIds.has(entry?.village)||result.some(t=>t.village===entry.village)||typeof entry.content!=='string'||!entry.content.trim()||typeof entry.signer!=='string')continue;
    const signature=(Array.isArray(entry.signature)?entry.signature:[]).slice(0,80).map(path=>(Array.isArray(path)?path:[]).slice(0,600).filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<=360&&p[1]>=0&&p[1]<=120).map(p=>[...p])).filter(p=>p.length>1);
    if(!signature.length)continue;
    result.push({id:'peace-'+entry.village,village:entry.village,content:entry.content.slice(0,4000),signer:entry.signer.slice(0,80),signature,signedAt:typeof entry.signedAt==='string'?entry.signedAt.slice(0,40):''});
  }
  return result;
}
export function storeTreaty(save,id,draft){
  const treaty=readTreaties([{...draft,village:id,signer:save.hero.name,signedAt:new Date().toISOString()}])[0];
  if(!treaty)return false;
  save.story.treaties??=[];
  if(save.story.treaties.some(t=>t.village===id))return false;
  save.story.treaties.push(treaty);return true;
}
export const signaturePaths=signature=>signature.map(path=>'M'+path.map(p=>p.join(',')).join(' L')).join(' ');
