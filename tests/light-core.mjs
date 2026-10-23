import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import { LightArts } from '../src/light-arts.js';
const ctx={};vm.runInNewContext(fs.readFileSync('game-core.js','utf8'),ctx);
const {spells,Fighter,intersectFireWall}=ctx.SealGameCore;
const spell=id=>spells.find(s=>s.id===id),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const scene=new T.Scene(),arts=new LightArts(scene,intersectFireWall);
let actors,walls,hits;
const setup=()=>{arts.reset();walls=[];hits=[];actors=[{owner:'player',pos:[0,1.72,0],dir:[0,0,-1],fighter:new Fighter(1000)},{owner:'enemy',pos:[0,1.72,-15],dir:[0,0,1],fighter:new Fighter(1000)}];};
const damage=(s,p)=>{hits.push({...s});return actors.find(a=>a.owner!==s.owner).fighter.receive(s.damage,true);};
const advance=t=>{for(let age=0;age<t-1e-9;age+=1/60)arts.advance(Math.min(1/60,t-age),actors,walls,damage);};
const place=(id,owner='player',finish=true)=>{const a=actors.find(a=>a.owner===owner),o=arts.place(owner,spell(id),a.pos,a.dir,actors);if(o.kind==='dome'&&finish)advance(o.buildTime);return o;};
const fire=(owner='player')=>{const a=actors.find(a=>a.owner===owner);arts.fire(owner,spell('light-orb'),a.pos,a.dir);advance(.1);};
assert.deepEqual(Array.from(spells.filter(s=>s.element==='light').map(s=>s.sequence.length)),[2,4,6,3,6]);
assert.equal(spell('light-barrier').duration,8);assert.equal(spell('light-lance').duration,10);assert.equal(spell('light-reflect').duration,2.5);
for(const id of ['light-barrier','light-lance','light-reflect']){
  setup();const optic=place(id,'player',false);advance(spell(id).duration+(optic.buildTime||0)-.01);assert.ok(arts.optics.includes(optic),id+' remains until its full lifetime');close(optic.life,.01);
  advance(.01);assert.ok(!arts.optics.includes(optic),id+' expires at its exact lifetime');
}
assert.equal(spell('light-lance').sequence.length,6);assert.equal(spell('light-lance').domeRadius,6.2);
setup();const assembly=place('light-lance','player',false);assert.equal(arts.domeReady(assembly),false);assert.equal(arts.state().domes[0].landedPanels,0);assert.equal(assembly.assembly.panels.length,96);advance(.45);arts.visuals(.45,[],actors);assert.ok(assembly.assembly.panels.some(p=>p.part.visible&&p.part.position.y>p.target.y+2));assert.equal(arts.state().domes[0].landedPanels,0);fire();assert.equal(assembly.rays.length,0,'Unassembled roof cannot trap lasers');close(actors[1].fighter.hp,974);advance(assembly.buildTime-assembly.age);assert.equal(arts.domeReady(assembly),true);assert.equal(arts.state().domes[0].landedPanels,96);close(assembly.life,10);arts.visuals(1.2,[],actors);assert.ok(assembly.assembly.panels.every(p=>p.part.position.distanceTo(p.target)<1e-6));fire();assert.equal(assembly.rays.length,1);
setup();fire();close(actors[1].fighter.hp,974);assert.equal(hits.length,1);assert.equal(arts.lastPaths[0].spectrum,0);
setup();actors[0].dir=[1,0,0];fire();assert.equal(hits.length,0,'Laser must be aimed at the target');
setup();const sphere=place('light-barrier');close(sphere.center[2],-3);fire();close(actors[1].fighter.hp,954.5);assert.equal(arts.lastPaths.at(-1).spectrum,7);assert.equal(arts.lastPaths.at(-1).multiplier,1.75);
setup();place('light-barrier','enemy');fire();close(actors[1].fighter.hp,974,'Enemy glass cannot amplify a friendly ray');
setup();const fixed=place('light-barrier'),center=[...fixed.center];actors[0].pos[0]=4;advance(.2);assert.deepEqual(fixed.center,center);fire();assert.equal(hits.length,0);advance(fixed.life);assert.equal(arts.optics.length,0);
setup();const old=place('light-barrier');place('light-barrier');assert.equal(arts.optics.length,1);assert.notEqual(arts.optics[0].id,old.id);
setup();place('light-barrier');advance(spell('light-barrier').duration);fire();close(actors[1].fighter.hp,974,'Expired sphere gives no boost');
setup();place('light-barrier');walls.push({owner:'enemy',p:[0,0,-10],normal:[0,0,1],width:8,height:5,hp:110,life:5});fire();close(actors[1].fighter.hp,1000);close(walls[0].hp,64.5);assert.equal(arts.lastPaths.at(-1).event,'wall');
setup();actors[1].fighter.shield=60;place('light-barrier');fire();close(actors[1].fighter.hp,1000);close(actors[1].fighter.shield,14.5);
setup();actors[1].fighter.invulnerableTime=2;fire();close(actors[1].fighter.hp,1000);
setup();const dormant=place('light-lance');advance(2);close(actors[1].fighter.hp,1000);assert.equal(dormant.rays.length,0);advance(dormant.life);assert.equal(arts.optics.length,0);
setup();const dome=place('light-lance');fire();close(actors[1].fighter.hp,1000);assert.equal(dome.rays.length,1);assert.equal(dome.rays[0].path.length,14);
for(const leg of dome.rays[0].path)for(const p of [leg.start,leg.end]){assert.ok(Math.hypot(...p.map((v,i)=>v-dome.center[i]))<=dome.radius+.02);assert.ok(p[1]>=dome.center[1]-.001);}
advance(.97);close(actors[1].fighter.hp,1000);advance(.04);close(actors[1].fighter.hp,980);advance(1);close(actors[1].fighter.hp,960);
advance(dome.life+.01);assert.equal(arts.optics.length,0);close(actors[1].fighter.hp,820);advance(3);close(actors[1].fighter.hp,820,'Dome stops damage at expiry');
setup();place('light-barrier');const rainbowDome=place('light-lance');fire();assert.equal(rainbowDome.rays[0].power,1.75);advance(1);close(actors[1].fighter.hp,965);
assert.equal(rainbowDome.rays[0].spectrum,7);assert.ok(rainbowDome.rays[0].path.every(leg=>leg.spectrum===7),'Every rainbow reflection retains all seven colors');
for(const powers of [[1,1],[1.75,1.75],[1.75,1]]){
  setup();const stacked=place('light-lance');
  for(const power of powers){
    for(const sphere of [...arts.optics].filter(o=>o.kind==='sphere'))arts.remove(arts.optics,sphere);
    if(power>1)place('light-barrier');fire();
  }
  assert.equal(stacked.rays.length,2,'Each laser is captured without replacing earlier lasers');
  assert.deepEqual(stacked.rays.map(r=>r.power),powers);
  for(const ray of stacked.rays)assert.ok(ray.path.every(leg=>leg.spectrum===(ray.power>1?7:0)));
  const dps=powers.reduce((sum,p)=>sum+p*20,0);advance(1);close(actors[1].fighter.hp,1000-dps);advance(1);close(actors[1].fighter.hp,1000-dps*2);
  assert.ok(arts.status('player').includes(`2 laser · ${dps} sát thương/s`));
  arts.visuals(2,[],actors);if(powers.some(p=>p>1))assert.ok(arts.colors.every(material=>stacked.root.userData.lines.some(m=>m.visible&&m.material===material)),'Render all seven colors while bouncing');
  advance(stacked.life+.01);const hp=actors[1].fighter.hp;assert.equal(arts.optics.length,0);advance(1);close(actors[1].fighter.hp,hp,'All stacked laser damage stops with the dome');
}
setup();const escape=place('light-lance');fire();const origin=[...actors[1].pos];for(const sign of [-1,1]){const three=arts.constrainMovement('enemy',origin,[sign*5.4,1.72,-15]);close(three[0],sign*5.4);const beyond=arts.constrainMovement('enemy',origin,[sign*20,1.72,-15]);assert.ok(Math.abs(beyond[0])>5.4&&Math.abs(beyond[0])<6.2,'Wall allows three dodge cells and blocks escape');}actors[1].pos=arts.constrainMovement('enemy',origin,[8,1.72,-15]);advance(3);close(actors[1].fighter.hp,940,'Trapped enemy keeps taking laser damage after moving to the wall');advance(escape.life);close(arts.constrainMovement('enemy',actors[1].pos,[8,1.72,-15])[0],8,'Movement is freed at expiry');
setup();place('light-lance');walls.push({owner:'enemy',p:[0,0,-5],normal:[0,0,1],width:8,height:5,hp:110,life:5});fire();assert.equal(arts.optics[0].rays.length,0);advance(2);close(actors[1].fighter.hp,1000);
setup();place('light-lance','enemy');fire('enemy');advance(1);close(actors[0].fighter.hp,980);close(actors[1].fighter.hp,1000);
setup();const mirror=place('light-reflect');fire('enemy');close(actors[0].fighter.hp,1000);close(actors[1].fighter.hp,974);assert.equal(mirror.reflections,1);assert.equal(arts.lastPaths.at(-1).owner,'player');
setup();actors[1].pos[2]=-31;place('light-reflect');fire('enemy');close(actors[0].fighter.hp,1000);close(actors[1].fighter.hp,974,'Reflected laser reaches its distant caster');
setup();place('light-reflect');fire();close(actors[1].fighter.hp,974,'Own outgoing laser passes through the mirror');
setup();place('light-reflect');advance(spell('light-reflect').duration);fire('enemy');close(actors[0].fighter.hp,974,'Mirror stops reflecting at 2.5 seconds');
const missile=(owner='enemy',x=0)=>({owner,style:'orb',phase:'flying',old:[x,1.72,-5],p:[x,1.72,0],v:[0,0,29],size:.2,life:4,damage:40});
setup();place('light-reflect');const shot=missile();assert.equal(arts.redirect(shot,actors),true);assert.equal(shot.owner,'player');assert.equal(shot.reflected,true);close(shot.v[2],-29);
setup();place('light-reflect');assert.equal(arts.redirect(missile('player'),actors),false);assert.equal(arts.redirect(missile('enemy',4),actors),false);
const rear=missile();rear.old=[0,1.72,1];rear.p=[0,1.72,-5];rear.v=[0,0,-29];assert.equal(arts.redirect(rear,actors),false,'Mirror guards only its front');
setup();const guardedMirror=place('light-reflect');walls.push({owner:'player',p:[0,0,-4],normal:[0,0,-1],width:8,height:5,hp:110,life:5});const blockedMissile=missile();assert.equal(arts.redirect(blockedMissile,actors,walls),true,'A closer blocking wall resolves before the mirror');assert.ok(blockedMissile.consumedByDefense);close(blockedMissile.damage,0);close(walls[0].hp,70);close(guardedMirror.hp,120);assert.equal(guardedMirror.reflections,0);
setup();place('light-barrier');place('light-lance');fire();arts.visuals(.1,[],actors);assert.ok(arts.optics[1].root.userData.lines.some(m=>m.visible));
const mock={element:'light',style:'jacob',target:[0,.08,-15],cloudPoint:[0,44,-15],blastRadius:3.5,age:.4,strikeTime:1.25,returnTime:.55,impactTime:1.8,phase:'charging',owner:'player'};
arts.visuals(.4,[mock],actors);assert.equal(arts.jacobs.get(mock).core.visible,false);mock.age=1.5;arts.visuals(1.5,[mock],actors);assert.equal(arts.jacobs.get(mock).core.visible,true);assert.ok(arts.jacobs.get(mock).core.scale.y>0&&arts.jacobs.get(mock).core.scale.y<44);
arts.reset();assert.equal(scene.children.length,0,'No cast objects or preview models remain');assert.equal(arts.optics.length+arts.pulses.length+arts.jacobs.size,0);assert.equal(arts.state().preview,null);
console.log('PASS: five new Light spells, exact lifetimes, straight/rainbow laser hits and misses, amplification, anchored/replaced optics, walls/shields/immunity, dormant and active dome DPS/bounces/escape/expiry, both owners, mirror laser/projectile reflection/front/expiry, Jacob descent visuals and reset.');
