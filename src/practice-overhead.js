import * as T from 'three';
import {MOVEMENT_SPEED_MULTIPLIER} from './game-pace.js';

// The rails in scene.js enclose x = ±16, z = -26..12. Leave room for the body.
export const PRACTICE_ARENA={minX:-16,maxX:16,minZ:-26,maxZ:12};
export const PRACTICE_DIVIDERS=[1,2].map(i=>PRACTICE_ARENA.minZ+(PRACTICE_ARENA.maxZ-PRACTICE_ARENA.minZ)*i/3);
export const PRACTICE_BOUNDS={minX:-15.35,maxX:15.35,minZ:-25.35,maxZ:11.35};
export const PRACTICE_MOVE_SPEED=2.5*MOVEMENT_SPEED_MULTIPLIER;
export const PRACTICE_BOT_MOVE_SPEED=PRACTICE_MOVE_SPEED*.5;
export function clampPracticePoint(p){return [T.MathUtils.clamp(p[0],PRACTICE_BOUNDS.minX,PRACTICE_BOUNDS.maxX),p[1],T.MathUtils.clamp(p[2],PRACTICE_BOUNDS.minZ,PRACTICE_BOUNDS.maxZ)];}
// Skills may move actors across a divider. Walking and G stay in the section
// occupied when the movement starts, without snapping a skill back home.
export function practiceMovementBounds(owner,clearance=.65,from){const edges=[PRACTICE_ARENA.minZ,...PRACTICE_DIVIDERS,PRACTICE_ARENA.maxZ],section=from?from[2]<PRACTICE_DIVIDERS[0]?0:from[2]<PRACTICE_DIVIDERS[1]?1:2:owner==='enemy'?0:2;return {minX:PRACTICE_ARENA.minX+clearance,maxX:PRACTICE_ARENA.maxX-clearance,minZ:edges[section]+clearance,maxZ:edges[section+1]-clearance};}
export function clampPracticeActorPoint(p,owner='player',clearance=.65,from){const b=practiceMovementBounds(owner,clearance,from);return [T.MathUtils.clamp(p[0],b.minX,b.maxX),p[1],T.MathUtils.clamp(p[2],b.minZ,b.maxZ)];}
export function stepPracticePoint(from,to,distance,clearance=.65){const goal=clampPracticeActorPoint(to,'player',clearance,from),dx=goal[0]-from[0],dz=goal[2]-from[2],length=Math.hypot(dx,dz),t=length>0?Math.min(1,distance/length):0;return clampPracticeActorPoint([from[0]+dx*t,from[1],from[2]+dz*t],'player',clearance,from);}

export function createPracticeOverhead(scene,{actorScale=1}={}){
  const root=new T.Group();scene.add(root);root.visible=false;
  const material=new T.MeshBasicMaterial({color:'#71e6e7',transparent:true,opacity:.7,depthWrite:false,side:T.DoubleSide});
  const strip=new T.Mesh(new T.PlaneGeometry(1,1),material);strip.rotation.x=-Math.PI/2;root.add(strip);
  const ring=new T.Mesh(new T.RingGeometry(.94,1,80),material);ring.rotation.x=-Math.PI/2;root.add(ring);
  const arrow=new T.Mesh(new T.ConeGeometry(.35,.9,3),material);arrow.rotation.x=-Math.PI/2;root.add(arrow);
  const destination=new T.Mesh(new T.RingGeometry(.32,.43,32),new T.MeshBasicMaterial({color:'#a6f4b9',transparent:true,opacity:.9,depthWrite:false,side:T.DoubleSide}));destination.rotation.x=-Math.PI/2;scene.add(destination);destination.visible=false;
  const playerMarker=new T.Mesh(new T.RingGeometry(.7,.79,48),new T.MeshBasicMaterial({color:'#a6f4b9',transparent:true,opacity:.9,depthWrite:false,side:T.DoubleSide}));playerMarker.rotation.x=-Math.PI/2;scene.add(playerMarker);playerMarker.visible=false;
  playerMarker.scale.setScalar(actorScale);
  const fence=new T.Group(),wood=new T.MeshStandardMaterial({color:'#85664b',roughness:.9});scene.add(fence);fence.visible=false;
  for(const z of [PRACTICE_ARENA.minZ,...PRACTICE_DIVIDERS,PRACTICE_ARENA.maxZ]){const row=new T.Group();row.name=PRACTICE_DIVIDERS.includes(z)?'practice-divider':'practice-end-fence';row.position.z=z;fence.add(row);for(const y of [.55,1.25]){const rail=new T.Mesh(new T.BoxGeometry(32,.12,.15),wood);rail.position.set(0,y,0);row.add(rail);}for(let x=-16;x<=16;x+=4){const post=new T.Mesh(new T.BoxGeometry(.25,1.7,.25),wood);post.position.set(x,.85,0);row.add(post);}}
  const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3();
  let cursor=[0,0,-8],pointer=null,moveTarget=null,preview=null;
  function projectPointer(camera,canvas){if(!pointer)return;const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((pointer[0]-r.left)/r.width*2-1,-(pointer[1]-r.top)/r.height*2+1),camera);if(ray.ray.intersectPlane(plane,hit))cursor=clampPracticePoint(hit.toArray());}
  return {
    point:()=>[...cursor],
    pointer(x,y,camera,canvas){pointer=[x,y];projectPointer(camera,canvas);},
    move(from){moveTarget=clampPracticeActorPoint(cursor,'player',.65*actorScale,from);},
    moveTo(point,from){moveTarget=clampPracticeActorPoint(point,'player',.65*actorScale,from);},
    target:()=>moveTarget&&[...moveTarget],
    stop(){moveTarget=null;destination.visible=false;},
    reset(){moveTarget=null;pointer=null;cursor=[0,0,-8];preview=null;root.visible=destination.visible=playerMarker.visible=fence.visible=false;},
    camera(camera,canvas){const height=Math.max(47,47*1.2/camera.aspect);camera.fov=52;camera.position.set(0,height,-7+height*30/47);camera.lookAt(0,0,-7);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);projectPointer(camera,canvas);},
    update({enabled,active,spell,available,position,target,heightAt}){
      fence.visible=enabled;playerMarker.visible=enabled;playerMarker.position.set(position[0],heightAt(position[0],position[2])+.14,position[2]);root.visible=active&&!!spell;
      destination.visible=active&&!!moveTarget;if(destination.visible)destination.position.set(moveTarget[0],heightAt(moveTarget[0],moveTarget[2])+.13,moveTarget[2]);
      preview=null;if(!root.visible)return;
      const dx=cursor[0]-position[0],dz=cursor[2]-position[2],length=Math.hypot(dx,dz),direction=length>.001?[dx/length,0,dz/length]:[0,0,-1];
      const self=['domain','shadowclone','shadowdive','snowstorm','icefog','snowball','flowerpoison'].includes(spell.style);
      const wall=['firewall','waterwall','windwall','icewall','earthwall','lightmirror'].includes(spell.style);
      const area=['meteor','thunder','jacob','waterbubbles','shadowbind','lightdome','earthgravity','earthquake','earthcraterspikes','stormfield','lightsphere','ignite','discharge','woodseed','aircombo'].includes(spell.style);
      const fixed=spell.style==='lightmirror'?2.4:spell.style==='icewall'?3.2:wall?3:spell.style==='stormfield'?4:spell.style==='lightsphere'?3:null;
      const center=self?[...position]:fixed!==null?[position[0]+direction[0]*fixed,0,position[2]+direction[2]*fixed]:area?[...target]:[position[0]+direction[0]*31,0,position[2]+direction[2]*31];
      const radius=spell.style==='lightsphere'?.8:spell.blastRadius||spell.domeRadius||spell.fieldRadius||spell.radius||spell.domainRadius||2.2;
      strip.visible=!self&&!area;ring.visible=self||area;arrow.visible=!self&&!area&&!wall;
      material.color.set(available?'#71e6e7':'#db846e');
      const end=center,dist=Math.hypot(end[0]-position[0],end[2]-position[2]);
      strip.position.set(wall?center[0]:(position[0]+end[0])/2,.16+heightAt(position[0],position[2]),wall?center[2]:(position[2]+end[2])/2);
      strip.rotation.z=Math.atan2(-direction[0],-direction[2]);strip.scale.set(wall?(spell.wallWidth||spell.width||4):Math.max(.22,spell.waveWidth||((spell.size||.25)*2)),wall?.18:Math.max(.1,dist),1);
      ring.position.set(center[0],.17+heightAt(center[0],center[2]),center[2]);ring.scale.setScalar(radius);
      arrow.position.set(end[0],.23+heightAt(end[0],end[2]),end[2]);arrow.rotation.z=Math.atan2(-direction[0],-direction[2]);
      preview={spellId:spell.id,kind:self?'self':wall?'wall':area?'area':'direction',available,origin:[...position],target:center,direction,radius};
    },
    state:()=>({actorScale,cursor:[...cursor],moveTarget:moveTarget&&[...moveTarget],preview,visible:root.visible,fencesVisible:fence.visible,dividers:[...PRACTICE_DIVIDERS],bounds:{player:practiceMovementBounds('player',.65*actorScale),enemy:practiceMovementBounds('enemy',.65*actorScale)}})
  };
}
