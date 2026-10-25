// Read through the UI normally, with spoken playback disabled for deterministic
// gameplay tests. Advancing during speech is covered by challenge-dialogue-browser.
module.exports=async function finishDialogue(page){
 await page.evaluate(()=>{__AN_HOA__.audio.configure({readDialogue:false});__AN_HOA__.advance(0);});
 for(let i=0;i<30;i++){
  const state=await page.evaluate(()=>__AN_HOA__.adventure().dialogue);
  if(!state.active||state.complete)return;
  await page.locator('#dialogNext').click();
 }
 throw Error('Dialogue did not finish');
};
