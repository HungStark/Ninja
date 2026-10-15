const {chromium}=require('playwright');
(async()=>{
  const {runEarthBrowserChecks}=await import('./earth-browser.mjs');
  await runEarthBrowserChecks({chromium,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',onProgress:console.log});
})().catch(e=>{console.error(e);process.exitCode=1;});
