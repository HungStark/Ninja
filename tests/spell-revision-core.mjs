import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {EarthArts} from '../src/earth-arts.js';
import {NatureArts} from '../src/nature-arts.js';
import {LightArts} from '../src/light-arts.js';
import {DarkDomain} from '../src/dark-domain.js';
const {spells,Fighter,GameRules,intersectFireWall}=SealGameCore,spell=id=>spells.find(s=>s.id===id),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,a+' != '+b);
const scene=new T.Scene(),earth=new EarthArts(scene),nature=new NatureArts(scene),light=new LightArts(scene,intersectFireWall);
let walls=[],actors,hits=[];
function setup(){earth.reset(walls);nature.reset(walls);light.reset();walls=[];hits=[];actors=[{owner:'player',pos:[0,1.72,7],dir:[0,0,-1],fighter:new Fighter(1000)},{owner:'enemy',pos:[0,1.72,-24],dir:[0,0,1],fighter:new Fighter(1000)}];}
const damage=(s,p)=>{hits.push(s.damage);return actors.find(a=>a.owner!==s.owner).fighter.receive(s.damage,true);};
const castEarth=id=>earth.cast('player',spell(id),actors[0].pos,actors[0].dir,actors,walls);
function earthStep(t){for(let age=0;age<t-1e-8;age+=1/60){const dt=Math.min(1/60,t-age);earth.advance(dt,actors,walls,damage,(owner,p)=>actors.find(a=>a.owner===owner).pos=[...p]);for(const a of actors)a.pos[1]=1.72+earth.floor(a.owner,a.pos[0],a.pos[2]);}}
setup();castEarth('earth-volley');earthStep(5.1);assert.deepEqual(hits,[20,20,20,20,20]);close(actors[1].fighter.hp,900);
setup();const wall=castEarth('earth-barrier');close(wall.hp,130);walls[0].hp-=50;assert.ok(walls.every(w=>w.hp===80));
setup();const gravity=castEarth('earth-reflect');earthStep(gravity.landTime+.01);assert.deepEqual(hits,[60,75]);close(actors[1].fighter.hp,865);assert.equal(actors[1].fighter.earthControlTime,0);const spikes=castEarth('earth-lance');assert.ok(spikes);earthStep(.3);assert.deepEqual(hits,[60,75,50]);
assert.equal(spell('light-volley').damage,150);assert.equal(spell('earth-reflect').damage,135);
const element={innerHTML:'',style:{setProperty(){}},classList:{toggle(){},remove(){}}};globalThis.document={getElementById:()=>element,querySelector:()=>element,body:element};
const domain=new DarkDomain({scene,environment:[]});
for(const active of [false,true])for(const owner of ['player','enemy']){
 setup();domain.reset();if(active)domain.sustain(owner);const caster=actors.find(a=>a.owner===owner),victim=actors.find(a=>a.owner!==owner),rules=new GameRules(['dark-volley']);spell('dark-volley').sequence.forEach(k=>rules.seal(k));assert.equal(rules.cast().ok,true,'Elephant is available outside a domain');
 assert.equal(domain.cast(spell('dark-volley'),owner,caster.pos,caster.dir,victim.pos,caster.fighter,victim),true);domain.updateDomainArts(.71,actors);close(victim.fighter.hp,910);close(victim.fighter.darkControlTime,active?2:0);domain.updateDomainArts(.45,actors);assert.equal(domain.viewDepth(victim.owner)<-2,active);if(active){domain.updateSubmergeView(domain.viewDepth(victim.owner),-1);assert.ok(domain.submerge.value>.8);assert.equal(domain.ink.transparent,true);}domain.updateDomainArts(2,actors);assert.equal(victim.fighter.darkControlTime,0);domain.reset();
}
setup();const ball={owner:'player',phase:'gathering',p:[0,4.8,-8],spell:spell('ice-orb')};nature.balls.push(ball);
const incoming=(owner='enemy',x=0)=>({owner,old:[x,1.72,-24],p:[x,1.72,7],size:.2,damage:999,life:5});
assert.equal(nature.intercept(incoming()),false,'Snow gathering has no interception');ball.phase='rolling';
for(const style of ['orb','dragon','boat','meteor','thunder','jacob','lance','windslash','tornado','icebind','bambooleaf','shadowstrike','lightray','tsunami']){const shot={...incoming(),style,width:12};assert.equal(nature.intercept(shot),true,style);assert.equal(shot.consumedByDefense,true);assert.equal(shot.life,0);}
assert.equal(nature.intercept(incoming('player')),false,'Own attacks pass');assert.equal(nature.intercept(incoming('enemy',20)),false,'Off-axis attacks miss');const high=incoming();high.old[1]=high.p[1]=20;assert.equal(nature.intercept(high),false,'Attacks passing above are not blocked');
const beam=light.fire('enemy',spell('light-orb'),[0,1.72,-24],[0,0,1]);light.advance(.1,actors,walls,damage,s=>nature.intercept(s));assert.equal(hits.length,0,'Laser stops at snow before reaching the player');assert.ok(beam.path[0].end[2]<7);
walls.push({owner:'player',p:[0,0,2],normal:[0,0,-1],width:8,height:5,hp:100,life:5});light.fire('enemy',spell('light-orb'),[0,1.72,-24],[0,0,1]);light.advance(.1,actors,walls,damage,s=>nature.intercept(s));close(walls[0].hp,100,'Snow stops the ray before a defense behind it');
actors[0].pos=[0,1.72,-20];light.fire('enemy',spell('light-orb'),[0,1.72,-24],[0,0,1]);light.advance(.1,actors,walls,damage,s=>nature.intercept(s));close(actors[0].fighter.hp,974,'A target in front of the snowball still gets hit');actors[0].pos=[0,1.72,7];
const caster=actors[1],victim=actors[0];domain.cast(spell('dark-volley'),'enemy',caster.pos,caster.dir,[0,1.72,-8],caster.fighter,victim);domain.updateDomainArts(.71,actors,undefined,s=>nature.intercept(s));assert.equal(domain.bindings.length,0,'Falling elephant is stopped by rolling snow');
ball.phase='carrying';assert.equal(nature.intercept(incoming()),true,'Rolling with a buried victim still blocks');nature.balls=[];domain.reset();setup();
for(const [id,cost] of [['ice-lance',1],['ice-volley',2],['ice-barrier',2]])assert.equal(spell(id).snowCost,cost);
assert.equal(new Set(spells.map(s=>s.id)).size,45);assert.equal(new Set(spells.map(s=>s.name)).size,45);
console.log('PASS: revised earth damage, shared wall durability, gravity/spike combo, Jacob damage, both elephant owners inside/outside domains, submerged view and release, swept snowball blocking across projectile/laser/summon styles with misses and ownership.');
