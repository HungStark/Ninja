import * as T from 'three';
import {createHero} from './hero.js';

export function createHeroPreview(){
  let renderer,scene,camera,hero;
  return {show(container,state){
    if(!renderer){
      renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
      renderer.domElement.setAttribute('aria-label','Nhân vật tóc bạc che một mắt với trang bị đang mặc');renderer.domElement.setAttribute('role','img');
      scene=new T.Scene();scene.add(new T.HemisphereLight('#e5f0eb','#55514b',2.6));const sun=new T.DirectionalLight('#ffe1bb',3.5);sun.position.set(-3,6,5);scene.add(sun);const fill=new T.DirectionalLight('#a0c1db',1.4);fill.position.set(3,3,-3);scene.add(fill);
      hero=createHero();scene.add(hero.root);hero.root.rotation.y=.25;camera=new T.PerspectiveCamera(34,1,.1,30);camera.position.set(2.2,2.15,6.7);camera.lookAt(0,1.65,0);
      const ring=new T.Mesh(new T.RingGeometry(.55,.64,32),new T.MeshBasicMaterial({color:'#b7ab82',transparent:true,opacity:.45,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.005;scene.add(ring);
    }
    container.replaceChildren(renderer.domElement);hero.setEquipment(state);const width=container.clientWidth||250,height=container.clientHeight||370;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();hero.update(0,false);renderer.render(scene,camera);
  }};
}
