import * as T from 'three';

// Reuse the animated combat hands and the existing WebGL context.
export function createPracticeHandInset(renderer,hands){
  const camera=new T.PerspectiveCamera(54,1.5,.02,10);camera.position.set(0,-.12,.15);camera.layers.enable(1);
  const viewport=new T.Vector4(),scissor=new T.Vector4(),clearColor=new T.Color();
  const jointPosition=new T.Vector3();
  function frameCamera(width,height){
    hands.root.updateMatrixWorld(true);let low=Infinity,high=-Infinity;
    for(const hand of hands.hands)for(const joint of Object.values(hand.joints)){jointPosition.setFromMatrixPosition(joint.matrixWorld);low=Math.min(low,jointPosition.y);high=Math.max(high,jointPosition.y);}
    camera.position.y=Number.isFinite(low)?(low+high)/2-.04:-.3;camera.aspect=width/height;camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(27))*1.6/camera.aspect));camera.updateProjectionMatrix();
  }
  return {
    snapshot(){
      const target=new T.WebGLRenderTarget(320,150),previous=renderer.getRenderTarget(),pixels=new Uint8Array(320*150*4);
      renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getClearColor(clearColor);const test=renderer.getScissorTest(),alpha=renderer.getClearAlpha();
      try{
        frameCamera(320,150);hands.setInkViewport(320,150);
        renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.setClearColor('#142b30',1);renderer.clear();renderer.render(hands.scene,camera);renderer.readRenderTargetPixels(target,0,0,320,150,pixels);
        const canvas=document.createElement('canvas');canvas.width=320;canvas.height=150;const context=canvas.getContext('2d'),data=context.createImageData(320,150);
        for(let y=0;y<150;y++)data.data.set(pixels.subarray((149-y)*320*4,(150-y)*320*4),y*320*4);context.putImageData(data,0,0);return canvas.toDataURL();
      }finally{hands.setInkViewport(innerWidth,innerHeight);renderer.setRenderTarget(previous);renderer.setClearColor(clearColor,alpha);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(test);target.dispose();}
    },
    render(element){
      const r=element.getBoundingClientRect();if(r.width<1||r.height<1)return;
      const stack=element.closest('.desktop-battle-stack')?.getBoundingClientRect(),left=Math.max(0,r.left,stack?.left??0),right=Math.min(innerWidth,r.right,stack?.right??innerWidth),top=Math.max(0,r.top,stack?.top??0),bottom=Math.min(innerHeight,r.bottom,stack?.bottom??innerHeight);
      if(right<=left||bottom<=top)return;
      renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getClearColor(clearColor);
      const scissorTest=renderer.getScissorTest(),alpha=renderer.getClearAlpha();
      frameCamera(r.width,r.height);
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
