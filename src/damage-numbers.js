import * as T from 'three';

export const DAMAGE_NUMBER_LIFE=1.05,MAX_DAMAGE_NUMBERS=40;
export function damageNumberText(amount){return '-'+(amount>=1?Number(amount.toFixed(1)):Number(amount.toFixed(2))||.01);}
export function damageNumberSize(amount){return Math.min(70,24+Math.log2(1+Math.max(0,amount))*3.6);}
function numberTexture(text,owner){
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font='900 84px Arial, sans-serif';
  canvas.width=Math.ceil(ctx.measureText(text).width)+44;canvas.height=136;
  ctx.font='900 84px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  const x=canvas.width/2-3,y=canvas.height/2-4;
  // Dark bevel and offset faces give the world-space number a raised silhouette.
  ctx.lineWidth=13;ctx.strokeStyle='#17151d';ctx.strokeText(text,x+3,y+6);
  for(let depth=5;depth>0;depth--){ctx.fillStyle=owner==='player'?'#7c1723':'#9b4912';ctx.fillText(text,x+depth*.6,y+depth);}
  ctx.lineWidth=7;ctx.strokeStyle=owner==='player'?'#8e2631':'#9e5419';ctx.strokeText(text,x,y);
  const fill=ctx.createLinearGradient(0,y-42,0,y+42);fill.addColorStop(0,'#fffbed');fill.addColorStop(.35,owner==='player'?'#ffc7b0':'#fff3b0');fill.addColorStop(1,owner==='player'?'#ff545c':'#ffb33f');ctx.fillStyle=fill;ctx.fillText(text,x,y);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;
  return {texture,aspect:canvas.width/canvas.height};
}
export function createDamageNumbers(scene,{enabled=()=>true,createTexture=numberTexture}={}){
  const root=new T.Group(),overlay=new T.Scene();root.name='combat-damage-numbers';scene.add(root);
  const active=[],pool=[],cache=new Map(),bindings=new Map();let actors=new Map(),time=0,serial=0;
  const right=new T.Vector3(),up=new T.Vector3(),forward=new T.Vector3(),eye=new T.Vector3(),delta=new T.Vector3();
  function prune(){for(const [key,entry]of cache){if(cache.size<=48)break;if(!entry.refs){entry.texture.dispose();cache.delete(key);}}}
  function asset(text,owner){const key=owner+':'+text;let entry=cache.get(key);if(!entry){entry={...createTexture(text,owner),key,refs:0};cache.set(key,entry);}else{cache.delete(key);cache.set(key,entry);}entry.refs++;prune();return entry;}
  function setAmount(node,amount){if(node.asset)node.asset.refs--;node.amount=amount;node.text=damageNumberText(amount);node.pixels=damageNumberSize(amount);node.asset=asset(node.text,node.owner);const hadMap=!!node.sprite.material.map;node.sprite.material.map=node.asset.texture;if(!hadMap)node.sprite.material.needsUpdate=true;}
  function remove(node){node.sprite.removeFromParent();node.sprite.visible=false;node.asset.refs--;pool.push(node.sprite);active.splice(active.indexOf(node),1);prune();}
  function trigger(actor,amount){
    if(!enabled()||!Number.isFinite(amount)||amount<=0)return;
    let recent;for(let i=active.length-1;i>=0;i--)if(active[i].actorId===actor.id&&time-active[i].born<=.08){recent=active[i];break;}
    if(recent){setAmount(recent,recent.amount+amount);return;}
    if(active.length>=MAX_DAMAGE_NUMBERS)remove(active[0]);
    const sprite=pool.pop()||new T.Sprite(new T.SpriteMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));sprite.name='damage-number';sprite.renderOrder=11010;sprite.frustumCulled=false;sprite.visible=true;sprite.material.opacity=1;root.add(sprite);
    const nearby=active.filter(n=>n.actorId===actor.id).length,side=(nearby%2?1:-1)*(.35+Math.floor(nearby/2)*.22),pos=actor.pos||actor.position;
    const node={id:++serial,actorId:actor.id,owner:actor.owner,amount:0,born:time,age:0,side,anchor:new T.Vector3(pos[0],pos[1]+Math.min(3,(actor.height||3)*.28),pos[2]),sprite,asset:null};
    setAmount(node,amount);active.push(node);
  }
  function unbind(fighter,binding){if(fighter.onDamage===binding.callback)fighter.onDamage=binding.previous;bindings.delete(fighter);}
  return {
    observe(list){actors=new Map(list.map(actor=>[actor.fighter,actor]));for(const [fighter,binding]of bindings)if(!actors.has(fighter))unbind(fighter,binding);
      for(const actor of list)if(!bindings.has(actor.fighter)){
        const fighter=actor.fighter,previous=fighter.onDamage,callback=amount=>{if(typeof previous==='function')previous.call(fighter,amount);const current=actors.get(fighter);if(current)trigger(current,amount);};fighter.onDamage=callback;bindings.set(fighter,{previous,callback});
      }
    },
    advance(dt){if(!(dt>0))return;time+=dt;for(const node of [...active]){node.age=time-node.born;if(node.age>=DAMAGE_NUMBER_LIFE)remove(node);}},
    render(camera,{enabled:visible=true,firstPerson=false,viewportHeight=globalThis.innerHeight||800,reducedMotion=false}={}){
      root.visible=visible;if(!visible)return;const parent=firstPerson?overlay:scene;if(root.parent!==parent)parent.add(root);camera.updateMatrixWorld();right.set(1,0,0).applyQuaternion(camera.quaternion);up.set(0,1,0).applyQuaternion(camera.quaternion);camera.getWorldDirection(forward);eye.copy(camera.position);
      for(const node of active){
        const t=node.age/DAMAGE_NUMBER_LIFE,rise=reducedMotion?t*.4:3*t-1.7*t*t;
        if(firstPerson&&node.actorId==='player')node.sprite.position.copy(eye).addScaledVector(forward,2.2).addScaledVector(right,-.64+node.side*.2).addScaledVector(up,-.5+rise*.22);
        else{node.sprite.position.copy(node.anchor).addScaledVector(right,node.side*(.35+t*.7));node.sprite.position.y+=rise;}
        const depth=delta.copy(node.sprite.position).sub(eye).dot(forward);node.sprite.visible=depth>camera.near;if(!node.sprite.visible)continue;
        const bounce=reducedMotion?1:node.age<.12?.55+node.age/.12*.7:node.age<.25?1.25-(node.age-.12)/.13*.25:1;
        const height=node.pixels/viewportHeight*(2*depth*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*bounce;node.sprite.scale.set(height*node.asset.aspect,height,1);node.sprite.material.opacity=t<.58?1:Math.max(0,(1-t)/.42);
      }
    },
    drawOverlay(renderer,camera){if(root.parent===overlay&&root.visible&&active.length)renderer.render(overlay,camera);},
    reset(){for(const node of [...active])remove(node);for(const [fighter,binding]of bindings)unbind(fighter,binding);actors.clear();},
    dispose(){this.reset();for(const sprite of pool)sprite.material.dispose();for(const entry of cache.values())entry.texture.dispose();cache.clear();pool.length=0;root.removeFromParent();},
    state:()=>({active:active.map(n=>({id:n.id,actorId:n.actorId,owner:n.owner,amount:n.amount,text:n.text,age:n.age,pixels:n.pixels,position:n.sprite.position.toArray(),scale:n.sprite.scale.toArray(),opacity:n.sprite.material.opacity,visible:root.visible&&n.sprite.visible})),pooled:pool.length,textures:cache.size})
  };
}
