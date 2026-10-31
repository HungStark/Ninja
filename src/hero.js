import {prepareCharacterSource,trackCharacterLoad} from './character-assets.js';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {createArmorWardrobe} from './hero-armor.js';
import {createArmguardModel} from './armguard-model.js';
import {inkMaterial,addInkOutline} from './ink-outline.js';
import {createCharacterMotion,REST_ARM_OPEN} from './character-motion.js';

let heroModelPromise;
function loadHeroModel(){return heroModelPromise??=new GLTFLoader().loadAsync(new URL('assets/hero-ninja-simple.glb',document.baseURI).href).then(gltf=>prepareCharacterSource(gltf.scene));}

export function createHero({outlineWidth=1.15,procedural=typeof document==='undefined'}={}){
  const root=new T.Group(),body=new T.Group();root.name='crimson-masked-hero';root.add(body);root.userData.proceduralCharacter=procedural;
  const ink=inkMaterial(outlineWidth,'#302b30');
  function outlineMeshes(group){const meshes=[];group.traverse(o=>{if(o.isMesh&&!o.userData.inkOutline&&!o.userData.hasInkOutline&&!/eye|facemouth|facebrow/i.test(Array.isArray(o.material)?o.material.map(m=>m.name).join(' '):o.material?.name||''))meshes.push(o);});for(const o of meshes)addInkOutline(o,ink);}
  const mats=new Map(),M=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.86,flatShading:true}));return mats.get(c);};
  const cloth=M('#211e25'),dark=M('#14151c'),skin=M('#deb499'),hair=M('#161821'),silver=M('#8d878a'),strap=M('#30272a'),red=M('#762936');
  const boxGeo=procedural?new T.BoxGeometry(1,1,1):null,sphere=procedural?new T.SphereGeometry(1,16,10):null;
  const mesh=(g,m,p,x,y,z,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
  const box=(p,m,x,y,z,w,h,d)=>mesh(boxGeo,m,p,x,y,z,w,h,d);
  const ball=(p,m,x,y,z,w,h,d)=>mesh(sphere,m,p,x,y,z,w,h,d);
  const tails=[],legs=[],arms=[];let head,scarf;
  if(procedural){
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
  head=new T.Group();head.position.set(0,2.61,0);body.add(head);head.name='hero-face';
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
  scarf=new T.Group();scarf.name='hero-crimson-scarf';body.add(scarf);
  for(let i=0;i<3;i++){const collar=mesh(new T.TorusGeometry(.26+i*.025,.063,6,16),i===0?red:dark,scarf,0,2.27-i*.07,0);collar.rotation.set(Math.PI/2,.08*(i-1),-.14);collar.scale.y=.83;}
  ribbon(scarf,[[-.36,2.19,.05,.21],[-.54,2.1,-.12,.23],[-.69,1.85,-.23,.21],[-.84,1.58,-.2,.19],[-.93,1.38,-.29,.09],[-1.03,1.18,-.3,.003]],'hero-shoulder-tail');
  ribbon(scarf,[[.34,2.18,-.07,.22],[.52,1.98,-.21,.25],[.64,1.7,-.3,.22],[.8,1.4,-.23,.18],[.79,1.15,-.31,.09],[.88,.98,-.35,.003]],'hero-shoulder-tail');
  ring(scarf,.27,2.13,.23,.055);tassel(scarf,.27,2.065,.23,.2);
  link(body,silver,[-.26,1.31,.28],[-.37,1.04,.21],.008);link(body,silver,[-.37,1.04,.21],[-.16,1.14,.29],.008);
  for(const side of [-1,1])for(let i=0;i<2;i++){
    const pivot=new T.Group();pivot.position.set(side*(.23+i*.02),1.26,i===0?-.12:.12);body.add(pivot);tails.push(pivot);
    ribbon(pivot,[[0,0,0,.25],[side*.065,-.24,-.035,.31],[side*.14,-.52,-.09,.28],[side*.20,-.78,-.07,.2],[side*.22,-1.01,-.11,.08],[side*.3,-1.15,-.12,.003]],'hero-torn-coattail',true);
    ribbon(pivot,[[side*.08,-.13,-.018,.035],[side*.14,-.38,-.06,.045],[side*.2,-.68,-.055,.025],[side*.25,-.86,-.08,.002]],'hero-red-trim',true);
  }
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
  }else{
    body.visible=false;head=new T.Group();head.name='hero-face';head.position.set(0,2.61,0);body.add(head);scarf=new T.Group();body.add(scarf);
    for(const side of [-1,1]){const pivot=new T.Group(),knee=new T.Group(),foot=new T.Group();pivot.position.set(side*.175,1.21,0);knee.position.y=-.5;foot.position.y=-.51;body.add(pivot);pivot.add(knee);knee.add(foot);legs.push({side,pivot,knee,foot});const arm=new T.Group(),elbow=new T.Group(),hand=new T.Group();arm.position.set(side*.36,2.04,0);elbow.position.set(side*.02,-.46,0);hand.position.set(0,-.43,.035);body.add(arm);arm.add(elbow);elbow.add(hand);arms.push({side,pivot:arm,upper:new T.Group(),lower:new T.Group(),elbow,hand,fingers:[]});}
  }
  const gear=new T.Group();gear.name='hero-equipment';body.add(gear);let gearKey='',equipment=null,avatarPose=null,avatarOutfit=null,avatarWardrobe=null,lastEquipmentState=null;
  const armorAnchor=(parent,name)=>{const g=new T.Group();g.name=name;parent.add(g);return g;};
  const armorAnchors={body:gear,shoulders:arms.map(a=>armorAnchor(a.pivot,'armor-shoulder')),bracers:arms.map(a=>armorAnchor(a.elbow,'armor-bracer')),shins:legs.map(l=>armorAnchor(l.knee,'armor-shin')),hips:legs.map(l=>armorAnchor(l.pivot,'armor-hip'))};
  const wardrobe=createArmorWardrobe(armorAnchors);
  function setEquipment(state){
    lastEquipmentState=state||null;
    cloth.color.set(state?.hero?.coat||'#211e25');hair.color.set(state?.hero?.hair||'#161821');
    const armor=state?.armor||{id:'traveler',color:'#29252c',style:'wrap'},bag=state?.bag||{id:'pouch-30',capacity:10},armguard=state?.armguard||{id:'bare-wrists',color:'#403640'};
    avatarOutfit?.apply(state,armor);
    const key=armor.id+':'+bag.id+':'+armguard.id;if(key===gearKey)return;gearKey=key;equipment={armor:armor.id,bag:bag.id,armguard:armguard.id,gloves:!!armguard.gloves};
    if(!procedural){
      if(avatarWardrobe){avatarWardrobe.clear();root.userData.avatarArmorAppearance=armor.id==='traveler'?{region:'traveler',elite:false,triangles:0,draws:0}:avatarWardrobe.build(armor);}
      root.userData.armorAppearance=root.userData.avatarArmorAppearance||{region:'traveler',elite:false,triangles:0,draws:0};root.userData.equipment={...equipment};outlineMeshes(root);return;
    }
    wardrobe.clear();
    const trim=M(armor.elite?'#c4a574':'#8d878a');
    const b=(m,x,y,z,w,h,d)=>mesh(new T.BoxGeometry(w,h,d),m,gear,x,y,z);
    if(armor.id==='traveler'){
      const sash=b(red,0,1.77,.26,.095,.77,.035);sash.rotation.z=.51;
      const harness=b(strap,0,1.77,.3,.075,.8,.032);harness.rotation.z=-.48;
      b(trim,.08,1.91,.33,.075,.07,.02).rotation.z=-.48;
      root.userData.armorAppearance={region:'traveler',elite:false,triangles:0,draws:0};
    }else root.userData.armorAppearance=wardrobe.build(armor);
    if(avatarWardrobe){
      avatarWardrobe.clear();
      if(armor.id!=='traveler')root.userData.avatarArmorAppearance=avatarWardrobe.build(armor);
      else root.userData.avatarArmorAppearance={region:'traveler',elite:false,triangles:0,draws:0};
    }
    for(const anchor of armorAnchors.bracers){anchor.traverse(o=>o.geometry?.dispose());anchor.clear();anchor.add(createArmguardModel(armguard));}
    for(const arm of arms)for(const finger of arm.fingers)finger.material=armguard.gloves?dark:skin;
    const size=bag.capacity>=50?1.65:bag.capacity>=30?1.4:bag.capacity>=20?1.15:1;
    b(strap,.32,1.09,-.19,.27*size,.31*size,.26*size);b(trim,.32,1.19,-.19-.14*size,.23*size,.07,.035);
    b(strap,.18,.77,-.15,.22,.28,.13);root.userData.equipment={...equipment};outlineMeshes(root);
  }
  function addAvatar(){
    if(procedural||typeof document==='undefined'||document.baseURI==='about:blank')return;
    return loadHeroModel().then(source=>{
      const visual=cloneSkeleton(source),garments={tops:[],bottoms:[],shoes:[],wraps:[],insignia:[]};
      visual.traverse(o=>{
        if(!o.isMesh)return;
        if(o.name.toLowerCase()==='icosphere'||!o.material){o.visible=false;return;}
        o.castShadow=true;o.receiveShadow=true;
        o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();
        for(const m of Array.isArray(o.material)?o.material:[o.material]){
          const n=m.name.toLowerCase();m.roughness=.88;
          if(n.includes('face_00_skin'))m.color.set('#dfb99e');
          if(n.includes('tops'))garments.tops.push(m);else if(n.includes('bottoms'))garments.bottoms.push(m);else if(n.includes('shoes'))garments.shoes.push(m);else if(n.includes('crimson wrap'))garments.wraps.push(m);else if(n.includes('warm stitch'))garments.insignia.push(m);
        }
      });
      visual.getObjectByName('Icosphere')?.removeFromParent();
      // A solid cloth mask keeps the pale mouth/cheek texture from reading as
      // a white stripe at the small size used by the training portrait.
      const faceBone=visual.getObjectByName('J_Bip_C_Head');
      if(faceBone){
        const maskGeometry=new T.BufferGeometry();
        maskGeometry.setAttribute('position',new T.Float32BufferAttribute([-.096,1.592,.045,0,1.589,.097,.096,1.592,.045,-.078,1.526,.027,0,1.522,.079,.078,1.526,.027,-.099,1.58,-.018,-.084,1.528,-.019,.099,1.58,-.018,.084,1.528,-.019],3));
        maskGeometry.setIndex([0,3,1,1,3,4,1,4,2,2,4,5,6,7,0,0,7,3,2,5,8,8,5,9]);
        visual.updateMatrixWorld(true);maskGeometry.applyMatrix4(faceBone.matrixWorld.clone().invert().multiply(visual.matrixWorld));maskGeometry.computeVertexNormals();
        const faceMask=new T.Mesh(maskGeometry,new T.MeshStandardMaterial({color:'#24242b',roughness:1,side:T.DoubleSide}));faceMask.name='hero-cloth-face-mask';faceBone.add(faceMask);
      }
      const bounds=new T.Box3().setFromObject(visual),size=bounds.getSize(new T.Vector3());
      if(!Number.isFinite(size.y)||size.y<.5)throw new Error('GLB model has no usable humanoid height');
      const scale=2.94/size.y;visual.scale.setScalar(scale);visual.position.y=-bounds.min.y*scale;visual.name='hero-ninja-glb';
      const bones={hips:visual.getObjectByName('J_Bip_C_Hips'),spine:visual.getObjectByName('J_Bip_C_Spine'),chest:visual.getObjectByName('J_Bip_C_Chest'),
        arms:['J_Bip_L_UpperArm','J_Bip_R_UpperArm'].map(n=>visual.getObjectByName(n)),elbows:['J_Bip_L_LowerArm','J_Bip_R_LowerArm'].map(n=>visual.getObjectByName(n)),
        legs:['J_Bip_L_UpperLeg','J_Bip_R_UpperLeg'].map(n=>visual.getObjectByName(n)),knees:['J_Bip_L_LowerLeg','J_Bip_R_LowerLeg'].map(n=>visual.getObjectByName(n)),feet:['J_Bip_L_Foot','J_Bip_R_Foot'].map(n=>visual.getObjectByName(n))};
      const bind=bone=>bone?{bone,base:bone.quaternion.clone(),position:bone.position.clone()}:null;
      avatarPose={hips:bind(bones.hips),spine:bind(bones.spine),chest:bind(bones.chest),scale,legLength:(bones.knees[0]?.position.length()||.393)+(bones.feet[0]?.position.length()||.46)};
      for(const part of ['arms','elbows','legs','knees','feet'])avatarPose[part]=bones[part].map(bind);
      root.add(visual);body.visible=false;root.userData.referenceAppearance=true;outlineMeshes(visual);
      const anchor=(parent,name)=>{const g=new T.Group();g.name=name;parent.add(g);if(parent!==root)g.scale.setScalar(1/scale);return g;};
      const armorBodyAnchor=anchor(root,'avatar-armor-body');armorBodyAnchor.position.y=.18;
      const avatarShoulders=[-1,1].map((side,i)=>{const g=anchor(root,`avatar-armor-shoulder-${i}`);g.position.set(side*.32,2.32,.075);return g;});
      const avatarArmorAnchors={body:armorBodyAnchor,shoulders:avatarShoulders,bracers:bones.elbows.map((bone,i)=>anchor(bone||visual,`avatar-armor-bracer-${i}`)),shins:bones.knees.map((bone,i)=>anchor(bone||visual,`avatar-armor-shin-${i}`)),hips:bones.legs.map((bone,i)=>anchor(bone||visual,`avatar-armor-hip-${i}`))};
      avatarWardrobe=createArmorWardrobe(avatarArmorAnchors);
      avatarOutfit={apply(state,armor){
        for(const m of garments.tops)m.color.set(state?.hero?.coat||'#29272d');
        for(const m of garments.bottoms)m.color.set(state?.hero?.coat||'#29272d').multiplyScalar(.78);
        for(const m of garments.shoes)m.color.set('#181a20');
        for(const m of garments.wraps)m.color.set(armor?.elite?'#c4a574':'#71313a');
      }};
      avatarOutfit.apply(lastEquipmentState,{id:'traveler'});
      gearKey='';setEquipment(lastEquipmentState);return true;
    }).catch(error=>{console.warn('Could not load hero GLB:',error);return false;});
  }
  setEquipment();const ready=trackCharacterLoad(root,procedural?'procedural':'hero-ninja-simple.glb',(addAvatar()||Promise.resolve(procedural)).then(loaded=>{if(loaded)update(0,false,null,0);return loaded;})),motion=createCharacterMotion();let stride=0,localX=0,localZ=0,sprintBlend=0,airborne=false,airVerticalSpeed=0;
  function setAirborne(value,verticalSpeed=0){airborne=!!value;airVerticalSpeed=verticalSpeed||0;}
  function avatarArm(i,pitch,spread,flex,clearance=0){
    const entry=avatarPose?.arms[i];if(!entry)return;
    const sign=i===0?1:-1,relaxed=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-sign*1.55);
    entry.bone.quaternion.copy(entry.base).premultiply(relaxed).premultiply(new T.Quaternion().setFromEuler(new T.Euler(pitch,0,spread+sign*clearance)));
    const elbow=avatarPose.elbows[i];
    // Forearms run along local X: Y bends the elbow, X merely twists it.
    if(elbow)elbow.bone.quaternion.copy(elbow.base).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-sign*flex));
  }
  function avatarLeg(i,hip,knee,ankle,spread=0){
    const apply=(entry,x,z)=>{if(entry)entry.bone.quaternion.copy(entry.base).premultiply(new T.Quaternion().setFromEuler(new T.Euler(x,0,z)));};
    if(!avatarPose)return;apply(avatarPose.legs[i],hip,spread);apply(avatarPose.knees[i],knee,0);apply(avatarPose.feet[i],ankle,-spread);
  }
  function update(time,moving,velocity=null,dt=1/60,sprinting=false){
    const state=motion.update(time,moving,velocity,dt,sprinting,root.rotation.y,airborne);({localX,localZ,stride,sprintBlend}=state);
    const {weight,side,forward,sprintLean,gait}=state;
    legs.forEach((leg,i)=>{
      const step=gait.legs[i];
      leg.pivot.rotation.x=step.hip-sprintLean;
      leg.pivot.rotation.z=step.side;leg.knee.rotation.x=step.knee;
      leg.foot.rotation.x=step.ankle;leg.foot.rotation.z=-step.side;
      // Both hands trail behind the shoulders instead of pumping beside the torso.
      arms[i].pivot.rotation.x=state.arms[i].pitch;arms[i].pivot.rotation.z=state.arms[i].spread;arms[i].elbow.rotation.x=-state.arms[i].flex;
    });
    // Lean about the hips, keeping the pelvis and leg stride anchored over the feet.
    body.position.z=-Math.sin(sprintLean)*1.21;
    body.position.y=(1-Math.cos(sprintLean))*1.21-gait.drop*1.01+Math.sin(time*2)*.008*(1-weight);
    body.rotation.x=forward*weight*.045*(1-sprintBlend)+sprintLean;body.rotation.z=-side*weight*.05;
    scarf.rotation.y=Math.sin(time*1.6)*.018+side*weight*.045;
    tails.forEach((tail,i)=>{tail.rotation.x=-.05-weight*.12+Math.sin(time*2.1+i*1.7)*(.025+weight*.045);tail.rotation.z=Math.sin(time*1.7+i)*.025+side*weight*.06;});
    if(avatarPose){
      const rotation=(x,y,z)=>new T.Quaternion().setFromEuler(new T.Euler(x,y,z));
      for(let i=0;i<2;i++){
        avatarArm(i,airborne?-.6:arms[i].pivot.rotation.x,airborne?(i===0?.22:-.22):arms[i].pivot.rotation.z,airborne?.35:-arms[i].elbow.rotation.x,airborne?0:REST_ARM_OPEN);
        const step=gait.legs[i];avatarLeg(i,airborne?-.3:step.hip-sprintLean,airborne?(airVerticalSpeed>0?.48:.62):step.knee,airborne?-.22:step.ankle,airborne?0:step.side);
      }
      if(avatarPose.hips){avatarPose.hips.bone.quaternion.copy(avatarPose.hips.base).premultiply(rotation(airborne?-.04:forward*weight*.045*(1-sprintBlend)+sprintLean,0,airborne?0:-side*weight*.05));avatarPose.hips.bone.position.y=avatarPose.hips.position.y+(airborne?0:-gait.drop*avatarPose.legLength+Math.sin(time*2)*.008*(1-weight)/avatarPose.scale);}
      if(avatarPose.spine)avatarPose.spine.bone.quaternion.copy(avatarPose.spine.base).premultiply(rotation(airborne?.08:-forward*weight*.018,0,airborne?0:side*weight*.018));
      if(avatarPose.chest)avatarPose.chest.bone.quaternion.copy(avatarPose.chest.base).premultiply(rotation(airborne?-.04:-forward*weight*.012,0,airborne?0:side*weight*.012));
    }
  }
  function airPose(v){setAirborne(true,v);legs.forEach((l,i)=>{l.pivot.rotation.x=-.3;l.pivot.rotation.z=0;l.knee.rotation.x=(v>0?.65:.38)+(i===0?.1:0);l.foot.rotation.x=-l.pivot.rotation.x-l.knee.rotation.x;avatarLeg(i,l.pivot.rotation.x,l.knee.rotation.x,l.foot.rotation.x);});arms.forEach((a,i)=>{a.pivot.rotation.x=-.6;a.pivot.rotation.z=-a.side*.22;a.elbow.rotation.x=-.35;avatarArm(i,-.6,i===0?.22:-.22,.35);});}
  function climbPose(t){arms.forEach((a,i)=>{a.pivot.rotation.x=-2+Math.sin(t*6+i*Math.PI)*.35;a.elbow.rotation.x=-.5;avatarArm(i,a.pivot.rotation.x,0,.5);});legs.forEach((l,i)=>{l.knee.rotation.x=.4+Math.sin(t*6+i*Math.PI)*.25;avatarLeg(i,-.15,l.knee.rotation.x,-l.knee.rotation.x+.15);});body.rotation.x=-.1;}
  return {root,group:root,ready,get modelReady(){return root.userData.referenceAppearance===true;},cloth,hair,legs,arms,armorAnchors,update,airPose,setAirborne,climbPose,setEquipment,setInkViewport:(w,h)=>ink.uniforms.viewport.value.set(w,h),locomotionState:()=>({side:localX,forward:localZ,speed:Math.hypot(localX,localZ),stride,sprintBlend,arms:arms.map(a=>({shoulder:[a.pivot.rotation.x,a.pivot.rotation.z],elbow:a.elbow.rotation.x})),legs:legs.map(l=>({hip:[l.pivot.rotation.x,l.pivot.rotation.z],knee:l.knee.rotation.x,ankle:l.foot.rotation.x})),lean:[body.rotation.x,body.rotation.z]}),get equipment(){return equipment;}};
}
