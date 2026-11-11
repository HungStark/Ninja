const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{build}=require('esbuild'),{chromium}=require('playwright');
(async()=>{
 const out='test-results/projectile-defense-targeting';await fs.mkdir(out,{recursive:true});
 const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'defense-test-controls',setup(b){b.onLoad({filter:/[/\\]src[/\\]main\.js$/},async({path})=>{
  let source=await fs.readFile(path,'utf8');
  source=source.replace('function wallImpact(wall,point,result,shot){','function wallImpact(wall,point,result,shot){window.__wallHits.push({style:shot.style,absorbed:result.absorbed,remaining:result.remaining});');
  source=source.replace("if(testMode)window.__AN_HOA__.setAIEnabled=enabled=>{testAIDisabled=!enabled;};",`if(testMode){window.__AN_HOA__.setAIEnabled=enabled=>{testAIDisabled=!enabled;};window.__wallHits=[];window.__defenseTest={
   reset(){clearDragonView();clearMeteorView();clearWaveView();clearWindView();clearEarthView();shots.length=salvos.length=fields.length=particles.length=0;darkDomain.reset();natureArts.reset(walls);earthArts.reset(walls);lightArts.reset();windArts.reset();waterBubbles.reset();effects.reset();squad.reset();walls.length=0;window.__wallHits=[];player=new Fighter(10000);enemy=new Fighter(10000);player.autoRestore=enemy.autoRestore=false;camera.p=[0,1.72,12];moveTargetX=0;opponent.group.position.set(0,0,-24);camera.yaw=camera.pitch=0;won=false;},
   launch(id,owner='player',dir){const pos=owner==='player'?playerPos():enemyPos();return launch(spells.find(s=>s.id===id),owner,pos,dir||vnorm(vsub(owner==='player'?aimedEnemy().pos:playerPos(),pos)));},
   wall(hp,owner='enemy',z=-10,element='fire'){walls.push({owner,hp,life:100,p:[0,0,z],normal:[0,0,1],width:80,height:12,element});},
   prepare(id,owner='player'){const s=spells.find(s=>s.id===id),pos=owner==='player'?playerPos():enemyPos();if(s.requiresGarden){natureArts.cast(owner,spells.find(s=>s.style==='woodseed'),pos,[0,0,-1],windActors(),walls,shots);natureArts.advance(60,windActors(),undefined,walls,impact);for(const plant of natureArts.wood.garden(owner).plants.filter(p=>p.kind==='bamboo')){plant.p[2]=pos[2];plant.anchor.position.fromArray(plant.p);}}if(s.snowCost){natureArts.cast(owner,spells.find(s=>s.style==='snowstorm'),pos,[0,0,-1],windActors(),walls,shots);natureArts.weather(owner).amount=90;}},
   oneClone(owner='player',bull=false){const c=darkDomain.clones.find(c=>c.owner===owner);for(const other of [...darkDomain.clones])if(other!==c)darkDomain.removeClone(other);if(bull)darkDomain.upgradeClone(c,spells.find(s=>s.id==='dark-orb'));},
   move(id,x,z){if(id==='primary')opponent.group.position.set(x,0,z);else if(id==='player'){camera.p[0]=x;camera.p[2]=z;moveTargetX=x;}else squad.root(id).position.set(x,0,z);},
   squad(){const profile={id:'test-ninja',name:'Đối thủ kiểm tra',element:'fire',village:'fire',hp:10000,spellIds:['fire-volley'],sealDelay:1,initialDelay:100,restTime:100,weaponInterval:100};squad.start([profile,profile],new T.Vector3(0,0,-24));squad.root('squad-1').position.set(12,0,-24);},
   statuses(){return combatEnemies().map(a=>({id:a.id,hp:a.fighter.hp,burns:a.fighter.burns.length,static:a.fighter.staticStacks,control:a.fighter.lightningControlTime}));},
   stacks(){for(const a of combatEnemies())for(let i=0;i<3;i++){a.fighter.applyElementHit('fire',{damage:1},'volley');a.fighter.applyElementHit('lightning',{damage:1},'lance');}},
   clones(){return darkDomain.clones.map(c=>({targetId:c.targetId,target:c.target,damage:c.chargeDamage??c.damage,mode:c.mode,p:c.p}));},
   snapshot(){return {wallHits:window.__wallHits,walls:walls.map(w=>({hp:w.hp,owner:w.owner})),actors:this.statuses()};}
  };}`);
  return {contents:source,loader:'js'};
 });}}]});
 const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4388'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page,checkpoint='load';const errors=[];
 const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-4,`${a} != ${b}`);
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.stack));
  await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
  await page.goto('http://127.0.0.1:4388/?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();
  if(await page.locator('#practiceViewConfirm').isVisible()){await page.locator('[name=practiceView][value=first-person]').check();await page.locator('#practiceViewConfirm').click();}
  await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
  const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),reset=()=>page.evaluate(()=>__defenseTest.reset());
  const launch=(id,owner='player',dir)=>page.evaluate(({id,owner,dir})=>{__defenseTest.prepare(id,owner);return __defenseTest.launch(id,owner,dir);},{id,owner,dir});
  const inspect=()=>page.evaluate(()=>__defenseTest.snapshot()),wall=(hp,owner='enemy')=>page.evaluate(({hp,owner})=>__defenseTest.wall(hp,owner),{hp,owner});
  for(const owner of ['player','enemy'])for(const id of ['fire-volley','fire-lance','water-lance','water-volley','lightning-lance','lightning-volley','wind-orb','wind-volley','wood-volley','ice-lance','light-orb']){
   checkpoint=id+' '+owner+' wall';await reset();await wall(100000,owner==='player'?'enemy':'player');await launch(id,owner);await advance(5);
   const s=await inspect();assert.ok(s.wallHits.length>0||(id==='light-orb'&&s.walls.some(w=>w.hp<100000)),checkpoint+' must contact the defense');close((await state())[owner==='player'?'enemyHealth':'health'],10000);console.log('PASS: '+checkpoint);
  }
  for(const owner of ['player','enemy'])for(const bull of [false,true])for(const hp of [5,100]){
   checkpoint=owner+' '+(bull?'bull':'dog')+' residual '+hp;await reset();await launch('dark-orb',owner);await page.evaluate(({owner,bull})=>__defenseTest.oneClone(owner,bull),{owner,bull});await wall(hp,owner==='player'?'enemy':'player');await launch('dark-lance',owner,[1,0,0]);await advance(4);
   const s=await inspect(),damage=await page.evaluate(bull=>{const spell=SealGameCore.spells.find(s=>s.id==='dark-orb');return bull?spell.upgradeDamage:spell.damage;},bull);assert.ok(s.wallHits.length);close(s.wallHits[0].absorbed,Math.min(hp,damage));close(s.wallHits[0].remaining,Math.max(0,damage-hp));
   assert.equal((await state())[owner==='player'?'enemyHealth':'health']<10000,hp<damage);console.log('PASS: '+checkpoint);
  }
  for(const owner of ['player','enemy'])for(const hp of [100,250,300]){
   checkpoint=owner+' snowball residual '+hp;await reset();await wall(hp,owner==='player'?'enemy':'player');await launch('ice-orb',owner,[1,0,0]);let s=await state();assert.equal(s.natureArt.balls[0].targetId,owner==='player'?'primary':'player');assert.ok(Math.abs(s.natureArt.balls[0].direction[2])>.99);await advance(6);
   const info=await inspect();assert.equal(info.wallHits.length,1);close(info.wallHits[0].absorbed,Math.min(hp,250));close(info.wallHits[0].remaining,Math.max(0,250-hp));assert.equal((await state())[owner==='player'?'enemyHealth':'health']<10000,hp<250);console.log('PASS: '+checkpoint);
  }
  checkpoint='locked target in multi-enemy fight';await reset();await page.evaluate(()=>{__defenseTest.squad();__AN_HOA__.aimAt([12,1.72,-24]);});await launch('dark-orb');await page.evaluate(()=>__defenseTest.oneClone());await launch('dark-lance');await launch('ice-orb','player',[1,0,0]);
  assert.ok((await page.evaluate(()=>__defenseTest.clones())).every(c=>c.targetId==='squad-1'));assert.equal((await state()).natureArt.balls[0].targetId,'squad-1');
  await advance(.4);await page.evaluate(()=>{__defenseTest.move('squad-1',18,-24);__AN_HOA__.aimAt([0,1.72,-24]);});await advance(.8);
  const moving=await state();assert.ok(moving.natureArt.balls[0].direction[0]>0);assert.ok((await page.evaluate(()=>__defenseTest.clones())).every(c=>c.targetId==='squad-1'&&c.target[0]===18));await advance(5);
  let actors=(await inspect()).actors;close(actors.find(a=>a.id==='primary').hp,10000);assert.ok(actors.find(a=>a.id==='squad-1').hp<10000);await page.screenshot({path:out+'/selected-target.png'});
  checkpoint='ignite and discharge only affect selected target';await reset();await page.evaluate(()=>{__defenseTest.squad();__defenseTest.stacks();__AN_HOA__.aimAt([12,1.72,-24]);});
  assert.equal(await launch('fire-barrier'),true);actors=(await inspect()).actors;assert.equal(actors.find(a=>a.id==='primary').burns,3);assert.equal(actors.find(a=>a.id==='squad-1').burns,0);close(actors.find(a=>a.id==='primary').hp,10000);assert.ok(actors.find(a=>a.id==='squad-1').hp<10000);
  assert.equal(await launch('lightning-barrier'),true);actors=(await inspect()).actors;assert.equal(actors.find(a=>a.id==='primary').static,3);close(actors.find(a=>a.id==='primary').control,0);assert.equal(actors.find(a=>a.id==='squad-1').static,0);close(actors.find(a=>a.id==='squad-1').control,2);
  await page.evaluate(()=>__AN_HOA__.aimAt([12,1.72,-24]));assert.equal(await launch('fire-barrier'),false);assert.equal(await launch('lightning-barrier'),false);actors=(await inspect()).actors;assert.equal(actors.find(a=>a.id==='primary').burns,3);assert.equal(actors.find(a=>a.id==='primary').static,3);
  for(const id of ['water-tsunami','earth-reflect','earth-orb','earth-lance','earth-volley','fire-meteor','lightning-thunder','light-volley','dark-volley']){
   checkpoint=id+' exception';await reset();await wall(100000);if(id==='earth-lance'){await launch('earth-reflect');await advance(7);await page.evaluate(()=>window.__wallHits=[]);}await launch(id);await advance(10);assert.equal((await inspect()).wallHits.length,0,id+' remains exempt');
  }
  assert.deepEqual(errors,[]);console.log('PASS: actual game wall interception for both owners, residual damage, chosen target locks, live pursuit, single-target ignition/discharge and all trajectory exemptions.');
 }catch(error){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,message:error.message,state:await page?.evaluate(()=>__AN_HOA__.state()).catch(()=>null)},null,2));throw error;}
 finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
