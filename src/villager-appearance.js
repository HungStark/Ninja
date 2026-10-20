const cultures={
  nameless:{coat:'#75664e',accent:'#a89570',job:'elder',skin:'#bc9475'},
  water:{coat:'#456d78',accent:'#b7b994',job:'boatman',skin:'#b88560'},
  fire:{coat:'#794c3a',accent:'#dba264',job:'smith',skin:'#b57b55'},
  lightning:{coat:'#485773',accent:'#c8ac72',job:'engineer',skin:'#c4a080'},
  earth:{coat:'#817052',accent:'#c8ae7c',job:'miner',skin:'#ab7c59'},
  wind:{coat:'#658078',accent:'#d5c6a0',job:'farmer',skin:'#d6ac87'},
  light:{coat:'#d8d0ae',accent:'#b58c44',job:'priest',skin:'#c79d7e'},
  ice:{coat:'#7b8b9c',accent:'#dedbc9',job:'elder',skin:'#d9bba4'},
  wood:{coat:'#526748',accent:'#b7a47b',job:'ranger',skin:'#b78a67'},
  dark:{coat:'#554c67',accent:'#baa58b',job:'lantern',skin:'#c2a28e'}
};
const hairColors=['#342d29','#584638','#827665','#252c2f'];
const variants={
  'nameless-lan':{job:'elder',female:true,hairStyle:'bun',hair:'#c1bbaa',height:2.65,width:.93,age:'elder',shawl:true},
  'nameless-sen':{job:'healer',female:false,hairStyle:'short',height:2.95,width:1.02},
  'nameless-trac':{age:'elder',hair:'#c6c5b3',beard:'long',hairStyle:'bald',hat:'conical',height:3.04},
  'fire-khoi':{job:'smith',height:3.15,width:1.3,hairStyle:'short',beard:'short',skin:'#a96e4d',hat:'band'},
  'fire-dan':{female:true,hairStyle:'ponytail',height:2.88},
  'fire-xich':{height:3.32,width:1.1,hair:'#a97953',hairStyle:'long',beard:'short'},
  'water-chau':{job:'boatman',height:2.94,width:1.13,hat:'conical',beard:'short',hairStyle:'short'},
  'water-ha':{female:true,hairStyle:'bun',height:2.83,width:.94},
  'water-luu':{age:'elder',job:'sage',hat:'conical',hair:'#c6c4b5',beard:'long',height:3.18,width:.88},
  'lightning-kiet':{job:'engineer',height:3.08,width:.95,hairStyle:'short',hat:'goggles'},
  'lightning-lam':{female:false,hairStyle:'short',height:3.1,width:1.08},
  'lightning-chan':{height:3.35,width:1.15,hairStyle:'ponytail',hair:'#292a36',age:'adult'},
  'earth-son':{job:'miner',height:2.86,width:1.3,hat:'helmet',beard:'short'},
  'earth-quynh':{female:true,hairStyle:'braid',height:3.02,width:1.04,hat:'band'},
  'earth-nham':{age:'elder',height:2.82,width:1.14,hairStyle:'bald',beard:'long',hair:'#beb29a'},
  'wind-vu':{job:'farmer',height:3.17,width:.92,hat:'straw',beard:'short'},
  'wind-may':{job:'tailor',female:true,hairStyle:'bun',height:2.78,width:1.04},
  'wind-thanh':{height:3.28,width:.86,hairStyle:'ponytail',hair:'#353c3d',age:'adult'},
  'light-minh':{job:'priest',height:3.2,width:.98,hairStyle:'bald',beard:'short',hair:'#bcb8a3'},
  'light-hue':{female:true,hairStyle:'braid',height:2.93,width:.96},
  'light-khai':{height:3.12,width:.93,hairStyle:'short',hat:'goggles',age:'adult'},
  'ice-bac':{job:'elder',age:'elder',height:2.92,width:1.24,hair:'#c8cbd1',beard:'long',hat:'fur'},
  'ice-nhi':{female:true,hairStyle:'braid',hat:'fur',height:2.86},
  'ice-tuyet':{female:true,height:3.22,width:.88,hairStyle:'long',hair:'#dedde1',age:'adult'},
  'wood-loc':{job:'ranger',height:3.2,width:1.14,beard:'short',hairStyle:'short'},
  'wood-thao':{female:true,hairStyle:'bun',height:2.82,width:.92},
  'wood-truc':{age:'elder',height:3.31,width:.83,hairStyle:'bun',hair:'#b0baa2',beard:'long'},
  'dark-da':{job:'lantern',female:true,age:'elder',height:2.7,width:1.02,hairStyle:'long',hair:'#c1bac9',hat:'hood'},
  'dark-yen':{female:true,hairStyle:'long',height:2.91,width:.88},
  'dark-mac':{height:3.34,width:.9,hairStyle:'long',hair:'#252635',age:'adult',hat:'hood'}
};

export function villagerAppearance(villageId,person={kind:'chief'},index=0){
  const c=cultures[villageId]||cultures.nameless,kind=person.kind||'lore',id=person.id||kind;
  const seed=Array.from(villageId+':'+id).reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,7);
  const p={id,village:villageId,job:kind==='chief'?'elder':kind==='mentor'?'sage':kind==='healer'?'healer':kind==='envoy'?'envoy':kind==='leader'?'leader':c.job,
    coat:c.coat,accent:c.accent,skin:c.skin,hair:hairColors[seed%hairColors.length],hairStyle:'short',height:2.85+(seed%6)*.07,width:.91+(seed%4)*.07,
    age:kind==='chief'?'elder':'adult',female:false,beard:null,hat:null,variant:seed%5};
  if(kind==='chief')Object.assign(p,{hair:'#b8b5a3',hairStyle:seed%2?'bald':'short',beard:villageId==='dark'?null:'short',female:villageId==='dark',hat:villageId==='water'?'conical':villageId==='ice'?'fur':null});
  if(kind==='healer')Object.assign(p,{coat:'#cecdb4',accent:c.coat});
  if(kind==='mentor')Object.assign(p,{coat:c.coat,accent:c.accent,height:3.18});
  if(kind==='envoy')Object.assign(p,{height:3.13,hairStyle:'bun'});
  if(kind==='leader')Object.assign(p,{height:3.35,width:1.16,hat:villageId==='dark'?'hood':null});
  Object.assign(p,variants[id]||{});
  Object.assign(p,person.appearance||{});if(person.activity)p.activity=person.activity;
  if(villageId==='ice')p.fur=true;
  return p;
}
