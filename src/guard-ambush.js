import * as T from 'three';

export const GUARD_ALERT_RADIUS=10,GUARD_RUN_SPEED=5.8;
export function createGuardAmbush({entry,char,land,physics,heightAt,blocked,findPath,smoke}){
  const standing=entry.guardRole==='guardian',home={x:entry.x,y:entry.y,z:entry.z},disguise=new T.Group();disguise.name='guard-disguise-'+entry.disguise;disguise.position.set(home.x,home.y,home.z);land.add(disguise);entry.revealed=standing;char.root.visible=standing;disguise.visible=!standing;
  const mesh=(geometry,color,x,y,z)=>{const object=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:1,flatShading:true}));object.position.set(x,y,z);object.castShadow=true;object.receiveShadow=true;disguise.add(object);return object;};
  if(standing){/* These two elite guards stand openly at their posts. */}
  else if(entry.disguise==='stump'){
    const trunk=mesh(new T.CylinderGeometry(.46,.66,1.05,7),'#62503c',0,.52,0);trunk.rotation.z=.08;mesh(new T.CylinderGeometry(.4,.4,.055,7),'#a18b60',.04,1.075,0);for(let i=0;i<4;i++){const a=i*Math.PI/2,root=mesh(new T.ConeGeometry(.22,.8,5),'#62503c',Math.sin(a)*.47,.18,Math.cos(a)*.47);root.rotation.z=Math.sin(a)*.9;root.rotation.x=Math.cos(a)*.9;}
  }else if(entry.disguise==='bush'){
    for(let i=0;i<5;i++){const a=i*2.4,m=mesh(new T.IcosahedronGeometry(.53+i%2*.14,0),'#586a46',Math.sin(a)*.42,.42+i%3*.15,Math.cos(a)*.38);m.scale.y=.86;}
  }else{const rock=mesh(new T.DodecahedronGeometry(.78,0),'#777768',0,.55,0);rock.scale.set(1.05,.78,.9);rock.rotation.set(.12,.7,.08);}
  disguise.userData.noCollision=true;
  // Deactivate this collider on reveal; keep the spatial index intact.
  const solid=standing?null:physics.addBox({name:'guard-disguise',x:home.x,z:home.z,w:1.05,d:1.05,bottom:home.y,top:home.y+1.05,stepable:false});
  let phase=standing?'guarding':'hidden',age=0,path=[],replan=0,lastTarget=null,moving=false,velocity={x:0,z:0};
  function reveal(){if(phase!=='hidden')return false;phase='revealing';age=0;entry.revealed=true;smoke.burst([home.x,home.y,home.z]);return true;}
  function update(dt,{hero,enabled=true,riding=false,surface=null}){
    moving=false;velocity={x:0,z:0};if(!enabled||riding||surface)return false;
    const p=char.root.position,d=Math.hypot(p.x-hero.x,p.z-hero.z,p.y-hero.y);let revealed=false;
    if(phase==='guarding'&&d<=GUARD_ALERT_RADIUS)phase='chasing';
    if(phase==='hidden'&&d<=GUARD_ALERT_RADIUS)revealed=reveal();
    if(phase==='revealing'){age+=dt;if(age>=.14){disguise.visible=false;char.root.visible=true;solid.top=-1000;solid.bottom=-1001;}if(age<.6)return revealed;phase='chasing';}
    if(phase==='chasing'){
      if(d<1.9&&Math.abs(p.y-hero.y)<2.5){phase='caught';return revealed;}
      replan-=dt;
      if(replan<=0&&(!lastTarget||Math.hypot(hero.x-lastTarget.x,hero.z-lastTarget.z)>1||!path.length)){
        replan=.55;lastTarget={x:hero.x,z:hero.z};
        let target=[hero.x,hero.z];if(blocked(...target))target=null;
        path=target?findPath([p.x,p.z],target,blocked):[];
      }
      let budget=GUARD_RUN_SPEED*dt;while(path.length&&budget>0){const [x,z]=path[0],dx=x-p.x,dz=z-p.z,length=Math.hypot(dx,dz);if(length<.03){path.shift();continue;}const step=Math.min(length,budget,.18),nx=p.x+dx/length*step,nz=p.z+dz/length*step,ny=heightAt(nx,nz);if(blocked(nx,nz)||Math.abs(ny-p.y)>.8){path=[];break;}p.x=nx;p.z=nz;p.y=ny;char.root.rotation.y=Math.atan2(dx,dz);velocity={x:dx/length*GUARD_RUN_SPEED,z:dz/length*GUARD_RUN_SPEED};moving=true;budget-=step;if(step>=length-.001)path.shift();}
      Object.assign(entry,{x:p.x,y:p.y,z:p.z});
    }
    return revealed;
  }
  return {entry,char,disguise,update,reveal,dismiss(){phase='withdrawn';path=[];moving=false;},caught:()=>phase==='caught',animate(time,dt){if(char.root.visible)char.update(time,moving,velocity,dt);},state:()=>({...entry,phase,home:{...home},ninjaVisible:char.root.visible,disguiseVisible:disguise.visible,moving,alertRadius:GUARD_ALERT_RADIUS,runSpeed:GUARD_RUN_SPEED})};
}
