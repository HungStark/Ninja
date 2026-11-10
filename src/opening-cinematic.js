import * as T from 'three';
import {gameAudio} from './game-audio.js';

export const OPENING_LINE='Mình vậy mà lại trùng sinh rồi, lần này mình sẽ không phạm sai lầm nữa. Mẹ mình, mình phải tìm mẹ trước đã.';
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

export function createOpeningCinematic(root,world,onComplete){
 const panel=document.createElement('section');panel.id='journeyOpening';panel.className='journey-opening';panel.hidden=true;panel.setAttribute('aria-label','Mở đầu hành trình');
 panel.innerHTML='<button type="button" class="opening-skip">Bỏ qua</button><div class="opening-subtitle" hidden><strong></strong><p></p><button type="button" class="opening-next" hidden>Tiếp tục</button></div>';
 root.append(panel);
 const subtitle=panel.querySelector('.opening-subtitle'),text=panel.querySelector('p'),next=panel.querySelector('.opening-next');
 let active=false,age=0,returnAge=null,spoken=false,speaker,normal,returnFrom,letters=[];
 const camera=world.camera,hero=world.hero;
 function beginReturn(){if(!active||returnAge!==null)return;returnAge=0;returnFrom={position:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov};gameAudio.stopDialogue();next.hidden=true;}
 panel.querySelector('.opening-skip').onclick=beginReturn;next.onclick=beginReturn;
 function complete(){active=false;panel.hidden=true;hero.setEyeOpening(1);camera.position.copy(normal.position);camera.quaternion.copy(normal.quaternion);camera.fov=normal.fov;camera.updateProjectionMatrix();onComplete();}
 function start(heroSpeaker){
  speaker=heroSpeaker;active=true;age=0;returnAge=null;spoken=false;letters=Array.from(OPENING_LINE);panel.hidden=false;subtitle.style.opacity='1';subtitle.hidden=true;next.hidden=true;text.textContent='';subtitle.querySelector('strong').textContent=speaker.name;
  normal={position:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov};hero.setEyeOpening(0);frame(0);panel.querySelector('.opening-skip').focus({preventScroll:true});
 }
 function frame(dt){
  if(!active)return;
  age+=dt;hero.root.visible=true;
  const eye=hero.facePosition(),aim=eye.clone().add(new T.Vector3(0,-.16,0)),forward=new T.Vector3(0,0,1).applyQuaternion(hero.root.quaternion);
  const distance=1.7*Math.max(1,.85/camera.aspect);
  const front=aim.clone().addScaledVector(forward,distance);front.y+=.055;
  hero.setEyeOpening(smooth((age-.7)/1.3));
  if(returnAge===null){
   camera.position.copy(front);camera.lookAt(aim);camera.fov=40;camera.updateProjectionMatrix();
   if(age>=2.3){
    subtitle.hidden=false;if(!spoken){spoken=true;gameAudio.dialogueLine({speaker,text:OPENING_LINE});}
    const count=Math.floor((age-2.3)*32);text.textContent=letters.slice(0,count).join('');next.hidden=count<letters.length;
    if(age>2.3+letters.length/12&&!gameAudio.state().speaking)beginReturn();
   }
  }else{
   returnAge+=dt;const t=smooth(returnAge/2.2),a=new T.Spherical().setFromVector3(returnFrom.position.clone().sub(aim)),b=new T.Spherical().setFromVector3(normal.position.clone().sub(aim));
   const angle=Math.atan2(Math.sin(b.theta-a.theta),Math.cos(b.theta-a.theta));
   camera.position.copy(aim).add(new T.Vector3().setFromSpherical(new T.Spherical(T.MathUtils.lerp(a.radius,b.radius,t),T.MathUtils.lerp(a.phi,b.phi,t),a.theta+angle*t)));
   camera.lookAt(aim);camera.quaternion.slerp(normal.quaternion,t);camera.fov=T.MathUtils.lerp(returnFrom.fov,normal.fov,t);camera.updateProjectionMatrix();subtitle.style.opacity=String(1-t);hero.setEyeOpening(1);
   if(returnAge>=2.2)complete();
  }
 }
 return {start,update:frame,keydown(event){if(event.key==='Escape'){event.preventDefault();beginReturn();return;}const buttons=[...panel.querySelectorAll('button')].filter(b=>!b.hidden);if(event.key==='Tab'){event.preventDefault();const index=buttons.indexOf(document.activeElement);buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus();return;}if(['Enter',' '].includes(event.key)&&buttons.includes(event.target))return;event.preventDefault();},state:()=>({active,age,stage:!active?'done':returnAge!==null?'returning':age<.7?'eyes-closed':age<2?'awakening':age<2.3?'awake':'dialogue',eyesOpen:hero.eyeOpening,text:text.textContent}),reset(){active=false;panel.hidden=true;hero.setEyeOpening(1);gameAudio.stopDialogue();},};
}
