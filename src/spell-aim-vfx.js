import * as T from 'three';

// Ground-space strokes keep the targeting silhouette sharp at mobile resolutions.
// The guides render above snow cover, without adding gameplay geometry.
function stroke(vertices,points,width){
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<1e-8)continue;
    const x=-dz/length*width/2,z=dx/length*width/2;
    vertices.push(a[0]+x,0,a[1]+z,a[0]-x,0,a[1]-z,b[0]+x,0,b[1]+z,a[0]-x,0,a[1]-z,b[0]-x,0,b[1]-z,b[0]+x,0,b[1]+z);
  }
}
const circle=(radius,segments=128)=>Array.from({length:segments+1},(_,i)=>{const a=i/segments*Math.PI*2;return [Math.cos(a)*radius,Math.sin(a)*radius];});
const rotate=(points,angle)=>points.map(([x,z])=>[x*Math.cos(angle)+z*Math.sin(angle),-x*Math.sin(angle)+z*Math.cos(angle)]);

export function createSpellAimGuide(scene){
  const root=new T.Group();root.name='spell-aim-guide';scene.add(root);
  const direction=new T.Group(),area=new T.Group();root.add(direction,area);
  const materials=[
    new T.MeshBasicMaterial({color:'#073f43',transparent:true,opacity:.9}),
    new T.MeshBasicMaterial({color:'#24ffdc',transparent:true,opacity:.2,blending:T.AdditiveBlending}),
    new T.MeshBasicMaterial({color:'#60ffe4',transparent:true,opacity:.96})
  ];
  for(const material of materials)Object.assign(material,{depthTest:false,depthWrite:false,fog:false,side:T.DoubleSide,toneMapped:false});
  function layer(parent,index){
    const mesh=new T.Mesh(new T.BufferGeometry(),materials[index]);mesh.frustumCulled=false;mesh.renderOrder=10000+index;mesh.userData.aimGuide=true;parent.add(mesh);return mesh;
  }
  const lines=materials.map((_,i)=>layer(direction,i)),rings=materials.map((_,i)=>layer(area,i));
  function geometry(mesh,paths,multiplier){
    const vertices=[];for(const path of paths)stroke(vertices,path.points,path.width*multiplier);
    const attribute=mesh.geometry.getAttribute('position');
    if(attribute?.array.length===vertices.length){attribute.array.set(vertices);attribute.needsUpdate=true;}
    else mesh.geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  }
  const runePaths=[{points:circle(1),width:.007},{points:circle(.925),width:.004}];
  for(let i=0;i<4;i++){
    const angle=i*Math.PI/2;
    for(const side of [-1,1])runePaths.push({points:rotate([[side*.068,.967],[side*.026,.967],[side*.026,.94],[side*.047,.94],[side*.047,.952]],angle),width:.008});
  }
  for(let i=0;i<3;i++){
    const angle=i*Math.PI*2/3;
    runePaths.push({points:rotate([[0,.09],[0,.84]],angle),width:.004});
    runePaths.push({points:rotate([[-.036,.79],[0,.85],[.036,.79]],angle),width:.007});
    for(const side of [-1,1]){
      runePaths.push({points:rotate([[side*.055,.49],[side*.027,.5],[side*.018,.53],[side*.027,.56],[side*.055,.57]],angle),width:.007});
      runePaths.push({points:rotate([[side*.055,.52],[side*.037,.53],[side*.055,.54]],angle),width:.006});
    }
  }
  for(const radius of [.057,.027])runePaths.push({points:[[0,-radius],[radius,0],[0,radius],[-radius,0],[0,-radius]],width:.006});
  let lastShape='',lastRingWeight=0;
  return {root,
    update({kind,position,center,direction:axis,width,radius,heightAt,available}){
      const circular=kind==='area',wall=kind==='wall';area.visible=circular;direction.visible=!circular;
      const weight=Math.max(2.5,Math.min(5,2400/(globalThis.innerHeight||800)));
      materials[1].color.set(available?'#24ffdc':'#ff6e56');materials[2].color.set(available?'#60ffe4':'#ffb29b');
      if(circular){
        const ringWeight=weight*Math.max(1,2/radius);
        if(lastRingWeight!==ringWeight){for(const [i,multiplier] of [2.2,4.5,1].entries())geometry(rings[i],runePaths,multiplier*ringWeight);lastRingWeight=ringWeight;}
        area.position.set(center[0],heightAt(center[0],center[2])+.2,center[2]);area.scale.setScalar(radius);return;
      }
      const length=wall?width:Math.hypot(center[0]-position[0],center[2]-position[2]),span=wall?.28:Math.max(.22,width);
      direction.position.set(wall?center[0]:position[0],heightAt(wall?center[0]:position[0],wall?center[2]:position[2])+.2,wall?center[2]:position[2]);
      direction.rotation.y=Math.atan2(axis[0],axis[2])+(wall?Math.PI/2:0);
      const key=[wall,length.toFixed(4),span.toFixed(4),weight.toFixed(3)].join(':');if(key===lastShape)return;lastShape=key;
      const half=span/2,cap=wall?Math.min(.35,length*.15):Math.min(length*.18,Math.max(.65,span*.65)),start=wall?-length/2:Math.min(.65,length*.1),end=wall?length/2:length;
      const paths=[{points:[[0,start],[0,end-.035]],width:wall?.025:.045}];
      for(const side of [-1,1])paths.push({points:[[side*half,start],[side*half,end-cap]],width:.025});
      for(let row=0;row<3;row++){
        const inset=row*.13,capWidth=half*(1-row*.13),capEnd=end-inset;
        const arch=Array.from({length:21},(_,i)=>{const a=i/20*Math.PI;return [Math.cos(a)*capWidth,capEnd-cap+Math.sin(a)*cap];});
        paths.push({points:arch,width:row?.02:.035});
      }
      paths.push({points:[[-half*.55,end-cap*.7],[0,end-.06],[half*.55,end-cap*.7]],width:.035});
      if(wall)paths.push({points:[[-half,start+.2],[0,start],[half,start+.2]],width:.03});
      for(const [i,multiplier] of [2.2,4.5,1].entries())geometry(lines[i],paths,multiplier*weight);
    }
  };
}
