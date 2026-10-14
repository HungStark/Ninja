const {chromium}=require('playwright');
(async()=>{
  const {runLightBrowserChecks}=await import('./light-browser.mjs');
  await runLightBrowserChecks({chromium,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',onProgress:console.log});
  console.log('PASS: redesigned Light spells in the browser; no shader errors.');
})().catch(e=>{console.error(e);process.exitCode=1;});
