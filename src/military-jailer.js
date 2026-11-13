import {insidePlot} from './village-zoning.js';
export function challengeJailer(save,id=save.village){
  save.story.jailerWarnings??={};const count=save.story.jailerWarnings[id]||0;
  save.story.jailerWarnings[id]=Math.min(2,count+1);return count===0?'warning':'battle';
}
export const militaryIntrusion=(plan,p)=>!!plan&&insidePlot(plan,p.x,p.z,-1);
