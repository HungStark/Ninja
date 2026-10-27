import {gameLanguage} from './language.js';
import {createSpeechOutput} from './speech-output.js';
import {characterVoice,spellVoice} from './character-voice.js';
import {spellCastCue,spellImpactCue} from './spell-audio-cues.js';
import {renderSpellSound,SPELL_SOUND_DURATIONS,SPELL_SOUND_RATE} from './spell-sound-bank.js';
import {createSpellSoundscape} from './spell-soundscape.js';
import {normalizeSoundBuffer,createEffectsMixer,createPeakLimiter,SPELL_LOUDNESS_TARGET} from './sound-loudness.js';
import {PROCEDURAL_CUE_DURATIONS,renderProceduralCue,scheduleProceduralCue} from './procedural-spell-sounds.js';
import {FIRE_DRAGON_ROAR_BASE64} from '../assets/audio/fire-dragon-roar.js';
import {WIND_WHOOSH_BASE64} from '../assets/audio/wind-whoosh.js';
import {WIND_SPIRIT_CHANT_BASE64} from '../assets/audio/wind-spirit-chant.js';
import {LIGHTNING_HAWK_CRY_BASE64} from '../assets/audio/lightning-hawk-cry.js';
import {THUNDER_CLAP_BASE64} from '../assets/audio/thunder-clap.js';
import {SHADOW_DOG_BARK_BASE64} from '../assets/audio/shadow-dog-bark.js';
import {SHADOW_BULL_MOO_BASE64} from '../assets/audio/shadow-bull-moo.js';
import {SHADOW_ELEPHANT_TRUMPET_BASE64} from '../assets/audio/shadow-elephant-trumpet.js';
import {BAMBOO_FLIGHT_SWOOSH_BASE64} from '../assets/audio/bamboo-flight-swoosh.js';
import {SNOWSTORM_WIND_BASE64} from '../assets/audio/snowstorm-wind.js';
import {EARTH_GRAVITY_CINEMATIC_BASE64} from '../assets/audio/earth-gravity-cinematic.js';
import {EARTH_HEAVY_ROCK_BASE64} from '../assets/audio/earth-heavy-rock.js';
import {LIGHT_LASER_BASE64} from '../assets/audio/light-laser.js';
import {HOLY_STAIR_LASER_BASE64} from '../assets/audio/holy-stair-laser.js';
const recordings={'dragon-roar':FIRE_DRAGON_ROAR_BASE64,'wind-howl':WIND_WHOOSH_BASE64,'wind-cut':WIND_WHOOSH_BASE64,'spirit-song':WIND_SPIRIT_CHANT_BASE64,'bird-cry':LIGHTNING_HAWK_CRY_BASE64,'thunder-strike':THUNDER_CLAP_BASE64,'shadow-dog':SHADOW_DOG_BARK_BASE64,'shadow-bull':SHADOW_BULL_MOO_BASE64,'shadow-elephant':SHADOW_ELEPHANT_TRUMPET_BASE64,'bamboo-swoosh':BAMBOO_FLIGHT_SWOOSH_BASE64,'snowstorm-wind':SNOWSTORM_WIND_BASE64,'earth-cinematic':EARTH_GRAVITY_CINEMATIC_BASE64,'earth-heavy-rock':EARTH_HEAVY_ROCK_BASE64,'rock-shift':EARTH_HEAVY_ROCK_BASE64,'stone-impact':EARTH_HEAVY_ROCK_BASE64,'light-laser':LIGHT_LASER_BASE64,'dome-laser':LIGHT_LASER_BASE64,'holy-stair-laser':HOLY_STAIR_LASER_BASE64};
const recordingAliases={'wind-cut':'wind-howl','rock-shift':'earth-heavy-rock','stone-impact':'earth-heavy-rock','dome-laser':'light-laser'};
// The user's recordings are embedded for offline playback.
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
  let ctx=null,master,music,effects,effectMixer,effectOutput,voice,analyser,noiseBuffer,timer=null,theme='nameless',mode='home',musicBus=null,step=0,nextNote=0,dialogue=null,utterance=null,hidden=false,settingsOpen=false,destroyed=false;
  const active=new Set(),lastEffects=new Map(),listeners=new Set(),stats={notes:0,seals:0,casts:0,impacts:0,dialogueLines:0,syllables:0,shuriken:0,dashes:0,cues:{}};
  const soundBuffers=new Map(),loudnessProfiles=new Map(),proceduralReady=new Map(),spellTextures=new Map(),fallingMeteors=new Map(),attachedSounds=new Map(),domeSounds=new Map(),recordingsReady=new Map();let soundEpoch=0,previewSound=null,previewSerial=0;
  const soundscape=createSpellSoundscape({cue:(type,level)=>api.cue(type,level),textures:setSpellTextures,attached:setAttachedSounds,repeating:setDomeSounds});
  const notify=()=>listeners.forEach(fn=>fn({...settings}));
  const ramp=(param,value,duration=.15)=>{if(!ctx||!param)return;param.cancelScheduledValues(ctx.currentTime);param.setTargetAtTime(value,ctx.currentTime,duration/3);};
  const apply=()=>{if(!ctx)return;const volume=settings.muted||hidden?0:.72;ramp(master.gain,volume);ramp(effectOutput.gain,volume);ramp(music.gain,settings.music*musicBoost*(dialogue?.24:settingsOpen||mode==='pause'?.42:mode==='dialog'?.55:1));ramp(effectMixer.volume.gain,settings.effects);ramp(voice.gain,settings.voice);};
  function release(node,nodes){active.delete(node);for(const n of nodes)try{n.disconnect();}catch{}}
  function note(bus,hz,time,duration,volume,wave='sine',endHz=hz,attack=.012){
    if(!ctx||active.size>=(bus===effects?80:64)||!Number.isFinite(hz)||hz<=0||duration<=0)return;
    const o=ctx.createOscillator(),g=ctx.createGain();o.type=wave;o.frequency.setValueAtTime(hz,time);o.frequency.exponentialRampToValueAtTime(Math.max(20,endHz),time+duration);
    g.gain.setValueAtTime(.00001,time);g.gain.linearRampToValueAtTime(volume,time+Math.min(attack,duration*.2));g.gain.exponentialRampToValueAtTime(.00001,time+duration);
    o.connect(g).connect(bus);active.add(o);o.onended=()=>release(o,[o,g]);o.start(time);o.stop(time+duration+.02);
  }
  function noise(bus,time,duration,volume,cutoff=1800,type='lowpass',endCutoff=cutoff){
    if(!ctx||active.size>=(bus===effects?80:64))return;const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=noiseBuffer;src.loop=true;
    filter.type=type;filter.frequency.setValueAtTime(cutoff,time);filter.frequency.exponentialRampToValueAtTime(Math.max(30,endCutoff),time+duration);filter.Q.value=.7;
    g.gain.setValueAtTime(.00001,time);g.gain.linearRampToValueAtTime(volume,time+.008);g.gain.exponentialRampToValueAtTime(.00001,time+duration);
    src.connect(filter).connect(g).connect(bus);active.add(src);src.onended=()=>release(src,[src,filter,g]);src.start(time);src.stop(time+duration+.02);
  }
  function soundBuffer(type){
    if(!ctx)return null;if(soundBuffers.has(type))return soundBuffers.get(type);if(!SPELL_SOUND_DURATIONS[type])return null;
    if(!soundBuffers.has(type)){const pcm=renderSpellSound(type),buffer=ctx.createBuffer(1,pcm.length,SPELL_SOUND_RATE);buffer.getChannelData(0).set(pcm);cacheSound(type,buffer);}
    return soundBuffers.get(type);
  }
  function cacheSound(type,buffer){
    if(destroyed)return null;const profile=normalizeSoundBuffer(buffer);soundBuffers.set(type,buffer);loudnessProfiles.set(type,profile);
    for(const [alias,canonical] of Object.entries(recordingAliases))if(canonical===type){soundBuffers.set(alias,buffer);loudnessProfiles.set(alias,profile);}return buffer;
  }
  function prepareRecording(type){
    if(!ctx)return Promise.resolve(null);
    const key=recordingAliases[type]||type;
    if(!recordingsReady.has(key)){const bytes=Uint8Array.from(globalThis.atob(recordings[key]),c=>c.charCodeAt(0));recordingsReady.set(key,ctx.decodeAudioData(bytes.buffer).then(buffer=>cacheSound(key,buffer)).catch(()=>null));}
    return recordingsReady.get(key);
  }
  function prepareEffect(type){
    if(!ctx||destroyed)return Promise.resolve(null);
    if(recordings[type])return prepareRecording(type);
    if(PROCEDURAL_CUE_DURATIONS[type]){
      if(!proceduralReady.has(type))proceduralReady.set(type,renderProceduralCue(type).then(buffer=>buffer?cacheSound(type,buffer):null).catch(()=>null));return proceduralReady.get(type);
    }
    return Promise.resolve(soundBuffer(type));
  }
  function sample(type,level=1,loop=false){
    const buffer=soundBuffer(type);if(!buffer||active.size>=80)return null;
    const source=ctx.createBufferSource(),gain=ctx.createGain(),volume=level;
    source.buffer=buffer;source.loop=loop;gain.gain.setValueAtTime(volume,ctx.currentTime);
    source.connect(gain).connect(effects);active.add(source);source.onended=()=>release(source,[source,gain]);source.start();
    return {source,gain,volume:level,baseVolume:volume/level};
  }
  function stopTexture(type,entry){
    if(!ctx)return;const now=ctx.currentTime,fade=type==='spirit-song'?.02:.08;entry.gain.gain.cancelScheduledValues(now);entry.gain.gain.setTargetAtTime(0,now,fade/4);try{entry.source.stop(now+fade);}catch{}spellTextures.delete(type);
  }
  function stopEffectPreview(){
    previewSerial++;if(!previewSound||!ctx)return;
    const entry=previewSound;previewSound=null;const now=ctx.currentTime;entry.gain.gain.cancelScheduledValues(now);entry.gain.gain.setTargetAtTime(0,now,.005);try{entry.source.stop(now+.02);}catch{}
  }
  function stopMeteorFall(shot){
    const entry=fallingMeteors.get(shot);if(!entry||!ctx)return;
    const now=ctx.currentTime;entry.gain.gain.cancelScheduledValues(now);entry.gain.gain.setTargetAtTime(0,now,.005);try{entry.source.stop(now+.02);}catch{}fallingMeteors.delete(shot);
  }
  function setSpellTextures(wanted){
    if(!ctx||ctx.state!=='running'||settings.muted||hidden||settings.effects<=0)wanted=new Map();
    for(const [type,entry] of spellTextures)if(!wanted.has(type))stopTexture(type,entry);
    for(const [type,level] of wanted){
      const entry=spellTextures.get(type);
      if(entry){if(entry.volume!==level){ramp(entry.gain.gain,entry.baseVolume*level);entry.volume=level;}continue;}
      if(spellTextures.size>=6)break;
      const next=sample(type,level,true);if(next){spellTextures.set(type,next);stats.cues[type]=(stats.cues[type]||0)+1;}
    }
  }
  function setAttachedSounds(wanted){
    if(!ctx||ctx.state!=='running'||settings.muted||hidden||settings.effects<=0)wanted=new Map();
    for(const [effect,entry] of attachedSounds)if(!wanted.has(effect)){
      const now=ctx.currentTime;entry.gain.gain.cancelScheduledValues(now);entry.gain.gain.setTargetAtTime(0,now,.005);try{entry.source.stop(now+.02);}catch{}attachedSounds.delete(effect);
    }
    for(const [effect,{type,level,duration,loop=false}] of wanted){
      if(attachedSounds.has(effect))continue;
      if(!soundBuffers.has(type)){prepareRecording(type);continue;}
      const entry=sample(type,level,loop);if(entry){if(Number.isFinite(duration))entry.source.stop(ctx.currentTime+Math.max(.001,duration));attachedSounds.set(effect,{...entry,type});stats.cues[type]=(stats.cues[type]||0)+1;}
    }
  }
  function resetMusic(){
    if(!ctx)return;const previous=musicBus;musicBus=ctx.createGain();musicBus.gain.value=0;musicBus.connect(music);ramp(musicBus.gain,1,.65);
    if(previous){ramp(previous.gain,0,.4);setTimeout(()=>{try{previous.disconnect();}catch{}},900);}step=0;nextNote=ctx.currentTime+.06;
  }
  function setDomeSounds(wanted){
    if(!ctx||ctx.state!=='running'||settings.muted||hidden||settings.effects<=0)wanted=new Map();
    for(const [dome,state] of domeSounds)if(!wanted.has(dome)){
      const now=ctx.currentTime;for(const entry of state.voices){entry.gain.gain.cancelScheduledValues(now);entry.gain.gain.setTargetAtTime(0,now,.005);try{entry.source.stop(now+.02);}catch{}}domeSounds.delete(dome);
    }
    for(const [dome,{level,age,duration}] of wanted){
      let state=domeSounds.get(dome);if(!state){state={nextAt:age,voices:new Set()};domeSounds.set(dome,state);}
      if(age+1e-6<state.nextAt)continue;
      if(!soundBuffers.has('dome-laser')){prepareRecording('dome-laser');continue;}
      const entry=sample('dome-laser',level);if(!entry)continue;
      entry.source.stop(ctx.currentTime+Math.max(.001,duration));state.voices.add(entry);const end=entry.source.onended;entry.source.onended=()=>{state.voices.delete(entry);end?.();};
      state.nextAt=age+1;stats.cues['dome-laser']=(stats.cues['dome-laser']||0)+1;
    }
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
      // Keep the existing music/voice compressor off the balanced spell bus:
      // its automatic makeup changes short impacts and long recordings unevenly.
      effectOutput=ctx.createGain();effectOutput.gain.value=0;master.gain.value=0;
      music.connect(master);voice.connect(master);master.connect(limiter).connect(analyser);
      effectMixer=createEffectsMixer(ctx,effects,effectOutput);effectOutput.connect(analyser);analyser.connect(createPeakLimiter(ctx)).connect(ctx.destination);
      noiseBuffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const samples=noiseBuffer.getChannelData(0);let seed=7919;for(let i=0;i<samples.length;i++){seed=(seed*16807)%2147483647;samples[i]=seed/1073741824-1;}
      resetMusic();apply();timer=setInterval(schedule,80);
    }catch{ctx=null;return false;}}
    try{if(ctx.state==='suspended')await ctx.resume();}catch{return false;}for(const type of ['dragon-roar','wind-howl','spirit-song','bird-cry','thunder-strike','shadow-dog','shadow-bull','shadow-elephant','bamboo-swoosh','snowstorm-wind','earth-cinematic','earth-heavy-rock','light-laser','holy-stair-laser',...Object.keys(PROCEDURAL_CUE_DURATIONS)])prepareEffect(type);schedule();return true;
  }
  function canEffect(key,interval=.045){if(!ctx||ctx.state!=='running'||settings.muted||hidden||settings.effects<=0)return false;const old=lastEffects.get(key)??-Infinity;if(ctx.currentTime-old<interval)return false;lastEffects.set(key,ctx.currentTime);return true;}
  const speech=createSpeechOutput({getOutput:()=>ctx?{context:ctx,destination:voice}:null,onEnd:()=>{utterance=null;dialogue=null;apply();},onError:()=>{utterance=null;if(dialogue){dialogue.remaining=dialogue.fallbackRemaining;dialogue.next=ctx?.currentTime||0;}apply();},onStatus:()=>notify()});
  function stopSpeech(){utterance=null;speech.stop();}
  function stopDialogue(){dialogue=null;stopSpeech();apply();}
  function speak(text,speaker={},preview=false,options={}){
    stopSpeech();if((!preview&&!settings.readDialogue)||settings.voice<=0||settings.muted||hidden)return false;
    utterance={};const accepted=speech.speak(text,{...characterVoice(speaker,settings.heroVoice),volume:settings.voice,language:gameLanguage(),...options});if(!accepted)utterance=null;return accepted;
  }
  const api={
    unlock,
    get speaking(){return !!utterance;},
    get spellSounds(){const info=type=>{const buffer=soundBuffers.get(type);return buffer?{duration:buffer.duration,samples:buffer.length,channels:buffer.numberOfChannels}:null;};return {textures:[...spellTextures.keys()],attached:[...attachedSounds.values()].map(entry=>entry.type),cached:[...soundBuffers.keys()],loudness:{target:SPELL_LOUDNESS_TARGET,profiles:Object.fromEntries(loudnessProfiles),reduction:effectMixer?.reduction||0,processorReady:!!effectMixer?.processor,mixerError:effectMixer?.error||null},meteors:[...fallingMeteors.keys()].filter(s=>s.style==='meteor').length,boats:[...fallingMeteors.keys()].filter(s=>s.style==='boat').length,domes:domeSounds.size,dragonRecording:info('dragon-roar'),windRecording:info('wind-howl'),spiritRecording:info('spirit-song'),birdRecording:info('bird-cry'),thunderRecording:info('thunder-strike'),laserRecording:info('light-laser'),holyStairRecording:info('holy-stair-laser')};},
    settings:()=>({...settings}),
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    configure(change){if(['male','female'].includes(change.heroVoice)){settings.heroVoice=change.heroVoice;stopDialogue();}for(const key of ['music','effects','voice'])if(Number.isFinite(change[key]))settings[key]=clamp(change[key]);for(const key of ['muted','readDialogue'])if(typeof change[key]==='boolean')settings[key]=change[key];if(settings.muted||settings.voice===0||change.readDialogue===false)stopDialogue();apply();if(!settings.muted)unlock();try{(storage||globalThis.localStorage)?.setItem(AUDIO_STORAGE_KEY,JSON.stringify(settings));}catch{}notify();},
    setScene(village,phase){const next=VILLAGE_MUSIC[village]?village:'nameless';if(theme===next&&mode===phase)return;const changed=theme!==next||(['combat','duel'].includes(mode)!==['combat','duel'].includes(phase));theme=next;mode=phase;if(changed)resetMusic();apply();},
    settingsOpen(open){settingsOpen=open;apply();},
    async previewEffect(type){
      stopEffectPreview();const serial=previewSerial;await prepareEffect(type);
      if(serial!==previewSerial||!canEffect('effect-preview',0))return;
      const entry=sample(type);if(entry){previewSound={...entry,type};stats.cues[type]=(stats.cues[type]||0)+1;}
    },
    stopEffectPreview,
    tone(hz=260,duration=.08,wave='sine',volume=.06){if(canEffect('tone',.018))note(effects,hz,ctx.currentTime,duration,volume,wave,hz*.65);},
    cue(type,intensity=1){
      if(!type||!canEffect('cue-'+type,.09))return;stats.cues[type]=(stats.cues[type]||0)+1;const power=Math.max(.05,Math.min(1,intensity));
      if(soundBuffers.has(type)||SPELL_SOUND_DURATIONS[type]){sample(type,power);return;}
      const epoch=soundEpoch;prepareEffect(type).then(buffer=>{
        if(epoch!==soundEpoch||destroyed||settings.muted||hidden||settings.effects<=0||ctx?.state!=='running')return;
        if(buffer){sample(type,power);return;}
        const t=ctx.currentTime;
        scheduleProceduralCue(type,(hz,dur,volume,wave='sine',end=hz,delay=0)=>note(effects,hz,t+delay,dur,volume*power,wave,end),(dur,volume,cutoff,filter='lowpass',end=cutoff,delay=0)=>noise(effects,t+delay,dur,volume*power,cutoff,filter,end));
      });
    },
    seal(index,valid=true,ready=false,enemy=false){if(!canEffect(enemy?'enemy-seal':'seal',.035))return;stats.seals++;const t=ctx.currentTime,hz=valid?330*2**((index%12)/12):145,level=enemy?.28:1;noise(effects,t,.045,.11*level,1600,'bandpass');note(effects,hz,t,.12,.065*level,'triangle',hz*1.08);if(ready){note(effects,660,t+.04,.24,.055*level);note(effects,990,t+.09,.3,.03*level);}},
    cast(spell,enemy=false){
      if(!canEffect('cast-'+spell.element,.055))return;stats.casts++;
      // These sounds follow their actual effects or individual attack events.
      if(spell.element==='wind'||['aircombo','boat','lightray','jacob','snowstorm','bamboostab'].includes(spell.style)||spell.style?.startsWith('earth'))return;
      api.cue(spellCastCue(spell),enemy?.65:1);
    },
    impact(element='weapon',damage=0,blocked=false,style=null){if(!canEffect('impact-'+element,.075))return;stats.impacts++;if(['boat','lightray','jacob','lightdome'].includes(style))return;const cue=spellImpactCue({element,style});if(!blocked&&cue){api.cue(cue);return;}if(!blocked&&element==='earth')return;const t=ctx.currentTime,large=damage>=70;noise(effects,t,large?.45:.13,blocked?.12:large?.26:.16,element==='ice'||element==='lightning'?3800:element==='earth'?260:1400);note(effects,blocked?740:large?80:130,t,large?.55:.15,blocked?.06:.12,'triangle',blocked?510:35);},
    shuriken(enemy=false){if(canEffect('shuriken',.09)){stats.shuriken++;noise(effects,ctx.currentTime,.13,enemy?.07:.13,3800,'bandpass',1000);note(effects,1600,ctx.currentTime,.08,enemy?.012:.025,'sine',700);}},
    dash(){if(canEffect('dash',.1)){stats.dashes++;noise(effects,ctx.currentTime,.24,.2,500,'bandpass',3500);}},
    windSlash(enemy=false){
      if(!canEffect('wind-slash',0))return;
      stats.cues['wind-cut']=(stats.cues['wind-cut']||0)+1;const level=enemy?.65:1;
      if(soundBuffers.has('wind-cut'))sample('wind-cut',level);
      else{const epoch=soundEpoch;prepareRecording('wind-cut').then(buffer=>{if(buffer&&epoch===soundEpoch&&!destroyed&&!settings.muted&&!hidden&&settings.effects>0&&ctx?.state==='running')sample('wind-cut',level);});}
    },
    ambient(type){if(!canEffect('ambient-'+type,type==='thunder'?2:.1))return;const t=ctx.currentTime;if(type==='thunder'){noise(effects,t,2.2,.2,180,'lowpass',50);note(effects,55,t,1.8,.09,'sine',28);}else noise(effects,t,.14,.11,900,'lowpass',140);},
    startMeteorFall(shot){
      if(fallingMeteors.has(shot)||!canEffect('meteor-flight',0))return;
      const entry=sample('meteor-fall',shot.owner==='player'?1:.65,true);if(!entry)return;
      const remaining=Math.max(.25,shot.style==='boat'?shot.travelTime-shot.flightAge:(shot.fallTime||2.4)-(shot.fallAge||0));entry.source.playbackRate.setValueAtTime(entry.source.buffer.duration/remaining,ctx.currentTime);
      fallingMeteors.set(shot,entry);stats.cues['meteor-fall']=(stats.cues['meteor-fall']||0)+1;
    },
    meteorImpact(shot){stopMeteorFall(shot);api.cue('explosion');},
    startBoatRush(shot){api.startMeteorFall(shot);},
    boatImpact(shot,hitTarget){stopMeteorFall(shot);if(hitTarget)api.cue('explosion');},
    updateSpells(scene){
      const live=new Set((scene?.shots||[]).filter(s=>((s.style==='meteor'&&s.phase==='falling')||(s.style==='boat'&&s.phase==='flying'))&&s.life>0&&!s.consumedByDefense));
      for(const shot of fallingMeteors.keys())if(!live.has(shot)||settings.muted||hidden||settings.effects<=0)stopMeteorFall(shot);
      for(const shot of live)api.startMeteorFall(shot);soundscape.update(scene);
    },
    clearSpellSounds(){soundEpoch++;stopEffectPreview();for(const shot of fallingMeteors.keys())stopMeteorFall(shot);soundscape.reset();},
    result(won){if(!canEffect('result',.5))return;for(const [i,midi] of (won?[60,64,67,72]:[57,53,50]).entries())note(effects,frequency(midi),ctx.currentTime+i*.15,.65,.09,'triangle');},
    dialogueLine(line){stopDialogue();stats.dialogueLines++;if(settings.muted||settings.voice===0||hidden)return;const hash=Array.from(line.speaker?.id||'npc').reduce((n,c)=>n+c.charCodeAt(0),0),syllables=Math.min(120,Math.ceil(line.text.replace(/\s/g,'').length/2));dialogue={remaining:syllables,fallbackRemaining:syllables,next:ctx?.currentTime||0,pitch:190*characterVoice(line.speaker,settings.heroVoice).pitch+hash%15};if(speak(line.text,line.speaker))dialogue.remaining=0;apply();},
    finishTyping(){if(!utterance){dialogue=null;apply();}},
    stopDialogue,
    speakSpell(spell){speak(spell.name,{id:'hero'},false,{language:'vi',segments:spellVoice(spell.name,settings.heroVoice)});},
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
