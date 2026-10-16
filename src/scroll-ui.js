// Restart the physical unrolling only on entry, including adventure encounters.
// Waiting for readiness keeps the opening from playing behind the loading screen.
export function setupScrollOpening(){
  const screen=document.getElementById('startScreen'),book=screen.querySelector('.scroll-book');
  let visible=false,frame=0;
  const update=()=>{
    const open=document.body.dataset.ready==='true'&&!screen.classList.contains('hidden')&&getComputedStyle(screen).display!=='none';
    if(open===visible)return;
    visible=open;cancelAnimationFrame(frame);book.classList.remove('is-open');
    if(open)frame=requestAnimationFrame(()=>{if(visible){book.classList.add('is-open');screen.focus({preventScroll:true});}});
  };
  const observer=new MutationObserver(update);
  observer.observe(screen,{attributes:true,attributeFilter:['class']});
  observer.observe(document.body,{attributes:true,attributeFilter:['data-journey','data-ready']});
  update();
}
