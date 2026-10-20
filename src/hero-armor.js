import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Pieces are built in joint-local space, then merged by material for each joint.
export function createArmorWardrobe(anchors){
  const materials=new Map(),all=[anchors.body,...anchors.shoulders,...anchors.bracers,...anchors.shins,...anchors.hips];
  const material=(color,metal=false)=>{const key=color+metal;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:metal?.4:.92,metalness:metal?.55:.03,flatShading:true}));return materials.get(key);};
  function clear(){for(const root of all){root.traverse(o=>o.geometry?.dispose());root.clear();root.userData.parts=[];}}
  function build(armor){
    clear();const region=armor.village||'nameless',elite=!!armor.elite,body=anchors.body;
    const plate=material(armor.color,true),shadow=material(new T.Color(armor.color).multiplyScalar(.54).getStyle(),true),cloth=material(new T.Color(armor.color).multiplyScalar(.7).getStyle()),trim=material(elite?'#cbb17c':'#a9aaa0',true),leather=material('#382e2d'),black=material('#211e27');
    const add=(parent,geometry,mat,x=0,y=0,z=0,name='plate')=>{const o=new T.Mesh(geometry,mat);o.position.set(x,y,z);o.name=name;o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
    const box=(p,m,x,y,z,w,h,d,name)=>add(p,new T.BoxGeometry(w,h,d),m,x,y,z,name);
    const panel=(p,m,points,z,depth=.035,name='shaped-plate')=>{const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return add(p,new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.009,bevelThickness:.008,bevelSegments:1,curveSegments:3,steps:1}),m,0,0,z,name);};
    const line=(p,m,a,b,r=.009,name='inlay')=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av),o=add(p,new T.CylinderGeometry(r,r,delta.length(),5),m,...av.add(bv).multiplyScalar(.5).toArray(),name);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;};
    const ring=(p,m,x,y,z,r=.045,name='clasp')=>add(p,new T.TorusGeometry(r,.009,5,14),m,x,y,z,name);
    const jewel=(p,m,x,y,z,s=.06,name='crest')=>{const o=add(p,new T.OctahedronGeometry(s,0),m,x,y,z,name);o.scale.z=.4;return o;};
    const leaf=(p,m,x,y,z,size,tilt,name='leaf')=>{const o=panel(p,m,[[0,size*.55],[-size*.35,size*.08],[-size*.23,-size*.28],[0,-size*.6],[size*.23,-size*.28],[size*.35,size*.08]],0,.018,name);o.position.set(x,y,z);o.rotation.z=tilt;return o;};
    // A rounded, segmented back gives the close exploration camera a finished rear view.
    if(!['wind','dark'].includes(region)){
      const back=add(body,new T.CylinderGeometry(.33,.285,.64,10,1,true,Math.PI/2,Math.PI),shadow,0,1.76,0,'curved-back');back.scale.z=.8;
      for(let i=0;i<3;i++)box(body,plate,0,1.94-i*.18,-.278,.39-i*.035,.13,.04,'back-lamella');
    }
    if(['water','fire','lightning','earth','light','ice','nameless'].includes(region)){
      const outline=region==='earth'?[[-.29,2.05],[-.34,1.86],[-.27,1.48],[0,1.38],[.27,1.48],[.34,1.86],[.29,2.05]]:[[-.25,2.04],[-.29,1.87],[-.23,1.46],[0,1.4],[.23,1.46],[.29,1.87],[.25,2.04],[.16,2.0],[-.16,2.0]];
      panel(body,region==='nameless'?leather:shadow,outline,.251,.035,'fitted-cuirass');
    }
    if(region==='water'){
      for(let i=0;i<4;i++){const y=1.94-i*.135,w=.25-i*.018;panel(body,plate,[[-w,y],[-w*.85,y-.09],[0,y-.15],[w*.85,y-.09],[w,y],[0,y-.045]],.302+i*.005,.025,'tidal-scale');}
      for(const side of [-1,1])line(body,trim,[side*.24,1.96,.333],[side*.19,1.51,.351],.009,'silver-piping');
      jewel(body,trim,0,1.91,.355,.067,'water-drop');
    }else if(region==='fire'){
      for(let row=0;row<4;row++)for(const side of [-1,1]){const x=side*.125,y=1.96-row*.14;panel(body,row%2?plate:shadow,[[x-.112,y],[x-.102,y-.105],[x,y-.14],[x+.102,y-.105],[x+.112,y]],.303+row*.006,.025,'lacquered-lamella');}
      for(const side of [-1,1])for(let row=0;row<3;row++)line(body,trim,[side*.12,1.91-row*.14,.347],[side*.12,1.86-row*.14,.356],.008,'lacing');
      jewel(body,material('#d3a064',true),0,1.95,.36,.055,'ember-crest');
    }else if(region==='lightning'){
      for(const side of [-1,1])panel(body,plate,[[side*.03,2.02],[side*.27,1.94],[side*.23,1.68],[side*.055,1.54],[side*.11,1.81]],.299,.035,'angular-thunder-plate');
      panel(body,trim,[[-.015,1.97],[-.09,1.77],[-.005,1.79],[-.06,1.56],[.1,1.83],[.015,1.81]],.35,.012,'lightning-inlay');
    }else if(region==='earth'){
      panel(body,plate,[[-.25,1.97],[-.28,1.78],[-.2,1.56],[0,1.46],[.2,1.56],[.28,1.78],[.25,1.97]],.302,.065,'stone-breastplate');
      for(const side of [-1,1]){line(body,trim,[0,1.75,.386],[side*.19,1.92,.386],.012,'stone-ridge');panel(body,shadow,[[side*.08,1.64],[side*.23,1.7],[side*.2,1.52],[side*.04,1.45]],.386,.014,'lower-rivet-plate');}
      jewel(body,trim,0,1.78,.395,.07,'stone-seal');
    }else if(region==='wind'){
      for(const side of [-1,1]){const sash=box(body,cloth,side*.12,1.77,.268,.24,.73,.047,'crossed-silk');sash.rotation.z=side*.36;}
      for(let i=0;i<3;i++)leaf(body,plate,.14-i*.048,1.96-i*.135,.316,.19,-.7,'feather-breast');
      ring(body,trim,-.16,1.96,.314,.05,'wind-buckle');
    }else if(region==='light'){
      panel(body,plate,[[-.22,1.98],[-.25,1.82],[-.12,1.61],[0,1.5],[.12,1.61],[.25,1.82],[.22,1.98],[0,1.9]],.301,.032,'sun-cuirass');
      ring(body,trim,0,1.85,.359,.085,'solar-disc');
      for(let i=0;i<8;i++){const a=i*Math.PI/4;line(body,trim,[Math.sin(a)*.1,1.85+Math.cos(a)*.1,.359],[Math.sin(a)*.14,1.85+Math.cos(a)*.14,.359],.008,'sun-ray');}
      jewel(body,material('#dce8d9',true),0,1.85,.366,.05,'sun-stone');
    }else if(region==='ice'){
      for(const side of [-1,1])panel(body,plate,[[side*.025,1.99],[side*.25,1.95],[side*.23,1.61],[side*.1,1.48],[side*.015,1.65]],.306,.035,'winter-corslet');
      const fur=material('#d6d7cc');for(let i=0;i<13;i++){const a=i*Math.PI*2/13,o=add(body,new T.IcosahedronGeometry(.085,0),fur,Math.sin(a)*.34,2.08,Math.cos(a)*.275,'fur-collar');o.scale.set(1,1.1,.9);}
      jewel(body,trim,0,1.82,.363,.075,'frost-crystal');
    }else if(region==='wood'){
      panel(body,leather,[[-.25,1.99],[-.28,1.76],[-.2,1.48],[.18,1.43],[.26,1.81],[.21,2.0]],.264,.035,'woven-vest');
      for(let i=0;i<4;i++)leaf(body,i%2?plate:shadow,(i%2?.105:-.105),1.92-Math.floor(i/2)*.23,.324,.32,(i%2?1:-1)*.3,'overlapping-bark');
      for(let i=0;i<3;i++)line(body,trim,[-.16,1.84-i*.13,.354],[.12,1.92-i*.13,.354],.007,'woven-binding');
    }else if(region==='dark'){
      panel(body,cloth,[[-.28,2.04],[-.32,1.74],[-.23,1.38],[.03,1.48],[.24,2.01]],.27,.03,'asymmetric-shadow-wrap');
      const strap=box(body,leather,0,1.77,.315,.08,.76,.035,'diagonal-shadow-harness');strap.rotation.z=-.48;
      for(let i=0;i<3;i++)jewel(body,plate,-.16+i*.08,1.94-i*.16,.346,.063,'shadow-diamond');
      ring(body,trim,.17,1.96,.345,.06,'moon-clasp');
    }else{
      for(const side of [-1,1]){const patch=box(body,cloth,side*.14,1.77,.306,.22,.42,.025,'patched-leather');patch.rotation.z=side*.08;for(let i=0;i<4;i++)line(body,trim,[side*.23,1.93-i*.1,.332],[side*.19,1.9-i*.1,.332],.006,'repair-stitch');}
    }
    for(let i=0;i<2;i++){
      const side=i===0?-1:1,shoulder=anchors.shoulders[i],bracer=anchors.bracers[i],shin=anchors.shins[i],hip=anchors.hips[i];
      const layers=elite?3:2;
      if(['wind','wood'].includes(region)){
        for(let k=0;k<layers;k++)leaf(shoulder,k%2?shadow:plate,side*(.045+k*.055),-.07-k*.09,.18-k*.012,region==='wind'?.36:.28,side*(.35+k*.17),region==='wood'?'leaf-pauldron':'feather-pauldron');
      }else if(region==='earth'){
        const rock=add(shoulder,new T.DodecahedronGeometry(.21,0),plate,side*.045,-.06,0,'stone-pauldron');rock.scale.set(1,.7,.85);
        panel(shoulder,trim,[[-.12,-.03],[0,.07],[.12,-.03],[0,-.15]],.166,.015,'stone-shoulder-seal');
      }else if(region==='ice'){
        for(let k=0;k<(elite?4:2);k++){const shard=add(shoulder,new T.ConeGeometry(.065,.22,5),k%2?trim:plate,side*(.045+k*.045),.025-k*.04,.04,'crystal-pauldron');shard.rotation.z=-side*.4;}
      }else{
        for(let k=0;k<(region==='nameless'?1:layers);k++){
          const reach=(region==='dark'&&i===1?.08:.15)+(elite?.025:0),x=side*.035,y=-.015-k*.083;
          const points=[[x-side*.14,y+.045],[x+side*.10,y+.035],[x+side*(reach+.045),y-.075],[x+side*reach,y-.16],[x-side*.13,y-.10]];
          panel(shoulder,k%2?shadow:plate,points,-.12+k*.015,.235,'layered-pauldron');
          line(shoulder,trim,[x-side*.10,y+.035,.129+k*.015],[x+side*.08,y+.025,.129+k*.015],.008,'shoulder-rim');
        }
      }
      panel(bracer,shadow,[[-.085,-.045],[-.103,-.16],[-.065,-.34],[.065,-.34],[.103,-.16],[.085,-.045]],.107,.025,'fitted-vambrace');
      panel(bracer,plate,[[-.06,-.07],[-.075,-.19],[0,-.32],[.075,-.19],[.06,-.07],[0,-.11]],.142,.025,'vambrace-face');
      if(['wind','wood'].includes(region))leaf(bracer,trim,0,-.18,.178,.17,.18,'bracer-leaf');else line(bracer,trim,[0,-.09,.178],[0,-.26,.178],.008,'bracer-ridge');
      const greave=region==='earth'?[[-.105,-.07],[-.125,-.22],[-.09,-.45],[.09,-.45],[.125,-.22],[.105,-.07]]:region==='wind'?[[-.06,-.1],[-.075,-.25],[0,-.43],[.075,-.25],[.06,-.1]]:region==='ice'?[[-.08,-.06],[-.105,-.2],[0,-.5],[.105,-.2],[.08,-.06],[0,-.12]]:[[-.084,-.08],[-.10,-.18],[-.06,-.43],[0,-.48],[.06,-.43],[.10,-.18],[.084,-.08],[0,-.12]];
      if(region==='wood')leaf(shin,plate,0,-.25,.139,.4,0,'leaf-greave');
      else if(region==='nameless')panel(shin,leather,[[-.08,-.12],[-.075,-.35],[.075,-.35],[.08,-.12]],.14,.024,'leather-greave');
      else panel(shin,region==='dark'&&i===0?shadow:plate,greave,.137,.028,'shaped-greave');
      line(shin,trim,[0,-.14,.18],[0,-.4,.18],.009,'greave-ridge');
      const y=-.03,outer=side*.14;
      if(region==='fire')for(let k=0;k<(elite?4:3);k++){const top=y-k*.09;panel(hip,k%2?shadow:plate,[[outer-.10,top],[outer-.105,top-.07],[outer,top-.12],[outer+.105,top-.07],[outer+.10,top]],.17+k*.005,.018,'lamellar-hip-guard');}
      else if(region==='wood')leaf(hip,plate,outer,-.17,.17,elite?.48:.4,-side*.16,'leaf-hip-guard');
      else if(region==='nameless')panel(hip,leather,[[outer-.08,y],[outer-.08,y-.25],[outer+.08,y-.25],[outer+.08,y]],.17,.02,'leather-hip-patch');
      else{
        const length=region==='dark'?(i===0?.48:.26):region==='wind'?.46:elite?.42:.34;
        const outline=region==='water'?[[outer-.105,y],[outer-.12,y-.24],[outer-.055,y-length],[outer,y-length+.07],[outer+.055,y-length],[outer+.12,y-.24],[outer+.105,y]]:[[outer-.105,y],[outer-.12,y-.24],[outer,y-length],[outer+.12,y-.24],[outer+.105,y]];
        panel(hip,region==='wind'||region==='dark'?cloth:plate,outline,.17,.02,'split-hip-guard');
      }
      if(elite){
        line(hip,trim,[outer,y-.07,.207],[outer,y-.27,.207],.009,'elite-hip-embroidery');
        jewel(bracer,trim,0,-.12,.19,.035,'elite-wrist-gem');
        if(region==='dark'||region==='light')leaf(shoulder,trim,side*.13,-.04,.15,.22,side*.5,'elite-wing');
      }
    }
    if(elite){
      const crest=region==='wind'||region==='wood'?'leaf-standard':region==='earth'?'stone-standard':'elite-back-crest';
      panel(body,trim,[[-.085,2.04],[0,2.15],[.085,2.04],[0,1.86]],-.323,.012,crest);
      const front=region==='earth'?.405:region==='wind'?.309:region==='dark'?.318:.363;
      for(const side of [-1,1])line(body,trim,[side*.21,1.94,front],[side*.17,1.5,front],.008,'elite-edge');
    }
    let triangles=0,draws=0;
    for(const root of all){
      const groups=new Map(),parts=[];
      for(const o of [...root.children]){o.updateMatrix();const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrix);if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push(g);parts.push(o.name);o.geometry.dispose();root.remove(o);}
      for(const [m,geometries] of groups){const geometry=mergeGeometries(geometries),mesh=new T.Mesh(geometry,m);mesh.name='armor-'+region;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);triangles+=geometry.attributes.position.count/3;draws++;geometries.forEach(g=>g.dispose());}
      root.userData.parts=parts;
    }
    return {region,elite,triangles,draws};
  }
  return {build,clear};
}
