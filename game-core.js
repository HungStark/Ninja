/* Shared, deterministic seal, loadout and combat rules. */
(function (root) {
  const keys = ['q', 'w', 'e', 'r', 'a', 's', 'd', 'f', 'z', 'x', 'c', 'v'];
  const elements = [
    { id: 'fire', name: 'Hỏa', glyph: '火', color: '#ff844b', prefix: 'qw', speed: 20, power: 1.12 },
    { id: 'water', name: 'Thủy', glyph: '水', color: '#50baff', prefix: 'we', speed: 18, power: 1 },
    { id: 'lightning', name: 'Lôi', glyph: '雷', color: '#c6a2ff', prefix: 'er', speed: 29, power: .92 },
    { id: 'wind', name: 'Phong', glyph: '風', color: '#9fe9ce', prefix: 'ra', speed: 25, power: .95 },
    { id: 'earth', name: 'Thổ', glyph: '土', color: '#d9ae69', prefix: 'as', speed: 15, power: 1.2 },
    { id: 'light', name: 'Quang', glyph: '光', color: '#ffe6a0', prefix: 'sd', speed: 27, power: .94 },
    { id: 'dark', name: 'Ám', glyph: '闇', color: '#e284d3', prefix: 'df', speed: 20, power: 1.08 },
    { id: 'wood', name: 'Mộc', glyph: '木', color: '#9ed26c', prefix: 'fz', speed: 17, power: 1.02 },
    { id: 'ice', name: 'Băng', glyph: '氷', color: '#a6edff', prefix: 'zx', speed: 21, power: 1.04 }
  ];
  const titles = {
    light: ['Quang cầu', 'Quang thương', 'Quang liên kích', 'Quang thuẫn', 'Quang kính'],
    wood: ['Mộc đạn', 'Mộc thương', 'Mộc liên kích', 'Mộc thành', 'Mộc phản'],
    ice: ['Băng cầu', 'Băng thương', 'Băng liên kích', 'Băng bích', 'Băng kính']
  };
  const variants = [
    { kind: 'attack', style: 'orb', rank: 'D', suffix: '', cost: 28, damage: 38, size: .4, count: 1, subtitle: 'Đạn cơ bản • một mục tiêu' },
    { kind: 'attack', style: 'lance', rank: 'B', suffix: 'df', cost: 34, damage: 46, size: .22, count: 1, subtitle: 'Mũi xuyên nhanh • sát thương cao' },
    { kind: 'attack', style: 'volley', rank: 'S', suffix: 'cvzx', cost: 56, damage: 58, size: .25, count: 3, subtitle: 'Ba đạn mạnh xòe ngang • vùng sát thương lớn' },
    { kind: 'defense', style: 'barrier', rank: 'C', suffix: 'a', cost: 26, damage: 0, shield: 65, duration: 4.5, subtitle: 'Khiên hấp thụ • 4,5 giây' },
    { kind: 'defense', style: 'reflect', rank: 'A', suffix: 'zxc', cost: 32, damage: 0, shield: 25, duration: 2.8, subtitle: 'Phản lại một đạn • 2,8 giây' }
  ];
  // Keep the saved fire IDs while replacing their formulas and behavior.
  const fireSpells = [
    { id: 'fire-volley', name: 'Hỏa liên đạn', kind: 'attack', style: 'volley', rank: 'B', sequence: [...'qwdf'], cost: 40, damage: 9.6, size: .075, count: 3, speed: 27, holdTime: .5, salvoInterval: .1, subtitle: 'Ba hỏa cầu nhỏ xếp ngang • mỗi viên 9,6 sát thương • giữ 0,5 giây rồi phóng lần lượt cách nhau 0,1 giây' },
    { id: 'fire-lance', name: 'Rồng lửa', kind: 'attack', style: 'dragon', rank: 'S', sequence: [...'qwcvzx'], cost: 56, damage: 104, size: .72, count: 1, speed: 23, subtitle: 'Rồng lửa khổng lồ • thân uốn lượn, sừng và nanh' },
    { id: 'fire-meteor', name: 'Thiên thạch', kind: 'attack', style: 'meteor', rank: 'SS', sequence: [...'qwcvzxer'], cost: 82, damage: 150, size: 1.5, count: 1, speed: 0, blastRadius: 5.5, fallTime: 1.6, subtitle: 'Thiên thạch từ trời • nổ lan bán kính 5,5 m' },
    { id: 'fire-barrier', name: 'Khiên lửa', kind: 'defense', style: 'barrier', rank: 'C', sequence: [...'qwa'], cost: 26, damage: 0, shield: 75, duration: 4.5, count: 0, subtitle: 'Vòm lửa bao quanh người • hấp thụ 75 sát thương' },
    { id: 'fire-reflect', name: 'Tường lửa', kind: 'defense', style: 'firewall', rank: 'A', sequence: [...'qwzxc'], cost: 36, damage: 0, shield: 120, duration: 5, count: 0, wallWidth: 7, wallHeight: 4.2, subtitle: 'Tường lửa phía trước • chặn đạn, tồn tại 5 giây' }
  ].map(s => ({ ...s, element: 'fire', glyph: '火', color: '#ff844b', heal: 0, shield: s.shield || 0 }));
  // Preserve saved water IDs; the former lance/volley/reflect now have water-specific behavior.
  const waterSpells = [
    { id: 'water-lance', name: 'Thủy ngục', kind: 'attack', style: 'prison', rank: 'A', sequence: [...'wezxc'], cost: 38, damage: 12, size: .55, count: 1, speed: 21, controlDuration: 3, subtitle: 'Giam đối thủ trong quả cầu nước • khóa di chuyển và thi triển 3 giây' },
    { id: 'water-volley', name: 'Ném thuyền', kind: 'attack', style: 'boat', rank: 'S', sequence: [...'wecvzx'], cost: 56, damage: 90, size: 1.7, count: 1, speed: 24, blastRadius: 3.5, subtitle: 'Triệu hồi thuyền hải tặc • ném thẳng tới điểm ngắm' },
    { id: 'water-tsunami', name: 'Sóng thần', kind: 'attack', style: 'tsunami', rank: 'SS', sequence: [...'wecvzxer'], cost: 72, damage: 30, size: 1, count: 1, speed: 12, waveWidth: 12, waveHeight: 5, subtitle: 'Sóng lớn cuốn chiêu thức • đẩy phân thân ra sau đối thủ, không phá hủy • sát thương vừa phải' },
    { id: 'water-barrier', name: 'Khiên nước', kind: 'defense', style: 'barrier', rank: 'C', sequence: [...'wea'], cost: 26, damage: 0, shield: 65, duration: 4.5, count: 0, subtitle: 'Khiên nước bao quanh bản thân • hấp thụ 65 sát thương' },
    { id: 'water-reflect', name: 'Thủy thuẫn', kind: 'defense', style: 'waterwall', rank: 'B', sequence: [...'wedf'], cost: 32, damage: 0, shield: 95, duration: 5, count: 0, wallRadius: 2.2, subtitle: 'Khiên nước tròn trước mặt • chặn chiêu bay qua mặt chắn' }
  ].map(s => ({ ...s, element: 'water', glyph: '水', color: '#50baff', heal: 0, shield: s.shield || 0 }));
  // Keep saved lightning IDs while giving each art its own behavior.
  const lightningSpells = [
    { id: 'lightning-lance', name: 'Lôi thương', kind: 'attack', style: 'lance', rank: 'B', sequence: [...'erdf'], cost: 40, damage: 62, size: .3, count: 1, speed: 38, subtitle: 'Thương sét dài • mũi nhọn và đuôi điện' },
    { id: 'lightning-volley', name: 'Lôi điểu', kind: 'attack', style: 'bird', rank: 'S', sequence: [...'ercvzx'], cost: 56, damage: 102, size: .9, count: 1, speed: 27, subtitle: 'Chim hiện ra từ cầu sét rồi lao tới • góc nhìn trên cao' },
    { id: 'lightning-thunder', name: 'Thiên lôi', kind: 'attack', style: 'thunder', rank: 'SS', sequence: [...'ercvzxer'], cost: 82, damage: 150, size: 1, count: 1, speed: 0, blastRadius: 4.5, chargeTime: 1.4, subtitle: 'Ngước nhìn mây chớp điện • trả góc nhìn rồi sét đánh xuống' },
    { id: 'lightning-barrier', name: 'Lôi thuẫn', kind: 'defense', style: 'barrier', rank: 'C', sequence: [...'era'], cost: 26, damage: 0, shield: 80, duration: 5, count: 0, subtitle: 'Khiên điện bao quanh bản thân • hấp thụ 80 sát thương trong 5 giây' },
    { id: 'lightning-reflect', name: 'Lôi trận', kind: 'defense', style: 'stormfield', rank: 'A', sequence: [...'erzxc'], cost: 36, damage: 0, shield: 0, duration: 10, count: 0, fieldRadius: 9, fieldHeight: 8, slowFactor: .3, subtitle: 'Vùng điện rộng 10 giây • đạn đối phương còn 30% tốc độ trong vùng' }
  ].map(s => ({ ...s, element: 'lightning', glyph: '雷', color: '#c6a2ff', heal: 0, shield: s.shield || 0 }));
  const windSpells = [
    {id:'wind-orb',name:'Phong nhận',kind:'attack',style:'windslash',rank:'D',sequence:[...'ra'],cost:24,damage:36,size:.55,speed:29,count:1,subtitle:'Phóng một nhát chém gió hình lưỡi liềm về phía ngắm'},
    {id:'wind-volley',name:'Phong lốc',kind:'attack',style:'tornado',rank:'S',sequence:[...'racvzx'],cost:46,damage:70,size:1.15,speed:22,count:1,controlDuration:2,subtitle:'Lốc xoáy 3D lao tới · 70 sát thương, hất tung và khóa đối thủ 2 giây'},
    {id:'wind-lance',name:'Phong liên trảm',kind:'attack',style:'aircombo',rank:'B',sequence:[...'rad'],cost:22,damage:70,count:8,duration:2,requiresAirborne:true,subtitle:'Nối lốc khi địch còn trên không · chém liên tục tổng 70 sát thương, giữ thêm 2 giây · một lần mỗi lốc'},
    {id:'wind-barrier',name:'Phong bích',kind:'defense',style:'windwall',rank:'A',sequence:[...'razx'],cost:32,damage:0,shield:110,duration:5,count:0,wallWidth:7,wallHeight:5,subtitle:'Tường gió phía trước · chặn chiêu, 110 độ bền trong 5 giây'},
    {id:'wind-reflect',name:'Tiên linh gió',kind:'defense',style:'windspirit',rank:'SS',sequence:[...'racvzxer'],cost:70,damage:0,count:0,duration:5,formation:1.8,guardWidth:8,guardRange:10,guardHeight:10,subtitle:'Tinh linh toon xuất hiện phía trước mặt · giữ góc nhìn FPS · thổi gió liên tục 5 giây, phản chiêu bay tới từ phía trước'}
  ].map(s=>({...s,element:'wind',glyph:'風',color:'#9fe9ce',heal:0,shield:s.shield||0}));
  // Keep all five saved Light IDs while replacing their spells.
  const earthSpells = [
    {id:'earth-orb',name:'Thổ Thứ',kind:'attack',style:'earthspikes',rank:'D',sequence:[...'as'],cost:24,damage:40,count:1,duration:3,range:36,speed:32,subtitle:'Chạy ngầm làm đất nứt và nhô nhẹ, tới đối thủ mới bật gai · 40 sát thương · để lại gờ đá trong 3 giây'},
    {id:'earth-lance',name:'Địa Ngục Chông',kind:'attack',style:'earthcraterspikes',rank:'B',sequence:[...'asdf'],cost:34,damage:50,count:1,radius:5,requiresCrater:true,subtitle:'Cần hố Địa Bộc Thiên Tinh của bạn · phủ chông dưới đáy hố tới khi hố biến mất · 50 sát thương một lần khi chạm chông'},
    {id:'earth-volley',name:'Sơn Hà Đảo Chuyển',kind:'attack',style:'earthquake',rank:'S',sequence:[...'ascvzx'],cost:56,damage:30,count:5,duration:5,residualTime:5,radius:5.8,subtitle:'Địa hình nhấp nhô 5 đợt trong 5 giây · mỗi đợt 30 sát thương · địa hình gồ ghề còn lại 5 giây'},
    {id:'earth-barrier',name:'Thổ Bích',kind:'defense',style:'earthwall',rank:'A',sequence:[...'aszxc'],cost:32,damage:0,count:0,duration:6,shield:180,wallWidth:7,wallHeight:3.2,subtitle:'Tường đá cong trước mặt · chặn đạn và đường đi · 180 độ bền, nứt dần trong 6 giây'},
    {id:'earth-reflect',name:'Địa Bộc Thiên Tinh',kind:'attack',style:'earthgravity',rank:'SS',sequence:[...'ascvzxer'],cost:82,damage:180,count:1,chargeTime:1,pullTime:5.4,pullSpeed:10,pullAcceleration:42,liftBatchSize:5,liftBatchInterval:.2,holdTime:3,fallTime:.65,craterTime:1.5,radius:5.5,craterRadius:6.5,captureDamage:80,fallDamage:100,subtitle:'Ném lõi đen, nứt đất, nâng mảng trung tâm rồi gom từng đợt đá · giam 3 giây, gây 80 rồi 100 khi rơi · hố biến mất 1,5 giây sau khi địch rơi'}
  ].map(s=>({...s,element:'earth',glyph:'土',color:'#d9ae69',heal:0,shield:s.shield||0}));
  const lightSpells = [
    {id:'light-orb',name:'Quang laser',kind:'attack',style:'lightray',rank:'D',sequence:[...'sd'],cost:24,damage:40,count:1,chargeTime:.08,range:55,subtitle:'Tia laser thẳng trắng–vàng · 40 sát thương; qua cầu thủy tinh thành 7 sắc và 70 sát thương'},
    {id:'light-barrier',name:'Cầu thủy tinh',kind:'defense',style:'lightsphere',rank:'S',sequence:[...'sdcvzx'],cost:32,damage:0,count:0,duration:8,amplification:1.75,subtitle:'Cầu trong suốt ngay trước mặt, tồn tại 8 giây · laser xuyên qua thành tia 7 sắc cầu vồng, tăng 75% sát thương'},
    {id:'light-lance',name:'Mái vòm gương',kind:'attack',style:'lightdome',rank:'S',sequence:[...'sdcvzxsd'],cost:54,damage:20,count:0,duration:10,domeRadius:6.2,domeBuildTime:1.2,subtitle:'Gương rơi ghép vòm trong 1,2 giây · đủ 3 ô né, chặn đường thoát · vòm kín tồn tại 10 giây · mỗi laser nảy gây 20 sát thương/giây, tia 7 sắc giữ nguyên màu và gây 35 · nhiều laser cộng dồn'},
    {id:'light-reflect',name:'Quang kính',kind:'defense',style:'lightmirror',rank:'A',sequence:[...'sdzxc'],cost:28,damage:0,count:0,shield:120,duration:2.5,subtitle:'Gương trước mặt tồn tại 2,5 giây · 120 độ bền · phản các đòn tấn công bay tới từ phía trước, kể cả laser'},
    {id:'light-volley',name:'Nấc thang của Jacob',kind:'attack',style:'jacob',rank:'SS',sequence:[...'sdzxcv'],cost:82,damage:160,count:1,size:1,chargeTime:1.25,blastRadius:3.5,speed:0,subtitle:'Ngước nhìn trời rồi lia xuống theo cột sáng trắng–vàng giáng xuống · 160 sát thương trong bán kính 3,5 m'}
  ].map(s=>({...s,element:'light',glyph:'光',color:'#fff2bd',heal:0,shield:s.shield||0}));
  const darkSpells = [
    { id:'dark-orb', name:'Ảnh phân thân', kind:'attack', style:'shadowclone', rank:'C', cooldown:2, sequence:[...'dfa'], cost:26, damage:38, count:1, cloneCount:1, maxClones:3, upgradeMultiplier:1.5, subtitle:'Thêm một chó bóng · đủ 3 con thì mỗi lần thi triển nâng một chó thành bò bóng, sát thương 57 · không bị chiêu đối thủ phá hủy, không cản đạn' },
    { id:'dark-lance', name:'Ảnh tập kích', kind:'attack', style:'shadowcommand', rank:'B', sequence:[...'df'], cost:34, damage:38, count:1, requiresClones:true, subtitle:'Ra lệnh lao tới điểm ngắm, đánh 38 sát thương rồi biến mất · trong lãnh địa tự trồi lên lại' },
    { id:'dark-volley', name:'Ảnh tượng', kind:'attack', style:'shadowbind', rank:'S', sequence:[...'dfcvzx'], cost:56, damage:90, fallTime:.7, duration:2, count:1, requiresDomain:true, subtitle:'Voi bóng rơi xuống đầu đối thủ, gây 90 sát thương và nhấn chìm, khóa thao tác 2 giây · có thể né trước khi voi đáp' },
    { id:'dark-domain', name:'Hắc lãnh địa', kind:'attack', style:'domain', rank:'SS', sequence:[...'dfcvzxer'], cost:70, damage:0, count:0, duration:30, subtitle:'Mái vòm đen nở thành đầm mực trong 30 giây · mở khóa voi bóng và lặn, phân thân bị đánh sẽ trồi lên lại' },
    { id:'dark-reflect', name:'Ảnh độn', kind:'defense', style:'shadowdive', rank:'A', sequence:[...'dfzxc'], cost:32, damage:0, count:0, duration:3, requiresDomain:true, subtitle:'Lặn dưới đất 3 giây, nhìn ra qua bóng đen mờ · miễn nhiễm tấn công, vẫn ngắm, né, kết ấn và thi triển' }
  ].map(s=>({...s,element:'dark',glyph:'闇',color:'#a48fd8',size:.36,speed:24,heal:0,shield:0,requiresDomain:!!s.requiresDomain}));
  const woodSpells=[
    {id:'wood-orb',name:'Độc Hoa',kind:'attack',style:'flowerpoison',rank:'D',sequence:[...'fzc'],cost:22,damage:30,count:0,requiresGarden:true,subtitle:'Miệng hoa nhả khói tím lan quanh cây trong 6 giây · vùng rộng 2–5 m theo cây · địch chỉ mất 5–15 máu/giây khi ở trong vùng'},
    {id:'wood-lance',name:'Dây Leo Trói Buộc',kind:'attack',style:'vinebind',rank:'B',sequence:[...'fzdf'],cost:34,damage:18,count:1,controlDuration:2,requiresGarden:true,subtitle:'Dây leo từ vườn bò tới quấn đối thủ · 18–54 sát thương, trói 2–6 giây theo kích thước cây'},
    {id:'wood-volley',name:'Trúc Diệp Phi Vũ',kind:'attack',style:'bamboostab',rank:'S',sequence:[...'fzcvzx'],cost:50,damage:75,count:12,requiresGarden:true,subtitle:'Các bụi tre rung lên, mọc cành lá phát sáng rồi phóng lá sắc thành 1–3 đợt về điểm ngắm · tổng 75–225 sát thương theo cây, có thể ngắm trượt và bị chắn'},
    {id:'wood-barrier',name:'Óc Chó Hộ Vệ',kind:'defense',style:'walnutwall',rank:'A',sequence:[...'fzzxc'],cost:30,damage:0,count:0,shield:90,duration:5,requiresGarden:true,subtitle:'Cây trước mặt bên phải thả quả óc chó, quả rơi và hóa lớn chắn phía trước · 90–270 độ bền trong 5–7 giây'},
    {id:'wood-reflect',name:'Vườn Sinh Mệnh',kind:'attack',style:'woodseed',rank:'SS',sequence:[...'fzcvzxerqw'],cost:50,damage:0,count:0,oncePerMatch:true,growthTime:60,subtitle:'10 ấn · gieo rừng hoa độc, dây leo và tre bao quanh đối thủ, cả trước, sau và hai bên, óc chó trước mặt bên phải · không gây sát thương, một lần mỗi trận · trưởng thành sau 60 giây, cây phía sau lớn nhỏ xen kẽ · cây phía trước cao tối đa nửa người đối thủ, phía sau cao tới 3/4 cổng cũ'}
  ].map(s=>({...s,element:'wood',glyph:'木',color:'#9ed26c',heal:0,shield:s.shield||0}));
  const iceSpells=[
    {id:'ice-orb',name:'Tuyết Táng',kind:'attack',style:'snowball',rank:'SS',sequence:[...'zx'],cost:20,damage:0,count:0,requiresSnowFull:true,speed:3.1,radius:4.8,subtitle:'Chỉ mở sau 90 giây gọi tuyết · gom tuyết thành cầu khổng lồ tự đuổi địch, không thể cản · chôn vùi rồi lăn đi để kết thúc trận'},
    {id:'ice-lance',name:'Băng Phược',kind:'attack',style:'icebind',snowCost:3,rank:'B',sequence:[...'zxdf'],cost:28,damage:0,count:1,size:.38,speed:27,controlDuration:3,subtitle:'Gom tuyết trong không khí trong 0,75 giây rồi bắn tinh thể · khóa di chuyển và kết ấn 3 giây, không gây sát thương'},
    {id:'ice-volley',name:'Huyễn Sương',kind:'defense',style:'icefog',snowCost:3,rank:'S',sequence:[...'zxcvzx'],cost:34,damage:0,count:0,duration:6,subtitle:'Sương phủ kín người trong 6 giây · bản thân nhìn xuyên sương, đối thủ chỉ thấy ảo ảnh ở vị trí lệch'},
    {id:'ice-barrier',name:'Băng Bích',kind:'defense',style:'icewall',snowCost:3,rank:'A',sequence:[...'zxzxc'],cost:28,damage:0,count:0,shield:120,duration:5,subtitle:'Tường tinh thể mọc từ mặt đất trong 0,82 giây · chắn đòn từ phía trước, 120 độ bền, tồn tại 5 giây'},
    {id:'ice-reflect',name:'Băng Thiên Tuyết Địa',kind:'attack',style:'snowstorm',rank:'SS',sequence:[...'zxcvzxerqw'],cost:50,damage:0,count:0,oncePerMatch:true,snowTime:90,subtitle:'10 ấn · gọi tuyết một lần mỗi trận, không gây sát thương · tích tối đa 90 tuyết, mỗi giây thêm 1 · chiêu cơ bản tốn 3 tuyết, kéo dài thời gian mở Tuyết Táng'}
  ].map(s=>({...s,element:'ice',glyph:'氷',color:'#a6edff',heal:0,shield:s.shield||0,subtitle:s.subtitle+(s.snowCost?' · tốn '+s.snowCost+' tuyết từ mưa tuyết':'')}));
  const spells = elements.flatMap(el => el.id === 'wood' ? woodSpells : el.id === 'ice' ? iceSpells : el.id === 'fire' ? fireSpells : el.id === 'water' ? waterSpells : el.id === 'lightning' ? lightningSpells : el.id === 'wind' ? windSpells : el.id === 'earth' ? earthSpells : el.id === 'light' ? lightSpells : el.id === 'dark' ? darkSpells : variants.map((v, i) => ({
    ...v, id: el.id + '-' + v.style, name: titles[el.id][i], element: el.id,
    glyph: el.glyph, color: el.color, speed: el.speed * (v.style === 'lance' ? 1.3 : 1),
    damage: Math.round(v.damage * el.power), sequence: [...el.prefix, ...v.suffix],
    shield: v.shield ? Math.round(v.shield * (el.id === 'earth' ? 1.2 : 1)) : 0,
    heal: v.kind === 'defense' && ['wood', 'light'].includes(el.id) ? 12 : 0
  })));
  const defaultLoadout = ['fire-volley', 'water-lance', 'lightning-volley', 'earth-barrier', 'ice-reflect'];
  const chakraRegen=5,cooldownByRank={D:3,C:4,B:6,A:8,S:11,SS:15};
  for(const spell of spells)spell.cooldown=spell.cooldown??cooldownByRank[spell.rank]??6;
  const shuriken={name:'Phi tiêu',damage:6,speed:36,size:.075,interval:.45};
  function validateLoadout(ids, { allowDefenseOnly = false } = {}) {
    if (!Array.isArray(ids) || ids.length < 1 || ids.length > 5) return { ok: false, reason: 'Chọn từ 1 đến 5 chiêu.' };
    if (new Set(ids).size !== ids.length || ids.some(id => !spells.some(s => s.id === id))) return { ok: false, reason: 'Bộ chiêu không hợp lệ hoặc bị trùng.' };
    const attack = ids.filter(id => spells.find(s => s.id === id).kind === 'attack').length, defense = ids.length - attack;
    if (!allowDefenseOnly && attack < 1) return { ok: false, attack, defense, reason: 'Cần ít nhất 1 chiêu tấn công để vào trận.' };
    return { ok: true, attack, defense };
  }
  class GameRules {
    constructor(ids = defaultLoadout) {
      this.sequence = []; this.chakra = 100; this.time = 0; this.lastSeal = -Infinity; this.cooldown = 0; this.casts = 0;this.usedOnce=new Set();
      this.cooldowns={};this.shurikenCooldown=0;this.shurikenThrows=0;
      const result = this.setLoadout(ids);
      if (!result.ok) throw new RangeError(result.reason);
    }
    setLoadout(ids) {
      const result = validateLoadout(ids);
      if (!result.ok) return result;
      this.loadout = [...ids]; this.spells = ids.map(id => spells.find(s => s.id === id)); this.clear(); return result;
    }
    tick(dt) {
      this.time += dt; this.chakra = Math.min(100, this.chakra + dt * chakraRegen); this.cooldown = Math.max(0, this.cooldown - dt);this.shurikenCooldown=Math.max(0,this.shurikenCooldown-dt);
      if(this.shurikenCooldown<1e-7)this.shurikenCooldown=0;
      for(const id of Object.keys(this.cooldowns)){this.cooldowns[id]=Math.max(0,this.cooldowns[id]-dt);if(this.cooldowns[id]<1e-7)delete this.cooldowns[id];}
      if (this.sequence.length && this.time - this.lastSeal > 7) { this.clear(); return 'expired'; }
    }
    ready() { return this.spells.find(s => s.sequence.join('') === this.sequence.join('')); }
    seal(key) {
      if (!keys.includes(key)) return null;
      this.lastSeal = this.time; this.sequence.push(key);
      const valid = this.spells.some(s => s.sequence.slice(0, this.sequence.length).join('') === this.sequence.join(''));
      if (!valid) this.sequence = this.spells.some(s => s.sequence[0] === key) ? [key] : [];
      return { valid, ready: this.ready() };
    }
    clear() { this.sequence = []; }
    remaining(id){return this.cooldowns[id]||0;}
    throwShuriken(){
      if(this.ready())return {ok:false,reason:'spellReady'};
      if(this.shurikenCooldown>1e-7)return {ok:false,reason:'shurikenCooldown'};
      this.shurikenCooldown=shuriken.interval;this.shurikenThrows++;this.clear();return {ok:true,weapon:shuriken};
    }
    cast(context = {}) {
      const spell = this.ready();
      if (!spell) return { ok: false, reason: 'sequence' };
      if(spell.oncePerMatch&&this.usedOnce.has(spell.id))return {ok:false,reason:'once'};
      if(this.remaining(spell.id)>1e-7)return {ok:false,reason:'spellCooldown',remaining:this.remaining(spell.id)};
      if(spell.requiresSnowFull&&!context.snowFull)return {ok:false,reason:'snow'};
      if(spell.snowCost&&(context.snowAmount||0)+1e-6<spell.snowCost)return {ok:false,reason:'snowCost'};
      if(spell.requiresGarden&&!context.woodGarden)return {ok:false,reason:'garden'};
      if (spell.requiresDomain && !context.darkDomain) return { ok: false, reason: 'domain' };
      if (spell.requiresClones && !context.shadowClones) return { ok:false, reason:'clones' };
      if (spell.requiresAirborne && !context.windAirborne) return {ok:false,reason:'airborne'};
      if (spell.requiresCrater && !context.earthCrater) return {ok:false,reason:'crater'};
      if (spell.style==='shadowclone' && context.shadowCloneCount>=spell.maxClones && !context.shadowUpgrades) return {ok:false,reason:'cloneLimit'};
      if (this.cooldown > 0) return { ok: false, reason: 'cooldown' };
      if (this.chakra < spell.cost) return { ok: false, reason: 'chakra' };
      this.chakra -= spell.cost; this.cooldown = 1;this.cooldowns[spell.id]=spell.cooldown; this.casts++;if(spell.oncePerMatch)this.usedOnce.add(spell.id); this.clear(); return { ok: true, spell };
    }
  }
  class Fighter {
    constructor(maxHp = 1000) { this.maxHp = maxHp; this.hp = maxHp; this.shield = 0; this.shieldTime = 0; this.reflect = 0; this.waterControlTime = 0; this.darkControlTime=0; this.windControlTime=0; this.earthControlTime=0;this.iceControlTime=0;this.woodControlTime=0; this.invulnerableTime=0; this.color = '#ffffff'; this.defenseElement = ''; }
    get controlTime(){return Math.max(this.waterControlTime,this.darkControlTime,this.windControlTime,this.earthControlTime,this.iceControlTime||0,this.woodControlTime||0);}
    set controlTime(value){this.waterControlTime=value;}
    get controlSource(){if(this.snowBuried)return 'Tuyết Táng';if(this.woodControlTime>0&&this.woodControlTime>=Math.max(this.waterControlTime,this.darkControlTime,this.windControlTime,this.earthControlTime,this.iceControlTime))return 'Dây leo';return this.iceControlTime>0&&this.iceControlTime>=Math.max(this.waterControlTime,this.darkControlTime,this.windControlTime,this.earthControlTime)?'Băng Phược':this.earthControlTime>0&&this.earthControlTime>=Math.max(this.waterControlTime,this.darkControlTime,this.windControlTime)?'Địa Bộc Thiên Tinh':this.windControlTime>0&&this.windControlTime>=Math.max(this.waterControlTime,this.darkControlTime)?'Phong lốc':this.darkControlTime>0&&this.darkControlTime>=this.waterControlTime?'Ảnh tượng':'Thủy ngục';}
    tick(dt) { this.woodControlTime=Math.max(0,(this.woodControlTime||0)-dt);this.iceControlTime=Math.max(0,(this.iceControlTime||0)-dt);this.waterControlTime = Math.max(0, this.waterControlTime - dt); this.darkControlTime=Math.max(0,this.darkControlTime-dt);this.windControlTime=Math.max(0,this.windControlTime-dt);this.earthControlTime=Math.max(0,this.earthControlTime-dt);this.invulnerableTime=Math.max(0,this.invulnerableTime-dt);this.shieldTime = Math.max(0, this.shieldTime - dt); if (!this.shieldTime) { this.shield = 0; this.reflect = 0; } }
    defend(spell) { this.shield = spell.shield; this.shieldTime = spell.duration; this.reflect = spell.style === 'reflect' ? 1 : 0; this.color = spell.color; this.defenseElement = spell.element; this.hp = Math.min(this.maxHp, this.hp + spell.heal); }
    receive(damage, reflected = false, ignoreShield=false) {
      if(this.invulnerableTime>0)return {damage:0,absorbed:0,reflected:false,restored:false,immune:true};
      if (this.reflect && !reflected) { this.reflect--; return { damage: 0, reflected: true }; }
      const absorbed = ignoreShield?0:Math.min(this.shield, damage); this.shield -= absorbed;
      if(absorbed>0&&this.shield<=1e-7){this.shield=0;this.shieldTime=0;this.reflect=0;}
      const actual = Math.min(this.hp, Math.max(0, damage - absorbed)); this.hp -= actual;
      const defeated = this.hp <= 0, restored = defeated && this.autoRestore !== false;
      if (restored) this.hp = this.maxHp;
      return { damage: actual, absorbed, reflected: false, restored, defeated };
    }
  }
  // A downward aiming ray selects the ground, clamped to a circular six-metre reach.
  function lightBlinkTarget(position,direction,range=6){
    if(direction[1]>=-.025)return null;
    const time=-position[1]/direction[1],dx=direction[0]*time,dz=direction[2]*time,distance=Math.hypot(dx,dz);
    if(!Number.isFinite(distance)||distance<.15)return null;
    const scale=Math.min(1,range/distance),x=Math.max(-6,Math.min(6,position[0]+dx*scale)),z=Math.max(-32,Math.min(12,position[2]+dz*scale));
    if(Math.hypot(x-position[0],z-position[2])<.15)return null;
    return [x,position[1],z];
  }
  // Swept plane intersection prevents fast projectiles from passing through a wall.
  function intersectFireWall(start, end, wall) {
    const side = p => (p[0] - wall.p[0]) * wall.normal[0] + (p[2] - wall.p[2]) * wall.normal[2];
    const startSide = side(start), endSide = side(end);
    const a = Math.abs(startSide) < 1e-8 ? 0 : startSide, b = Math.abs(endSide) < 1e-8 ? 0 : endSide;
    if (a * b > 0 || Math.abs(a - b) < 1e-8) return null;
    const t = a / (a - b), point = start.map((v, i) => v + (end[i] - v) * t);
    const across = (point[0] - wall.p[0]) * -wall.normal[2] + (point[2] - wall.p[2]) * wall.normal[0];
    if (wall.radius) return Math.hypot(across, point[1] - wall.p[1]) <= wall.radius ? point : null;
    const bottom=wall.p[1]||0;
    return Math.abs(across) <= wall.width / 2 && point[1] >= bottom && point[1] <= bottom+wall.height ? point : null;
  }
  // Sweep in the wave's frame to catch crossing projectiles, regardless of their speed or owner.
  function intersectsWave(start, end, waveStart, waveEnd, normal, width, height, padding = 0, depth = 2.4) {
    const local = (p, w) => [(p[0] - w[0]) * -normal[2] + (p[2] - w[2]) * normal[0], p[1], (p[0] - w[0]) * normal[0] + (p[2] - w[2]) * normal[2]];
    const a = local(start, waveStart), b = local(end, waveEnd);
    const low = [-width / 2 - padding, -padding, -depth / 2 - padding], high = [width / 2 + padding, height + padding, depth / 2 + padding];
    let enter = 0, leave = 1;
    for (let i = 0; i < 3; i++) {
      const d = b[i] - a[i];
      if (Math.abs(d) < 1e-8) { if (a[i] < low[i] || a[i] > high[i]) return false; continue; }
      const t1 = (low[i] - a[i]) / d, t2 = (high[i] - a[i]) / d;
      enter = Math.max(enter, Math.min(t1, t2)); leave = Math.min(leave, Math.max(t1, t2));
      if (enter > leave) return false;
    }
    return true;
  }
  function meteorTarget(pos, dir) {
    const distance = dir[1] < -.025 ? Math.min(55, Math.max(6, -pos[1] / dir[1])) : 31;
    return [pos[0] + dir[0] * distance, .08, pos[2] + dir[2] * distance];
  }
  // Integrate travel across field boundaries, including a fast shot entering and
  // leaving a field in one frame. Velocity stays intact, so exiting restores it.
  function projectileTimeStep(start, velocity, dt, owner, fields) {
    if(dt<=0)return { travelTime: 0, slowFactor: 1 };
    const delta=velocity.map(v=>v*dt),intervals=[];
    for(const f of fields) {
      if(f.owner===owner||f.life<=0)continue;
      const x=start[0]-f.p[0],z=start[2]-f.p[2],a=delta[0]**2+delta[2]**2;
      let enter=0,leave=1;
      if(a<1e-12){if(x*x+z*z>f.radius*f.radius)continue;}
      else {
        const b=2*(x*delta[0]+z*delta[2]),c=x*x+z*z-f.radius*f.radius,disc=b*b-4*a*c;
        if(disc<0)continue;
        enter=Math.max(enter,(-b-Math.sqrt(disc))/(2*a));leave=Math.min(leave,(-b+Math.sqrt(disc))/(2*a));
      }
      const low=f.p[1],high=low+f.height;
      if(Math.abs(delta[1])<1e-12){if(start[1]<low||start[1]>high)continue;}
      else {
        const t1=(low-start[1])/delta[1],t2=(high-start[1])/delta[1];
        enter=Math.max(enter,Math.min(t1,t2));leave=Math.min(leave,Math.max(t1,t2));
      }
      if(enter<leave)intervals.push({enter:enter*dt,leave:leave*dt,factor:f.slowFactor});
    }
    const events=[0,dt,...intervals.flatMap(i=>[i.enter,i.leave])].sort((a,b)=>a-b);
    let remaining=dt,travelTime=0;
    for(let i=1;i<events.length&&remaining>0;i++) {
      const a=events[i-1],b=events[i],mid=(a+b)/2;
      const factor=Math.min(1,...intervals.filter(v=>mid>=v.enter&&mid<=v.leave).map(v=>v.factor));
      const travel=Math.min(b-a,remaining*factor);travelTime+=travel;remaining-=travel/factor;
    }
    return { travelTime, slowFactor: travelTime/dt };
  }
  root.SealGameCore = { keys, elements, spells, defaultLoadout, validateLoadout, GameRules, Fighter, chakraRegen, cooldownByRank, shuriken, intersectFireWall, intersectsWave, meteorTarget, projectileTimeStep };
})(globalThis);
