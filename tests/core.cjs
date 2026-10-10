const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..'), context = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'game-core.js'), 'utf8'), context);
const { GameRules, Fighter, spells, keys, elements, defaultLoadout, validateLoadout, intersectFireWall, meteorTarget } = context.SealGameCore;
assert.equal(new Set(keys).size, 12);
assert.equal(elements.length, 9); assert.equal(spells.length, 46);
assert.equal(new Set(spells.map(s => s.sequence.join(''))).size, 46);
for (const element of elements) {
  const list=spells.filter(s=>s.element===element.id);
  assert.equal(list.filter(s=>s.kind==='attack').length,element.id==='fire'?4:3); assert.equal(list.filter(s=>s.kind==='defense').length,2);
}
for (const spell of spells) {
  const r = new GameRules([spell.id]); spell.sequence.slice(0,-1).forEach(k => r.seal(k));
  assert.equal(r.ready(),undefined); assert.equal(r.cast().reason,'sequence');
  r.seal(spell.sequence.at(-1));
  assert.equal(r.ready().id,spell.id); assert.equal(r.cast().ok,true); assert.equal(r.chakra,100-spell.cost); assert.equal(r.casts,1); assert.equal(r.sequence.length,0);
}
assert.deepEqual(Array.from(new Set(spells.map(s=>s.sequence.length))).sort(),[2,3,4,5,6,8]);
for(const element of elements){
 const list=spells.filter(s=>s.element===element.id), attack=list.filter(s=>s.kind==='attack').sort((a,b)=>a.sequence.length-b.sequence.length);
 for(let i=1;i<attack.length;i++){assert.ok(attack[i].damage*attack[i].count>attack[i-1].damage*attack[i-1].count);assert.ok(attack[i].cost>attack[i-1].cost);}
 const volley=list.find(s=>s.style==='volley'), orb=list.find(s=>s.style==='orb'), chain=new GameRules([orb.id,volley.id]);
 volley.sequence.slice(0,2).forEach(k=>chain.seal(k));assert.equal(chain.ready().id,orb.id);assert.equal(chain.casts,0);assert.equal(chain.chakra,100);
 volley.sequence.slice(2,-1).forEach(k=>chain.seal(k));assert.equal(chain.ready(),undefined);assert.equal(chain.cast().reason,'sequence');
 chain.seal(volley.sequence.at(-1));assert.equal(chain.cast().spell.id,volley.id);
}
assert.equal(validateLoadout(defaultLoadout).ok,true);
assert.equal(validateLoadout(['fire-orb','water-lance','earth-barrier','ice-reflect','wood-barrier']).ok,true);
assert.equal(validateLoadout([]).ok,false); assert.equal(validateLoadout([...defaultLoadout,'wood-barrier']).ok,false);
assert.equal(validateLoadout(['fire-orb','fire-orb']).ok,false); assert.equal(validateLoadout(['unknown']).ok,false);
assert.equal(validateLoadout(['fire-orb','water-orb','light-orb','ice-orb','earth-barrier']).ok,false);
assert.equal(validateLoadout(['fire-orb','water-barrier','earth-barrier','ice-reflect','wood-barrier']).ok,false);
const r=new GameRules(); r.seal('q'); r.seal('e'); assert.equal(r.sequence.join(''),'e');
r.seal('q');r.seal('w');r.seal('a');assert.equal(r.sequence.join(''),'a');r.tick(7.1);assert.equal(r.sequence.length,0);
assert.equal(r.cast().reason,'sequence');
const missing=spells.find(s=>s.id==='dark-orb');missing.sequence.forEach(k=>r.seal(k));assert.equal(r.cast().ok,false);
assert.equal(r.setLoadout([]).ok,false); assert.equal(r.loadout.join(','),defaultLoadout.join(','));r.clear();
const orb=spells.find(s=>s.id==='fire-orb');orb.sequence.forEach(k=>r.seal(k));r.chakra=orb.cost-1;
assert.equal(r.cast().reason,'chakra');assert.equal(r.sequence.length,orb.sequence.length);r.tick(.2);assert.equal(r.cast().ok,true);
orb.sequence.forEach(k=>r.seal(k));assert.equal(r.cast().reason,'cooldown');r.tick(1.1);assert.equal(r.cast().reason,'chakra');r.tick(2);assert.equal(r.cast().ok,true);
const shield=spells.find(s=>s.id==='earth-barrier'), mirror=spells.find(s=>s.id==='ice-reflect');
const fighter=new Fighter();fighter.defend(shield);assert.equal(fighter.shield,78);fighter.receive(43);assert.equal(fighter.hp,220);assert.equal(fighter.shield,35);
fighter.receive(50);assert.equal(fighter.hp,205);fighter.tick(4.6);assert.equal(fighter.shield,0);
fighter.defend(mirror);assert.equal(fighter.receive(43).reflected,true);assert.equal(fighter.reflect,0);assert.equal(fighter.hp,205);
assert.equal(fighter.receive(43).damage,18);fighter.defend(mirror);assert.equal(fighter.receive(43,true).reflected,false);
fighter.tick(3);assert.equal(fighter.reflect,0);fighter.receive(999);assert.equal(fighter.hp,0);assert.equal(fighter.receive(99).damage,0);
const healed=new Fighter();healed.hp=210;healed.defend(spells.find(s=>s.id==='wood-barrier'));assert.equal(healed.hp,220);
const fire = spells.filter(s=>s.element==='fire');
assert.deepEqual(Array.from(fire.filter(s=>s.kind==='attack').map(s=>s.sequence.length)),[2,4,6,8]);
assert.deepEqual(Array.from(fire.filter(s=>s.kind==='defense').map(s=>s.sequence.length)),[3,5]);
const wall={p:[0,0,0],normal:[0,0,-1],width:7,height:4.2};
assert.ok(intersectFireWall([0,1.7,-10],[0,1.7,10],wall),'Swept collision catches fast shots');
assert.equal(intersectFireWall([4,1.7,-1],[4,1.7,1],wall),null,'Can shoot around the wall');
assert.equal(intersectFireWall([0,5,-1],[0,5,1],wall),null,'Can shoot over the wall');
assert.equal(intersectFireWall([0,1.7,-3],[0,1.7,-1],wall),null);
assert.ok(intersectFireWall([-3,1,0],[3,1,0],{...wall,normal:[1,0,0]}),'Wall rotates with aim');
assert.deepEqual(Array.from(meteorTarget([0,1.72,7],[0,0,-1])),[0,.08,-24]);
const downward=meteorTarget([0,1.72,7],[0,-.1,-.995]);assert.ok(downward[2]>-11&&downward[2]<-10);
const binary = fs.readFileSync(path.join(root, "assets/ninja-hands.glb"));
assert.equal(binary.readUInt32LE(0), 1179937895);
assert.equal(binary.readUInt32LE(4), 2);
assert.equal(binary.readUInt32LE(8), binary.length);
const jsonLength = binary.readUInt32LE(12), model = JSON.parse(binary.subarray(20, 20 + jsonLength).toString());
assert.equal(model.skins.length, 1);
assert.equal(model.skins[0].joints.length, 16);
assert.equal(model.animations.length, 12);
for (const animation of model.animations) assert.ok(animation.channels.length >= 12);
assert.ok(model.meshes.some((m) => m.primitives.some((p) => p.attributes.JOINTS_0 !== void 0 && p.attributes.WEIGHTS_0 !== void 0)));
for (const primitive of model.meshes.flatMap((m) => m.primitives)) assert.ok(primitive.attributes.NORMAL !== void 0);
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
assert.ok(pkg.dependencies.three);
assert.equal(pkg.version, "0.3.0");
const bundle = fs.readFileSync(path.join(root, "game.js"), "utf8");
assert.ok(bundle.length > 5e5);
assert.ok(!/<script[^>]+https?:/.test(fs.readFileSync(path.join(root, "index.html"), "utf8")));
console.log("PASS: 9 elements; 46 unique spells; six fire arts with 2/4/6/8 attack seals and 3/5 defense seals; total attack power progression; short-to-long combos; five-spell loadout; swept fire-wall collision and meteor targeting; shields/reflection/healing; cooldown and chakra; offline bundle and GLB.");
