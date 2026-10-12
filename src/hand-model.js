import * as T from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { fingerShapes, fingerRadius, sculptHand } from './hand-sculpt.js';

export function createHandModel() {
  const model=new T.Group();model.name='ReferenceNinjaHand';
  const root=new T.Bone();root.name='wrist';model.add(root);
  const bones=[root],fingers=fingerShapes.map(f=>({...f,base:[...f.base]}));
  const skinMaterial=new T.MeshStandardMaterial({name:'skin',color:'#efbaa5',roughness:.8});
  const nailMaterial=new T.MeshStandardMaterial({name:'nail',color:'#edc9bf',roughness:.55});
  for(const f of fingers) {
    const j0=new T.Bone();j0.name=f.name+'_0';j0.position.fromArray(f.base);j0.rotation.z=f.angle;root.add(j0);
    const j1=new T.Bone();j1.name=f.name+'_1';j1.position.y=f.length*.46;j0.add(j1);
    const j2=new T.Bone();j2.name=f.name+'_2';j2.position.y=f.length*.31;j1.add(j2);
    f.ids=[bones.length,bones.length+1,bones.length+2];bones.push(j0,j1,j2);
    // Rounded nail beds run along the distal phalanx and hug its curved surface.
    const w=f.radius*.57,low=f.length*.03,high=f.length*.185,shape=new T.Shape();
    shape.moveTo(-w,low+.005);shape.bezierCurveTo(-w,low-.002,w,low-.002,w,low+.005);
    shape.lineTo(w,high-.006);shape.bezierCurveTo(w,high+.003,-w,high+.003,-w,high-.006);shape.closePath();
    const geo=new T.ExtrudeGeometry(shape,{depth:.0003,bevelEnabled:true,bevelSize:.0003,bevelThickness:.0002,bevelSegments:3,curveSegments:16,steps:1});
    const p=geo.attributes.position;
    for(let i=0;i<p.count;i++) {
      const x=p.getX(i),y=p.getY(i),along=f.length*.77+y,capStart=f.length-f.radius*.9;
      const r=fingerRadius(f,along/f.length),cap=Math.max(0,along-capStart);
      const z=Math.sqrt(Math.max(.000001,r*r-x*x-cap*cap))*.88;
      p.setZ(i,p.getZ(i)+z+.0006);
    }
    geo.deleteAttribute('normal');geo.deleteAttribute('uv');
    const smoothNail=mergeVertices(geo,1e-6);smoothNail.computeVertexNormals();geo.dispose();
    const nail=new T.Mesh(smoothNail,nailMaterial);nail.name=f.name+'_nail';j2.add(nail);
  }
  const skin=new T.SkinnedMesh(sculptHand(fingers),skinMaterial);skin.name='hand_skin';model.add(skin);
  model.updateMatrixWorld(true);skin.bind(new T.Skeleton(bones));
  const cloth=new T.MeshStandardMaterial({name:'cloth',color:'#272c40',roughness:.85});
  const glove=new T.MeshStandardMaterial({name:'glove',color:'#2c3142',roughness:.78});
  const gold=new T.MeshStandardMaterial({name:'trim',color:'#e3bb81',roughness:.62,metalness:.18});
  const edge=new T.MeshStandardMaterial({name:'edge',color:'#151b2a',roughness:.8});
  function mesh(geometry,material,p=[0,0,0],s=[1,1,1],name='') {
    const m=new T.Mesh(geometry,material);m.name=name;m.position.fromArray(p);m.scale.fromArray(s);root.add(m);return m;
  }
  // Keep the forearm centered on the wrist axis; only its thickness tapers.
  const armProfile=[[-.52,.085],[-.44,.082],[-.35,.078],[-.24,.070],[-.14,.060]];
  const sleeveProfile=armProfile.map(([y,r])=>new T.Vector2(r,y));
  const sleeve=new T.LatheGeometry(sleeveProfile,40);
  const sleeveRadius=y=>{
    for(let i=1;i<armProfile.length;i++)if(y<=armProfile[i][0]) {
      const [ay,ar]=armProfile[i-1],[by,br]=armProfile[i];
      return T.MathUtils.lerp(ar,br,T.MathUtils.clamp((y-ay)/(by-ay),0,1));
    }
    return armProfile.at(-1)[1];
  };
  const sleeveSurface=(x,y)=>Math.sqrt(Math.max(0,sleeveRadius(y)**2-x*x))*.9;
  mesh(sleeve,cloth,[0,0,0],[1,1,.9],'sleeve');
  mesh(new T.CylinderGeometry(.059,.065,.078,40),glove,[0,-.136,0],[1,1,.9],'wrist_cuff');
  mesh(new T.TorusGeometry(.064,.0055,10,48),gold,[0,-.17,0],[1,.9,1],'gold_binding').rotation.x=Math.PI/2;
  const shield=new T.Shape();
  shield.moveTo(0,.069);shield.bezierCurveTo(.040,.066,.068,.025,.065,-.004);
  shield.bezierCurveTo(.062,-.036,.048,-.071,.028,-.078);shield.bezierCurveTo(.01,-.087,-.01,-.087,-.028,-.078);
  shield.bezierCurveTo(-.048,-.071,-.062,-.036,-.065,-.004);shield.bezierCurveTo(-.068,.025,-.040,.066,0,.069);
  const panel=new T.ExtrudeGeometry(shield,{depth:.006,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:3,curveSegments:20,steps:1});
  const pp=panel.attributes.position;
  for(let i=0;i<pp.count;i++)pp.setZ(i,pp.getZ(i)+.009*(1-Math.pow(pp.getX(i)/.070,2)));
  panel.computeVertexNormals();mesh(panel,glove,[0,-.047,.027],[1,1,1],'glove_back');
  const rim=shield.getPoints(100).map(p=>new T.Vector3(p.x,p.y,.005+.009*(1-Math.pow(p.x/.070,2))));
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(rim,true),120,.0010,5,true),edge,[0,-.047,.027],[1,1,1],'guard_outline');
  const badge=new T.CylinderGeometry(.038,.038,.0025,48);badge.rotateX(Math.PI/2);
  mesh(badge,edge,[0,-.027,.049],[1,1,1],'wrist_plate');
  const emblem=new T.Shape();emblem.absarc(0,0,.039,0,Math.PI*2,false);
  const emblemHole=new T.Path();emblemHole.absarc(0,0,.028,0,Math.PI*2,true);emblem.holes.push(emblemHole);
  mesh(new T.ExtrudeGeometry(emblem,{depth:.0012,bevelEnabled:true,bevelSize:.0006,bevelThickness:.0006,bevelSegments:2,curveSegments:48}),gold,[0,-.027,.052],[1,1,1],'gold_emblem');
  mesh(new T.TorusGeometry(.012,.00165,8,40),gold,[0,-.027,.053],[1,1,1],'chakra_rune');
  mesh(new T.CylinderGeometry(.0013,.0013,.036,8),gold,[0,-.027,.055],[1,1,1],'chakra_line').rotation.z=-.34;
  for(const side of [-1,1]) {
    const seam=[[-.18,.042],[-.30,.050],[-.47,.055]].map(([y,x])=>new T.Vector3(side*x,y,sleeveSurface(x,y)+.001));
    mesh(new T.TubeGeometry(new T.CatmullRomCurve3(seam),32,.0018,6,false),gold,[0,0,0],[1,1,1],'sleeve_seam');
    const point=new T.Shape();point.moveTo(0,0);point.lineTo(side*.021,-.008);point.lineTo(side*.012,-.050);point.closePath();
    const tip=new T.ExtrudeGeometry(point,{depth:.002,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:1});
    const tp=tip.attributes.position;
    for(let i=0;i<tp.count;i++) {
      const x=tp.getX(i)+side*.041,y=tp.getY(i)-.185;
      tp.setXYZ(i,x,y,tp.getZ(i)+sleeveSurface(x,y)+.001);
    }
    tip.computeVertexNormals();mesh(tip,gold,[0,0,0],[1,1,1],'gold_cuff_tip');
  }
  return model;
}
