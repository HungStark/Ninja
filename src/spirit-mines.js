export const ORE_RESPAWN_MS=120000,ORE_SWING_COOLDOWN=.45;
export const SPIRIT_ORES=[
 {id:'earth-ore-1',x:-13,z:-22},{id:'earth-ore-2',x:14,z:-25},{id:'earth-ore-3',x:-15,z:-43},{id:'earth-ore-4',x:14,z:-48},{id:'earth-ore-5',x:0,z:-52}
];
export function readMines(raw){const clean={};for(const ore of SPIRIT_ORES){const value=raw?.[ore.id];if(value&&Number.isInteger(value.hits)&&value.hits>=0&&value.hits<=5)clean[ore.id]={hits:value.hits,readyAt:Number.isFinite(value.readyAt)&&value.readyAt>=0?value.readyAt:0};}return clean;}
export function oreState(save,id,now=Date.now()){const raw=save.mines?.[id]||{hits:0,readyAt:0};return raw.hits===5&&raw.readyAt<=now?{hits:0,readyAt:0}:{...raw};}
export function strikeOre(save,id,now=Date.now()){if(save.interior?.id!=='earth-cave'||!SPIRIT_ORES.some(o=>o.id===id))return {ok:false};const ore=oreState(save,id,now);if(ore.hits>=5)return {ok:false};ore.hits++;ore.readyAt=ore.hits===5?now+ORE_RESPAWN_MS:0;save.mines??={};save.mines[id]=ore;const reward=2+(ore.hits===5?10:0);save.gold+=reward;return {ok:true,reward,broken:ore.hits===5,...ore};}
