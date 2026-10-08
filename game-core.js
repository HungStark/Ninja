/* Pure seal/chakra rules; shared by browser and smoke tests. */
(function(root){
 const keys=['q','w','e','r','a','s','d','f','z','x','c','v'];
 const spells=[
  {id:'ball',name:'Hỏa cầu',subtitle:'Một cầu lửa • sát thương lớn',sequence:['q','w','e','r'],cost:30,damage:70},
  {id:'breath',name:'Hỏa long',subtitle:'Phun lửa liên tục • tầm gần',sequence:['a','s','d','f'],cost:45,damage:18},
  {id:'phoenix',name:'Phượng hỏa',subtitle:'Năm đạn lửa • vùng rộng',sequence:['z','x','c','v'],cost:60,damage:35}
 ];
 class GameRules {
  constructor(){this.sequence=[];this.chakra=100;this.time=0;this.lastSeal=-Infinity;this.cooldown=0;this.casts=0;}
  tick(dt){this.time+=dt;this.chakra=Math.min(100,this.chakra+dt*9);this.cooldown=Math.max(0,this.cooldown-dt);if(this.sequence.length && this.time-this.lastSeal>7){this.sequence=[];return 'expired';}}
  ready(){return spells.find(s=>s.sequence.join('')===this.sequence.join(''));}
  seal(key){if(!keys.includes(key))return null;this.lastSeal=this.time;this.sequence.push(key);let candidates=spells.filter(s=>s.sequence.slice(0,this.sequence.length).join('')===this.sequence.join(''));if(!candidates.length){this.sequence=spells.some(s=>s.sequence[0]===key)?[key]:[];return {valid:false,ready:null};}return {valid:true,ready:this.ready()};}
  clear(){this.sequence=[];}
  cast(){const spell=this.ready();if(!spell)return {ok:false,reason:'sequence'};if(this.cooldown>0)return {ok:false,reason:'cooldown'};if(this.chakra<spell.cost)return {ok:false,reason:'chakra'};this.chakra-=spell.cost;this.cooldown=1.2;this.casts++;this.sequence=[];return {ok:true,spell};}
 }
 root.SealGameCore={keys,spells,GameRules};
})(globalThis);
