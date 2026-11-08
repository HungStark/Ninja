const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{chromium}=require('playwright'),{build}=require('esbuild');
(async()=>{
 const out='test-results/projectile-revision';await fs.mkdir(out,{recursive:true});
 const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'projectile-controls',setup(b){b.onLoad({filter:/[/\\]src[/\\]main\.js$/},async({path})=>{
  let source=await fs.readFile(path,'utf8');source="import {shurikenById} from './equipment.js';\n"+source;
  source=source.replace("if(testMode)window.__AN_HOA__.setAIEnabled=enabled=>{testAIDisabled=!enabled;};",`if(testMode){window.__AN_HOA__.setAIEnabled=enabled=>{testAIDisabled=!enabled;};window.__projectileTest={
    enemy(x,z){opponent.group.position.set(x,0,z);},player(x,z){camera.p[0]=x;camera.p[2]=z;moveTargetX=x;},
    clear(){shots.length=0;walls.length=0;fields.length=0;rules.clear();rules.cooldown=0;rules.cooldowns={};rules.chakra=rules.maxChakra;rules.shurikenCooldown=0;enemy.hp=player.hp=10000;enemy.invulnerableTime=player.invulnerableTime=0;},
    ready(id){clearDragonView();clearMeteorView();clearWaveView();clearWindView();clearEarthView();shots.length=walls.length=fields.length=0;natureArts.reset(walls);effects.reset();rules=new GameRules([id]);player=new Fighter(10000);enemy=new Fighter(10000);selected=0;activePose=-1;camera.p=[0,1.72,10];moveTargetX=0;opponent.group.position.set(0,0,-14);renderGuide();updateUI();},
    snow(owner,amount){if(!natureArts.weather(owner))natureArts.cast(owner,spells.find(s=>s.style==='snowstorm'),owner==='player'?playerPos():enemyPos(),[0,0,-1],windActors(),walls,shots);natureArts.weather(owner).amount=amount;updateUI();},
    weapon(id,owner='player'){launchShuriken(owner,{...SealGameCore.shuriken,...shurikenById(id),shurikenType:id},owner==='player'?playerPos():enemyPos(),owner==='player'?aim():enemyCastDirection());}
  };}`);
  return {contents:source,loader:'js'};
 });}}]});
 const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4352'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
  await page.goto('http://127.0.0.1:4352/?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();await page.waitForFunction(()=>__AN_HOA__.state().started);await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
  const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),move=(x,z)=>page.evaluate(({x,z})=>__projectileTest.enemy(x,z),{x,z});
  const prepare=async()=>{await page.evaluate(()=>{__projectileTest.clear();__projectileTest.player(0,10);__projectileTest.enemy(0,-14);__AN_HOA__.aimAt([0,1.72,-14]);});};
  const cast=async()=>{for(const k of await page.evaluate(()=>SealGameCore.spells.find(s=>s.id==='fire-volley').sequence))await page.keyboard.press(k);await page.keyboard.press('Space');};
  const volleys=async()=>(await state()).projectiles.filter(p=>p.owner==='player'&&p.element==='fire'&&p.style==='volley');
  console.log('CHECK: each salvo projectile snapshots the moving target at its own release');
  await prepare();await cast();let staged=await volleys();assert.equal(staged.length,3);assert.ok(staged.every(p=>p.phase==='staged'&&p.aimedTargetId==='primary'));
  await advance(.35);await move(2,-14);await page.evaluate(()=>__AN_HOA__.aimAt([-12,1.72,-14]));await advance(.16);let shots=await volleys(),first=shots.find(p=>p.rowIndex===0);assert.equal(first.phase,'flying');assert.deepEqual(first.target,[2,1.72,-14]);assert.ok(shots.filter(p=>p.rowIndex>0).every(p=>p.phase==='staged'));
  await move(4,-14);await advance(.1);shots=await volleys();const second=shots.find(p=>p.rowIndex===1);assert.deepEqual(second.target,[4,1.72,-14]);assert.deepEqual(shots.find(p=>p.rowIndex===0).target,first.target);
  await move(6,-14);await advance(.1);shots=await volleys();assert.deepEqual(shots.find(p=>p.rowIndex===2).target,[6,1.72,-14]);const launched=shots.map(p=>({i:p.rowIndex,v:p.velocity,target:p.target}));await move(-6,-14);await advance(.1);shots=await volleys();for(const s of shots){const old=launched.find(p=>p.i===s.rowIndex);assert.deepEqual(s.velocity,old.v,'no steering after launch');assert.deepEqual(s.target,old.target);}
  await page.screenshot({path:out+'/volley-flight.png'});await advance(2);assert.equal((await state()).enemyHealth,10000,'a target that moves after launch can dodge');
  console.log('CHECK: missing the initial aim never acquires a later target');
  await prepare();await page.evaluate(()=>__AN_HOA__.aimAt([8,1.72,-14]));await cast();staged=await volleys();assert.ok(staged.every(p=>p.aimedTargetId===null));const fixed=staged[0].target;await move(fixed[0],fixed[2]);await advance(.71);shots=await volleys();assert.ok(shots.every(p=>p.phase==='flying'));for(const s of shots)assert.deepEqual(s.target,fixed);
  console.log('CHECK: enemy volley also snapshots the moving player per projectile');
  await prepare();await page.evaluate(()=>__AN_HOA__.launchEnemy('fire-volley'));await page.evaluate(()=>__projectileTest.player(3,10));await advance(.51);const ai=(await state()).projectiles.filter(p=>p.owner==='enemy'&&p.element==='fire'&&p.style==='volley');assert.equal(ai.find(p=>p.rowIndex===0).aimedTargetId,'player');assert.deepEqual(ai.find(p=>p.rowIndex===0).target,[3,1.72,10]);
  console.log('CHECK: all four shuriken tiers glow and travel at 72 m/s');
  for(const owner of ['player','enemy'])for(const id of ['iron','steel','tempered','chakra']){
   await prepare();await page.evaluate(({id,owner})=>__projectileTest.weapon(id,owner),{id,owner});await advance(.001);const before=(await state()).projectiles.find(p=>p.style==='shuriken');assert.ok(before.energy&&before.visual.energy);assert.equal(Math.round(Math.hypot(...before.velocity)),72);await advance(.05);const after=(await state()).projectiles.find(p=>p.style==='shuriken');assert.ok(Math.abs(Math.hypot(...after.position.map((v,i)=>v-before.position[i]))-3.6)<1e-5);assert.notEqual(after.visual.energyRotation,0);if(owner==='player'&&id==='iron')await page.screenshot({path:out+'/iron-glow.png'});
  }
  await prepare();await page.evaluate(()=>__AN_HOA__.launchEnemy('fire-reflect',[0,1.72,-3],[0,0,1]));const hp=(await state()).walls[0].hp;await page.evaluate(()=>__projectileTest.weapon('iron'));await advance(.25);assert.equal((await state()).enemyHealth,10000);assert.equal((await state()).walls[0].hp,hp-2,'swept wall collision still blocks faster shuriken');
  console.log('CHECK: exact spell release and thunder impact times for both owners');
  const ready=async id=>{await page.evaluate(id=>__projectileTest.ready(id),id);await page.evaluate(()=>__AN_HOA__.aimAt([0,1.72,-14]));};
  const use=async(id,owner)=>{if(owner==='enemy'){await page.evaluate(id=>__AN_HOA__.launchEnemy(id),id);return;}for(const k of await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id))await page.keyboard.press(k);await page.keyboard.press('Space');};
  for(const owner of ['player','enemy']){
   for(const [id,delay] of [['fire-lance',.5],['lightning-volley',.5],['water-volley',.5],['water-tsunami',1]]){
    await ready(id);await use(id,owner);const shot=async()=>(await state()).projectiles.find(p=>p.owner===owner);
    await advance(delay-.001);assert.notEqual((await shot()).phase,'flying',id+' must still be forming');
    await advance(.001);assert.equal((await shot()).phase,'flying',id+' releases at '+delay);await advance(.01);assert.ok((await shot()).motionDistance>0);
   }
   await ready('ice-lance');await use('ice-lance',owner);let crystal=(await state()).projectiles[0];assert.equal(crystal.phase,'flying');const crystalStart=crystal.position;await advance(.01);assert.notDeepEqual((await state()).projectiles[0].position,crystalStart);assert.equal((await state()).natureArt.iceGather.length,0);
   await ready('lightning-thunder');await use('lightning-thunder',owner);await advance(1.499);assert.equal((await state()).projectiles[0].hitTarget,false);await advance(.001);assert.equal((await state()).projectiles[0].hitTarget,true);assert.equal((await state()).projectiles[0].phase,'striking');
   await ready('ice-orb');await page.evaluate(owner=>__projectileTest.snow(owner,34.99),owner);await use('ice-orb',owner);assert.equal((await state()).natureArt.balls.length,0,'34.99 snow is insufficient');await page.evaluate(owner=>__projectileTest.snow(owner,35),owner);
   if(owner==='player')await page.keyboard.press('Space');else await use('ice-orb',owner);
   let snow=(await state()).natureArt;assert.equal(snow.balls.length,1);assert.equal(snow.snow.find(s=>s.owner===owner).amount,0);const origin=snow.balls[0].position;
   await advance(1.999);assert.equal((await state()).natureArt.balls[0].phase,'gathering');assert.deepEqual((await state()).natureArt.balls[0].position,origin);await advance(.001);assert.equal((await state()).natureArt.balls[0].phase,'rolling');await advance(.01);assert.notDeepEqual((await state()).natureArt.balls[0].position,origin);
  }
  assert.deepEqual(errors,[]);console.log('PASS: per-bullet release targeting, original target identity, fixed-point misses, real dodges, AI parity, all four glowing tiers on both sides, 72m/s shuriken, swept wall collision, exact release/impact timing, instant ice crystals and 35-snow/2s gathering.');
 }catch(error){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({message:error.message,state:await page?.evaluate(()=>__AN_HOA__.state()).catch(()=>null)},null,2));throw error;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
