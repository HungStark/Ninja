const fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{build}=require('esbuild'),{chromium}=require('playwright');
(async()=>{
 const label=process.argv[2]||'after',server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4443'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:915,height:412}});await page.route('**/perf.html',r=>r.fulfill({contentType:'text/html',body:'<html></html>'}));await page.goto('http://127.0.0.1:4443/perf.html');
  const bundle=await build({entryPoints:['tests/performance-five-fixture.mjs'],bundle:true,write:false,format:'iife'});await page.addScriptTag({content:bundle.outputFiles[0].text});const cycles=await page.evaluate(()=>run());const assert=require('node:assert/strict');for(let i=2;i<cycles.length;i++){assert.equal(cycles[i].liveBuffers,cycles[i-2].liveBuffers,'GPU buffers must plateau on repeated village visits');assert.equal(cycles[i].liveTextures,cycles[i-2].liveTextures,'GPU textures must plateau on repeated village visits');}
  await fs.mkdir('test-results/five-directions',{recursive:true});await fs.writeFile('test-results/five-directions/world-'+label+'.json',JSON.stringify(cycles,null,2));
  const capture=await page.evaluate(()=>({pixels:firstPixels,image:firstImage}));await fs.writeFile('test-results/five-directions/world-'+label+'.rgba',Buffer.from(capture.pixels,'base64'));await fs.writeFile('test-results/five-directions/world-'+label+'.png',Buffer.from(capture.image.split(',')[1],'base64'));
  console.log(JSON.stringify(cycles.map(({largest,...rest})=>rest)));
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
