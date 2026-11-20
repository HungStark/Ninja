import {gameAudio} from './game-audio.js';

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
    if(++scene.index<scene.lines.length){enterLine();return;}
    scene.index--;
    scene.complete=true;
    subtitle.hidden=true;
    gameAudio.stopDialogue();
    scene.onComplete();
  }

  return {start,update,get active(){return !!scene;},get playing(){return !!scene&&!scene.complete;},get complete(){return !!scene?.complete;},
    state:()=>scene?{active:true,index:scene.index,count:scene.lines.length,typing:false,complete:scene.complete,autoplay:true}:null,
    reset(){if(scene)gameAudio.stopDialogue();scene=null;subtitle.hidden=true;name.textContent='';copy.textContent='';}};
}
