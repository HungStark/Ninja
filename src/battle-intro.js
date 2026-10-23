import * as T from 'three';
import {createHero} from './hero.js';
import {createNinja} from './ninja.js';
import {encounterAppearance} from './encounter-appearance.js';
export function createBattleIntro(){
  const root=document.createElement('section');root.id='battleIntro';root.hidden=true;root.setAttribute('role','status');root.setAttribute('aria-label','Chuẩn bị chiến trường');
  root.innerHTML='<div class="versus-side versus-player"><div class="versus-landscape"></div><div class="versus-portraits"></div><h2></h2></div><div class="versus-side versus-enemies"><div class="versus-landscape"></div><div class="versus-portraits"></div><h2></h2></div><b class="versus-mark">VS</b><p class="versus-status">Đang chuẩn bị chiến trường…</p><div class="versus-progress"><i></i></div>';
  document.body.append(root);let active=false,age=0,loaded=false,readyAt=0,renderer=null,portraits=[],pending=[];
  function portrait(actor,hero=false){
    renderer??=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(320,420,false);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
    const scene=new T.Scene(),model=hero?createHero():createNinja(encounterAppearance({...actor,guardianForm:'human'}));if(hero)model.setEquipment(actor);scene.add(model.root);model.root.rotation.y=hero?.3:-.3;
    scene.add(new T.HemisphereLight('#e6f2ff','#423a43',2.7));const light=new T.DirectionalLight(hero?'#83c6ff':'#ffb08d',3.5);light.position.set(-3,6,6);scene.add(light);
    const camera=new T.PerspectiveCamera(31,320/420,.1,30);camera.position.set(0,2.0,6.1);camera.lookAt(0,1.65,0);renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');
    if(model.dispose)model.dispose();else{const gs=new Set(),ms=new Set();model.root.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])ms.add(m);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}return url;
  }
  return {
    begin(hero,enemies){if(active)return false;active=true;age=0;loaded=false;readyAt=0;pending=[];root.hidden=false;root.style.setProperty('--slide','1');root.querySelector('.versus-status').textContent='Đang chuẩn bị chiến trường…';root.querySelector('.versus-progress i').style.width='0';portraits=[hero.hero?.name||'Người giữ ấn',...enemies.map(e=>e.name||'Đối thủ')];
      for(const [selector,actors,isHero] of [['.versus-player',[hero],true],['.versus-enemies',enemies,false]]){const side=root.querySelector(selector),list=side.querySelector('.versus-portraits');list.replaceChildren();side.querySelector('h2').textContent=actors.length>1?actors.length+' ĐỐI THỦ':isHero?hero.hero?.name||'Người giữ ấn':actors[0].name||'Đối thủ';for(const actor of actors){const figure=document.createElement('figure'),img=new Image();img.alt=isHero?hero.hero?.name||'Nhân vật chính':actor.name||'Đối thủ';pending.push({img,actor,isHero});figure.append(img);if(actors.length>1){const caption=document.createElement('figcaption');caption.textContent=actor.name;figure.append(caption);}list.append(figure);}list.dataset.count=actors.length;list.style.setProperty('--actors',actors.length);}
      return true;
    },
    preparePortraits(){for(const {img,actor,isHero} of pending)img.src=portrait(actor,isHero);pending=[];},
    ready(){loaded=true;readyAt=age;root.querySelector('.versus-status').textContent='VÀO TRẬN';},
    update(dt){if(!active)return;age+=dt;const out=loaded&&age>Math.max(1.4,readyAt+.35),end=Math.max(1.4,readyAt+.35);root.style.setProperty('--slide',String(out?Math.min(1,(age-end)/.65):1-Math.min(1,age/.65)));root.querySelector('.versus-progress i').style.width=Math.min(100,loaded?100:age*45)+'%';if(out&&age>end+.65){active=false;root.hidden=true;}},
    reset(){active=false;root.hidden=true;age=0;},get active(){return active;},state:()=>({active,age,loaded,portraits:[...portraits],stage:!active?'idle':!loaded?'loading':age<1.4?'slide-in':'slide-out'})
  };
}
