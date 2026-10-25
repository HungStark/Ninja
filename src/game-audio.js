import {createSpeechOutput} from './speech-output.js';
import {characterVoice,spellVoice} from './character-voice.js';
import {spellCastCue,spellImpactCue} from './spell-audio-cues.js';
// Original procedural score and effects: no downloads or third-party recordings.
export const AUDIO_STORAGE_KEY='anhoa-audio-v1';
export const VILLAGE_MUSIC={
  nameless:{name:'Vô Danh · Dấu chân lữ khách',bpm:66,root:50,scale:[0,2,3,7,10],wave:'triangle',motif:[0,2,3,null,2,1,0,null,0,1,2,4,3,null,1,0],chords:[0,5,3,7],minor:true,drums:.35},
  fire:{name:'Hỏa · Trống lửa',bpm:104,root:57,scale:[0,2,4,7,9],wave:'triangle',motif:[0,0,2,3,2,null,1,2,3,4,3,2,1,2,0,null],chords:[0,5,7,0],drums:1},
  water:{name:'Thủy · Dòng nước xanh',bpm:72,root:60,scale:[0,2,5,7,9],wave:'sine',motif:[0,null,2,3,4,3,null,2,1,null,0,1,2,null,1,null],chords:[0,5,9,7],drums:.2},
  lightning:{name:'Lôi · Mạch trời',bpm:116,root:52,scale:[0,2,3,7,9],wave:'triangle',motif:[0,3,1,3,2,4,2,null,0,3,2,4,3,1,2,null],chords:[0,3,5,7],minor:true,drums:.8},
  wind:{name:'Phong · Sáo trên đồi',bpm:86,root:62,scale:[0,2,4,7,9],wave:'sine',motif:[3,null,2,1,0,null,1,2,4,3,null,2,1,0,null,null],chords:[0,7,5,0],drums:.25},
  earth:{name:'Thổ · Nhịp núi',bpm:70,root:45,scale:[0,3,5,7,10],wave:'triangle',motif:[0,null,0,2,null,1,0,null,3,null,2,1,0,null,0,null],chords:[0,5,3,0],minor:true,drums:1.2},
  light:{name:'Quang · Chuông bình minh',bpm:80,root:64,scale:[0,2,4,7,11],wave:'sine',motif:[0,2,4,null,3,2,1,null,0,1,2,3,4,null,2,null],chords:[0,5,7,0],drums:.12},
  dark:{name:'Ám · Tiếng vọng bóng đêm',bpm:58,root:44,scale:[0,1,3,7,8],wave:'sine',motif:[0,null,null,2,1,null,0,null,3,null,2,null,1,null,null,0],chords:[0,8,5,1],minor:true,drums:.5},
  wood:{name:'Mộc · Rừng thức giấc',bpm:78,root:57,scale:[0,2,4,7,9],wave:'triangle',motif:[0,1,2,null,1,3,2,null,0,2,4,3,2,1,0,null],chords:[0,5,9,7],drums:.45},
  ice:{name:'Băng · Tuyết rơi',bpm:62,root:69,scale:[0,2,3,7,10],wave:'sine',motif:[4,null,3,null,2,1,null,0,2,null,1,0,null,null,0,null],chords:[0,3,8,5],minor:true,drums:.1},
  duel:{name:'Đấu trường · Nhịp kết ấn',bpm:112,root:50,scale:[0,2,3,7,10],wave:'triangle',motif:[0,2,0,3,2,4,3,2,0,2,3,4,3,2,1,0],chords:[0,5,3,7],minor:true,drums:1}
};
const defaults={muted:false,music:.45,effects:.75,voice:.7,readDialogue:true,heroVoice:'male'};
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0)),frequency=midi=>440*2**((midi-69)/12);
export function createGameAudio({storage,contextFactory,android=!!(globalThis.AnHoaSpeech||globalThis.document?.documentElement?.dataset.android==='true')}={}){
  const platformDefaults=android?{...defaults,music:.75,voice:.9}:defaults,musicBoost=android?2:1;
  let settings={...platformDefaults};try{const raw=JSON.parse((storage||globalThis.localStorage)?.getItem(AUDIO_STORAGE_KEY)||'null');if(raw){for(const key of ['music','effects','voice'])if(Number.isFinite(raw[key]))settings[key]=clamp(raw[key]);for(const key of ['muted','readDialogue'])if(typeof raw[key]==='boolean')settings[key]=raw[key];if(['male','female'].includes(raw.heroVoice))settings.heroVoice=raw.heroVoice;}}catch{}
  let ctx=null,master,music,effects,voice,analyser,noiseBuffer,timer=null,theme='nameless',mode='home',musicBus=null,step=0,nextNote=0,dialogue=null,utterance=null,hidden=false,settingsOpen=false,destroyed=false;
  const active=new Set(),lastEffects=new Map(),listeners=new Set(),stats={notes:0,seals:0,casts:0,impacts:0,dialogueLines:0,syllables:0,shuriken:0,dashes:0,cues:{}};
  const notify=()=>listeners.forEach(fn=>fn({...settings}));
  const ramp=(param,value,duration=.15)=>{if(!ctx||!param)return;param.cancelScheduledValues(ctx.currentTime);param.setTargetAtTime(value,ctx.currentTime,duration/3);};
  const apply=()=>{if(!ctx)return;ramp(master.gain,settings.muted||hidden?0:.72);ramp(music.gain,settings.music*musicBoost*(dialogue?.24:settingsOpen||mode==='pause'?.42:mode==='dialog'?.55:1));ramp(effects.gain,settings.effects);ramp(voice.gain,settings.voice);};
  function release(node,nodes){active.delete(node);for(const n of nodes)try{n.disconnect();}catch{}}
  function note(bus,hz,time,duration,volume,wave='sine',endHz=hz,attack=.012){
    if(!ctx||active.size>=80||!Number.isFinite(hz)||hz<=0||duration<=0)return;
    const o=ctx.createOscillator(),g=ctx.createGain();o.type=wave;o.frequency.setValueAtTime(hz,time);o.frequency.exponentialRampToValueAtTime(Math.max(20,endHz),time+duration);
    g.gain.setValueAtTime(.00001,time);g.gain.linearRampToValueAtTime(volume,time+Math.min(attack,duration*.2));g.gain.exponentialRampToValueAtTime(.00001,time+duration);
    o.connect(g).connect(bus);active.add(o);o.onended=()=>release(o,[o,g]);o.start(time);o.stop(time+duration+.02);
  }
  function noise(bus,time,duration,volume,cutoff=1800,type='lowpass',endCutoff=cutoff){
    if(!ctx||active.size>=80)return;const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=noiseBuffer;src.loop=true;
    filter.type=type;filter.frequency.setValueAtTime(cutoff,time);filter.frequency.exponentialRampToValueAtTime(Math.max(30,endCutoff),time+duration);filter.Q.value=.7;
    g.gain.setValueAtTime(.00001,time);g.gain.linearRampToValueAtTime(volume,time+.008);g.gain.exponentialRampToValueAtTime(.00001,time+duration);
    src.connect(filter).connect(g).connect(bus);active.add(src);src.onended=()=>release(src,[src,filter,g]);src.start(time);src.stop(time+duration+.02);
  }
  function resetMusic(){
    if(!ctx)return;const previous=musicBus;musicBus=ctx.createGain();musicBus.gain.value=0;musicBus.connect(music);ramp(musicBus.gain,1,.65);
    if(previous){ramp(previous.gain,0,.4);setTimeout(()=>{try{previous.disconnect();}catch{}},900);}step=0;nextNote=ctx.currentTime+.06;
  }
  function schedule(){
    if(!ctx||ctx.state!=='running'||settings.muted||hidden||destroyed)return;
    if(settings.music>0){
      const song=VILLAGE_MUSIC[theme],combat=mode==='combat'||mode==='duel',beat=60/(song.bpm*(combat?1.16:1)),dt=beat/2;
      if(nextNote<ctx.currentTime-.2)nextNote=ctx.currentTime+.025;
      while(nextNote<ctx.currentTime+.3){
        const bar=Math.floor(step/8),index=step%16,degree=song.motif[index],chord=song.chords[Math.floor(bar/2)%4];
        if(degree!==null){const octave=theme==='earth'||theme==='dark'?12:0,midi=song.root+song.scale[degree%song.scale.length]+octave+(Math.floor(step/64)%2&&index>7?12:0);note(musicBus,frequency(midi),nextNote,dt*(theme==='ice'?2.3:1.7),.085,song.wave);if(['water','light','ice'].includes(theme))note(musicBus,frequency(midi+12),nextNote+.018,dt*2,.022);stats.notes++;}
        if(step%8===0){for(const interval of [0,song.minor?3:4,7])note(musicBus,frequency(song.root+chord+interval-12),nextNote,beat*3.7,.024,'sine',frequency(song.root+chord+interval-12),.3);note(musicBus,frequency(song.root+chord-24),nextNote,beat*1.7,.09,'sine');}
        const drum=song.drums*(combat?1.35:1);if(step%4===0)note(musicBus,100,nextNote,.16,.06*drum,'sine',42);if(step%4===2)noise(musicBus,nextNote,.065,.035*drum,2400,'highpass');
        nextNote+=dt;step=(step+1)%128;
      }
    }
    if(dialogue&&ctx.currentTime>=dialogue.next&&dialogue.remaining>0){
      // A short, pitched character murmur remains available without a TTS voice.
      const phase=dialogue.remaining%5,hz=dialogue.pitch*(1+phase*.055);note(voice,hz,ctx.currentTime,.065,.035,'triangle',hz*.85);note(voice,hz*2.1,ctx.currentTime,.055,.009,'sine');
      dialogue.remaining--;dialogue.next=ctx.currentTime+.105;stats.syllables++;if(!dialogue.remaining){dialogue=null;apply();}
    }
  }
  async function unlock(){
    if(destroyed||hidden)return false;
    if(!ctx){try{ctx=contextFactory?contextFactory():new (globalThis.AudioContext||globalThis.webkitAudioContext)({latencyHint:'interactive'});master=ctx.createGain();music=ctx.createGain();effects=ctx.createGain();voice=ctx.createGain();analyser=ctx.createAnalyser();analyser.fftSize=512;
      const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-14;limiter.knee.value=12;limiter.ratio.value=5;limiter.attack.value=.005;limiter.release.value=.2;
      master.gain.value=0;music.connect(master);effects.connect(master);voice.connect(master);master.connect(limiter).connect(analyser).connect(ctx.destination);
      noiseBuffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const samples=noiseBuffer.getChannelData(0);let seed=7919;for(let i=0;i<samples.length;i++){seed=(seed*16807)%2147483647;samples[i]=seed/1073741824-1;}
      resetMusic();apply();timer=setInterval(schedule,80);
    }catch{ctx=null;return false;}}
    try{if(ctx.state==='suspended')await ctx.resume();}catch{return false;}schedule();return true;
  }
  function canEffect(key,interval=.045){if(!ctx||ctx.state!=='running'||settings.muted||hidden||settings.effects<=0)return false;const old=lastEffects.get(key)??-Infinity;if(ctx.currentTime-old<interval)return false;lastEffects.set(key,ctx.currentTime);return true;}
  const speech=createSpeechOutput({getOutput:()=>ctx?{context:ctx,destination:voice}:null,onEnd:()=>{utterance=null;dialogue=null;apply();},onError:()=>{utterance=null;if(dialogue){dialogue.remaining=dialogue.fallbackRemaining;dialogue.next=ctx?.currentTime||0;}apply();},onStatus:()=>notify()});
  function stopSpeech(){utterance=null;speech.stop();}
  function stopDialogue(){dialogue=null;stopSpeech();apply();}
  function speak(text,speaker={},preview=false,options={}){
    stopSpeech();if((!preview&&!settings.readDialogue)||settings.voice<=0||settings.muted||hidden)return false;
    utterance={};const accepted=speech.speak(text,{...characterVoice(speaker,settings.heroVoice),volume:settings.voice,...options});if(!accepted)utterance=null;return accepted;
  }
  const api={
    unlock,
    get speaking(){return !!utterance;},
    settings:()=>({...settings}),
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    configure(change){if(['male','female'].includes(change.heroVoice)){settings.heroVoice=change.heroVoice;stopDialogue();}for(const key of ['music','effects','voice'])if(Number.isFinite(change[key]))settings[key]=clamp(change[key]);for(const key of ['muted','readDialogue'])if(typeof change[key]==='boolean')settings[key]=change[key];if(settings.muted||settings.voice===0||change.readDialogue===false)stopDialogue();apply();if(!settings.muted)unlock();try{(storage||globalThis.localStorage)?.setItem(AUDIO_STORAGE_KEY,JSON.stringify(settings));}catch{}notify();},
    setScene(village,phase){const next=VILLAGE_MUSIC[village]?village:'nameless';if(theme===next&&mode===phase)return;const changed=theme!==next||(['combat','duel'].includes(mode)!==['combat','duel'].includes(phase));theme=next;mode=phase;if(changed)resetMusic();apply();},
    settingsOpen(open){settingsOpen=open;apply();},
    tone(hz=260,duration=.08,wave='sine',volume=.06){if(canEffect('tone',.018))note(effects,hz,ctx.currentTime,duration,volume,wave,hz*.65);},
    cue(type,intensity=1){
      if(!type||!canEffect('cue-'+type,.09))return;stats.cues[type]=(stats.cues[type]||0)+1;const t=ctx.currentTime,power=Math.max(.05,Math.min(1,intensity));
      const fx=(hz,dur,volume,wave='sine',end=hz,delay=0)=>note(effects,hz,t+delay,dur,volume*power,wave,end);
      const hiss=(dur,volume,cutoff,type='lowpass',end=cutoff,delay=0)=>noise(effects,t+delay,dur,volume*power,cutoff,type,end);
      if(type==='energy-charge'){for(let i=0;i<9;i++)fx(110+i*55,.3,.025+i*.006,'triangle',150+i*80,i*.15);hiss(1.5,.12,250,'bandpass',2400);}
      else if(type==='energy-fire'){hiss(1.25,.3,3800,'bandpass',1100);fx(65,1.2,.19,'sawtooth',37);fx(230,.45,.065,'triangle',70);}
      else if(type==='dragon-roar'||type==='guardian-roar'){for(let i=0;i<5;i++){fx(76+i*23,.75,.045,'sawtooth',38+i*13,i*.035);hiss(.25,.06,260+i*110,'bandpass',120,i*.1);}hiss(.85,.15,560,'lowpass',90);}
      else if(type==='meteor-fall'){hiss(1.15,.3,4200,'bandpass',450);fx(650,1.1,.09,'sawtooth',45);}
      else if(type==='meteor-summon'){hiss(.8,.14,170,'lowpass',600);fx(48,.8,.1,'sine',85);}
      else if(type==='explosion'){hiss(.85,.34,4200,'lowpass',90);fx(85,1,.24,'sine',24);hiss(.6,.13,240,'lowpass',60,.15);}
      else if(type==='thunder-strike'){hiss(.1,.38,7000,'highpass',1100);hiss(2,.24,380,'lowpass',50,.08);fx(62,1.6,.17,'triangle',25,.03);hiss(.8,.1,160,'lowpass',55,.65);}
      else if(type==='static-charge'||type==='lightning-crack'){for(let i=0;i<4;i++){hiss(.05,.13,5200,'highpass',1700,i*.07);fx(1800-i*230,.1,.035,'sawtooth',140,i*.06);}if(type==='static-charge')fx(110,.8,.06,'sawtooth',330);}
      else if(type==='wind-howl'||type==='wind-cut'){const length=type==='wind-howl'?1.1:.3;hiss(length,.24,650,'bandpass',3400);fx(720,length,.035,'sine',1600);fx(950,length,.018,'sine',430);}
      else if(type==='rock-shift'||type==='stone-impact'){hiss(type==='stone-impact'?.7:1,.26,650,'lowpass',65);fx(type==='stone-impact'?90:60,.7,.18,'triangle',26);for(let i=0;i<6;i++)hiss(.07,.07,1300-i*130,'bandpass',140,i*.065);}
      else if(type==='water-surge'||type==='water-splash'){hiss(type==='water-surge'?1:.35,.24,1200,'bandpass',290);for(let i=0;i<5;i++)fx(420+i*95,.12,.03,'sine',170+i*40,i*.045);}
      else if(type==='wood-creak'||type==='wood-snap'){fx(160,.55,.07,'sawtooth',65);for(let i=0;i<4;i++)hiss(.06,.1,1500-i*270,'bandpass',250,i*.065);}
      else if(type==='ice-crack'){hiss(.09,.14,5200,'highpass',1600);for(let i=0;i<5;i++)fx(1200+i*530,.3,.025,'sine',1100+i*390,i*.025);}
      else if(type==='light-chime'){for(let i=0;i<4;i++)fx(660*2**(i/3),.6,.035,'sine',690*2**(i/3),i*.04);}
      else if(type==='shadow-rumble'||type==='shadow-hit'){fx(58,.7,.15,'sine',27);hiss(.55,.14,350,'lowpass',65);}
      else if(type==='flame-burst'){hiss(.35,.2,2400,'lowpass',160);fx(95,.3,.09,'triangle',38);}
    },
    seal(index,valid=true,ready=false,enemy=false){if(!canEffect(enemy?'enemy-seal':'seal',.035))return;stats.seals++;const t=ctx.currentTime,hz=valid?330*2**((index%12)/12):145,level=enemy?.28:1;noise(effects,t,.045,.11*level,1600,'bandpass');note(effects,hz,t,.12,.065*level,'triangle',hz*1.08);if(ready){note(effects,660,t+.04,.24,.055*level);note(effects,990,t+.09,.3,.03*level);}},
    cast(spell,enemy=false){if(!canEffect('cast-'+spell.element,.055))return;stats.casts++;const t=ctx.currentTime,level=enemy?.65:1,heavy=['S','SS'].includes(spell.rank),length=heavy?1.05:.45,power=heavy?1.25:1;
      api.cue(spellCastCue(spell),level);
      const fx=(hz,dur,volume,wave='sine',end=hz,delay=0)=>note(effects,hz,t+delay,dur,volume*level*power,wave,end);
      const hiss=(dur,volume,cutoff,type='lowpass',end=cutoff,delay=0)=>noise(effects,t+delay,dur,volume*level*power,cutoff,type,end);
      switch(spell.element){
        case 'fire':hiss(length,.3,2300,'lowpass',160);fx(135,length,.14,'sawtooth',42);break;
        case 'water':hiss(length,.2,900,'bandpass',2600);for(let i=0;i<5;i++)fx(300+i*160,.12,.06,'sine',180+i*80,i*.045);break;
        case 'lightning':hiss(.22,.2,4500,'highpass',1300);for(let i=0;i<4;i++)fx(1500-i*190,.08,.065,'sawtooth',120,i*.055);if(heavy)fx(60,.8,.18,'sine',28,.18);break;
        case 'wind':hiss(length,.25,650,'bandpass',4200);fx(420,length,.03,'sine',1600);break;
        case 'earth':hiss(length,.25,460,'lowpass',70);fx(95,length,.2,'triangle',28);for(let i=0;i<3;i++)fx(180,.11,.045,'square',48,i*.09);break;
        case 'light':fx(680,length,.065,'sine',2300);fx(1360,length,.04,'triangle',3400);hiss(.12,.07,5000,'highpass');break;
        case 'dark':fx(74,length,.14,'sine',38);fx(111,length,.065,'triangle',55);hiss(length,.1,320,'lowpass',80);break;
        case 'wood':for(let i=0;i<5;i++){hiss(.08,.08,600+i*200,'bandpass',130,i*.075);fx(230+i*30,.13,.045,'triangle',110,i*.075);}break;
        case 'ice':for(let i=0;i<6;i++)fx(1100+i*290,.35,.035,'sine',1000+i*270,i*.04);hiss(length,.1,4400,'highpass',1800);break;
      }
      if(['firewall','waterwall','windwall','earthwall','icewall','walnutwall','lightmirror'].includes(spell.style))fx(190,.45,.07,'sine',430);
    },
    impact(element='weapon',damage=0,blocked=false,style=null){if(!canEffect('impact-'+element,.075))return;stats.impacts++;if(!blocked)api.cue(spellImpactCue({element,style}),damage>=70?1:.55);const t=ctx.currentTime,large=damage>=70;noise(effects,t,large?.45:.13,blocked?.12:large?.26:.16,element==='ice'||element==='lightning'?3800:element==='earth'?260:1400);note(effects,blocked?740:large?80:130,t,large?.55:.15,blocked?.06:.12,'triangle',blocked?510:35);},
    shuriken(enemy=false){if(canEffect('shuriken',.09)){stats.shuriken++;noise(effects,ctx.currentTime,.13,enemy?.07:.13,3800,'bandpass',1000);note(effects,1600,ctx.currentTime,.08,enemy?.012:.025,'sine',700);}},
    dash(){if(canEffect('dash',.1)){stats.dashes++;noise(effects,ctx.currentTime,.24,.2,500,'bandpass',3500);}},
    ambient(type){if(!canEffect('ambient-'+type,type==='thunder'?2:.1))return;const t=ctx.currentTime;if(type==='thunder'){noise(effects,t,2.2,.2,180,'lowpass',50);note(effects,55,t,1.8,.09,'sine',28);}else noise(effects,t,.14,.11,900,'lowpass',140);},
    result(won){if(!canEffect('result',.5))return;for(const [i,midi] of (won?[60,64,67,72]:[57,53,50]).entries())note(effects,frequency(midi),ctx.currentTime+i*.15,.65,.09,'triangle');},
    dialogueLine(line){stopDialogue();stats.dialogueLines++;if(settings.muted||settings.voice===0||hidden)return;const hash=Array.from(line.speaker?.id||'npc').reduce((n,c)=>n+c.charCodeAt(0),0),syllables=Math.min(120,Math.ceil(line.text.replace(/\s/g,'').length/2));dialogue={remaining:syllables,fallbackRemaining:syllables,next:ctx?.currentTime||0,pitch:190*characterVoice(line.speaker,settings.heroVoice).pitch+hash%15};if(speak(line.text,line.speaker))dialogue.remaining=0;apply();},
    finishTyping(){if(!utterance){dialogue=null;apply();}},
    stopDialogue,
    speakSpell(spell){speak(spell.name,{id:'hero'},false,{segments:spellVoice(spell.name,settings.heroVoice)});},
    stopVoice:stopSpeech,
    pauseVoice(paused){if(paused)speech.pause();else speech.resume();},
    speechStatus:()=>speech.status(),
    installVoice:()=>speech.install(),
    openVoiceSettings:()=>speech.openSettings(),
    previewVoice(){stopDialogue();dialogue={remaining:0,fallbackRemaining:0,next:0,pitch:220};const ok=speak('Xin chào. Tôi sẽ cùng bạn mang hòa bình trở về các làng.',{id:'hero'},true);if(!ok)dialogue=null;apply();return ok;},
    visibility(value){hidden=value;stopDialogue();apply();if(ctx){if(value)ctx.suspend().catch(()=>{});else unlock();}},
    state(){let rms=0;if(analyser){const values=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(values);rms=Math.sqrt(values.reduce((n,x)=>n+x*x,0)/values.length);}return {supported:!!(globalThis.AudioContext||globalThis.webkitAudioContext||contextFactory),context:ctx?.state||'locked',theme,track:VILLAGE_MUSIC[theme].name,mode,settings:{...settings},activeVoices:active.size,musicStep:step,hidden,rms,stats:{...stats},musicBoost,musicGain:music?.gain.value||0,speech:speech.status(),speaking:!!utterance,dialogue:!!dialogue};},
    destroy(){destroyed=true;clearInterval(timer);stopDialogue();speech.destroy();for(const source of active)try{source.stop();}catch{}active.clear();ctx?.close().catch(()=>{});listeners.clear();}
  };return api;
}
export const gameAudio=createGameAudio();
