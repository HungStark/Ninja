import {modelPortrait} from './model-portrait.js';
import {encounterAppearance} from './encounter-appearance.js';
export function createBattleIntro(){
  const root=document.createElement('section');root.id='battleIntro';root.hidden=true;root.setAttribute('role','status');root.setAttribute('aria-label','Chuẩn bị chiến trường');
  root.innerHTML='<div class="versus-side versus-player"><div class="versus-landscape"></div><div class="versus-portraits"></div><h2></h2></div><div class="versus-side versus-enemies"><div class="versus-landscape"></div><div class="versus-portraits"></div><h2></h2></div><b class="versus-mark">VS</b><p class="versus-status">Đang chuẩn bị chiến trường…</p><div class="versus-progress"><i></i></div>';
  document.body.append(root);let active=false,age=0,loaded=false,readyAt=0,portraits=[],pending=[];
  function portrait(actor,hero=false){
    if(hero)return modelPortrait({id:'hero',coat:actor.hero?.coat,equipment:actor});
    if(actor.kind==='guardian-ally')return modelPortrait({appearance:{kind:'creature',id:'nameless'}});
    const look=encounterAppearance({...actor,guardianForm:'human'});return modelPortrait({appearance:{job:'ninja',village:look.village||'nameless',id:look.id}});
  }

  return {
    begin(hero,enemies,allies=[]){if(active)return false;active=true;age=0;loaded=false;readyAt=0;pending=[];root.hidden=false;root.style.setProperty('--slide','1');root.querySelector('.versus-status').textContent='Đang chuẩn bị chiến trường…';root.querySelector('.versus-progress i').style.width='0';portraits=[hero.hero?.name||'Người giữ ấn',...allies.map(a=>a.name),...enemies.map(e=>e.name||'Đối thủ')];
      for(const [selector,actors,isHero] of [['.versus-player',[hero,...allies],true],['.versus-enemies',enemies,false]]){const side=root.querySelector(selector),list=side.querySelector('.versus-portraits');list.replaceChildren();side.querySelector('h2').textContent=actors.length>1?actors.length+(isHero?' ĐỒNG ĐỘI':' ĐỐI THỦ'):isHero?hero.hero?.name||'Người giữ ấn':actors[0].name||'Đối thủ';for(const actor of actors){const figure=document.createElement('figure'),img=new Image();const isPlayer=isHero&&actor===hero;img.alt=isPlayer?hero.hero?.name||'Nhân vật chính':actor.name||'Đối thủ';pending.push({img,actor,isHero:isPlayer});figure.append(img);if(actors.length>1){const caption=document.createElement('figcaption');caption.textContent=actor.name||actor.hero?.name||'Người giữ ấn';figure.append(caption);}list.append(figure);}list.dataset.count=actors.length;list.style.setProperty('--actors',actors.length);}
      return true;
    },
    async preparePortraits(){const batch=pending;pending=[];for(const {img,actor,isHero} of batch)img.src=await portrait(actor,isHero);},
    ready(){loaded=true;readyAt=age;root.querySelector('.versus-status').textContent='VÀO TRẬN';},
    update(dt){if(!active)return;age+=dt;const out=loaded&&age>Math.max(1.4,readyAt+.35),end=Math.max(1.4,readyAt+.35);root.style.setProperty('--slide',String(out?Math.min(1,(age-end)/.65):1-Math.min(1,age/.65)));root.querySelector('.versus-progress i').style.width=Math.min(100,loaded?100:age*45)+'%';if(out&&age>end+.65){active=false;root.hidden=true;}},
    reset(){active=false;root.hidden=true;age=0;},get active(){return active;},state:()=>({active,age,loaded,portraits:[...portraits],stage:!active?'idle':!loaded?'loading':age<1.4?'slide-in':'slide-out'})
  };
}
