export const FLASK_UPGRADE_PRICES=[100,200,350,550];
export const newFlask=()=>({owned:false,upgrades:0,charges:0});
export function flaskState(save){const f=save.flask||newFlask(),upgrades=f.upgrades||0;return {...f,level:upgrades+1,maxCharges:1+(upgrades>=1?1:0)+(upgrades>=3?1:0),fraction:upgrades>=4?.5:upgrades>=2?.375:.25,nextPrice:FLASK_UPGRADE_PRICES[upgrades]??null};}
export function grantFlask(save){if(save.flask?.owned)return false;save.flask={owned:true,upgrades:0,charges:1};return true;}
export function readFlask(raw,received=false){const upgrades=Number.isInteger(raw?.upgrades)?Math.max(0,Math.min(4,raw.upgrades)):0,owned=raw?.owned===true||received,max=1+(upgrades>=1?1:0)+(upgrades>=3?1:0);return {owned,upgrades,charges:owned?(Number.isInteger(raw?.charges)?Math.max(0,Math.min(max,raw.charges)):max):0};}
export function refillFlask(save){const f=flaskState(save);if(!f.owned)return false;save.flask.charges=f.maxCharges;return true;}
export function useFlask(save,hp,maxHp){const f=flaskState(save);if(!f.owned||f.charges<=0||hp<=0||hp>=maxHp)return {ok:false};const heal=Math.min(maxHp-hp,maxHp*f.fraction);save.flask.charges--;return {ok:true,heal,hp:hp+heal};}
export function upgradeFlask(save){const f=flaskState(save);if(!f.owned)return {ok:false,reason:'Hãy nhận bình thuốc từ trưởng làng Vô Danh trước.'};if(f.nextPrice===null)return {ok:false,reason:'Bình thuốc đã đạt cấp tối đa.'};if(save.gold<f.nextPrice)return {ok:false,reason:'Không đủ xu.'};save.gold-=f.nextPrice;save.flask.upgrades++;refillFlask(save);return {ok:true};}
