import {gameAudio} from './game-audio.js';

export function createCutsceneControls(parent,{onNext,onSkip}){
  const controls=document.createElement('div');
  controls.className='cutscene-controls';
  controls.hidden=true;
  const next=document.createElement('button'),skip=document.createElement('button');
  next.type=skip.type='button';
  next.textContent='Tiếp tục';
  next.title='Enter';
  skip.textContent='Bỏ qua';
  skip.title='Esc';
  next.onclick=onNext;skip.onclick=onSkip;
  controls.append(next,skip);parent.append(controls);
  return {show(){controls.hidden=false;},hide(){controls.hidden=true;},keydown(event){
    if(event.ctrlKey||event.metaKey||event.altKey)return;
    if(!controls.hidden&&event.key==='Tab'){
      event.preventDefault();
      (event.target===next||event.shiftKey&&event.target!==skip?skip:next).focus({preventScroll:true});
      return;
    }
    if(!event.repeat&&(event.target===next||event.target===skip)&&['Enter',' '].includes(event.key))return;
    event.preventDefault();
    if(controls.hidden||event.repeat)return;
    if(event.key==='Escape')onSkip();
    if(event.key==='Enter')onNext();
  }};
}

function subtitlePages(text){
  const pages=[];
  let page='';
  for(const word of text.trim().split(/\s+/)){
    if(page&&page.length+word.length>96){pages.push(page);page='';}
    page+=(page?' ':'')+word;
  }
  if(page)pages.push(page);
  return pages.map(text=>({text,seconds:Math.max(1.65,text.split(' ').length*.31+.28,text.length/23)}));
}

export function createCutsceneDialogue(subtitle){
  const name=subtitle.querySelector('strong'),copy=subtitle.querySelector('span');
  let scene=null;

  function showPage(){
    copy.textContent=scene.pages[scene.page].text;
    subtitle.hidden=false;
  }

  function startLine(){
    const line=scene.lines[scene.index];
    scene.pages=subtitlePages(line.text);
    scene.page=0;
    scene.pageAge=0;
    const seconds=scene.pages.reduce((total,page)=>total+page.seconds,0);
    name.textContent=line.speaker.name+': ';
    showPage();
    gameAudio.dialogueLine(line);
    scene.onLine(line,scene.index,seconds,scene.lines[scene.index+1]);
  }

  function enterLine(){
    scene.before=scene.lines[scene.index].cue?.before;
    scene.beat=0;
    scene.beatAge=0;
    if(!scene.before?.length){startLine();return;}
    subtitle.hidden=true;
    gameAudio.stopDialogue();
    scene.onBeat(scene.before[0]);
  }

  function start(lines,{onBeat=()=>{},onLine=()=>{},onComplete=()=>{}}={}){
    scene={lines,index:0,onBeat,onLine,onComplete,complete:false};
    enterLine();
  }

  function finish(skipped=false){
    if(!scene||scene.complete)return;
    scene.complete=true;
    subtitle.hidden=true;
    gameAudio.stopDialogue();
    scene.onComplete(skipped);
  }

  function advance(){
    if(!scene||scene.complete)return;
    if(scene.before?.length){scene.before=null;startLine();return;}
    const speaker=scene.lines[scene.index].speaker;
    const next=scene.lines.findIndex((line,index)=>index>scene.index&&
      ((line.speaker.id||line.speaker.name)!==(speaker.id||speaker.name)||Boolean(line.speaker.thought)!==Boolean(speaker.thought)));
    if(next<0){finish();return;}
    scene.index=next;
    enterLine();
  }

  function update(dt){
    if(!scene||scene.complete)return;
    if(scene.before?.length){
      scene.beatAge+=dt;
      if(scene.beatAge<scene.before[scene.beat].seconds)return;
      scene.beatAge-=scene.before[scene.beat].seconds;
      if(++scene.beat<scene.before.length){scene.onBeat(scene.before[scene.beat]);return;}
      scene.before=null;
      startLine();
      return;
    }
    scene.pageAge+=dt;
    const {seconds}=scene.pages[scene.page];
    if(scene.pageAge<seconds)return;
    if(scene.page+1<scene.pages.length){
      scene.page++;
      scene.pageAge-=seconds;
      showPage();
      return;
    }
    if(gameAudio.speaking&&scene.pageAge<seconds+7)return;
    if(scene.index+1<scene.lines.length){scene.index++;enterLine();return;}
    finish();
  }

  return {start,update,advance,skip:()=>finish(true),get active(){return !!scene;},get playing(){return !!scene&&!scene.complete;},get complete(){return !!scene?.complete;},
    state:()=>scene?{active:true,index:scene.index,count:scene.lines.length,typing:false,complete:scene.complete,autoplay:true}:null,
    reset(){if(scene)gameAudio.stopDialogue();scene=null;subtitle.hidden=true;name.textContent='';copy.textContent='';}};
}
