const {chromium}=require('playwright');
(async()=>{const {runNatureBrowserChecks}=await import('./nature-browser.mjs');await runNatureBrowserChecks({chromium,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',onProgress:console.log});})().catch(e=>{console.error(e);process.exitCode=1;});
