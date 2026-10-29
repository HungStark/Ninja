// One authored resident per landmark, added after the villages' coordinates expand.
const residents={
 nameless:{
  terraces:['Bác Hòa','Người giữ ruộng cũ','farmer','farming','Đất còn giữ được hạt giống thì làng còn có ngày xanh trở lại. Tôi đang vun lại những luống bị giẫm nát.'],
  'tea-road':['Cô Trà','Chủ quán trà mái vỡ','merchant','market','Mái quán chưa vá xong, nhưng trà thì vẫn nóng. Khách đi qua đây thường kể tin từ ba làng.'],
  'old-bridge':['Thợ Mộc Tín','Người vá cầu sau chiến tranh','carpenter','repair','Tôi thay từng tấm ván một. Cây cầu này từng đưa quân lính qua sông; mong lần tới chỉ còn khách bộ hành.'],
  'bell-shrine':['Ông Tịnh','Người trông miếu chuông','priest','reading','Trên chuông có tên những người góp đồng đúc miếu. Tôi đang chép lại để chiến tranh không xóa mất họ.'],
  'war-cemetery':['Mẹ · Bà Liên','Mẹ của người giữ ấn','mourner','mourning','Cha và em trai con nằm ở đây, từ cuộc chiến giữa ba làng Hỏa, Thủy và Lôi. Mẹ không mong con trả thù; mẹ chỉ mong không gia đình nào phải chịu cảnh chia lìa như chúng ta nữa.']
 },
 water:{
  'floating-market':['Chị Vân','Người bán cá chợ nổi','merchant','market','Cá mới từ bến về đấy. Gặp luồng nước sâu thì tìm bè, đừng thử lội ngang sông.'],
  lotus:['Ông Sen','Người hái sen','gardener','watering','Tôi chăm sen để làm trà và thuốc. Rễ sen giữ bùn bên bờ, còn nước giữa dòng thì sâu lắm.'],
  falls:['Cụ Du','Người ghi chép dòng thác','scribe','reading','Nước thác đổi giọng sau mỗi cơn mưa. Tôi chép lại để người chèo bè biết ngày nào nên nghỉ.'],
  shipyard:['Thợ Cả Bình','Người đóng thuyền','carpenter','repair','Thuyền tốt phải biết nhường theo sóng. Tôi đang bịt lại những khe ván trước chuyến ra cửa sông.'],
  'net-islet':['Cô Lưới','Người vá lưới trên đảo','tailor','mending','Một mắt lưới rách đủ làm mất cả mẻ cá. Tôi vá lưới ở đây mỗi buổi chiều.'],
  'fishing-harbor':['Bác Ngạn','Ngư dân bến cá','fisher','fishing','Cứ nhìn chiếc phao mà giữ kiên nhẫn. Bến này có cá lớn, nhưng người làng luôn nhường đường cho bè qua.'],
  'pearl-shore':['Chị Châu','Người lựa ngọc trai','merchant','sorting','Viên ngọc đẹp nhất thường nằm trong con trai xấu xí nhất. Tôi chỉ nhặt những vỏ đã dạt vào bờ.'],
  'reed-estuary':['Ông Sậy','Người trông cửa sông','boatman','lookout','Từ đây tôi nhìn được bè đi cả hai nhánh. Sương xuống thì cứ theo đèn bến mà về.']
 },
 fire:{
  forge:['Thợ rèn Lâm','Thợ rèn Xóm Lò Đỏ','smith','forging','Lưỡi sắt phải được nung rồi gõ đều tay. Bỏ một nhịp là nó cong ngay khi nguội.'],
  maple:['Cô Phong','Người giữ vườn phong','gardener','watering','Lá phong đỏ quanh năm nhờ hơi ấm trong đất. Tôi vẫn tưới từng gốc trước lúc nắng lên.'],
  basalt:['Thợ Đá Cương','Người đẽo huyền vũ','miner','mining','Đá nguội có thớ riêng của nó. Gõ đúng đường thì chỉ một nhát cũng tách được mặt phẳng.'],
  crater:['Ông Hồng','Người canh miệng núi lửa','engineer','lookout','Khi khói chuyển màu, tôi đánh hiệu cho cả làng. Đừng bước xuống những vệt đất còn ánh đỏ.'],
  'red-cliff':['Cô Nham','Người kiểm tra đường leo','carpenter','repair','Tôi kiểm tra từng gờ đá ở chân vách. Lên cao thì chọn chỗ đặt chân rồi mới nhảy.'],
  'summit-lotus':['Cụ Liên','Người chăm Hồng Liên trên đỉnh','gardener','watering','Hoa trên đỉnh sống bằng sương đêm. Người leo tới đây xứng đáng được ngồi nghỉ ngắm cả thung lũng.'],
  'lava-quarry':['Thợ Mỏ Lực','Người khai thác đá núi lửa','miner','mining','Chúng tôi chỉ lấy đá đã nguội. Tiếng rạn mảnh hơn tiếng cuốc là dấu phải rời đi ngay.'],
  'ash-outpost':['Chú Tro','Người giữ trạm ven tro','lantern','warming','Tro phủ kín đường rất nhanh. Tôi giữ bếp ở đây để khách lỡ bước vẫn tìm được một chỗ ấm.']
 },
 lightning:{
  relay:['Kỹ thuật viên Túc','Thợ bảo trì trạm tiếp lôi','engineer','repairing','Mối nối lỏng sẽ làm cả dãy đèn tắt. Tôi siết lại dây đồng trước khi giông tới.'],
  crystals:['Cô Tinh','Người nghiên cứu tử tinh','scribe','reading','Mỗi tinh thể rung một nhịp khác nhau. Những con số này giúp chúng tôi dự đoán lúc sét đánh.'],
  observatory:['Ông Vọng','Nhà quan sát trời giông','engineer','observing','Khoảng mây mở phía tây cho thấy những ngôi sao đầu tiên. Tôi đợi đúng lúc ấy để chỉnh kính.'],
  'storm-spire':['Thợ Tháp Cẩn','Người kiểm tra cột dẫn sét','engineer','repairing','Dòng sét phải có lối đi xuống đất. Đừng chạm vào dây khi trời đang sáng tím.'],
  'rain-valley':['Cô Vũ','Người chăm vườn sau mưa','gardener','watering','Mưa ở đây đến rất nhanh. Tôi tranh thủ chăm cây giữa hai đợt giông.'],
  'copper-ridge':['Thợ Đồng Dư','Người nối dây trên sống núi','engineer','repairing','Đường dây này nối các trạm đèn về làng. Tôi luôn kiểm tra chốt trước khi xuống núi.'],
  'storm-shelter':['Bà Ấm','Người giữ trạm trú giông','elder','warming','Ngồi sưởi một lát rồi hãy đi. Trong cơn giông, chậm lại đôi khi là cách về nhà nhanh nhất.'],
  'thunder-meadow':['Cậu Sấm','Người đếm sét ngoài đồng','scribe','observing','Tôi đếm nhịp từ ánh chớp tới tiếng sấm rồi ghi lại. Cơn giông hôm nay còn ở khá xa.']
 },
 earth:{
  potters:['Nghệ nhân Đào','Thợ gốm đất đỏ','potter','pottery','Bàn tay đừng ép đất quá mạnh. Cứ giữ đều nhịp, chiếc bình sẽ tự lên hình.'],
  quarry:['Thợ Mỏ Thạch','Người chọn đá trong mỏ','miner','mining','Đá tốt nghe vang và trong. Tôi đánh dấu từng lớp để đoàn thợ không đào lạc đường.'],
  'stone-arch':['Ông Văn','Người đọc chữ khắc cổ','scribe','reading','Những nét khắc kể về đoàn người đầu tiên vượt hẻm núi. Đá nhớ được nhiều hơn chúng ta tưởng.'],
  'buried-city':['Cô Sa','Người khảo sát phế thành','scribe','sorting','Tôi chỉ phủi cát bằng chổi mềm. Một mảnh gốm nhỏ cũng có thể ghép lại tên của cả một phố.'],
  'great-cave':['Thợ Hang Đăng','Người giữ đèn trong Đại Hang','lantern','lookout','Tôi luôn chờ ở đoạn rộng này. Nếu thấy ánh đèn thì cứ theo lối đá mà trở ra cửa hang.'],
  'stone-wastes':['Thợ Tạc Khuê','Người tạc đá ngoài bãi','miner','mining','Khối đá này sẽ thành bia chỉ đường. Đất đá nhiều đến đâu cũng cần có người chỉ lối.'],
  'cave-crystals':['Cô Khoáng','Người ghi mạch tinh khoáng','scribe','reading','Tôi vẽ lại đường nứt thay vì bẻ tinh thể. Ánh sáng của chúng giúp người sau tìm được đường về.']
 },
 wind:{
  windmills:['Thợ Quạt Phan','Người sửa guồng gió','carpenter','repair','Cánh quạt nhẹ nhưng chốt phải chắc. Tôi thay lại thanh gỗ bị gió xoắn cong hôm qua.'],
  'kite-meadow':['Cô Diều','Người làm diều đồng cỏ','tailor','mending','Buộc dây lệch một chút là diều nghiêng ngay. Tôi đang vá cánh cho bọn trẻ trước buổi thả chiều.'],
  'sky-ruins':['Ông Thiên','Người chép dấu tích trên mây','scribe','reading','Từng phiến đá có một dấu khắc. Tôi chép chúng lại, mong ghép được câu chuyện của ngôi đền.'],
  'howling-ridge':['Bác Hướng','Người theo dõi luồng gió','ranger','lookout','Tiếng gió qua khe đá báo được cơn đổi mùa. Đứng yên một lát, con sẽ nghe ra từng giọng.'],
  'sky-house-west':['Bà Mây','Người trồng vườn trên mây','gardener','watering','Nước trên này quý lắm. Tôi hứng sương vào chum rồi chia đều cho từng chậu cây.'],
  'sky-house-east':['Thợ Buồm Tơ','Người khâu bóng khí','tailor','mending','Mũi chỉ phải kín mà vẫn mềm theo gió. Tôi kiểm tra đường may trước mỗi lần thay dây neo.'],
  'sky-house-north':['Người Gác Phong','Người giữ trạm gió trên cao','engineer','lookout','Từ sàn này nhìn thấy cả ba đường mây. Tôi báo hướng gió cho những căn nhà đang neo dưới đồi.'],
  'wind-farm':['Bác Mạch','Người giữ cánh đồng cối xay','farmer','farming','Bột mới được xay nhờ ngọn gió đêm. Tôi đang dọn phần rơm còn sót ngoài luống.']
 },
 light:{
  'prism-garden':['Thợ Kính Lăng','Người lau lăng kính','engineer','repairing','Một vết bụi nhỏ cũng làm tia sáng lệch đi. Lau sạch rồi mới chỉnh mặt kính.'],
  'sun-plaza':['Thư lại Nhật','Người ghi lịch mặt trời','scribe','reading','Tôi ghi vị trí bóng kim mỗi buổi trưa. Khi hòa bình trở lại, lễ hội sẽ dùng cuốn lịch này.'],
  'glass-bridge':['Chú Sáng','Người bảo trì cầu kính','carpenter','repair','Tôi kiểm tra các chốt giữ kính mỗi ngày. Cầu trong suốt không có nghĩa là nó yếu đâu.'],
  'sun-temple':['Cô Dương','Người dâng hoa trong điện','mourner','offering','Tôi thay hoa trước giờ chuông sáng. Ai bước vào điện cũng có quyền cầu một ngày yên ổn.']
 },
 ice:{
  hearth:['Bà Hồng','Người giữ bếp xóm tuyết','elder','warming','Đưa tay lại gần bếp thôi, đừng sát quá. Chúng tôi luôn chừa một chỗ cho người lỡ đường.'],
  'frozen-lake':['Bác Câu Bạc','Người câu cá trên hồ băng','fisher','fishing','Phải kiên nhẫn hơn cả lúc nước còn chảy. Tôi kiểm tra mặt băng trước khi mở chỗ thả câu.'],
  'crystal-cave':['Cô Ngân','Người nghiên cứu nhũ băng','scribe','reading','Tôi ghi lại màu của từng tầng băng. Trong đó còn dấu của những mùa đông rất xa.'],
  glacier:['Ông Tuyến','Người gác sông băng','ranger','lookout','Vách băng trông đứng yên nhưng vẫn chuyển động. Tôi cắm dấu để người làng biết đoạn nào đã nứt.'],
  'polar-sea':['Ngư dân Hải','Người trông bến biển băng','fisher','fishing','Cá dưới biển lạnh bơi chậm mà khỏe lắm. Tôi ngồi đây chờ gió dịu trước lúc thu dây.'],
  'snow-ridge':['Cô Nỉ','Người vá áo cho đoàn vượt tuyết','tailor','mending','Một đường chỉ kín giữ lại được rất nhiều hơi ấm. Tôi vá áo cho những người sắp qua sống núi.']
 },
 wood:{
  'root-quarter':['Thợ Rễ Bình','Người sửa nhà ôm gốc cây','carpenter','repair','Tôi kê sàn theo đường rễ, chẳng chặt chúng đi. Nhà trong làng phải lớn lên cùng cây.'],
  'herb-garden':['Dược nông Hạ','Người chăm vườn thuốc','gardener','watering','Lá non cần ít nước hơn người ta tưởng. Tôi chăm đúng mùa để thuốc không mất mùi.'],
  bamboo:['Thợ Trúc An','Người đan giỏ tre','tailor','mending','Tre chẻ mỏng rồi mới đan được sít. Chiếc giỏ này sẽ theo đoàn hái thuốc lên rừng.'],
  'elder-tree':['Cụ Niên','Người ghi chuyện cổ thụ','scribe','reading','Mỗi vòng gỗ là một năm rừng đã sống. Tôi kể lại những mùa mà người làng còn nhớ.'],
  'heart-tree-house':['Cô Lá','Người chăm hiên nhà trên cây','gardener','watering','Tôi tưới những giỏ lá trên hiên. Cứ theo cầu thang mà lên, trên này nhìn được cả làng.'],
  'deep-canopy':['Kiểm lâm Tùng','Người giữ đường rừng','ranger','lookout','Tôi đếm những lối mòn còn thông sau mưa. Nếu tán cây che kín trời, cứ tìm dấu buộc trên cành thấp.']
 },
 dark:{
  'lantern-street':['Thợ Đèn Đốm','Người sửa đèn phố đêm','engineer','repairing','Đèn ở đây không chỉ để soi đường. Người xa quê nhìn thấy chúng là biết vẫn còn người chờ mình.'],
  'mirror-pool':['Cô Gương','Người ghi bóng trăng','scribe','reading','Mặt hồ giữ hình trăng ngay cả khi mây kéo qua. Tôi ngồi đây để ghi những đêm nó thay đổi.'],
  memorial:['Ông Tưởng','Người dâng hoa ở đài tưởng niệm','mourner','mourning','Tôi đến thay hoa và đọc từng cái tên. Người đã khuất không nên chỉ còn là một con số trong chiến tranh.'],
  'moon-temple':['Bà Nguyệt','Người giữ hương điện trăng','priest','offering','Tôi thắp hương cho những người chưa trở lại. Đêm có dài đến đâu thì ngọn đèn vẫn cần được giữ.']
 }
};
export function landmarkResidents(village,zones){return zones.map((zone,index)=>{
 const spec=residents[village]?.[zone.id];if(!spec)throw new Error('Missing resident for '+village+':'+zone.id);
 const [name,role,job,activity,dialogue]=spec,platform=zone.platform,offset=platform?[1.8,1.6]:zone.id==='war-cemetery'?[-3,5.8]:zone.id==='fishing-harbor'?[0,-13.5]:[index%2?-5:5,4.5];
 return {id:village+'-resident-'+zone.id,name,role,kind:'lore',landmark:zone.id,activity,dialogue,x:zone.x+offset[0],z:zone.z+offset[1],...(platform?{platform}:{}),...(zone.id==='summit-lotus'?{elevation:36}:{}),yaw:platform?0:zone.id==='war-cemetery'?Math.atan2(-zone.x,-zone.z)-Math.PI/2:Math.PI,
  appearance:{job,female:village==='nameless'&&zone.id==='war-cemetery'||index%3===1,height:2.8+(index%5)*.09,width:.94+(index%3)*.08,hairStyle:['short','bun','braid','ponytail'][index%4],...(job==='mourner'?{age:'elder',hair:'#bdb6a6',shawl:true}:{}),...(village==='nameless'&&zone.id==='war-cemetery'?{kneelingOffering:true}:{}),...(job==='smith'?{width:1.23,hat:'band',beard:'short',female:false}:{}),...(job==='miner'?{hat:'helmet'}:{}),...(job==='fisher'?{hat:'straw'}:{})}};
});}
