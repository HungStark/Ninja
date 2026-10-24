import {REGIONS} from './adventure-world.js';
import {gainExperience,regionElement} from './progression.js';
import {botHealth} from './enemy-balance.js';

export const HA_LY={id:'ha-ly',name:'Hạ Ly',role:'Nữ ninja Làng Hỏa · Bạn đồng hành',village:'fire',kind:'ninja',female:true,coat:'#93445b',hair:'#29202c'};
const stage=(title,body,spot,style,extra={})=>({title,body,spot,style,...extra});
const choice=(label,correct,feedback)=>({label,correct,feedback});
export const VILLAGE_EVENTS={
  water:{title:'Dòng nước không nói dối',speaker:'Người lái đò Mộc An',stages:[
    stage('Lời cầu cứu ở bến nước','Mộc An tìm thấy thuốc mê trong thùng nước cứu trợ. Dân làng đang đổ lỗi cho người Hỏa, nhưng dấu niêm phong có vẻ bị làm giả. Hãy kiểm tra kiện hàng trước khi có thêm người bị bắt.',0,'water'),
    stage('Dấu sáp trên kiện hàng','Dưới lớp sáp xanh là sợi chỉ tím. Một đường ống bị nối ngược đang đưa nước bẩn từ kho ra bến. Cần khóa nhánh từ kho, giữ nhánh vào khu dân cư.',1,'crate'),
    stage('Chặn dòng nước bị đầu độc','Hai van cùng dẫn về bến. Mở nhầm van sẽ đẩy nước bẩn tới dân làng. Dấu bùn tím nằm trên đường ống từ kho hàng.',0,'water',{choices:[choice('Khóa đường ống từ kho, giữ nước sạch',true),choice('Xả toàn bộ nước về khu dân cư',false,'Mộc An giữ tay bạn lại: phải chặn nguồn bẩn trước, không xả nó về phía những ngôi nhà.')]}),
    stage('Người làm chứng bên bến','Mộc An nhận ra kẻ giao hàng mang huy hiệu hình trăng khuyết. Ông đồng ý đưa dân làng ra khỏi bến và làm chứng rằng vụ việc không phải do Làng Hỏa. Đường tới hộ vệ đã mở.',0,'water')
  ]},
  fire:{title:'Người con gái giữa tro tàn',speaker:'Hạ Ly',stages:[
    stage('Tiếng gọi sau cổng Hỏa','Một nữ ninja bị thương đang trốn sau đống hàng cháy. Nàng tên Hạ Ly, vừa mang theo chứng cứ về những kẻ giả danh các làng thì bị truy sát. Hai kẻ áo đen đang quay lại tìm nàng.','entrance','injured'),
    stage('Bảo vệ Hạ Ly','Hạ Ly không thể đứng dậy. Hai kẻ truy sát chặn lối ra và đòi bạn giao nàng cho chúng. Hãy đánh bại cả hai để đưa nàng tới nơi an toàn.','entrance','injured',{battle:true,enemy:'Đội truy sát Hắc Y'}),
    stage('Thuốc cho vết thương','Dù toán truy sát đã bị đẩy lui, lưỡi dao tẩm độc vẫn khiến Hạ Ly sốt cao. Nàng chỉ bạn tới túi thuốc Hỏa Tâm được giấu cạnh khu dân cư. Mang thuốc về để cầm máu và giải độc.',0,'medicine'),
    stage('Một người cùng đường','Sau khi được băng bó, Hạ Ly trao cho bạn mảnh mật thư có dấu trăng khuyết. Nàng cũng muốn tìm kẻ đứng sau chiến tranh và xin được cùng bạn du hành. Từ đây hai người có thể bảo vệ và lắng nghe nhau.','entrance','injured',{recruit:true})
  ]},
  lightning:{title:'Đêm cao nguyên tắt sáng',speaker:'Kỹ sư Tử Khang',stages:[
    stage('Trạm tiếp lôi mất tín hiệu','Ba cột dẫn sét bị nối sai khiến khu dân cư tối đen. Tử Khang phát hiện một cầu chì bị đổi thành tinh thể tím lạ. Cần cô lập nguồn trước khi sửa mạch.',0,'lightning'),
    stage('Cô lập dòng điện','Dây nối đất còn nguyên nhưng cầu tiếp lôi đang phóng tia. Tử Khang dặn: nối đất trước, mở cầu nguồn sau.',0,'lightning',{choices:[choice('Nối đất rồi ngắt cầu nguồn',true),choice('Chạm thẳng vào tinh thể đang phóng điện',false,'Tử Khang kéo bạn lùi lại. Điện chưa được dẫn xuống đất; hãy xử lý dây nối đất trước.')]}),
    stage('Khôi phục đường truyền','Dòng sáng phải chạy từ nguồn qua bộ ổn định rồi mới tới nhà dân. Một đường tắt sẽ làm cầu chì cháy lần nữa.',1,'lightning',{choices:[choice('Nguồn → bộ ổn định → khu dân cư',true),choice('Nối nguồn thẳng vào khu dân cư',false,'Mạch lóe sáng rồi tắt. Không thể bỏ qua bộ ổn định.')]}),
    stage('Ánh sáng trở lại cao nguyên','Tử Khang khôi phục tín hiệu và tìm thấy dấu trăng khuyết trên tinh thể giả. Bạn đã giữ được khu dân cư khỏi một vụ quá tải có chủ ý.',0,'lightning')
  ]},
  earth:{title:'Tiếng gõ sau vách đá',speaker:'Thợ mỏ Sơn',stages:[
    stage('Những người mắc kẹt','Có tiếng gõ từ hầm sập. Sơn nghe được ba tiếng liên tục: tín hiệu còn người sống. Trước khi phá đá, cần kiểm tra cột chống đã nứt.',0,'earth'),
    stage('Gia cố cửa hầm','Cột trái nứt sâu, cột phải vẫn chịu lực. Phá ngay tảng đá sẽ khiến mái hầm đổ xuống những người bên trong.',0,'earth',{choices:[choice('Chống cột trái rồi chèn mái hầm',true),choice('Phá ngay tảng đá lớn ở cửa',false,'Đá vụn rơi xuống. Sơn yêu cầu dừng lại và gia cố cột chống trước.')]}),
    stage('Kéo dây cứu người','Mái hầm đã vững. Bạn đưa dây qua khe đá, kéo từng người ra theo tiếng gõ trả lời. Trong túi người thợ cuối cùng có một mảnh thuốc nổ lạ.',1,'rope'),
    stage('Một vụ sập hầm có chủ ý','Sơn nhận ra thuốc nổ không thuộc kho của làng. Các thợ mỏ sống sót sẽ làm chứng và mở lối cho bạn tới hộ vệ để trình bày sự thật.',0,'earth')
  ]},
  wind:{title:'Mật thư trên cánh diều',speaker:'Người đưa thư Thanh Vũ',stages:[
    stage('Người đưa thư mất tích','Thanh Vũ vừa trở về sau một cuộc truy đuổi. Cánh diều mang lời cầu cứu bị cắt dây trước khi tới tháp gió. Hãy tìm phần thư còn mắc ở đồng cỏ.',0,'wind'),
    stage('Nhặt lại mật thư','Trong ống thư có ba vạch chỉ hướng. Dòng cuối ghi: đọc từ nơi mặt trời mọc, theo gió qua đồng rồi trở về tháp; đừng đọc theo thứ tự mảnh giấy rơi.',1,'letter'),
    stage('Giải mật thư của người đưa tin','Ba mảnh ghi Đông, Đồng Cỏ và Tháp Gió. Ghép theo hành trình ghi ở dòng cuối để tìm nơi tập kết của kẻ phá hoại.',0,'wind',{choices:[choice('Đông → Đồng Cỏ → Tháp Gió',true),choice('Tháp Gió → Đông → Đồng Cỏ',false,'Thanh Vũ chỉ dòng cuối: hành trình bắt đầu ở phía mặt trời mọc.')]}),
    stage('Lá thư được đưa tới','Thông điệp cảnh báo về kẻ mang dấu trăng khuyết đã tới dân làng. Thanh Vũ hứa giữ đường liên lạc giữa các miền, thay vì để tin đồn tiếp tục chia rẽ họ.',0,'wind')
  ]},
  light:{title:'Lời tiên tri trong gương giả',speaker:'Người giữ kính Diệu Minh',stages:[
    stage('Lời tiên tri khiến dân làng sợ hãi','Một tấm kính phát lại cảnh các làng tấn công nhau. Diệu Minh nghi đây là ảo ảnh dựng sẵn. Ánh bình minh thật luôn phản chiếu từ mặt hồ, không từ đèn trong tháp.',0,'light'),
    stage('Xoay gương về ánh sáng thật','Cần hướng mặt kính tới mặt hồ để ánh bình minh phá lớp ảnh giả. Hướng về đèn trong tháp chỉ làm cảnh cũ tiếp tục lặp lại.',1,'light',{choices:[choice('Xoay gương về mặt hồ đón bình minh',true),choice('Tăng sáng ngọn đèn trong tháp',false,'Hình ảnh chiến tranh vẫn lặp lại y hệt. Nguồn sáng ấy đang nuôi ảo ảnh.')]}),
    stage('Mặt sau của tấm kính','Ảo ảnh tan, để lộ con dấu trăng khuyết và bản ghi âm ra lệnh gieo nỗi sợ. Bạn thu lại vật chứng để người giữ kính trình bày trước làng.',1,'letter'),
    stage('Trả lại tiếng nói cho người giữ kính','Diệu Minh công khai sự thật. Những người dân từng đòi đóng cổng đồng ý lắng nghe bạn. Hộ vệ sẽ không còn là lời giải duy nhất cho nỗi sợ của làng.',0,'light')
  ]},
  ice:{title:'Ngọn đèn trong bão tuyết',speaker:'Người mẹ Tuyết Nghi',stages:[
    stage('Đứa trẻ chưa trở về','Con của Tuyết Nghi mang đèn đi đón đoàn lữ hành nhưng lạc trong tuyết. Dấu chân nhỏ rẽ khỏi đường chính ở bờ hồ. Hãy kiểm tra trước khi bão xóa dấu.',0,'ice'),
    stage('Dấu chân bên mặt băng','Những dấu nhỏ đi về rặng tùng, còn các vết kéo nặng dẫn ra hồ. Dưới lớp tuyết ngoài hồ là băng mới, vẫn rất mỏng.',1,'ice',{choices:[choice('Theo dấu chân nhỏ về rặng tùng',true),choice('Đi thẳng theo vết kéo ra hồ băng',false,'Mặt băng rạn dưới chân. Dấu kéo không thuộc đứa trẻ; cần quay về rặng tùng.')]}),
    stage('Ánh đèn sau rặng tùng','Bạn tìm thấy đứa trẻ cùng một người lữ hành bị thương. Họ đang dùng chiếc đèn giữ ấm. Bạn trao áo choàng dự phòng, buộc dây dẫn đường để đưa cả hai trở về.',1,'lantern'),
    stage('Hai người được đợi trở về','Tuyết Nghi ôm con. Người lữ hành cho biết đoàn hàng bị những kẻ áo đen ép rời đường chính. Chiếc đèn nay được treo lại để dẫn người đi muộn về làng.',0,'lantern')
  ]},
  wood:{title:'Vết bệnh dưới rễ cổ thụ',speaker:'Y sư Linh Chi',stages:[
    stage('Khu rừng đang sốt','Một dải rễ đen lan từ giếng thuốc tới cổ thụ. Linh Chi cho rằng có độc chất trong đất. Đốt cây sẽ khiến khói mang độc đi xa hơn; cần tìm mẫu nước trước.',0,'wood'),
    stage('Mẫu nước dưới rễ cây','Mùi đắng trong nước giống chất giữ màu trên một con dấu giả. Bạn lấy mẫu và tìm được bình thuốc giải có ký hiệu lá xanh cạnh rễ cây.',1,'medicine'),
    stage('Chữa rừng thay vì đốt rừng','Linh Chi đã pha thuốc giải. Hãy rửa nguồn nước rồi đặt thuốc ở rễ sống, để cây dẫn thuốc vào phần bị bệnh.',1,'wood',{choices:[choice('Lọc nguồn nước rồi tưới thuốc vào rễ sống',true),choice('Thiêu rụi toàn bộ phần rễ đen',false,'Linh Chi ngăn ngọn lửa: khói sẽ mang độc vào tán rừng. Cần làm sạch nguồn nước trước.')]}),
    stage('Mầm xanh trong đất cũ','Rễ non bắt đầu trở lại. Linh Chi giữ mẫu độc cùng ký hiệu trăng khuyết làm chứng. Người dân hiểu rằng rừng được cứu bằng sự kiên nhẫn, không chỉ sức mạnh.',0,'wood')
  ]},
  dark:{title:'Lời hứa vượt qua bóng tối',speaker:'Người giữ đèn Vân Dạ',stages:[
    stage('Những tiếng gọi không có người','Ở cửa Làng Ám, Vân Dạ cảnh báo rằng màn sương bắt chước giọng người thân để khiến khách quay lại. Chỉ ký ức thật mới giữ bạn khỏi bị dẫn lạc.',0,'dark'),
    stage('Nhớ lời hứa ở quê nhà','Một giọng nói quen thuộc bảo bạn trả thù tất cả các làng. Nhưng trước mộ cha và em trai, bạn đã hứa điều gì với mẹ?',0,'dark',{choices:[choice('Đem lại hòa bình, không để thêm ai chịu mất mát',true),choice('Trả thù bằng mọi giá',false,'Hình bóng nứt ra. Đó không phải lời bạn đã nói với mẹ; hãy nhớ lại điều đưa mình lên đường.')]}),
    stage('Người canh màn sương','Khi ảo ảnh bị phá, kẻ canh cổng lộ diện. Hắn muốn thu hồi những chứng cứ bạn đã mang qua các làng. Hãy vượt qua hắn để tới đền Vô Nguyệt.',1,'dark',{battle:true,enemy:'Kẻ giữ màn sương'}),
    stage('Ghép những dấu trăng khuyết','Vân Dạ xác nhận cùng một tổ chức đã đầu độc nước, phá mạch điện, gây sập hầm và gieo ảo ảnh. Những việc bạn làm ở các làng đã nối thành một lời chứng. Giờ hãy đối mặt Vô Nguyệt.',0,'dark')
  ]}
};

export function villageEventStep(save,id){return Math.max(0,Math.min(VILLAGE_EVENTS[id]?.stages.length||0,save.story?.villageEvents?.[id]||0));}
export function villageEventComplete(save,id){return !VILLAGE_EVENTS[id]||villageEventStep(save,id)>=VILLAGE_EVENTS[id].stages.length;}
export function currentVillageEvent(save,id=save.village){const chapter=VILLAGE_EVENTS[id],step=villageEventStep(save,id);return chapter&&step<chapter.stages.length?{...chapter.stages[step],step,village:id,chapter:chapter.title,speaker:chapter.speaker}:null;}
export function villageEventObjective(save,id=save.village){const e=currentVillageEvent(save,id);return e?{title:e.title,description:e.body,targetVillage:id,targetKind:'village-event',targetId:`story-${id}-${e.step}`} : null;}
export function advanceVillageEvent(save,id,expectedStep,{choiceIndex=0,victory=false}={}){
  const e=currentVillageEvent(save,id);if(!e||save.village!==id||e.step!==expectedStep)return {ok:false,reason:'stage'};
  if(e.battle&&!victory)return {ok:false,reason:'battle'};
  if(e.choices&&!e.choices[choiceIndex]?.correct)return {ok:false,reason:'choice',message:e.choices[choiceIndex]?.feedback||'Hãy xem lại những dấu vết vừa tìm được.'};
  save.story.villageEvents??={};save.story.villageEvents[id]=e.step+1;
  const completed=villageEventComplete(save,id);
  if(completed){save.gold+=45;save.xp+=40;gainExperience(save.progression,regionElement(id),40);if(id==='fire')save.story.companion={recruited:true};}
  return {ok:true,completed,recruited:completed&&id==='fire'};
}
export function eventSpot(id,event){
  if(event.spot==='entrance')return {x:2.4,z:17};
  const zones=REGIONS[id].zones.filter(z=>!z.platform&&!['summit-lotus','red-cliff'].includes(z.id)),zone=zones[Number(event.spot)||0];
  // Use the district approach, already connected to the village road network.
  const distance=Math.max(6,Math.hypot(zone.x,zone.z)-Math.min(zone.radius*.7,9));const a=Math.atan2(zone.x,zone.z);
  return {x:Math.sin(a)*distance,z:Math.cos(a)*distance};
}
export function villageEventEncounter(id){
  if(id==='fire'){
    const squad=[{name:'Hắc Y · Kẻ mang hỏa phù',element:'fire',village:'fire',hp:botHealth(100),spellIds:['fire-volley']},{name:'Hắc Y · Kẻ khóa đường lui',element:'lightning',village:'lightning',hp:botHealth(95),spellIds:['lightning-lance']}].map((n,i)=>({...n,damageMultiplier:.38,sealDelay:.85,restTime:4.2,weaponInterval:4,initialDelay:2+i*2}));
    return {...squad[0],name:'Hai kẻ truy sát Hạ Ly',village:'fire',squad,eventStep:1};
  }
  if(id==='dark')return {name:'Kẻ giữ màn sương',element:'dark',hp:botHealth(230),spellIds:['dark-orb','dark-lance','dark-domain'],damageMultiplier:.8,sealDelay:.6,restTime:2.8,weaponInterval:2.7,eventStep:2};
  return null;
}
