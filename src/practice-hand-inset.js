import * as T from 'three';

// Reuse the animated combat hands and the existing WebGL context.
export function createPracticeHandInset(renderer,hands){
  const camera=new T.PerspectiveCamera(54,1.5,.02,10);camera.position.set(0,-.12,.15);camera.layers.enable(1);
  const viewport=new T.Vector4(),scissor=new T.Vector4(),clearColor=new T.Color();
  const jointPosition=new T.Vector3();
  return {
    render(element){
      const r=element.getBoundingClientRect();if(r.width<1||r.height<1)return;
      const stack=element.closest('.desktop-battle-stack')?.getBoundingClientRect(),left=Math.max(0,r.left,stack?.left??0),right=Math.min(innerWidth,r.right,stack?.right??innerWidth),top=Math.max(0,r.top,stack?.top??0),bottom=Math.min(innerHeight,r.bottom,stack?.bottom??innerHeight);
      if(right<=left||bottom<=top)return;
      renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getClearColor(clearColor);
      const scissorTest=renderer.getScissorTest(),alpha=renderer.getClearAlpha();
      hands.root.updateMatrixWorld(true);
      let low=Infinity,high=-Infinity;
      for(const hand of hands.hands)for(const joint of Object.values(hand.joints)){jointPosition.setFromMatrixPosition(joint.matrixWorld);low=Math.min(low,jointPosition.y);high=Math.max(high,jointPosition.y);}
      camera.position.y=Number.isFinite(low)?(low+high)/2-.04:-.3;
      camera.aspect=r.width/r.height;camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(27))*1.6/camera.aspect));camera.updateProjectionMatrix();
      try{
        hands.setInkViewport(r.width,r.height);
        renderer.setViewport(r.left,innerHeight-r.bottom,r.width,r.height);renderer.setScissor(left,innerHeight-bottom,right-left,bottom-top);renderer.setScissorTest(true);
        renderer.setClearColor('#142b30',1);renderer.clear(true,true,false);renderer.render(hands.scene,camera);
      }finally{
        hands.setInkViewport(innerWidth,innerHeight);
        renderer.setClearColor(clearColor,alpha);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);
      }
    }
  };
}
