const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
  const {createAdventureScene}=await import('../src/adventure-scene.js'),{newJourney,readJourney,findPath}=await import('../src/adventure-data.js'),{REGIONS}=await import('../src/adventure-world.js');
  globalThis.innerWidth=1440;globalThis.innerHeight=960;
  const model=createAdventureScene();model.load('nameless',newJourney());const cemetery=REGIONS.nameless.zones.find(z=>z.id==='war-cemetery');
  for(const i of model.interactives)assert.ok(findPath([0,7],[i.x,i.z],model.blocked).length,`a route remains open to ${i.kind}/${i.id}`);
  const houses=model.scene.getObjectsByProperty('name','village-house');assert.ok(houses.length>=15);
  for(const house of houses){assert.equal(house.userData.style,'abandoned-thatch');assert.ok(Math.hypot(house.position.x-cemetery.x,house.position.z-cemetery.z)>12+Math.hypot(house.userData.footprint.w,house.userData.footprint.d)/2);}
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),output='test-results/nameless-ruins';await fs.mkdir(output,{recursive:true});let page,checkpoint='load';
  try{
    page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.addInitScript(()=>{const s=sessionStorage.getItem('ruins-preview');if(s){localStorage.setItem('anhoa-adventure-v1',s);sessionStorage.removeItem('ruins-preview');}});
    const state=()=>page.evaluate(()=>__AN_HOA__.adventure()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
    await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#heroForm button[type=submit]').click();await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));
    checkpoint='discover cemetery';await page.evaluate(()=>__AN_HOA__.explore.interact('landmark','war-cemetery'));await advance(25);let s=await state();assert.equal(s.phase,'explore');assert.ok(s.save.discoveries.includes('nameless:war-cemetery'));assert.ok(Math.hypot(s.position[0]-cemetery.x,s.position[1]-cemetery.z)<3);
    await page.keyboard.press('b');assert.ok(await page.locator('[data-zone="war-cemetery"]').evaluate(e=>e.classList.contains('found')));await page.screenshot({path:`${output}/cemetery-journal.png`});await page.keyboard.press('b');
    await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#continueJourney').click();s=await state();assert.ok(s.save.discoveries.includes('nameless:war-cemetery'));assert.ok(readJourney({getItem:()=>JSON.stringify(s.save)}).discoveries.includes('nameless:war-cemetery'));
    const visit=async(position,name,yaw=0,pitch=.3)=>{
      checkpoint=name;const save=(await state()).save;save.position=position;await page.evaluate(s=>sessionStorage.setItem('ruins-preview',JSON.stringify(s)),save);await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));await page.locator('#continueJourney').click();await advance(.3);const s=await state();assert.ok(Math.hypot(s.position[0]-position[0],s.position[1]-position[1])<.1,'preview position is clear');
      await page.evaluate(()=>document.querySelector('#journeyHud').style.visibility='hidden');await page.mouse.move(800,450);await page.mouse.wheel(0,575);await page.mouse.down({button:'right'});await page.mouse.move(800-yaw/.005,450+(pitch-.2)/.003,{steps:10});await page.mouse.up({button:'right'});await advance(.4);await page.screenshot({path:`${output}/${name}.png`});
    };
    const clear=(x,z)=>{for(let k=0;k<=8;k++)if(model.blocked(x+k*.55/8,z+k))return false;return true;};
    const house=houses.filter(h=>h.userData.footprint.w<6).find(h=>clear(h.position.x,h.position.z+h.userData.footprint.d/2+5));assert.ok(house);await visit([house.position.x,house.position.z+house.userData.footprint.d/2+5],'thatched-cottage');
    await visit([0,7],'village-aftermath',-.55,.25);
    const yaw=Math.atan2(-cemetery.x,-cemetery.z),front=[cemetery.x+Math.sin(yaw)*15,cemetery.z+Math.cos(yaw)*15];await visit(front,'cemetery-approach',yaw,.45);
    const b=model.bridges[0],start=[b.x-b.dx*(b.half+1),b.z-b.dz*(b.half+1)],end=[b.x+b.dx*(b.half+1),b.z+b.dz*(b.half+1)];await visit(start,'weathered-bridge',Math.atan2(-b.dx,-b.dz),.32);await page.evaluate(p=>__AN_HOA__.explore.moveTo(p),end);await advance(15);s=await state();assert.ok(Math.hypot(s.position[0]-end[0],s.position[1]-end[1])<.1,'damaged bridge retains a passable deck');assert.deepEqual(errors,[]);
    console.log('PASS: Nameless NPCs/gates and cemetery remain reachable; all homes use ruined thatch, graves stay clear of houses, cemetery discovery/journal/reload persist, damaged bridge is passable, and four views render without browser errors.');
  }catch(e){if(page){await page.screenshot({path:`${output}/failure.png`}).catch(()=>{});await fs.writeFile(`${output}/failure.json`,JSON.stringify({checkpoint,message:e.message,state:await page.evaluate(()=>__AN_HOA__?.adventure()).catch(()=>null)},null,2));}e.message=checkpoint+': '+e.message;throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
