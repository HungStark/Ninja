// Zoom around the cursor or the midpoint between two fingers, then keep the
// map covering the viewport so dragging never exposes empty space.
export function createVillageMapControls(viewport,canvas){
  const pointers=new Map();let zoom=1,x=0,y=0,width=0,height=0;
  function render(){
    width=viewport.clientWidth;height=viewport.clientHeight;
    x=Math.max(width*(1-zoom),Math.min(0,x));y=Math.max(height*(1-zoom),Math.min(0,y));
    canvas.style.transform=`translate(${x}px,${y}px) scale(${zoom})`;
  }
  function changeZoom(value,from,to=from){
    const next=Math.max(1,Math.min(4,value)),ratio=next/zoom;
    x=to.x-(from.x-x)*ratio;y=to.y-(from.y-y)*ratio;zoom=next;render();
  }
  function gesture(){
    const [a,b]=pointers.values();
    return b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(b.x-a.x,b.y-a.y)}:a;
  }
  function point(e){const r=viewport.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
  viewport.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();pointers.set(e.pointerId,point(e));viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    e.preventDefault();const before=gesture();pointers.set(e.pointerId,point(e));const after=gesture();
    changeZoom(before.distance>0?zoom*after.distance/before.distance:zoom,before,after);
  });
  const finish=e=>pointers.delete(e.pointerId);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,finish);
  viewport.addEventListener('wheel',e=>{
    e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientHeight:1);
    changeZoom(zoom*Math.exp(-delta*.002),point(e));
  },{passive:false});
  new ResizeObserver(()=>{
    if(!viewport.clientWidth||!viewport.clientHeight)return;
    if(width&&height){x*=viewport.clientWidth/width;y*=viewport.clientHeight/height;}
    render();
  }).observe(viewport);
  return {reset(){pointers.clear();zoom=1;x=y=0;render();}};
}
