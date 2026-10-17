const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
  const {riverAt}=await import('../src/adventure-world.js');
  const {createAdventureScene}=await import('../src/adventure-scene.js');
  const {newJourney}=await import('../src/adventure-data.js');globalThis.innerWidth=1440;globalThis.innerHeight=960;
  const model=createAdventureScene(),output='test-results/landscape';await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  let page,checkpoint='load';
  try{
    page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.addInitScript(()=>{const preview=sessionStorage.getItem('landscape-preview');if(preview){localStorage.setItem('anhoa-adventure-v1',preview);sessionStorage.removeItem('landscape-preview');}});
    await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#heroForm button[type=submit]').click();
    const state=()=>page.evaluate(()=>__AN_HOA__.adventure()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
    const visit=async(id,position,name)=>{checkpoint=name;const save=(await state()).save;save.village=id;save.position=position;await page.evaluate(save=>sessionStorage.setItem('landscape-preview',JSON.stringify(save)),save);await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));await page.locator('#continueJourney').click();await advance(.3);assert.equal((await state()).save.village,id);assert.ok(Math.hypot((await state()).position[0]-position[0],(await state()).position[1]-position[1])<.1,'the preview position is unobstructed');
      await page.evaluate(()=>document.querySelector('#journeyHud').style.visibility='hidden');await page.mouse.move(800,450);await page.mouse.wheel(0,575);await advance(.5);await page.screenshot({path:`${output}/${name}.png`});
      const camera=(await state()).camera;assert.ok(camera.position.every(Number.isFinite));
    };
    const cameraClear=(x,z)=>{for(let k=0;k<=7;k++)if(model.blocked(x+k*.55/7,z+k))return false;return true;};
    for(const id of ['nameless','water','fire','wind','ice']){const save=newJourney();save.village=id;model.load(id,save);const house=model.scene.getObjectsByProperty('name','village-house').find(h=>cameraClear(h.position.x,h.position.z+h.userData.footprint.d/2+5));assert.ok(house);await visit(id,[house.position.x,house.position.z+house.userData.footprint.d/2+5],`${id}-house`);
      const r=riverAt(id,15),bank=[r.x+r.width+r.bank+1,15];let viewpoint;for(let k=0;k<160&&!viewpoint;k++){const a=k*2.4,d=Math.floor(k/8)*.6,p=[bank[0]+Math.sin(a)*d,bank[1]+Math.cos(a)*d];if(cameraClear(...p))viewpoint=p;}assert.ok(viewpoint);await visit(id,viewpoint,`${id}-river`);
    }
    // Walk an actual crossing through the normal exploration route/collision system.
    checkpoint='bridge traversal';const save=newJourney();model.load('nameless',save);const bridge=model.bridges[0],start=[bridge.x-bridge.dx*(bridge.half+1),bridge.z-bridge.dz*(bridge.half+1)],end=[bridge.x+bridge.dx*(bridge.half+1),bridge.z+bridge.dz*(bridge.half+1)];await visit('nameless',start,'bridge-approach');await page.evaluate(p=>__AN_HOA__.explore.moveTo(p),end);await advance(15);const arrived=await state();assert.ok(Math.hypot(arrived.position[0]-end[0],arrived.position[1]-end[1])<.1);assert.deepEqual(errors,[]);
    console.log('PASS: five villages render repaired houses and layered river scenery without browser errors; an actual bridge route remains walkable.');
  }catch(e){if(page){await page.screenshot({path:`${output}/failure.png`}).catch(()=>{});await fs.writeFile(`${output}/failure.json`,JSON.stringify({checkpoint,message:e.message,state:await page.evaluate(()=>__AN_HOA__?.adventure()).catch(()=>null)},null,2));}throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
