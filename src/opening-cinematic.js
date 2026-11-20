import * as T from 'three';
import {PLOT} from './campaign-plot.js';
import {createCutsceneDialogue} from './cutscene-dialogue.js';

export const OPENING_LINE=PLOT.opening.at(-1)[1];
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

export function createOpeningCinematic(root,world,onComplete){
  const panel=document.createElement('section');
  panel.id='journeyOpening';
  panel.className='journey-opening';
  panel.hidden=true;
  panel.innerHTML='<p class="cinematic-subtitle opening-subtitle" role="status" hidden><strong></strong><span></span></p>';
  root.append(panel);
  const dialogue=createCutsceneDialogue(panel.firstElementChild);
  const {camera,hero}=world;
  let active=false,age=0,normal,speaker,aspect;

  function reset(){
    if(active){
      camera.position.copy(normal.position);
      camera.quaternion.copy(normal.quaternion);
      camera.fov=normal.fov;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
    }
    active=false;
    panel.hidden=true;
    hero.setEyeOpening(1);
    dialogue.reset();
  }

  function complete(){
    if(!active)return;
    reset();
    onComplete();
  }

  function frameCloseup(){
    aspect=camera.aspect;
    const aim=hero.facePosition().add(new T.Vector3(0,-.16,0));
    const forward=new T.Vector3(0,0,1).applyQuaternion(hero.root.quaternion);
    camera.position.copy(aim).addScaledVector(forward,1.7*Math.max(1,.85/camera.aspect));
    camera.position.y+=.055;
    camera.lookAt(aim);
    camera.fov=40;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function start(heroSpeaker){
    speaker=heroSpeaker;
    active=true;
    age=0;
    panel.hidden=false;
    normal={position:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov};
    frameCloseup();
    hero.setEyeOpening(0);
  }

  function update(dt){
    if(!active)return;
    if(aspect!==camera.aspect)frameCloseup();
    age+=dt;
    hero.root.visible=true;
    hero.setEyeOpening(smooth((age-.7)/1.3));
    if(age>=2.3&&!dialogue.active)dialogue.start([{speaker,text:OPENING_LINE}],{onComplete:complete});
    dialogue.update(dt);
  }

  return {start,update,reset,keydown(event){event.preventDefault();if(event.key==='Escape')complete();},
    state:()=>({active,age,stage:!active?'done':age<.7?'eyes-closed':age<2?'awakening':age<2.3?'awake':'dialogue',
      eyesOpen:hero.eyeOpening,text:panel.querySelector('span').textContent})};
}
