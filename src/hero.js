import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {createArmorWardrobe} from './hero-armor.js';
import {createArmguardModel} from './armguard-model.js';

let heroModelPromise;
function loadHeroModel(){return heroModelPromise??=new GLTFLoader().loadAsync(new URL('assets/hero-ninja.glb',document.baseURI).href).then(gltf=>gltf.scene);}

export function createHero(){
  const root=new T.Group(),body=new T.Group();root.name='crimson-masked-hero';root.add(body);
  const mats=new Map(),M=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.86,flatShading:true}));return mats.get(c);};
  const cloth=M('#211e25'),dark=M('#14151c'),skin=M('#deb499'),hair=M('#161821'),silver=M('#8d878a'),strap=M('#30272a'),red=M('#762936');
  const boxGeo=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,16,10);
  const mesh=(g,m,p,x,y,z,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
  const box=(p,m,x,y,z,w,h,d)=>mesh(boxGeo,m,p,x,y,z,w,h,d);
  const ball=(p,m,x,y,z,w,h,d)=>mesh(sphere,m,p,x,y,z,w,h,d);
  // Creased strips give the torn cloth a silhouette without transparent textures.
  function ribbon(parent,rows,name,accent=true){
    const vertices=[],indices=[],geometry=new T.BufferGeometry();
    rows.forEach(([x,y,z,w],i)=>{const tip=i===rows.length-1;vertices.push(x-w/2,y+(i%2)*.025,z,x,y+(tip?.12:0),z+.025,x+w/2,y-(tip?.07:(i%2)*.018),z);});
    for(let i=0;i<rows.length-1;i++)for(let j=0;j<2;j++){const a=i*3+j,b=a+3;indices.push(a,b,a+1,a+1,b,b+1);}
    geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    for(let i=0;i<rows.length-1;i++)geometry.addGroup(i*12,12,accent?(i%3===1?0:1):0);
    const fabrics=[cloth,red];fabrics.forEach(m=>m.side=T.DoubleSide);const o=mesh(geometry,fabrics,parent,0,0,0);o.name=name;return o;
  }
  function link(parent,mat,a,b,r=.012){const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av),o=mesh(new T.CylinderGeometry(r,r,1,6),mat,parent,...av.clone().add(bv).multiplyScalar(.5).toArray());o.scale.y=delta.length();o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;}
  function ring(parent,x,y,z,r=.05){return mesh(new T.TorusGeometry(r,.009,5,12),silver,parent,x,y,z);}
  function tassel(parent,x,y,z,length=.2){ring(parent,x,y,z,.025);mesh(new T.ConeGeometry(.037,length,6),red,parent,x,y-length*.63,z).rotation.z=Math.PI;}
  mesh(new T.CylinderGeometry(.32,.265,.91,10),cloth,body,0,1.77,0,1,1,.73);
  ball(body,dark,0,1.2,0,.30,.17,.22);
  for(const side of [-1,1]){const lapel=box(body,dark,side*.12,1.8,.215,.24,.72,.055);lapel.rotation.z=side*.35;}
  box(body,red,0,1.32,0,.66,.16,.47);
  for(let i=0;i<3;i++){const belt=box(body,strap,0,1.27+i*.055,.248,.66,.033,.035);belt.rotation.z=(i-1)*.045;}
  ring(body,-.12,1.34,.286,.065);box(body,silver,.15,1.34,.284,.085,.064,.02);tassel(body,-.24,1.24,.28,.25);
  mesh(new T.CylinderGeometry(.1,.12,.17,8),skin,body,0,2.27,0);
  const head=new T.Group();head.position.set(0,2.61,0);body.add(head);head.name='hero-face';
  ball(head,skin,0,0,0,.222,.277,.207);for(const side of [-1,1])ball(head,skin,side*.216,-.015,0,.03,.056,.036);
  const mask=ball(head,dark,0,-.135,0,.226,.145,.216);mask.name='hero-face-mask';
  for(let i=0;i<3;i++){const fold=box(head,M('#343039'),0,-.075-i*.045,.217-i*.009,.26-i*.035,.009,.009);fold.rotation.z=(i%2?1:-1)*.06;}
  for(const side of [-1,1]){
    const eye=box(head,M('#e7d4cb'),side*.093,.022,.199,.105,.027,.021);eye.rotation.z=-side*.11;eye.name='hero-visible-eye';
    box(head,M('#9f4b43'),side*.084,.023,.214,.027,.03,.009);box(head,dark,side*.084,.023,.22,.012,.029,.006);
    box(head,hair,side*.095,.062,.195,.117,.017,.024).rotation.z=-side*.19;
  }
  const cap=mesh(new T.SphereGeometry(.245,14,9,0,Math.PI*2,0,Math.PI*.7),hair,head,0,.105,-.015);cap.scale.set(1,1.02,.96);
  // Curved, tapered locks replace the upright silver spikes and forehead plate.
  function lock(points,width,index){
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),v=[],ix=[];
    for(let i=0;i<4;i++){const p=curve.getPoint(i/3),t=curve.getTangent(i/3),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),t),r=width*(1-i/3)+.001;
      for(let j=0;j<3;j++){const a=j*Math.PI*2/3,d=new T.Vector3(Math.cos(a)*r,0,Math.sin(a)*r*.6).applyQuaternion(q).add(p);v.push(...d.toArray());}
    }
    for(let i=0;i<3;i++)for(let j=0;j<3;j++){const a=i*3+j,b=i*3+(j+1)%3;ix.push(a,a+3,b,b,a+3,b+3);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();const o=mesh(g,index%5===0?M('#292935'):hair,head,0,0,0);o.name='hero-black-hair';
  }
  for(let layer=0;layer<3;layer++)for(let i=0;i<12;i++){const a=i*Math.PI/6+layer*.16,r=.12+layer*.045,x=Math.sin(a),z=Math.cos(a);lock([[x*r,.26-layer*.045,z*r-.02],[x*.25,.29-layer*.065,z*.24-.025],[x*(.28+layer*.018)+.045,.2-layer*.125,z*.265-.02],[x*.32+.065,.17-layer*.14,z*.28-.03]],.055,i+layer);}
  for(let i=0;i<9;i++){const x=(i-4)*.048,tip=Math.abs(i-4)<3?.065+(i%2)*.03:-.025;lock([[x,.24,.13],[x-.035,.17,.22],[x-.055,.1,.237],[x-.065,tip,.224]],.046,i);}
  // Batch the 45 locks into two meshes while retaining their sculpted facets.
  const locks=head.children.filter(o=>o.name==='hero-black-hair'),hairGroups=new Map();
  for(const o of locks){if(!hairGroups.has(o.material))hairGroups.set(o.material,[]);hairGroups.get(o.material).push(o.geometry);head.remove(o);}
  for(const [material,geometries] of hairGroups){const o=mesh(mergeGeometries(geometries),material,head,0,0,0);o.name='hero-black-hair';o.userData.strands=geometries.length;geometries.forEach(g=>g.dispose());}
  const scarf=new T.Group();scarf.name='hero-crimson-scarf';body.add(scarf);
  for(let i=0;i<3;i++){const collar=mesh(new T.TorusGeometry(.26+i*.025,.063,6,16),i===0?red:dark,scarf,0,2.27-i*.07,0);collar.rotation.set(Math.PI/2,.08*(i-1),-.14);collar.scale.y=.83;}
  ribbon(scarf,[[-.36,2.19,.05,.21],[-.54,2.1,-.12,.23],[-.69,1.85,-.23,.21],[-.84,1.58,-.2,.19],[-.93,1.38,-.29,.09],[-1.03,1.18,-.3,.003]],'hero-shoulder-tail');
  ribbon(scarf,[[.34,2.18,-.07,.22],[.52,1.98,-.21,.25],[.64,1.7,-.3,.22],[.8,1.4,-.23,.18],[.79,1.15,-.31,.09],[.88,.98,-.35,.003]],'hero-shoulder-tail');
  ring(scarf,.27,2.13,.23,.055);tassel(scarf,.27,2.065,.23,.2);
  link(body,silver,[-.26,1.31,.28],[-.37,1.04,.21],.008);link(body,silver,[-.37,1.04,.21],[-.16,1.14,.29],.008);
  const tails=[];
  for(const side of [-1,1])for(let i=0;i<2;i++){
    const pivot=new T.Group();pivot.position.set(side*(.23+i*.02),1.26,i===0?-.12:.12);body.add(pivot);tails.push(pivot);
    ribbon(pivot,[[0,0,0,.25],[side*.065,-.24,-.035,.31],[side*.14,-.52,-.09,.28],[side*.20,-.78,-.07,.2],[side*.22,-1.01,-.11,.08],[side*.3,-1.15,-.12,.003]],'hero-torn-coattail',true);
    ribbon(pivot,[[side*.08,-.13,-.018,.035],[side*.14,-.38,-.06,.045],[side*.2,-.68,-.055,.025],[side*.25,-.86,-.08,.002]],'hero-red-trim',true);
  }
  const legs=[],arms=[];
  for(const side of [-1,1]){
    const pivot=new T.Group();pivot.position.set(side*.175,1.21,0);body.add(pivot);
    mesh(new T.CylinderGeometry(.145,.155,.5,9),cloth,pivot,0,-.25,0,1,1,1.12);
    const knee=new T.Group();knee.position.y=-.5;pivot.add(knee);mesh(new T.CylinderGeometry(.126,.086,.51,9),dark,knee,0,-.255,.01);
    box(knee,M('#35303a'),0,-.17,.113,.16,.28,.035);
    for(let i=0;i<4;i++)for(const s of [-1,1]){const lace=box(knee,i%2?strap:red,s*.035,-.12-i*.093,.145-i*.007,.105,.018,.012);lace.rotation.z=s*.49;}
    ring(knee,side*.075,-.08,.14,.024);tassel(knee,side*.1,-.15,.08,.16);
    const foot=new T.Group();foot.position.y=-.51;knee.add(foot);ball(foot,dark,0,-.08,.075,.12,.1,.225);box(foot,M('#343039'),0,-.148,.09,.24,.032,.4);box(foot,silver,0,-.061,.24,.13,.025,.065);
    legs.push({side,pivot,knee,foot});
    const arm=new T.Group();arm.position.set(side*.36,2.04,0);body.add(arm);const upper=mesh(new T.CylinderGeometry(.14,.17,.36,8),cloth,arm,side*.015,-.18,0);
    mesh(new T.CylinderGeometry(.115,.1,.16,8),skin,arm,side*.018,-.4,0);mesh(new T.CylinderGeometry(.171,.176,.035,8),red,arm,side*.015,-.345,0);
    const elbow=new T.Group();elbow.position.set(side*.02,-.46,0);arm.add(elbow);const lower=mesh(new T.CylinderGeometry(.115,.085,.37,8),dark,elbow,0,-.185,.01);
    box(elbow,M('#403640'),0,-.18,.1,.13,.25,.028);
    for(let i=0;i<3;i++){const lace=box(elbow,red,0,-.08-i*.095,.123,.15,.016,.012);lace.rotation.z=side*.28;}
    const hand=ball(elbow,dark,0,-.43,.035,.078,.1,.07),fingers=[];for(let i=0;i<3;i++)fingers.push(ball(elbow,skin,(i-1)*.035,-.49,.073,.018,.034,.021));
    arms.push({side,pivot:arm,upper,lower,elbow,hand,fingers});
  }
  const gear=new T.Group();gear.name='hero-equipment';body.add(gear);let gearKey='',equipment=null,avatarPose=null,avatarOutfit=null;
  const armorAnchor=(parent,name)=>{const g=new T.Group();g.name=name;parent.add(g);return g;};
  const armorAnchors={body:gear,shoulders:arms.map(a=>armorAnchor(a.pivot,'armor-shoulder')),bracers:arms.map(a=>armorAnchor(a.elbow,'armor-bracer')),shins:legs.map(l=>armorAnchor(l.knee,'armor-shin')),hips:legs.map(l=>armorAnchor(l.pivot,'armor-hip'))};
  const wardrobe=createArmorWardrobe(armorAnchors);
  function setEquipment(state){
    cloth.color.set(state?.hero?.coat||'#211e25');hair.color.set(state?.hero?.hair||'#161821');
    const armor=state?.armor||{id:'traveler',color:'#29252c',style:'wrap'},bag=state?.bag||{id:'pouch-30',capacity:10},armguard=state?.armguard||{id:'bare-wrists',color:'#403640'};
    avatarOutfit?.apply(state,armor);
    const key=armor.id+':'+bag.id+':'+armguard.id;if(key===gearKey)return;gearKey=key;equipment={armor:armor.id,bag:bag.id,armguard:armguard.id,gloves:!!armguard.gloves};
    wardrobe.clear();
    const trim=M(armor.elite?'#c4a574':'#8d878a');
    const b=(m,x,y,z,w,h,d)=>mesh(new T.BoxGeometry(w,h,d),m,gear,x,y,z);
    if(armor.id==='traveler'){
      const sash=b(red,0,1.77,.26,.095,.77,.035);sash.rotation.z=.51;
      const harness=b(strap,0,1.77,.3,.075,.8,.032);harness.rotation.z=-.48;
      b(trim,.08,1.91,.33,.075,.07,.02).rotation.z=-.48;
      root.userData.armorAppearance={region:'traveler',elite:false,triangles:0,draws:0};
    }else root.userData.armorAppearance=wardrobe.build(armor);
    for(const anchor of armorAnchors.bracers){anchor.traverse(o=>o.geometry?.dispose());anchor.clear();anchor.add(createArmguardModel(armguard));}
    for(const arm of arms)for(const finger of arm.fingers)finger.material=armguard.gloves?dark:skin;
    const size=bag.capacity>=50?1.65:bag.capacity>=30?1.4:bag.capacity>=20?1.15:1;
    b(strap,.32,1.09,-.19,.27*size,.31*size,.26*size);b(trim,.32,1.19,-.19-.14*size,.23*size,.07,.035);
    b(strap,.18,.77,-.15,.22,.28,.13);root.userData.equipment={...equipment};
  }
  function addAvatar(){
    loadHeroModel().then(source=>{
      const visual=cloneSkeleton(source),garments={tops:[],bottoms:[],shoes:[],wraps:[],insignia:[]};
      visual.traverse(o=>{
        if(!o.isMesh)return;
        if(o.name.toLowerCase()==='icosphere'||!o.material){o.visible=false;return;}
        o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();
        for(const m of Array.isArray(o.material)?o.material:[o.material]){
          const n=m.name.toLowerCase();m.roughness=.88;
          if(n.includes('tops'))garments.tops.push(m);else if(n.includes('bottoms'))garments.bottoms.push(m);else if(n.includes('shoes'))garments.shoes.push(m);else if(n.includes('crimson wrap'))garments.wraps.push(m);else if(n.includes('warm stitch'))garments.insignia.push(m);
        }
      });
      visual.getObjectByName('Icosphere')?.removeFromParent();
      const bounds=new T.Box3().setFromObject(visual),size=bounds.getSize(new T.Vector3());
      if(!Number.isFinite(size.y)||size.y<.5)throw new Error('GLB model has no usable humanoid height');
      const scale=2.94/size.y;visual.scale.setScalar(scale);visual.position.y=-bounds.min.y*scale;visual.name='hero-ninja-glb';
      const bones={hips:visual.getObjectByName('J_Bip_C_Hips'),spine:visual.getObjectByName('J_Bip_C_Spine'),chest:visual.getObjectByName('J_Bip_C_Chest'),
        arms:['J_Bip_L_UpperArm','J_Bip_R_UpperArm'].map(n=>visual.getObjectByName(n)),elbows:['J_Bip_L_LowerArm','J_Bip_R_LowerArm'].map(n=>visual.getObjectByName(n)),
        legs:['J_Bip_L_UpperLeg','J_Bip_R_UpperLeg'].map(n=>visual.getObjectByName(n)),knees:['J_Bip_L_LowerLeg','J_Bip_R_LowerLeg'].map(n=>visual.getObjectByName(n)),feet:['J_Bip_L_Foot','J_Bip_R_Foot'].map(n=>visual.getObjectByName(n))};
      const bind=bone=>bone?{bone,base:bone.quaternion.clone(),position:bone.position.clone()}:null;
      avatarPose={hips:bind(bones.hips),spine:bind(bones.spine),chest:bind(bones.chest)};
      for(const part of ['arms','elbows','legs','knees','feet'])avatarPose[part]=bones[part].map(bind);
      root.add(visual);body.visible=false;root.userData.referenceAppearance=true;
      avatarOutfit={apply(state,armor){
        for(const m of garments.tops)m.color.set(state?.hero?.coat||'#29272d');
        for(const m of garments.bottoms)m.color.set(state?.hero?.coat||'#29272d').multiplyScalar(.78);
        for(const m of garments.shoes)m.color.set('#181a20');
        for(const m of garments.wraps)m.color.set(armor?.elite?'#c4a574':'#71313a');
      }};
      avatarOutfit.apply(null,{id:'traveler'});
    }).catch(error=>console.warn('Could not load the custom ninja GLB; using the built-in model.',error));
  }
  setEquipment();addAvatar();let stride=0,localX=0,localZ=0,sprintBlend=0,airborne=false,airVerticalSpeed=0;
  function setAirborne(value,verticalSpeed=0){airborne=!!value;airVerticalSpeed=verticalSpeed||0;}
  function update(time,moving,velocity=null,dt=1/60,sprinting=false){
    const yaw=root.rotation.y,vx=moving?(velocity?.x??Math.sin(yaw)*4.6):0,vz=moving?(velocity?.z??Math.cos(yaw)*4.6):0,blend=1-Math.exp(-dt*14);
    localX+=(Math.cos(yaw)*vx-Math.sin(yaw)*vz-localX)*blend;localZ+=(Math.sin(yaw)*vx+Math.cos(yaw)*vz-localZ)*blend;
    const speed=Math.hypot(localX,localZ),weight=Math.min(1,speed/3),side=speed>.001?localX/speed:0,forward=speed>.001?localZ/speed:0,back=forward<0?1:0;
    sprintBlend+=((sprinting&&moving&&forward>.25?weight:0)-sprintBlend)*(1-Math.exp(-dt*12));
    const sprintLean=sprintBlend*.42;
    if(!airborne)stride+=speed*dt*(2.4+Math.abs(side)*.3)*(1+sprintBlend*.08);
    legs.forEach((leg,i)=>{
      const phase=stride+i*Math.PI,swing=Math.sin(phase)*weight,lift=Math.max(0,Math.cos(phase))*weight,knee=lift*(.5+back*.12+sprintBlend*.55);
      leg.pivot.rotation.x=-swing*forward*(back?.4:.58+sprintBlend*.27)-knee*.48-sprintLean;
      leg.pivot.rotation.z=swing*side*.34;leg.knee.rotation.x=knee;
      leg.foot.rotation.x=-leg.pivot.rotation.x-knee-sprintLean;leg.foot.rotation.z=-leg.pivot.rotation.z;
      // Both hands trail behind the shoulders instead of pumping beside the torso.
      arms[i].pivot.rotation.x=T.MathUtils.lerp(.06+swing*forward*.3,1.02+Math.sin(stride*2)*.025,sprintBlend);
      arms[i].pivot.rotation.z=T.MathUtils.lerp(-swing*side*.2,arms[i].side*.12,sprintBlend);
      arms[i].elbow.rotation.x=T.MathUtils.lerp(-.13,-.08,sprintBlend);
    });
    // Lean about the hips, keeping the pelvis and leg stride anchored over the feet.
    body.position.z=-Math.sin(sprintLean)*1.21;
    body.position.y=(1-Math.cos(sprintLean))*1.21+Math.sin(time*2)*.008*(1-weight)+Math.abs(Math.sin(stride))*.023*weight;
    body.rotation.x=forward*weight*.045*(1-sprintBlend)+sprintLean;body.rotation.z=-side*weight*.05;
    scarf.rotation.y=Math.sin(time*1.6)*.018+side*weight*.045;
    tails.forEach((tail,i)=>{tail.rotation.x=-.05-weight*.12+Math.sin(time*2.1+i*1.7)*(.025+weight*.045);tail.rotation.z=Math.sin(time*1.7+i)*.025+side*weight*.06;});
    if(avatarPose){
      const axis=(x,y,z)=>new T.Vector3(x,y,z),rotation=(x,y,z)=>new T.Quaternion().setFromEuler(new T.Euler(x,y,z));
      avatarPose.arms.forEach((entry,i)=>{
        if(!entry)return;const sign=i===0?1:-1,armSwing=airborne?-.12:Math.sin(stride+i*Math.PI)*weight*.28*(1-sprintBlend)+sprintBlend*.18;
        const relaxed=new T.Quaternion().setFromAxisAngle(axis(0,0,1),-sign*Math.PI*.35),swing=rotation(armSwing,side*weight*.06,0);
        entry.bone.quaternion.copy(entry.base).premultiply(relaxed).premultiply(swing);
      });
      avatarPose.elbows.forEach((entry,i)=>{if(entry){const flex=.12+Math.max(0,Math.cos(stride+i*Math.PI))*weight*.12;entry.bone.quaternion.copy(entry.base).premultiply(rotation(i===0?-flex:flex,0,0));}});
      avatarPose.legs.forEach((entry,i)=>{
        if(!entry)return;const phase=stride+i*Math.PI,swing=airborne?-.2:Math.sin(phase)*weight*(back?.4:.58+sprintBlend*.27)-sprintLean,lift=airborne?0:Math.max(0,Math.cos(phase))*weight;
        entry.bone.quaternion.copy(entry.base).premultiply(rotation(swing,0,0));const knee=avatarPose.knees[i];if(knee)knee.bone.quaternion.copy(knee.base).premultiply(rotation(lift*(.5+back*.12+sprintBlend*.55),0,0));
        if(airborne&&knee)knee.bone.quaternion.copy(knee.base).premultiply(rotation(airVerticalSpeed>0?.48:.62,0,0));
        const foot=avatarPose.feet[i];if(foot)foot.bone.quaternion.copy(foot.base).premultiply(rotation(airborne?-.22:-swing-lift*.35,0,0));
      });
      if(avatarPose.hips){avatarPose.hips.bone.quaternion.copy(avatarPose.hips.base).premultiply(rotation(airborne?-.04:forward*weight*.045*(1-sprintBlend)+sprintLean,0,airborne?0:-side*weight*.05));avatarPose.hips.bone.position.y=avatarPose.hips.position.y+(airborne?0:Math.sin(time*2)*.008*(1-weight)+Math.abs(Math.sin(stride))*.023*weight);}
      if(avatarPose.spine)avatarPose.spine.bone.quaternion.copy(avatarPose.spine.base).premultiply(rotation(airborne?.08:-forward*weight*.018,0,airborne?0:side*weight*.018));
      if(avatarPose.chest)avatarPose.chest.bone.quaternion.copy(avatarPose.chest.base).premultiply(rotation(airborne?-.04:-forward*weight*.012,0,airborne?0:side*weight*.012));
    }
  }
  function airPose(v){setAirborne(true,v);legs.forEach((l,i)=>{l.pivot.rotation.x=-.3;l.pivot.rotation.z=0;l.knee.rotation.x=(v>0?.65:.38)+(i===0?.1:0);l.foot.rotation.x=-l.pivot.rotation.x-l.knee.rotation.x;});arms.forEach(a=>{a.pivot.rotation.x=-.6;a.pivot.rotation.z=-a.side*.22;});}
  function climbPose(t){arms.forEach((a,i)=>{a.pivot.rotation.x=-2+Math.sin(t*6+i*Math.PI)*.35;});legs.forEach((l,i)=>l.knee.rotation.x=.4+Math.sin(t*6+i*Math.PI)*.25);body.rotation.x=-.1;}
  return {root,group:root,cloth,hair,legs,arms,armorAnchors,update,airPose,setAirborne,climbPose,setEquipment,locomotionState:()=>({side:localX,forward:localZ,speed:Math.hypot(localX,localZ),stride,sprintBlend,arms:arms.map(a=>({shoulder:[a.pivot.rotation.x,a.pivot.rotation.z],elbow:a.elbow.rotation.x})),legs:legs.map(l=>({hip:[l.pivot.rotation.x,l.pivot.rotation.z],knee:l.knee.rotation.x,ankle:l.foot.rotation.x})),lean:[body.rotation.x,body.rotation.z]}),get equipment(){return equipment;}};
}
