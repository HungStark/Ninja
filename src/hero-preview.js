import * as T from 'three';
import {createHero} from './hero.js';

export function createHeroPreview(){
  let renderer,scene,camera,hero,containerInUse,observer;
  function render(){
    const container=containerInUse;if(!container?.isConnected||!container.clientWidth||!container.clientHeight)return;
    const width=container.clientWidth,height=container.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;hero.setInkViewport(width,height);
    hero.update(0,false);hero.root.updateMatrixWorld(true);
    const bounds=new T.Box3(),point=new T.Vector3();
    hero.root.traverseVisible(o=>{if(!o.isMesh||o.userData.inkOutline)return;for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,point);point.applyMatrix4(o.matrixWorld);bounds.expandByPoint(point);}});
    const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),distance=Math.max(size.y,size.x/camera.aspect)*.5/Math.tan(T.MathUtils.degToRad(camera.fov/2))*1.06;
    camera.position.set(center.x+.08,center.y+.06,center.z+distance);camera.lookAt(center);camera.updateProjectionMatrix();renderer.render(scene,camera);renderer.domElement.dataset.modelReady=String(hero.root.userData.referenceAppearance===true);
  }
  return {show(container,state){
    if(!renderer){
      renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(2);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
      renderer.domElement.setAttribute('aria-label','Nhân vật tóc đen, mặt nạ và áo choàng đen đỏ với trang bị đang mặc');renderer.domElement.setAttribute('role','img');
      scene=new T.Scene();scene.add(new T.HemisphereLight('#e5f0eb','#55514b',2.6));const sun=new T.DirectionalLight('#ffe1bb',3.5);sun.position.set(-3,6,5);scene.add(sun);const fill=new T.DirectionalLight('#a0c1db',1.4);fill.position.set(3,3,-3);scene.add(fill);
      hero=createHero({outlineWidth:.45});scene.add(hero.root);hero.root.rotation.y=.12;camera=new T.PerspectiveCamera(34,1,.1,30);camera.position.set(2.2,2.15,6.7);camera.lookAt(0,1.65,0);hero.ready.then(render);
      const ring=new T.Mesh(new T.RingGeometry(.55,.64,32),new T.MeshBasicMaterial({color:'#b7ab82',transparent:true,opacity:.45,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.005;scene.add(ring);
    }
    container.replaceChildren(renderer.domElement);hero.setEquipment(state);
    if(container!==containerInUse){observer?.disconnect();containerInUse=container;observer??=new ResizeObserver(render);observer.observe(container);}
    render();return hero.ready;
  }};
}
