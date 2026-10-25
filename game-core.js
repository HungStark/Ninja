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
  // Shared Phong benchmarks: quick projectiles and large travelling techniques.
  const flightSpeeds = { quick: 29, heavy: 22 };
  // Recipes are randomized once and kept stable for learning and saved loadouts.
  // Each element keeps its unique prefix; suffixes use only the other ten seals.
  // Keep the saved fire IDs while replacing their formulas and behavior.
  const fireSpells = [
    { id: 'fire-volley', name: 'Hỏa Vũ Liên Châu', kind: 'attack', style: 'volley', rank: 'B', sequence:[...'qw'],cooldown:4, cost:20, damage:6, baseDamage:6, size: .075, count: 3, speed: flightSpeeds.quick, holdTime: .5, salvoInterval: .1, subtitle: 'Ba hỏa cầu nhỏ xếp ngang • mỗi viên 6 sát thương gốc • giữ 0,5 giây rồi phóng lần lượt cách nhau 0,1 giây' },
    { id: 'fire-lance', name: 'Hỏa Long Cuồng Vũ', kind: 'attack', style: 'dragon', rank: 'S', sequence:[...'qwfar'],cooldown:20, cost: 56, damage: 104, size: .72, count: 1, speed: flightSpeeds.heavy, subtitle: 'Rồng lửa khổng lồ • thân uốn lượn, sừng và nanh' },
    { id: 'fire-meteor', name: 'Thiên Hỏa Vẫn Tinh', kind: 'attack', style: 'meteor', rank: 'SS', sequence:[...'qwrera'],cooldown:35, cost: 82, damage: 150, size: 1.5, count: 1, speed: flightSpeeds.heavy, blastRadius: 5.5, subtitle: 'Thiên thạch từ trời • nổ lan bán kính 5,5 m' },
    { id: 'fire-barrier', name: 'Liệt Diễm Bùng Phát', kind: 'defense', style: 'ignite', rank: 'C', sequence:[...'qwz'],cooldown:8, cost: 26, damage: 0, count: 0, requiresBurn:true, subtitle: 'Tiêu thụ 1–5 tầng bỏng • bốc cháy gây 10 / 20 / 30 / 45 / 60 sát thương' },
    { id: 'fire-reflect', name: 'Hỏa Bích Thiên Thành', kind: 'defense', style: 'firewall', rank: 'A', sequence:[...'qwc'],cooldown:13, cost:28, damage: 0, shield: 120, duration:9, count: 0, wallWidth: 7, wallHeight: 4.2, subtitle: 'Tường lửa phía trước • chặn đạn, tồn tại 9 giây' }
  ].map(s => ({ ...s, element: 'fire', glyph: '火', color: '#ff844b', heal: 0, shield: s.shield || 0 }));
  // Preserve saved water IDs; the former lance/volley/reflect now have water-specific behavior.
  // Explicit base damage; shared strength and equipment scale it during combat.
  const waterSpells = [
    { id: 'water-lance', name: 'Huyền Thủy Lao Lung', kind: 'attack', style: 'prison', rank: 'A', sequence:[...'wev'],cooldown:10, cost: 38, damage: 14.4, size: .55, count: 1, speed: flightSpeeds.quick, controlDuration: 3, subtitle: 'Giam đối thủ trong quả cầu nước • khóa di chuyển và thi triển 3 giây' },
    { id: 'water-volley', name: 'Thiên Chu Trấn Hải', kind: 'attack', style: 'boat', rank: 'S', sequence:[...'werdx'],cooldown:22, cost: 56, damage: 108, size: 1.7, count: 1, speed: flightSpeeds.heavy, blastRadius: 3.5, controlDuration:1, subtitle: 'Triệu hồi thuyền hải tặc • ném thẳng tới điểm ngắm • 108 sát thương và choáng 1 giây khi trúng' },
    { id: 'water-tsunami', name: 'Thương Hải Nộ Triều', kind: 'attack', style: 'tsunami', rank: 'SS', sequence:[...'wercva'],cooldown:30, cost: 72, damage: 79, size: 1, count: 1, speed: flightSpeeds.heavy, waveWidth: 12, waveHeight: 5, subtitle: 'Sóng lớn cuốn chiêu thức • đẩy phân thân ra sau đối thủ, không phá hủy • sát thương vừa phải' },
    { id: 'water-barrier', name: 'Thủy Bộc Phá Không', kind: 'attack', style: 'waterbubbles', rank: 'C', sequence:[...'we'], cost:22, damage:7.5, duration:4, detonationInterval:1, cooldown:5, count:4, size:.5, placementRadius:2.1, blastRadius:2.8, subtitle:'4 bong bóng nổ lần lượt ở giây 1–2–3–4 • mỗi quả 7,5 sát thương gốc, bán kính 2,8 m • nhận đầy đủ hệ số tăng sát thương • hồi 5 giây' },
    { id: 'water-reflect', name: 'Huyền Thủy Hộ Thuẫn', kind: 'defense', style: 'waterwall', rank: 'B', sequence:[...'wef'],cooldown:12, cost:26, damage: 0, shield: 95, duration:8, count: 0, wallRadius: 2.2, subtitle: 'Khiên nước tròn trước mặt • chặn chiêu bay qua mặt chắn' }
  ].map(s => ({ ...s, baseDamage:s.damage, element: 'water', glyph: '水', color: '#50baff', heal: 0, shield: s.shield || 0 }));
  // Keep saved lightning IDs while giving each art its own behavior.
  const lightningSpells = [
    { id: 'lightning-lance', name: 'Lôi Đình Nhất Kích', kind: 'attack', style: 'lance', rank: 'B', sequence:[...'er'],cooldown:4, cost:20, damage:22, baseDamage:22, size: .3, count: 1, speed: 38, subtitle: 'Thương sét dài • mũi nhọn và đuôi điện' },
    { id: 'lightning-volley', name: 'Lôi Điểu Phá Thiên', kind: 'attack', style: 'bird', rank: 'S', sequence:[...'erxqx'],cooldown:20, cost: 56, damage: 102, size: .9, count: 1, speed: 27, subtitle: 'Chim hiện ra từ cầu sét rồi lao tới • góc nhìn trên cao' },
    { id: 'lightning-thunder', name: 'Thiên Lôi Giáng Thế', kind: 'attack', style: 'thunder', rank: 'SS', sequence:[...'erfzvq'],cooldown:35, cost: 82, damage: 150, size: 1, count: 1, speed: 0, blastRadius: 4.5, chargeTime: 1.4, subtitle: 'Ngước nhìn mây chớp điện • trả góc nhìn rồi sét đánh xuống' },
    { id: 'lightning-barrier', name: 'Lôi Mạch Tê Liệt', kind: 'defense', style: 'discharge', rank: 'C', sequence:[...'era'],cooldown:10, cost: 26, damage: 0, count: 0, requiresStatic:true, subtitle: 'Tiêu thụ 1–3 điểm tĩnh điện • choáng 0,5 / 1 / 2 giây, sau đó từ tính hút chiêu Lôi 3 / 5 / 7 giây' },
    { id: 'lightning-reflect', name: 'Lôi Đình Kết Giới', kind: 'defense', style: 'stormfield', rank: 'A', sequence:[...'erqw'],cooldown:8, cost: 36, damage: 0, shield: 0, duration: 5, count: 0, fieldRadius: 9, fieldHeight: 8, slowFactor: .15, subtitle: 'Vùng điện rộng 5 giây • đạn đối phương còn 15% tốc độ trong vùng' }
  ].map(s => ({ ...s, element: 'lightning', glyph: '雷', color: '#c6a2ff', heal: 0, shield: s.shield || 0 }));
  const windSpells = [
    {id:'wind-orb',name:'Vô Ảnh Phong Đao',kind:'attack',style:'windslash',rank:'D',sequence:[...'ra'],cooldown:4,cost:16,damage:24,size:.55,speed:flightSpeeds.quick,count:1,subtitle:'Phóng một nhát chém gió hình lưỡi liềm về phía ngắm'},
    {id:'wind-volley',name:'Cuồng Phong Toàn Vũ',kind:'attack',style:'tornado',rank:'S',sequence:[...'rasw'],cooldown:12,cost:46,damage:70,size:1.15,speed:flightSpeeds.heavy,count:1,controlDuration:2,subtitle:'Lốc xoáy 3D lao tới · 70 sát thương, hất tung và khóa đối thủ 2 giây'},
    {id:'wind-lance',name:'Phong Nhận Loạn Vũ',kind:'attack',style:'aircombo',rank:'B',sequence:[...'rae'],cooldown:10,cost:22,damage:70,count:8,duration:2,requiresAirborne:true,subtitle:'Nối lốc khi địch còn trên không · chém liên tục tổng 70 sát thương, giữ thêm 2 giây · một lần mỗi lốc'},
    {id:'wind-barrier',name:'Phong Thuẫn Thiên Thành',kind:'defense',style:'windwall',rank:'A',sequence:[...'raz'],cooldown:13,cost:26,damage:0,shield:110,duration:9,count:0,wallWidth:7,wallHeight:5,subtitle:'Tường gió phía trước · chặn chiêu, 110 độ bền trong 9 giây'},
    {id:'wind-reflect',name:'Phong Linh Triệu Hoán',kind:'defense',style:'windspirit',rank:'SS',sequence:[...'raqxzx'],cooldown:24,cost:70,damage:0,count:0,duration:5,formation:1.8,guardWidth:8,guardRange:10,guardHeight:10,subtitle:'Tinh linh toon xuất hiện phía trước mặt · giữ góc nhìn FPS · thổi gió liên tục 5 giây, phản chiêu bay tới từ phía trước'}
  ].map(s=>({...s,element:'wind',glyph:'風',color:'#9fe9ce',heal:0,shield:s.shield||0}));
  // Keep all five saved Light IDs while replacing their spells.
  const earthSpells = [
    {id:'earth-orb',name:'Địa Mạch Phá Kích',kind:'attack',style:'earthspikes',rank:'D',sequence:[...'as'],cooldown:4,cost:16,damage:26,count:1,duration:3,range:36,speed:32,subtitle:'Chạy ngầm làm đất nứt và nhô nhẹ, tới đối thủ mới bật gai · 26 sát thương · để lại gờ đá trong 3 giây'},
    {id:'earth-lance',name:'Vạn Thứ Xuyên Địa',kind:'attack',style:'earthcraterspikes',rank:'B',sequence:[...'ase'],cooldown:8,cost:34,damage:50,count:1,radius:5,requiresCrater:true,subtitle:'Cần hố Địa Bộc Thiên Tinh của bạn · phủ chông dưới đáy hố tới khi hố biến mất · 50 sát thương một lần khi chạm chông'},
    {id:'earth-volley',name:'Sơn Hà Nghịch Chuyển',kind:'attack',style:'earthquake',rank:'S',sequence:[...'asdx'],cooldown:24,cost:56,damage:20,count:5,duration:5,residualTime:5,radius:5.8,subtitle:'Địa hình nhấp nhô 5 đợt trong 5 giây · mỗi đợt 20 sát thương · địa hình gồ ghề còn lại 5 giây'},
    {id:'earth-barrier',name:'Đại Địa Hộ Thành',kind:'defense',style:'earthwall',rank:'A',sequence:[...'asq'],cooldown:14,cost:30,damage:0,count:0,duration:10,shield:130,wallWidth:7,wallHeight:3.2,subtitle:'Tường đá cong trước mặt · chặn đạn và đường đi · 130 độ bền, nứt dần trong 10 giây'},
    {id:'earth-reflect',name:'Địa Bộc Thiên Tinh',kind:'attack',style:'earthgravity',rank:'SS',sequence:[...'asvcwc'],cooldown:40,cost:82,damage:135,count:1,chargeTime:1,pullTime:5.4,pullSpeed:10,pullAcceleration:42,liftBatchSize:5,liftBatchInterval:.2,holdTime:3,fallTime:.65,craterTime:1.5,radius:5.5,craterRadius:6.5,captureDamage:60,fallDamage:75,subtitle:'Ném lõi đen, nứt đất, nâng mảng trung tâm rồi gom từng đợt đá · giam 3 giây, gây 60 rồi 75 khi rơi · hố biến mất 1,5 giây sau khi địch rơi'}
  ].map(s=>({...s,element:'earth',glyph:'土',color:'#d9ae69',heal:0,shield:s.shield||0}));
  const lightSpells = [
    {id:'light-orb',name:'Cực Quang Xuyên Kích',kind:'attack',style:'lightray',rank:'D',sequence:[...'sd'],cooldown:4,cost:16,damage:26,count:1,chargeTime:.08,range:55,subtitle:'Tia laser thẳng trắng–vàng · 26 sát thương; qua cầu thủy tinh thành 7 sắc và 45,5 sát thương'},
    {id:'light-barrier',name:'Huyễn Quang Tinh Cầu',kind:'defense',style:'lightsphere',rank:'S',sequence:[...'sdex'],cooldown:12,cost:32,damage:0,count:0,duration:8,amplification:1.75,subtitle:'Cầu trong suốt ngay trước mặt, tồn tại 8 giây · laser xuyên qua thành tia 7 sắc cầu vồng, tăng 75% sát thương'},
    {id:'light-lance',name:'Kính Giới Phản Quang',kind:'attack',style:'lightdome',rank:'S',sequence:[...'sdzwcw'],cooldown:30,cost:54,damage:20,count:0,duration:10,domeRadius:6.2,domeBuildTime:1.2,subtitle:'Gương rơi ghép vòm trong 1,2 giây · được đi ra khỏi vòm · khóa G khi chưa thoát hẳn · tốc độ còn 50%, chạm vòm còn 25% · tồn tại 10 giây · mỗi laser nảy gây 20 sát thương/giây, tia 7 sắc giữ nguyên màu và gây 35 · nhiều laser cộng dồn'},
    {id:'light-reflect',name:'Thiên Kính Phản Quang',kind:'defense',style:'lightmirror',rank:'A',sequence:[...'sda'],cooldown:8,cost:22,damage:0,count:0,shield:120,duration:2.5,subtitle:'Gương trước mặt tồn tại 2,5 giây · 120 độ bền · phản các đòn tấn công bay tới từ phía trước, kể cả laser'},
    {id:'light-volley',name:'Thiên Giai Thánh Phạt',kind:'attack',style:'jacob',rank:'SS',sequence:[...'sdzfzx'],cooldown:35,cost:82,damage:150,count:1,size:1,chargeTime:1.25,blastRadius:3.5,speed:0,subtitle:'Ngước nhìn trời rồi lia xuống theo cột sáng trắng–vàng giáng xuống · 150 sát thương trong bán kính 3,5 m'}
  ].map(s=>({...s,element:'light',glyph:'光',color:'#fff2bd',heal:0,shield:s.shield||0}));
  const darkSpells = [
    { id:'dark-orb', name:'U Minh Phân Ảnh', kind:'attack', style:'shadowclone', rank:'C', cooldown:2, sequence:[...'dfz'], cost:26, damage:20, count:2, cloneCount:2, maxClones:4, upgradeDamage:30, subtitle:'Tạo 2 chó bóng mỗi lần, tối đa 4 ảnh · chó gây 20 sát thương · đủ 4 ảnh thì mỗi lần nâng một chó thành bò gây 30 sát thương · không bị chiêu đối thủ phá hủy, không cản đạn' },
    { id:'dark-lance', name:'U Ảnh Tuyệt Sát', kind:'attack', style:'shadowcommand', rank:'B', sequence:[...'df'],cooldown:8, cost:34, damage:20, count:1, requiresClones:true, subtitle:'Lấy đà rồi chạy lao tới điểm ngắm · chó 20, bò 30 sát thương · ngoài lãnh địa biến mất, trong lãnh địa tự trồi lên lại' },
    { id:'dark-volley', name:'U Ảnh Huyễn Tượng', kind:'attack', style:'shadowbind', rank:'S', sequence:[...'dfwq'],cooldown:20, cost:56, damage:90, fallTime:.7, duration:2, count:1, subtitle:'Voi bóng rơi xuống đầu đối thủ, gây 90 sát thương · trong lãnh địa mới nhấn chìm, khóa mọi thao tác 2 giây và nhìn qua bóng đen · có thể né trước khi voi đáp' },
    { id:'dark-domain', name:'U Minh Lĩnh Vực', kind:'attack', style:'domain', rank:'SS', sequence:[...'dfrzsq'],cooldown:45, cost:70, damage:0, count:0, duration:30, subtitle:'Mái vòm đen nở thành đầm mực trong 30 giây · voi bóng nhấn chìm địch và mở khóa lặn, phân thân bị đánh sẽ trồi lên lại' },
    { id:'dark-reflect', name:'U Ảnh Thuấn Di', kind:'defense', style:'shadowdive', rank:'A', sequence:[...'dfa'],cooldown:8, cost:32, damage:0, count:0, duration:3, requiresDomain:true, subtitle:'Lặn dưới đất 3 giây, nhìn ra qua bóng đen mờ · miễn nhiễm tấn công, vẫn ngắm, né, kết ấn và thi triển' }
  ].map(s=>({...s,element:'dark',glyph:'闇',color:'#a48fd8',size:.36,speed:24,heal:0,shield:0,requiresDomain:!!s.requiresDomain}));
  const woodSpells=[
    {id:'wood-orb',name:'Bách Hoa Độc Vũ',kind:'attack',style:'flowerpoison',rank:'D',sequence:[...'fz'],cooldown:6,cost:22,damage:30,count:0,requiresGarden:true,subtitle:'Miệng hoa nhả khói tím lan quanh cây trong 6 giây · vùng rộng 2–5 m theo cây · địch chỉ mất 5–15 máu/giây khi ở trong vùng'},
    {id:'wood-lance',name:'Vạn Đằng Phược Ấn',kind:'attack',style:'vinebind',rank:'B',sequence:[...'fzx'],cooldown:10,cost:34,damage:18,count:1,controlDuration:2,requiresGarden:true,subtitle:'Dây leo từ vườn bò tới quấn đối thủ · 18–54 sát thương, trói 2–6 giây theo kích thước cây'},
    {id:'wood-volley',name:'Trúc Diệp Loạn Vũ',kind:'attack',style:'bamboostab',rank:'S',sequence:[...'fzvd'],cooldown:20,cost:50,damage:75,count:12,requiresGarden:true,subtitle:'Các bụi tre rung lên, mọc cành lá phát sáng rồi phóng lá sắc thành 1–3 đợt về điểm ngắm · tổng 75–225 sát thương theo cây, có thể ngắm trượt và bị chắn'},
    {id:'wood-barrier',name:'Hồ Đào Cự Vệ',kind:'defense',style:'walnutwall',rank:'A',sequence:[...'fza'],cooldown:13,cost:24,damage:0,count:0,shield:90,duration:8,requiresGarden:true,subtitle:'Cây trước mặt bên phải thả quả óc chó, quả rơi và hóa lớn chắn phía trước · 90–270 độ bền trong 8–10 giây'},
    {id:'wood-reflect',name:'Vạn Mộc Sinh Giới',kind:'attack',style:'woodseed',rank:'SS',sequence:[...'fzrerd'],cooldown:15,cost:50,damage:0,count:0,oncePerMatch:true,growthTime:60,subtitle:'6 ấn · gieo rừng hoa độc, dây leo và tre bao quanh đối thủ, cả trước, sau và hai bên, óc chó trước mặt bên phải · không gây sát thương, một lần mỗi trận · trưởng thành sau 60 giây, cây phía sau lớn nhỏ xen kẽ · cây phía trước cao tối đa nửa người đối thủ, phía sau cao tới 3/4 cổng cũ'}
  ].map(s=>({...s,element:'wood',glyph:'木',color:'#9ed26c',heal:0,shield:s.shield||0}));
  const iceSpells=[
    {id:'ice-orb',name:'Tuyết táng',kind:'attack',style:'snowball',rank:'SS',sequence:[...'zx'],cooldown:45,cost:20,damage:0,count:0,requiresSnowFull:true,speed:3.1,radius:4.8,subtitle:'Chỉ mở sau 90 giây gọi tuyết · gom tuyết thành cầu khổng lồ tự đuổi địch, không thể cản · khi lăn chặn mọi chiêu lao tới · chôn vùi rồi lăn đi để kết thúc trận'},
    {id:'ice-lance',name:'Hàn Băng Phong Tỏa',kind:'attack',style:'icebind',snowCost:1,rank:'B',sequence:[...'zxs'],cooldown:8,cost:28,damage:0,count:1,size:.38,speed:27,controlDuration:1.5,subtitle:'Gom tuyết trong không khí trong 0,75 giây rồi bắn tinh thể · khóa di chuyển và kết ấn 1,5 giây, không gây sát thương'},
    {id:'ice-volley',name:'Huyễn Sương Vô Ảnh',kind:'defense',style:'icefog',snowCost:2,rank:'S',sequence:[...'zxce'],cooldown:11,cost:34,damage:0,count:0,duration:5,subtitle:'Sương phủ kín người trong 5 giây · bản thân nhìn xuyên sương, đối thủ chỉ thấy ảo ảnh ở vị trí lệch'},
    {id:'ice-barrier',name:'Huyền Băng Thiên Bích',kind:'defense',style:'icewall',snowCost:2,rank:'A',sequence:[...'zxv'],cooldown:12,cost:24,damage:0,count:0,shield:120,duration:8,subtitle:'Tường tinh thể mọc từ mặt đất trong 0,82 giây · chắn đòn từ phía trước, 120 độ bền, tồn tại 8 giây'},
    {id:'ice-reflect',name:'Thiên Địa Tuyết Táng',kind:'attack',style:'snowstorm',rank:'SS',sequence:[...'zxwqwq'],cooldown:15,cost:50,damage:0,count:0,oncePerMatch:true,snowTime:90,subtitle:'6 ấn · gọi tuyết một lần mỗi trận, không gây sát thương · tích tối đa 90 tuyết, mỗi giây thêm 1 · phong tỏa tốn 1 tuyết, sương và tường băng tốn 2 tuyết, kéo dài thời gian mở Tuyết táng'}
  ].map(s=>({...s,element:'ice',glyph:'氷',color:'#a6edff',heal:0,shield:s.shield||0,subtitle:s.subtitle+(s.snowCost?' · tốn '+s.snowCost+' tuyết từ mưa tuyết':'')}));
  const spells = elements.flatMap(el => el.id === 'wood' ? woodSpells : el.id === 'ice' ? iceSpells : el.id === 'fire' ? fireSpells : el.id === 'water' ? waterSpells : el.id === 'lightning' ? lightningSpells : el.id === 'wind' ? windSpells : el.id === 'earth' ? earthSpells : el.id === 'light' ? lightSpells : el.id === 'dark' ? darkSpells : variants.map((v, i) => ({
    ...v, id: el.id + '-' + v.style, name: titles[el.id][i], element: el.id,
    glyph: el.glyph, color: el.color, speed: el.speed * (v.style === 'lance' ? 1.3 : 1),
    damage: Math.round(v.damage * el.power), sequence: [...el.prefix, ...v.suffix],
    shield: v.shield ? Math.round(v.shield * (el.id === 'earth' ? 1.2 : 1)) : 0,
    heal: v.kind === 'defense' && ['wood', 'light'].includes(el.id) ? 12 : 0
  })));
  const defaultLoadout = ['fire-volley', 'water-lance', 'lightning-volley', 'earth-barrier', 'ice-reflect'];
  const chakraRegen=4,cooldownByRank={D:4,C:8,B:10,A:12,S:20,SS:35};
  const elementalDurations={burn:6,static:8};
  for(const spell of spells)spell.cooldown=spell.cooldown??cooldownByRank[spell.rank]??6;
  for(const spell of spells){if(spell.element==='fire'&&spell.kind==='attack')spell.subtitle+=' • trúng máu tích 1 tầng bỏng/viên, tối đa 5, mỗi tầng '+elementalDurations.burn+' giây';if(spell.element==='lightning'&&spell.kind==='attack')spell.subtitle+=' • trúng máu tích 1 tĩnh điện, tối đa 3, mỗi điểm '+elementalDurations.static+' giây';}
  const shuriken={name:'Phi tiêu',damage:2,speed:36,size:.075,interval:.45};
  function validateLoadout(ids) {
    if (!Array.isArray(ids) || ids.length < 1 || ids.length > 5) return { ok: false, reason: 'Chọn từ 1 đến 5 chiêu.' };
    if (new Set(ids).size !== ids.length || ids.some(id => !spells.some(s => s.id === id))) return { ok: false, reason: 'Bộ chiêu không hợp lệ hoặc bị trùng.' };
    const attack = ids.filter(id => spells.find(s => s.id === id).kind === 'attack').length, defense = ids.length - attack;
    return { ok: true, attack, defense };
  }
  class GameRules {
    constructor(ids = defaultLoadout,options={}) {
      this.maxChakra=Number.isFinite(options.maxChakra)&&options.maxChakra>=100?options.maxChakra:100;
      this.cooldownOverrides=options.cooldownOverrides||{};
      this.sequence = []; this.chakra = this.maxChakra; this.time = 0; this.lastSeal = -Infinity; this.cooldown = 0; this.casts = 0;this.usedOnce=new Set();
      this.cooldowns={};this.shurikenCooldown=0;this.shurikenThrows=0;
      const result = this.setLoadout(ids);
      if (!result.ok) throw new RangeError(result.reason);
    }
    setLoadout(ids) {
      const result = validateLoadout(ids);
      if (!result.ok) return result;
      this.loadout = [...ids]; this.spells = ids.map(id => {const spell=spells.find(s => s.id === id),override=this.cooldownOverrides[id];return Number.isFinite(override)&&override>0&&override<spell.cooldown?{...spell,cooldown:override}:spell;}); this.clear(); return result;
    }
    tick(dt) {
      this.time += dt; this.chakra = Math.min(this.maxChakra, this.chakra + dt * chakraRegen); this.cooldown = Math.max(0, this.cooldown - dt);this.shurikenCooldown=Math.max(0,this.shurikenCooldown-dt);
      if(this.shurikenCooldown<1e-7)this.shurikenCooldown=0;
      for(const id of Object.keys(this.cooldowns)){this.cooldowns[id]=Math.max(0,this.cooldowns[id]-dt);if(this.cooldowns[id]<1e-7)delete this.cooldowns[id];}
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
      this.shurikenCooldown=shuriken.interval;this.shurikenThrows++;return {ok:true,weapon:shuriken};
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
      if (spell.requiresBurn && !context.burnStacks) return {ok:false,reason:'burn'};
      if (spell.requiresStatic && !context.staticStacks) return {ok:false,reason:'static'};
      if (spell.style==='shadowclone' && context.shadowCloneCount>=spell.maxClones && !context.shadowUpgrades) return {ok:false,reason:'cloneLimit'};
      if (this.cooldown > 0) return { ok: false, reason: 'cooldown' };
      if (this.chakra < spell.cost) return { ok: false, reason: 'chakra' };
      this.chakra -= spell.cost; this.cooldown = 1;this.cooldowns[spell.id]=spell.cooldown; this.casts++;if(spell.oncePerMatch)this.usedOnce.add(spell.id); this.clear(); return { ok: true, spell };
    }
  }
  class Fighter {
    constructor(maxHp = 300) { this.maxHp = maxHp; this.hp = maxHp; this.shield = 0; this.shieldTime = 0; this.reflect = 0; this.waterControlTime = 0; this.darkControlTime=0; this.windControlTime=0; this.earthControlTime=0;this.iceControlTime=0;this.woodControlTime=0; this.invulnerableTime=0; this.color = '#ffffff'; this.defenseElement = ''; this.burns=[];this.staticCharges=[];this.lightningControlTime=0;this.boatControlTime=0;this.magneticTime=0;this.magneticDelay=0;this.ignitionTime=0;this.ignitionLevel=0; }
    get controlTime(){return Math.max(this.waterControlTime,this.darkControlTime,this.windControlTime,this.earthControlTime,this.iceControlTime||0,this.woodControlTime||0,this.lightningControlTime,this.boatControlTime);}
    set controlTime(value){this.waterControlTime=value;}
    get staticStacks(){return this.staticCharges.length;}
    get controlSource(){if(this.snowBuried)return 'Tuyết táng';if(this.lightningControlTime>0&&this.lightningControlTime>=this.controlTime)return 'Lôi Mạch Tê Liệt';if(this.boatControlTime>0&&this.boatControlTime>=this.controlTime)return 'Thiên Chu Trấn Hải';if(this.woodControlTime>0&&this.woodControlTime>=Math.max(this.waterControlTime,this.darkControlTime,this.windControlTime,this.earthControlTime,this.iceControlTime))return 'Vạn Đằng Phược Ấn';return this.iceControlTime>0&&this.iceControlTime>=Math.max(this.waterControlTime,this.darkControlTime,this.windControlTime,this.earthControlTime)?'Hàn Băng Phong Tỏa':this.earthControlTime>0&&this.earthControlTime>=Math.max(this.waterControlTime,this.darkControlTime,this.windControlTime)?'Địa Bộc Thiên Tinh':this.windControlTime>0&&this.windControlTime>=Math.max(this.waterControlTime,this.darkControlTime)?'Cuồng Phong Toàn Vũ':this.darkControlTime>0&&this.darkControlTime>=this.waterControlTime?'U Ảnh Huyễn Tượng':'Huyền Thủy Lao Lung';}
    get magneticActive(){return this.magneticTime>1e-7&&this.magneticDelay<=1e-7;}
    tick(dt) {
      this.burns=this.burns.map(t=>t-dt).filter(t=>t>1e-7);
      this.staticCharges=this.staticCharges.map(t=>t-dt).filter(t=>t>1e-7);
      const magneticDt=Math.max(0,dt-this.magneticDelay);this.magneticDelay=Math.max(0,this.magneticDelay-dt);this.magneticTime=Math.max(0,this.magneticTime-magneticDt);
      for(const key of ['lightningControlTime','boatControlTime','ignitionTime','woodControlTime','iceControlTime','waterControlTime','darkControlTime','windControlTime','earthControlTime','invulnerableTime','shieldTime']){this[key]=Math.max(0,(this[key]||0)-dt);if(this[key]<1e-7)this[key]=0;}
      if(!this.ignitionTime)this.ignitionLevel=0;
      if (!this.shieldTime) { this.shield = 0; this.reflect = 0; }
    }
    applyElementHit(element,result,style){
      if(!result||!(result.damage>0)||result.immune||result.reflected)return;
      if(element==='fire'&&style!=='ignite'){
        // At the cap, a fresh hit replaces only the oldest individual layer.
        if(this.burns.length>=5)this.burns.shift();this.burns.push(elementalDurations.burn);
      }
      if(element==='lightning'&&style!=='discharge'){
        if(this.staticCharges.length>=3)this.staticCharges.shift();this.staticCharges.push(elementalDurations.static);
      }
    }
    ignite(){
      if(!this.burns.length||this.invulnerableTime>0)return null;
      const stacks=this.burns.length;this.burns=[];this.ignitionLevel=stacks;this.ignitionTime=1.1;
      return {stacks,damage:[10,20,30,45,60][stacks-1]};
    }
    discharge(){
      if(!this.staticStacks||this.invulnerableTime>0)return null;
      const stacks=this.staticStacks,stun=[.5,1,2][stacks-1],magnetic=[3,5,7][stacks-1];this.staticCharges=[];
      this.lightningControlTime=Math.max(this.lightningControlTime,stun);this.magneticDelay=stun;this.magneticTime=magnetic;
      return {stacks,stun,magnetic};
    }
    elementalState(){return {burnStacks:this.burns.length,burnTimes:[...this.burns],staticStacks:this.staticStacks,staticTimes:[...this.staticCharges],lightningControlTime:this.lightningControlTime,boatControlTime:this.boatControlTime,magneticTime:this.magneticTime,magneticDelay:this.magneticDelay,magneticActive:this.magneticActive,ignitionTime:this.ignitionTime,ignitionLevel:this.ignitionLevel};}
    defend(spell) { this.shield = spell.shield; this.shieldTime = spell.duration; this.reflect = spell.style === 'reflect' ? 1 : 0; this.color = spell.color; this.defenseElement = spell.element; this.hp = Math.min(this.maxHp, this.hp + spell.heal); }
    receive(damage, reflected = false, ignoreShield=false, element=null) {
      if(this.invulnerableTime>0)return {damage:0,absorbed:0,reflected:false,restored:false,immune:true};
      if (this.reflect && !reflected) { this.reflect--; return { damage: 0, reflected: true }; }
      const resistance=Math.max(0,Math.min(.8,Number(this.resistances?.[element])||0));damage=Math.max(0,damage)*(1-resistance);
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
  root.SealGameCore = { keys, elements, spells, defaultLoadout, validateLoadout, GameRules, Fighter, chakraRegen, cooldownByRank, elementalDurations, shuriken, intersectFireWall, intersectsWave, meteorTarget, projectileTimeStep };
})(globalThis);
