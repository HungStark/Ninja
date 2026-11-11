import * as T from 'three';
import {renderEnemySeals} from './battle-scroll.js';

// The panel ends above the status badges; badges end above the model's head.
export function projectEnemyLabel(camera,position,height,{width,height:viewportHeight},panelHeight,badgeHeight=22){
  camera.updateMatrixWorld();const head=new T.Vector3(position[0],position[1]+height+.12,position[2]),local=head.clone().applyMatrix4(camera.matrixWorldInverse),p=head.project(camera);
  if(local.z>=0||p.z< -1||p.z>1||Math.abs(p.x)>1.08||p.y>1.12||p.y< -1.1)return null;
  const x=(p.x+1)*width/2,headY=(1-p.y)*viewportHeight/2,badgeBottom=headY-12,panelBottom=badgeBottom-badgeHeight-12;
  if(panelBottom-panelHeight<3)return null;
  return {x,headY,badgeBottom,panelBottom};
}
export function createEnemyNameplates(hud,primary){
  const layer=document.createElement('div');layer.id='enemyNameplates';layer.setAttribute('aria-label','Thông tin trên đầu đối thủ');hud.append(layer);layer.append(primary);primary.classList.add('enemy-nameplate');
  const badges=new Map(),panels=new Map([['primary',primary]]),healthBars=new Map();let compactMode=false;
  function badge(id){if(!badges.has(id)){const b=document.createElement('div');b.className='enemy-afflictions';b.dataset.enemyId=id;layer.append(b);badges.set(id,b);}return badges.get(id);}
  function extra(actor){if(!panels.has(actor.id)){const el=document.createElement('section');el.className='enemy-nameplate squad-nameplate panel';el.innerHTML='<strong class="enemy-heading"></strong><div class="enemy-health-row"><span data-health></span><span data-chakra></span></div><div class="meter enemy"><div data-fill></div></div><div class="enemy-seals"></div>';el.dataset.enemyId=actor.id;layer.append(el);panels.set(actor.id,el);}return panels.get(actor.id);}
  return {update(camera,actors,enabled,options={}){compactMode=!!options.compact;layer.hidden=!enabled;layer.classList.toggle('multiple-enemies',actors.length>1);for(const el of [...panels.values(),...badges.values(),...healthBars.values()])el.hidden=true;if(!enabled)return;
    for(const actor of actors){if(!actor.visible||actor.fighter.hp<=0)continue;const panel=actor.id==='primary'?primary:extra(actor),f=actor.fighter,b=badge(actor.id),burn=f.burns.length,staticStacks=f.staticStacks;
      if(compactMode){
        if(!healthBars.has(actor.id)){const bar=document.createElement('button');bar.className='enemy-health-bar';bar.dataset.enemyId=actor.id;bar.innerHTML='<span></span>';bar.setAttribute('aria-label','Chọn đối thủ');layer.append(bar);healthBars.set(actor.id,bar);}
        const bar=healthBars.get(actor.id),point=new T.Vector3(actor.position[0],actor.position[1]+actor.height+.18,actor.position[2]).project(camera);
        if(point.z< -1||point.z>1||Math.abs(point.x)>1||Math.abs(point.y)>1)continue;
        bar.hidden=false;bar.style.left=(point.x+1)*innerWidth/2+'px';bar.style.top=(1-point.y)*innerHeight/2+'px';bar.querySelector('span').style.width=Math.max(0,Math.min(100,f.hp/f.maxHp*100))+'%';bar.classList.toggle('selected',actor.id===options.selectedId);
        bar.onpointerdown=e=>{e.preventDefault();e.stopPropagation();options.onSelect?.(actor.id);};bar.onclick=e=>{if(e.detail===0)options.onSelect?.(actor.id);};continue;
      }
      const status=(burn?`<span class="burn-stacks" title="Số tầng bỏng">♨ ${burn}/5</span>`:'')+(staticStacks?`<span class="static-stacks" title="Điểm tĩnh điện">ϟ ${staticStacks}/3</span>`:'');if(b.innerHTML!==status)b.innerHTML=status;
      if(actor.id!=='primary'){panel.querySelector('.enemy-heading').textContent=actor.name;panel.querySelector('[data-health]').textContent=Math.ceil(f.hp)+' / '+f.maxHp;panel.querySelector('[data-chakra]').textContent=Math.floor(actor.chakra)+' MANA';panel.querySelector('[data-fill]').style.width=Math.max(0,Math.min(100,f.hp/f.maxHp*100))+'%';renderEnemySeals(panel.querySelector('.enemy-seals'),actor.sequence,actor.cast);}
      panel.hidden=false;const pos=projectEnemyLabel(camera,actor.position,actor.height,{width:innerWidth,height:innerHeight},panel.offsetHeight,status?22:14);
      if(!pos){panel.hidden=true;continue;}panel.style.left=pos.x+'px';panel.style.top=pos.panelBottom+'px';
      b.hidden=!status;b.style.left=pos.x+'px';b.style.top=pos.badgeBottom+'px';panel.dataset.headY=pos.headY.toFixed(2);
    }
  },state:()=>[...(compactMode?healthBars:panels)].map(([id,p])=>({id,compact:compactMode,visible:!layer.hidden&&!p.hidden,left:parseFloat(p.style.left)||0,bottom:parseFloat(p.style.top)||0,headY:Number(p.dataset.headY)||0}))};
}
