import vi from './locales/cinematic-route.vi.json' with {type:'json'};
import en from './locales/cinematic-route.en.json' with {type:'json'};
import {gameLanguage} from './language.js';
import {islandOccupied} from './island-occupation.js';

export const CINEMATIC_ROUTE=gameLanguage()==='en'?en:vi;
export const SIDE_REWARD=60;
// Openers, turning points and resolutions. Intermediary instructions keep the play camera.
const storyScenes={nameless:[0,1,2,3],water:[0,4,6,7],fire:[0,1,2,3,4,5],lightning:[0,2],wind:[0,2,3,4],earth:[0,3,4],wood:[0,1,2,3],ice:[0,2,3,4,6,7],light:[0,3,4,5],dark:[0,2,4,5,6,8,9]};
export const isStoryScene=event=>!!event&&storyScenes[event.village]?.includes(event.step)===true;
export const isMajorBattle=battle=>['boss','intro-trio','guardian-order','village-event'].includes(battle.kind)||battle.guardianChain===true;
const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&Math.abs(n)<=140);

export function readCinematicSides(raw){
  const stories={};
  for(const [id,value] of Object.entries(raw||{})){
    const spec=CINEMATIC_ROUTE.side[id];
    if(spec&&Number.isInteger(value?.step)&&value.step>=0&&value.step<=spec.steps.length&&validPoint(value.anchor))stories[id]={step:value.step,anchor:value.anchor};
  }
  return stories;
}
export function villageSideStory(save,id=save.village){
  const spec=CINEMATIC_ROUTE.side[id];
  if(!spec||islandOccupied(save,id)||['mother','chief'].includes(save.story?.stage))return null;
  const progress=save.story.cinematicSides?.[id];
  const step=progress?.step??-1;
  return {...spec,id,key:'side:'+id,giver:`${id}-resident-${spec.zone}`,step,task:spec.steps[step],anchor:progress?.anchor,complete:step===spec.steps.length};
}
export function startSideStory(save,anchor){
  const story=villageSideStory(save);
  if(!story||story.step!==-1||!validPoint(anchor))return false;
  save.story.cinematicSides??={};
  save.story.cinematicSides[story.id]={step:0,anchor};
  return true;
}
export function advanceSideStory(save,key,step,anchor){
  const story=villageSideStory(save);
  if(!story?.task||story.key!==key||story.step!==step||!validPoint(anchor))return null;
  const complete=step+1===story.steps.length;
  save.story.cinematicSides[story.id]={step:step+1,anchor};
  if(complete){save.gold+=SIDE_REWARD;save.xp+=45;}
  return {story,complete};
}
