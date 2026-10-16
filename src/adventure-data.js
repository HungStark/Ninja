// The atlas is also the source of truth for walking between village maps.
export const VILLAGES = [
  {id:'fire',name:'Làng Hỏa',glyph:'火',element:'fire',color:'#e47646',ground:'#635344',path:'#b19474',roof:'#813b32',sky:'#797f89',tree:'#ac593b',title:'Tro tàn dưới cổng đỏ',desc:'Mái ngói đỏ, đá núi lửa và những rặng phong giữa thung lũng khói.',x:25,y:22,polygon:'9,15 25,6 34,9 43,25 38,34 40,38 30,38 15,32 7,28',links:['water','nameless','wind','earth']},
  {id:'water',name:'Làng Thủy',glyph:'水',element:'water',color:'#62c5de',ground:'#506f73',path:'#a9b5a3',roof:'#365c76',sky:'#91bdce',tree:'#6b9c9b',title:'Bến sương và thủy lộ',desc:'Nhà sàn xanh lam, hồ nước lặng và những bến đá chìm trong sương.',x:51,y:15,polygon:'34,9 47,3 61,6 69,12 65,24 58,28 44,25',links:['fire','lightning','nameless']},
  {id:'lightning',name:'Làng Lôi',glyph:'雷',element:'lightning',color:'#bc9beb',ground:'#615c75',path:'#9995a3',roof:'#594070',sky:'#77768e',tree:'#79709c',title:'Lôi đài trên cao nguyên',desc:'Tháp dẫn sét, tinh thạch tím và vách đá trên cao nguyên giông.',x:79,y:24,polygon:'69,12 76,6 84,14 91,17 95,32 85,38 75,34 65,37 60,28 65,24',links:['water','nameless','light']},
  {id:'nameless',name:'Làng Vô Danh',glyph:'◉',element:'wind',color:'#dfc58c',ground:'#657a61',path:'#b9a68b',roof:'#394b4b',sky:'#a5c2c3',tree:'#647c54',title:'Nơi bước chân bắt đầu',desc:'Một ngôi làng lặng dưới chân núi. Những mái ngói cũ gìn giữ bí mật của chín hệ.',x:50,y:32,polygon:'44,25 58,28 60,28 65,37 56,39 49,37 40,38 38,34 43,25',links:['fire','water','lightning','wind']},
  {id:'earth',name:'Làng Thổ',glyph:'土',element:'earth',color:'#d7ae72',ground:'#8b7051',path:'#c9aa7a',roof:'#6c4c38',sky:'#c2ad8e',tree:'#8b8153',title:'Thành đá giữa hẻm núi',desc:'Bậc đá sa thạch, nhà đất và những khối núi dựng đứng bảo vệ làng.',x:21,y:47,polygon:'7,28 15,32 30,38 34,48 33,56 27,59 9,59 3,43',links:['fire','wind','ice']},
  {id:'wind',name:'Làng Phong',glyph:'風',element:'wind',color:'#91d0b0',ground:'#69876a',path:'#bec4a0',roof:'#426d62',sky:'#a7ccc6',tree:'#72996c',title:'Đồng cỏ kể chuyện gió',desc:'Guồng gió, đồng cỏ rộng và những dải cờ bạc màu trên đồi.',x:51,y:49,polygon:'40,38 49,37 56,39 65,37 68,46 64,57 59,61 43,63 38,66 33,56 34,48 30,38',links:['nameless','fire','earth','ice','wood','light','dark']},
  {id:'light',name:'Làng Quang',glyph:'☀',element:'light',color:'#f4d57e',ground:'#a69a6a',path:'#ddd1a4',roof:'#9f8044',sky:'#d5ceb0',tree:'#b7ae70',title:'Thánh điện của bình minh',desc:'Đá trắng, tháp mặt trời và những cột pha lê hứng ánh sáng vàng.',x:82,y:49,polygon:'65,37 75,34 85,38 95,32 98,49 94,61 86,63 74,58 64,57 68,46',links:['lightning','wind','dark']},
  {id:'ice',name:'Làng Băng',glyph:'❄',element:'ice',color:'#a9dcec',ground:'#a4b9b9',path:'#d3dcd4',roof:'#506c82',sky:'#bacfd8',tree:'#7c9d9f',title:'Dấu chân trên tuyết cũ',desc:'Tùng phủ tuyết, mái nhà dốc và tinh thể băng giữa sườn núi lạnh.',x:24,y:73,polygon:'9,59 27,59 33,56 38,66 35,77 31,91 24,88 13,75',links:['earth','wind','wood']},
  {id:'wood',name:'Làng Mộc',glyph:'木',element:'wood',color:'#a6c97d',ground:'#49634b',path:'#9a9970',roof:'#455c3c',sky:'#7f9c88',tree:'#497449',title:'Lời thề dưới cổ thụ',desc:'Nhà gỗ, rễ cây cổ thụ và rừng sâu với ánh đom đóm xanh.',x:51,y:80,polygon:'43,63 59,61 64,67 68,79 69,91 51,97 39,92 31,91 35,77 38,66',links:['ice','wind','dark']},
  {id:'dark',name:'Làng Ám',glyph:'☾',element:'dark',color:'#b7a0d6',ground:'#494858',path:'#858394',roof:'#383346',sky:'#555469',tree:'#61536e',title:'Đèn lồng bên kia màn sương',desc:'Rừng tím, đèn lồng lạnh và đền cổ ẩn dưới bầu trời hoàng hôn.',x:80,y:75,polygon:'64,57 74,58 86,63 94,61 94,77 85,86 69,91 68,79 64,67 59,61',links:['wind','light','wood']}
];
export const village = id => VILLAGES.find(v=>v.id===id);
export const QUESTS={
  nameless:{title:'Ngọn ấn đầu tiên',enemy:'Kẻ phá ấn',story:'Một kẻ lạ đang phá phong ấn ở con đường phía bắc. Hãy hạ hắn để bảo vệ lữ khách đi qua đây.'},
  fire:{title:'Tro tàn chưa nguội',enemy:'Nhẫn giả Tro Đỏ',story:'Một nhẫn giả phản bội đang cướp than hỏa ấn để nuôi ngọn lửa cấm. Hắn đang đợi trên con đường phía bắc.'},
  water:{title:'Lời thề bên bến nước',enemy:'Thủy tặc Sương Mù',story:'Bến thuyền đã bị thủy tặc phong tỏa. Hạ tên canh gác phía bắc để mở lại đường đưa thuốc vào làng.'},
  lightning:{title:'Tiếng sét lạc nhịp',enemy:'Kẻ trộm Lôi Thạch',story:'Lôi thạch của tháp dẫn sét đã bị đánh cắp. Chặn kẻ trộm đang trốn trên lối bắc trước khi cơn giông kéo đến.'},
  earth:{title:'Người giữ cửa núi',enemy:'Thổ nhẫn Lưu Vong',story:'Một thổ nhẫn lưu vong đã chiếm đường vào mỏ đá. Đánh bại hắn ở lối bắc để đoàn thợ có thể trở về.'},
  wind:{title:'Cánh cờ trong gió',enemy:'Du nhẫn Cuồng Phong',story:'Những lá cờ dẫn đường bị chém đứt mỗi đêm. Kẻ gây chuyện vừa xuất hiện phía bắc. Hãy ngăn hắn lại.'},
  light:{title:'Bình minh bị đánh cắp',enemy:'Kẻ giữ Kính Vỡ',story:'Một kẻ lạ dùng kính cổ đánh cắp ánh sáng của thánh điện. Hãy phá vòng vây của hắn trên đường phía bắc.'},
  ice:{title:'Đường về qua tuyết',enemy:'Băng nhẫn Vô Thanh',story:'Lối đón đoàn lữ hành bị một băng nhẫn canh giữ. Hạ hắn ở phía bắc trước khi tuyết lấp hết dấu chân.'},
  wood:{title:'Lời khẩn của cổ thụ',enemy:'Kẻ săn Mộc Ấn',story:'Có người đang hút sinh khí từ rễ cổ thụ. Lần theo con đường phía bắc và đánh bại kẻ săn mộc ấn.'},
  dark:{title:'Đèn lồng cuối ngõ',enemy:'Ảnh nhẫn Không Tên',story:'Đèn dẫn hồn tắt dần dưới bóng một ảnh nhẫn. Hắn đang ẩn ở đường phía bắc. Hãy giữ ngọn đèn cuối cùng.'}
};
export const SAVE_KEY = 'anhoa-adventure-v1';
export function newJourney(name='Lữ Khách',coat='#345c63',hair='#252b32') {
  return {version:1,hero:{name:name.trim().slice(0,24)||'Lữ Khách',coat,hair},village:'nameless',position:[0,7],checkpoint:'nameless',visited:['nameless'],activated:['nameless'],quests:{},gold:0,xp:0,wins:0};
}
export function readJourney(storage) {
  try {
    const s=JSON.parse(storage.getItem(SAVE_KEY));
    if(s?.version!==1||!village(s.village)||!village(s.checkpoint)||typeof s.hero?.name!=='string')return null;
    const hex=c=>/^#[\da-f]{6}$/i.test(c);
    const clean=newJourney(s.hero.name,hex(s.hero.coat)?s.hero.coat:'#345c63',hex(s.hero.hair)?s.hero.hair:'#252b32');
    clean.village=s.village;clean.checkpoint=s.checkpoint;
    clean.position=Array.isArray(s.position)&&s.position.length===2&&s.position.every(n=>Number.isFinite(n)&&Math.abs(n)<=25)?s.position:[0,7];
    for(const key of ['visited','activated'])clean[key]=[...new Set(['nameless',...(Array.isArray(s[key])?s[key].filter(id=>village(id)):[])])];
    clean.activated=[...new Set([...clean.activated,s.checkpoint])];
    for(const v of VILLAGES)if([1,2,3].includes(s.quests?.[v.id]))clean.quests[v.id]=s.quests[v.id];
    for(const key of ['gold','xp','wins'])clean[key]=Number.isSafeInteger(s[key])&&s[key]>=0?s[key]:0;
    return clean;
  }catch{return null;}
}
export function resolveBattle(save,encounter,victory) {
  if(victory){save.gold+=encounter.kind==='quest'?60:20;save.xp+=encounter.kind==='quest'?90:35;save.wins++;if(encounter.kind==='quest'&&save.quests[encounter.village]===1)save.quests[encounter.village]=2;}
  else{save.village=save.checkpoint;save.position=[0,7];}
  return save;
}

// A* over a one-unit grid. Diagonal moves cannot cut across solid corners.
export function findPath(from,to,blocked) {
  const grid=26,key=(x,z)=>`${x},${z}`,snap=p=>p.map(Math.round);
  const start=snap(from),end=snap(to),valid=(x,z)=>Math.abs(x)<=grid&&Math.abs(z)<=grid&&!blocked(x,z);
  if(!valid(...end)||Math.abs(to[0])>grid||Math.abs(to[1])>grid||blocked(...to))return [];
  const open=[{x:start[0],z:start[1],g:0,f:0}],cost=new Map([[key(...start),0]]),parent=new Map(),closed=new Set();
  while(open.length){
    open.sort((a,b)=>a.f-b.f);const c=open.shift(),k=key(c.x,c.z);if(closed.has(k))continue;closed.add(k);
    if(c.x===end[0]&&c.z===end[1]){const path=[[...to]];let at=k;while(parent.has(at)){const prev=parent.get(at);path.push(prev.split(',').map(Number));at=prev;}path.reverse();path.shift();return path;}
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const x=c.x+dx,z=c.z+dz;if(!valid(x,z)||(dx&&dz&&(!valid(c.x+dx,c.z)||!valid(c.x,c.z+dz))))continue;
      const nk=key(x,z),g=c.g+Math.hypot(dx,dz);if(g>=(cost.get(nk)??Infinity))continue;
      cost.set(nk,g);parent.set(nk,k);open.push({x,z,g,f:g+Math.hypot(x-end[0],z-end[1])});
    }
  }return [];
}
