const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {spawn}=require('node:child_process');
const {build}=require('esbuild');
const {chromium}=require('playwright');

(async()=>{
  const {campaignFixtures}=await import('./campaign-fixtures.mjs');
  const fixtures=campaignFixtures();
  const water=structuredClone(fixtures.complete);Object.assign(water,{village:'water',position:[0,7],interior:null,surface:null,elevation:null});
  const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'gate-review',setup(b){b.onLoad({filter:/[/\\]src[/\\]adventure\.js$/},async({path})=>({contents:(await fs.readFile(path,'utf8')).replace('const world=createAdventureScene();','const world=window.__gateWorld=createAdventureScene();'),loader:'js'}));}}]});
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4394'},windowsHide:true,stdio:['ignore','pipe','pipe']});
  let browser;
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));
    await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
    await page.addInitScript(water=>{const pending=sessionStorage.getItem('gate-pending');if(pending){localStorage.setItem('anhoa-adventure-v1',pending);sessionStorage.removeItem('gate-pending');}else if(!localStorage.getItem('anhoa-adventure-v1'))localStorage.setItem('anhoa-adventure-v1',JSON.stringify(water));},water);
    const ready=async()=>{await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#continueJourney').click();await page.waitForFunction(()=>!__AN_HOA__.adventure().loading&&__AN_HOA__.adventure().phase==='explore');await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));};
    const state=()=>page.evaluate(()=>__AN_HOA__.adventure());
    const walk=async id=>{
      await page.evaluate(id=>{
        const w=__gateWorld,g=w.gates.find(x=>x.id===id),x=g.x-Math.sin(g.yaw)*4,z=g.z-Math.cos(g.yaw)*4;
        w.hero.root.position.set(x,w.heroHeightAt(x,z),z);w.followHeading(g.yaw,4);w.faceView();__AN_HOA__.advance(.08);
      },id);
      await page.locator('#world').focus();await page.keyboard.down('w');await page.evaluate(()=>__AN_HOA__.advance(1.25));await page.keyboard.up('w');
    };
    const landed=async(id,from)=>{
      await page.waitForFunction(id=>__AN_HOA__.adventure().save.village===id&&!__AN_HOA__.adventure().loading,id);
      const inside=await page.evaluate(from=>{const w=__gateWorld,p=w.hero.root.position,g=w.gates.find(x=>x.id===from);return (g.x-p.x)*Math.sin(g.yaw)+(g.z-p.z)*Math.cos(g.yaw);},from);
      assert.ok(inside>=6.5&&inside<=9.5,'arrival is inside the matching return gate');
      await page.evaluate(()=>__AN_HOA__.advance(.55));assert.equal((await state()).save.village,id,'arrival does not return immediately');
    };
    await page.goto('http://127.0.0.1:4394/?test=1&adventure=1');await ready();
    await walk('nameless');await landed('nameless','water');
    await walk('water');await landed('water','nameless');
    await walk('wind');await landed('wind','water');
    const locked=structuredClone(fixtures.opening);await page.evaluate(save=>sessionStorage.setItem('gate-pending',JSON.stringify(save)),locked);
    await page.reload();await ready();await walk('water');
    assert.equal((await state()).save.village,'nameless');await page.waitForSelector('#journeyDialog:not([hidden])');assert.match(await page.locator('#dialogKicker').innerText(),/CHƯA MỞ/);
    assert.deepEqual(errors,[]);
    console.log('PASS: walk through gates without E, arrive inside the reciprocal gate, no immediate bounce back, and locked roads still respect story progression.');
  }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
