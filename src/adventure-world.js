// Authored places, people and terrain. Base coordinates expand per region below.
export const WORLD_LIMIT = 140;
export const GATE_RADIUS = 62;
export const ARRIVAL_RADIUS = 57;
export function regionMetrics(id){const scale=['water','fire','lightning','wind','earth','ice','wood'].includes(id)?2:1;return {scale,limit:70*scale,size:140*scale,area:(140*scale)**2,gateRadius:70*scale-8,arrivalRadius:70*scale-13};}

// The journey begins with one gift: water coating for ordinary shuriken.
export const STARTER_SPELLS = Object.freeze(['water-barrier']);

export const REGIONS = {
  nameless: {
    subtitle:'Thung lũng ruộng bậc thang · mái đình và cây cầu cổ',
    zones:[
      {id:'terraces',name:'Ruộng Bậc Thang',x:-27,z:23,radius:12,description:'Những thửa ruộng men theo sườn đồi, mỗi tầng giữ một mảnh trời.'},
      {id:'tea-road',name:'Đường Trà Cổ',x:29,z:18,radius:11,description:'Quán trà bên đường buôn cũ còn giữ câu chuyện của những người không tên.'},
      {id:'old-bridge',name:'Cầu Đá Vọng Âm',x:-30,z:-25,radius:12,description:'Cây cầu đá bắc qua khe cạn. Tiếng bước chân dội lại từ vách núi xa.'},
      {id:'bell-shrine',name:'Đồi Chuông Gió',x:25,z:-37,radius:13,description:'Một mái đình đơn độc giữa vòng chuông gió, nơi người xưa gửi lời chúc bình an.'},
      {id:'war-cemetery',name:'Nghĩa Trang Vô Danh',x:-43,z:45,radius:11,description:'Mười sáu nấm mộ dưới những bia đá nghiêng, bên hàng rào gỗ mục. Người làng chôn cả dân thường lẫn người lính của Thủy, Hỏa và Lôi ở đây; nhiều tấm bia vẫn chưa có tên. Những chén hương cũ nhắc rằng hòa bình phải đến trước khi nghĩa trang rộng thêm.'}
    ],
    npcs:[
      {id:'nameless-lan',name:'Bà Lan',role:'Người giữ ký ức',kind:'lore',x:-6,z:5,dialogue:'Làng này từng đón người của cả chín hệ. Muốn biết một miền đất, hãy rời quảng trường và nghe những người sống ở đó.'},
      {id:'nameless-sen',name:'Dược sư Sen',role:'Chủ quán trà',kind:'healer',x:25,z:18,dialogue:'Mời một chén trà ấm. Đường Trà Cổ nối những mái nhà với thế giới ngoài núi; chuyện tốt lành cũng đi theo con đường ấy.'},
      {id:'nameless-trac',name:'Lão Trác',role:'Ẩn sĩ giữ cầu',kind:'mentor',x:-27,z:-23,dialogue:'Đừng vội rút vũ khí. Hãy nghe gió ở ruộng bậc thang và trên đồi chuông, rồi trở về kể ta nghe.'}
    ],
    boss:{id:'nameless-bellwarden',name:'Hộ Vệ Chuông Vỡ',title:'Cự nhân canh thung lũng',x:25,z:-46,hp:1500,rewardGold:150,rewardXp:210,story:'Bộ giáp đá của người giữ đình bị lời nguyền đánh thức. Tiếng chuông vỡ gọi nó lang thang trên đồi mỗi hoàng hôn.'},
    mentor:{npcId:'nameless-trac',spellId:'wind-barrier',clue:'Lắng nghe Ruộng Bậc Thang và Đồi Chuông Gió, rồi trở về Cầu Đá Vọng Âm.',zoneIds:['terraces','bell-shrine'],lesson:'Gió mạnh không chỉ để chém. Hãy xếp những luồng gió thành một bức tường bảo vệ người phía sau. Ta truyền cho con Phong bích.'},
    houses:[[-14,14,4,3],[-21,9,3.5,3],[13,14,3.5,3],[20,11,4,3],[31,25,3.5,3],[-36,20,4,3],[-23,-16,3.5,3],[-37,-19,3.5,3],[20,-29,4,3],[31,-31,3,3]]
  },
  fire: {
    subtitle:'Lòng chảo núi lửa · phố thợ rèn dưới vòm đá bazan',
    zones:[
      {id:'forge',name:'Phố Lò Rèn',x:-28,z:17,radius:12,description:'Những ống khói đồng và búa rèn sáng đỏ làm nên nhịp tim của làng.'},
      {id:'maple',name:'Vườn Phong Tro',x:25,z:24,radius:12,description:'Tán phong đỏ mọc trên đất tro đen. Từng chiếc lá như một đốm lửa yên lành.'},
      {id:'basalt',name:'Cổng Đá Bazan',x:-32,z:-26,radius:13,description:'Các cột đá đen kết thành một vòm khổng lồ, dấu vết của dòng dung nham cổ.'},
      {id:'crater',name:'Miệng Núi Hồng Liên',x:31,z:-34,radius:14,description:'Hơi nóng bốc qua những khe sáng dưới đáy miệng núi. Một vật khổng lồ đang thức giấc.'}
    ],
    npcs:[
      {id:'fire-khoi',name:'Thợ cả Khôi',role:'Chủ lò rèn',kind:'lore',x:-6,z:5,dialogue:'Hỏa làng được xây quanh lòng núi, không phải trên một đồng bằng. Cột bazan phía tây còn già hơn tất cả chúng ta.'},
      {id:'fire-dan',name:'Y nữ Đan',role:'Người hái hồng liên',kind:'healer',x:23,z:21,dialogue:'Hồng liên vẫn mọc ở nơi nóng nhất. Khi mỏi chân, cứ tìm ta dưới những cây phong.'},
      {id:'fire-xich',name:'Xích Vân',role:'Ẩn sư hỏa long',kind:'mentor',x:-26,z:-25,dialogue:'Hãy quan sát nhịp búa ở Phố Lò Rèn và sự tĩnh lặng trong Vườn Phong Tro. Lửa phải có cả sức mạnh lẫn nhẫn nại.'}
    ],
    boss:{id:'fire-ashdragon',name:'Hỏa Long Tro Tàn',title:'Chúa tể lòng núi',x:36,z:-43,hp:1900,rewardGold:210,rewardXp:280,story:'Con rồng bọc vảy bazan trở mình dưới Hồng Liên. Mỗi hơi thở của nó làm những đường nham thạch trên thân sáng rực.'},
    mentor:{npcId:'fire-xich',spellId:'fire-lance',clue:'Khám phá Phố Lò Rèn và Vườn Phong Tro. Xích Vân đợi ở Cổng Đá Bazan.',zoneIds:['forge','maple'],lesson:'Đừng ép lửa thành một viên đạn. Hãy cho nó sống, uốn mình và tìm đường như rồng. Con đã sẵn sàng học Rồng lửa.'},
    houses:[[-19,12,4,3],[-34,10,4,4],[-37,23,4,3],[-23,26,3,3],[17,15,3,3],[33,20,4,3],[-25,-15,4,3],[-39,-20,3,3],[18,-25,4,3],[27,-43,3,3],[11,28,3,3],[39,30,3,3]]
  },
  water: {
    subtitle:'Thủy trấn kênh đào · nhà sàn, bến thuyền và thác xanh',
    zones:[
      {id:'floating-market',name:'Chợ Nổi Bạch Liên',x:26,z:19,radius:13,description:'Những chiếc thuyền chở sen và dược liệu tụ lại bên dãy nhà sàn xanh.'},
      {id:'lotus',name:'Đầm Sen Tĩnh Thủy',x:-27,z:23,radius:13,description:'Mặt đầm phẳng như gương, sen trắng nổi giữa những lối gỗ hẹp.'},
      {id:'falls',name:'Thác Lưu Ly',x:-28,z:-31,radius:14,description:'Dòng thác mảnh rơi từ vách đá xanh thành một màn sương lấp lánh.'},
      {id:'shipyard',name:'Bến Tàu Đắm',x:34,z:-29,radius:14,description:'Bộ sườn một chiến thuyền lớn trồi khỏi bãi cát, tiếng xích neo vẫn vọng trong gió.'}
    ],
    npcs:[
      {id:'water-chau',name:'Bến trưởng Châu',role:'Người giữ thủy lộ',kind:'lore',x:-6,z:5,dialogue:'Chợ nổi phía đông, đầm sen phía tây; đừng nhầm hai nhánh kênh. Con tàu đắm đã chặn thuốc men vào làng suốt nhiều ngày.'},
      {id:'water-ha',name:'Cô Hà',role:'Thầy thuốc chợ nổi',kind:'healer',x:23,z:17,dialogue:'Nước biết nâng đỡ. Dân chợ nổi vẫn góp thuốc cho khách qua đường, dù thủy tặc lấy mất thuyền lớn.'},
      {id:'water-luu',name:'Lưu Thủy',role:'Lão lái đò',kind:'mentor',x:-25,z:-27,dialogue:'Muốn điều khiển dòng nước, trước hết hãy nhìn cách thuyền đi qua Chợ Nổi và cách lá sen nằm yên trên Tĩnh Thủy.'}
    ],
    boss:{id:'water-leviathan',name:'Hải Xà Đắm Thuyền',title:'Bạo chúa thủy lộ',x:43,z:-36,hp:1950,rewardGold:220,rewardXp:290,story:'Hải xà cuộn quanh mỏ neo của chiến thuyền cổ. Vảy xanh và chiếc mào như buồm rách hiện lên qua màn sương nước.'},
    mentor:{npcId:'water-luu',spellId:'water-volley',clue:'Ghé Chợ Nổi Bạch Liên và Đầm Sen Tĩnh Thủy, rồi tìm Lưu Thủy dưới Thác Lưu Ly.',zoneIds:['floating-market','lotus'],lesson:'Dòng nước có thể mang cả một con thuyền, chỉ cần con hiểu trọng tâm của nó. Nhận lấy Ném thuyền, và nhớ bảo vệ những chuyến đò bình yên.'},
    houses:[[17,15,4,3],[33,16,4,3],[25,29,4,3],[39,24,3,3],[-20,15,3,3],[-35,19,4,3],[-28,32,3,3],[-21,-21,4,3],[-37,-25,3,3],[25,-22,4,3],[38,-18,4,3],[12,-15,3,3]]
  },
  lightning: {
    subtitle:'Sống núi giông tố · tháp dẫn sét và rừng tinh thạch',
    zones:[
      {id:'relay',name:'Phố Trạm Tiếp Lôi',x:-26,z:19,radius:12,description:'Dây đồng nối những mái nhà cao, đưa điện từ đỉnh núi về từng ngọn đèn.'},
      {id:'crystals',name:'Rừng Tử Tinh',x:28,z:23,radius:13,description:'Các tinh thể tím cao hơn đầu người rung theo tiếng sấm, như một khu rừng bằng ánh sáng.'},
      {id:'observatory',name:'Đài Thiên Văn',x:-29,z:-29,radius:13,description:'Vòng đồng của đài thiên văn luôn hướng về khe mây mở giữa các đỉnh núi.'},
      {id:'storm-spire',name:'Đỉnh Thiên Lôi',x:28,z:-36,radius:14,description:'Một kim dẫn sét khổng lồ đứng trên sống núi. Ánh điện bò quanh chân tháp.'}
    ],
    npcs:[
      {id:'lightning-kiet',name:'Kỹ sư Kiệt',role:'Trạm trưởng tiếp lôi',kind:'lore',x:-6,z:5,dialogue:'Mỗi trạm đèn là một mắt xích. Mất lôi thạch, cả cao nguyên chìm trong tối trước khi cơn giông tới.'},
      {id:'lightning-lam',name:'Y sư Lam',role:'Người chữa bỏng sét',kind:'healer',x:-23,z:17,dialogue:'Đừng đứng sát tinh thể khi trời động. Ánh sáng đẹp nhất ở đây cũng là thứ cần được kính trọng.'},
      {id:'lightning-chan',name:'Chấn Dực',role:'Người gọi lôi điểu',kind:'mentor',x:-25,z:-26,dialogue:'Ở Trạm Tiếp Lôi, điện có đường đi. Trong Rừng Tử Tinh, nó có nhịp đập. Hiểu cả hai, con sẽ nghe tiếng chim trong sấm.'}
    ],
    boss:{id:'lightning-stormroc',name:'Lôi Bằng Thiên Kiếp',title:'Hung điểu trên biển mây',x:32,z:-46,hp:2050,rewardGold:230,rewardXp:310,story:'Đôi cánh tinh thể của Lôi Bằng che kín tháp dẫn sét. Nó đã nhận cả cơn giông vào thân và không còn phân biệt người với kẻ thù.'},
    mentor:{npcId:'lightning-chan',spellId:'lightning-volley',clue:'Tới Phố Trạm Tiếp Lôi và Rừng Tử Tinh, rồi về Đài Thiên Văn gặp Chấn Dực.',zoneIds:['relay','crystals'],lesson:'Cho dòng điện một khung xương bằng ý niệm, đôi cánh bằng hơi thở. Lôi điểu sẽ theo ánh nhìn của con.'},
    houses:[[-18,13,3,4],[-33,13,3,4],[-30,28,3,3],[18,16,3,3],[36,19,4,3],[29,32,3,3],[-23,-19,3,4],[-38,-24,3,3],[20,-27,3,4],[37,-30,3,3],[10,29,3,3]]
  },
  earth: {
    subtitle:'Hẻm núi sa thạch · thành đất, mỏ sâu và cổng đá trời',
    zones:[
      {id:'potters',name:'Xóm Gốm Đất Đỏ',x:-28,z:20,radius:12,description:'Lò nung hình vòm chen giữa những ngôi nhà đất, chum gốm phơi dọc sườn dốc.'},
      {id:'quarry',name:'Mỏ Hoàng Thạch',x:29,z:22,radius:14,description:'Các bậc khai thác cắt vào vách núi, để lộ những đường vàng trong đá nâu.'},
      {id:'stone-arch',name:'Thiên Môn Sa Thạch',x:-31,z:-27,radius:14,description:'Một vòm đá tự nhiên khổng lồ bắc ngang hẻm núi khô. Gió mang tiếng cát như tiếng biển.'},
      {id:'buried-city',name:'Phế Thành Vùi Cát',x:31,z:-32,radius:14,description:'Đầu tượng và cột thành nhô khỏi biển cát. Bên dưới vẫn có tiếng bước chân nặng nề.'}
    ],
    npcs:[
      {id:'earth-son',name:'Trưởng thợ Sơn',role:'Người giữ mỏ',kind:'lore',x:-6,z:5,dialogue:'Nhà đất giữ mát, vách núi chắn gió. Dân làng đã sống cùng hẻm núi này từ thời phế thành còn nguyên vẹn.'},
      {id:'earth-quynh',name:'Dược sư Quỳnh',role:'Người cứu hộ hầm mỏ',kind:'healer',x:25,z:19,dialogue:'Ta đợi đoàn thợ trở về ở đây. Đất vững vẫn có thể chuyển mình; hãy nghe nó trước khi bước vào mỏ.'},
      {id:'earth-nham',name:'Nham Tẩu',role:'Ẩn sư dưới Thiên Môn',kind:'mentor',x:-27,z:-24,dialogue:'Xem đất đỏ hóa thành gốm, rồi xem những lớp đá lộ ra trong mỏ. Núi có tuổi và có ký ức.'}
    ],
    boss:{id:'earth-colossus',name:'Thạch Vương Cổ Thành',title:'Cự tượng thức tỉnh dưới cát',x:39,z:-41,hp:2300,rewardGold:250,rewardXp:330,story:'Thạch Vương mang cả một cổng thành trên vai. Các khớp đá sa thạch chuyển động theo nhịp của phong ấn đã bị phá.'},
    mentor:{npcId:'earth-nham',spellId:'earth-volley',clue:'Quan sát Xóm Gốm Đất Đỏ và Mỏ Hoàng Thạch; Nham Tẩu chờ dưới Thiên Môn Sa Thạch.',zoneIds:['potters','quarry'],lesson:'Đừng chỉ dựng một tảng đá. Hãy gọi những lớp đất cùng chuyển động như nhịp sóng. Con đã lĩnh hội Sơn Hà Đảo Chuyển.'},
    houses:[[-19,15,4,4],[-36,14,4,3],[-30,29,4,3],[19,16,4,3],[37,19,4,4],[29,32,3,3],[-24,-17,4,3],[-40,-20,4,3],[21,-23,4,3],[37,-23,3,3],[-11,29,3,3],[12,31,3,3]]
  },
  wind: {
    subtitle:'Đồi cỏ nối chân trời · guồng gió và phế tích lơ lửng',
    zones:[
      {id:'windmills',name:'Đồi Bảy Guồng Gió',x:-28,z:23,radius:14,description:'Những cánh quạt khổng lồ quay chậm trên đồi cỏ, kéo theo bóng dài chạy qua mái nhà.'},
      {id:'kite-meadow',name:'Đồng Diều Lục Sắc',x:28,z:23,radius:14,description:'Diều vải và cờ hành trình bay giữa một khoảng trời rộng, nơi trẻ nhỏ học đọc hướng gió.'},
      {id:'sky-ruins',name:'Phế Tích Thiên Không',x:-29,z:-30,radius:14,description:'Những phiến đá lơ lửng mang nét khắc của một ngôi đền đã mất mái.'},
      {id:'howling-ridge',name:'Sống Đồi Hú Gió',x:29,z:-34,radius:14,description:'Gió ép qua khe đá thành tiếng hú trầm. Dấu chân khổng lồ còn in trên cỏ.'}
    ],
    npcs:[
      {id:'wind-vu',name:'Bác Vũ',role:'Người trông guồng gió',kind:'lore',x:-6,z:5,dialogue:'Chẳng có bức tường nào giữ được đường chân trời. Cứ theo cánh guồng mà tìm dân làng; đồi cỏ rộng hơn con tưởng.'},
      {id:'wind-may',name:'Cô Mây',role:'Người vá diều',kind:'healer',x:25,z:20,dialogue:'Diều rách còn vá được, người mệt thì ngồi nghỉ. Đôi khi cách đi nhanh nhất là đợi đúng ngọn gió.'},
      {id:'wind-thanh',name:'Thanh Tiêu',role:'Du sĩ của trời xanh',kind:'mentor',x:-25,z:-26,dialogue:'Hãy xem gió làm quay guồng, rồi xem nó nâng diều. Cùng một luồng khí có thể xoay đất trời mà vẫn giữ một sợi dây mỏng.'}
    ],
    boss:{id:'wind-tempest',name:'Phong Thú Bạch Nha',title:'Chúa tể đồng hoang',x:35,z:-45,hp:1950,rewardGold:220,rewardXp:300,story:'Bờm trắng của Phong Thú xoáy thành những vòng mây. Tiếng gầm của nó đã thổi tắt tất cả guồng gió trên sống đồi.'},
    mentor:{npcId:'wind-thanh',spellId:'wind-volley',clue:'Đi qua Đồi Bảy Guồng Gió và Đồng Diều Lục Sắc, sau đó tìm Thanh Tiêu giữa Phế Tích Thiên Không.',zoneIds:['windmills','kite-meadow'],lesson:'Hãy gom gió thành một vòng tròn, để lực quay tự lớn lên. Ta tặng con Phong lốc, cùng lời nhắc luôn chừa một khoảng trời cho người khác.'},
    houses:[[-18,16,3,3],[-36,17,4,3],[-29,33,3,3],[18,17,3,3],[36,19,4,3],[27,33,3,3],[-23,-20,3,3],[-38,-25,3,3],[20,-25,3,3],[37,-28,3,3],[11,31,3,3]]
  },
  light: {
    subtitle:'Thành trắng trên bậc nắng · cầu kính và vườn gương',
    zones:[
      {id:'prism-garden',name:'Vườn Lăng Kính',x:27,z:23,radius:13,description:'Những mặt kính cao chia nắng thành dải bảy màu chạy trên nền đá trắng.'},
      {id:'sun-plaza',name:'Quảng Trường Nhật Luân',x:-27,z:22,radius:13,description:'Bánh xe mặt trời bằng vàng dựng giữa sân, bóng kim chỉ thời khắc bình minh.'},
      {id:'glass-bridge',name:'Cầu Kính Bình Minh',x:-30,z:-28,radius:14,description:'Mặt cầu trong vắt bắc qua khe đá trắng, ánh sáng chiếu thành hàng cột bên dưới.'},
      {id:'sun-temple',name:'Thánh Điện Mặt Trời',x:29,z:-35,radius:14,description:'Vòm trắng mở ra bầu trời, giữa điện là một vòng hào quang chưa bao giờ tắt.'}
    ],
    npcs:[
      {id:'light-minh',name:'Tư tế Minh',role:'Người giữ lịch mặt trời',kind:'lore',x:-6,z:5,dialogue:'Đá trắng không tự phát sáng. Người đi trước đặt từng phiến theo đường của mặt trời, để cả thành cùng thức dậy với bình minh.'},
      {id:'light-hue',name:'Chị Huệ',role:'Người chăm vườn kính',kind:'healer',x:24,z:20,dialogue:'Trong một tia trắng có nhiều sắc màu. Lòng người cũng vậy; hôm nay con có thể dừng chân mà chẳng cần chiến đấu.'},
      {id:'light-khai',name:'Khai Quang',role:'Thầy chế tác lăng kính',kind:'mentor',x:-26,z:-25,dialogue:'Nhìn ánh nắng trong Vườn Lăng Kính, rồi đọc bóng trên Quảng Trường Nhật Luân. Con sẽ hiểu ánh sáng cũng có hình dáng.'}
    ],
    boss:{id:'light-seraph',name:'Kim Giáp Nhật Thần',title:'Hộ thần bị ánh sáng thiêu đốt',x:35,z:-45,hp:2150,rewardGold:250,rewardXp:330,story:'Giáp vàng và những cánh quạt mặt trời bao quanh vị hộ thần. Chiếc gương vỡ trong ngực khiến ánh sáng của nó không còn sưởi ấm.'},
    mentor:{npcId:'light-khai',spellId:'light-barrier',clue:'Khám phá Vườn Lăng Kính và Quảng Trường Nhật Luân rồi gặp Khai Quang bên Cầu Kính Bình Minh.',zoneIds:['prism-garden','sun-plaza'],lesson:'Một khối kính không ngăn ánh sáng; nó giúp ánh sáng bộc lộ sức mạnh. Con hãy giữ lấy Cầu thủy tinh này.'},
    houses:[[-18,15,4,3],[-35,16,4,3],[-27,32,4,3],[18,16,4,3],[35,18,4,3],[28,33,4,3],[-24,-18,4,3],[-39,-22,4,3],[19,-25,4,3],[37,-27,4,3],[10,30,3,3]]
  },
  ice: {
    subtitle:'Lòng chảo băng hà · hồ xanh, hang pha lê và tường tuyết',
    zones:[
      {id:'hearth',name:'Xóm Lửa Hồng',x:-27,z:22,radius:12,description:'Ống khói thấp và cửa gỗ đỏ giữ hơi ấm giữa những mái nhà phủ tuyết dày.'},
      {id:'frozen-lake',name:'Hồ Gương Băng',x:28,z:21,radius:14,description:'Băng xanh trong đến mức nhìn thấy những bông tuyết bị giữ lại dưới mặt hồ.'},
      {id:'crystal-cave',name:'Hang Ngân Tinh',x:-29,z:-29,radius:14,description:'Nhũ băng xanh kết thành mái vòm như một thánh đường, phản chiếu hàng nghìn đốm sáng.'},
      {id:'glacier',name:'Vách Băng Vĩnh Cửu',x:28,z:-35,radius:15,description:'Dòng sông băng đứng yên thành bức tường cao, một bóng trắng di chuyển trong màn tuyết.'}
    ],
    npcs:[
      {id:'ice-bac',name:'Ông Bạc',role:'Người giữ lò sưởi',kind:'lore',x:-6,z:5,dialogue:'Lửa là của chung trong xóm này. Khi đi qua hồ, nhớ nhìn lên vách băng; nó vẫn dịch chuyển từng chút một.'},
      {id:'ice-nhi',name:'Y nữ Nhi',role:'Người dẫn đường tuyết',kind:'healer',x:-24,z:19,dialogue:'Bàn tay lạnh thì ôm chén trà này. Ta đếm khách trở về từng ngày, chẳng bỏ lại ai trong tuyết.'},
      {id:'ice-tuyet',name:'Tuyết Tâm',role:'Ẩn sĩ Ngân Tinh',kind:'mentor',x:-25,z:-26,dialogue:'Học cách giữ hơi ấm ở Xóm Lửa Hồng, rồi học sự tĩnh lặng ở Hồ Gương Băng. Tâm không run thì tuyết mới nghe lời.'}
    ],
    boss:{id:'ice-frostking',name:'Băng Vương Tuyết Hống',title:'Cổ thú của sông băng',x:34,z:-46,hp:2250,rewardGold:260,rewardXp:340,story:'Tuyết Hống mang sừng pha lê và bờm băng cao bằng mái nhà. Nó bảo vệ giấc ngủ của sông băng bằng những cơn bão trắng.'},
    mentor:{npcId:'ice-tuyet',spellId:'ice-lance',clue:'Tới Xóm Lửa Hồng và Hồ Gương Băng, rồi trở lại Hang Ngân Tinh gặp Tuyết Tâm.',zoneIds:['hearth','frozen-lake'],lesson:'Con đã gọi được tuyết. Giờ hãy gom nó thành một tinh thể, khóa bước chân đối thủ để không phải làm họ tổn thương. Đây là Băng Phược.'},
    houses:[[-18,15,4,3],[-35,15,4,3],[-28,31,4,3],[18,15,4,3],[36,18,4,3],[28,31,3,3],[-23,-19,4,3],[-37,-24,4,3],[20,-25,4,3],[37,-29,3,3],[-11,31,3,3]]
  },
  wood: {
    subtitle:'Thành rừng cổ thụ · nhà ôm rễ, vườn thuốc và biển trúc',
    zones:[
      {id:'root-quarter',name:'Xóm Rễ Cây',x:-28,z:22,radius:13,description:'Những mái nhà nhỏ tựa vào rễ cổ thụ, lối đi vòng theo đường cong của gỗ sống.'},
      {id:'herb-garden',name:'Vườn Dược Linh Chi',x:28,z:22,radius:13,description:'Hoa thuốc phát sáng và nấm lớn mọc dưới tán lá thấp, được dân làng chăm bằng nước sương.'},
      {id:'bamboo',name:'Biển Trúc Thanh Âm',x:-29,z:-29,radius:14,description:'Hàng trăm thân trúc mảnh va nhau trong gió thành một bản nhạc không dứt.'},
      {id:'elder-tree',name:'Cội Cây Ngàn Tuổi',x:29,z:-35,radius:15,description:'Thân cây vĩ đại tách thành một cổng rễ. Ánh sinh lực xanh chảy trong từng kẽ vỏ.'}
    ],
    npcs:[
      {id:'wood-loc',name:'Bác Lộc',role:'Người chăm cổ thụ',kind:'lore',x:-6,z:5,dialogue:'Làng không đốn cây để mở đường. Chúng ta học cách dựng nhà bên rễ, nên mỗi lối đi đều có câu chuyện riêng.'},
      {id:'wood-thao',name:'Dược nữ Thảo',role:'Chủ vườn Linh Chi',kind:'healer',x:25,z:19,dialogue:'Một chiếc lá đúng lúc quý hơn cả túi vàng. Cứ tới vườn khi cần nghỉ; cây ở đây nhận ra người biết giữ lời.'},
      {id:'wood-truc',name:'Trúc Ẩn',role:'Hiền sư rừng xanh',kind:'mentor',x:-25,z:-25,dialogue:'Hãy theo rễ qua xóm, rồi xem cách người làng chăm từng cây thuốc. Sự sống không nghe lệnh; nó đáp lại lòng kiên nhẫn.'}
    ],
    boss:{id:'wood-rootwarden',name:'Cổ Mộc Thủ Hộ',title:'Linh thú rễ ngàn năm',x:35,z:-46,hp:2350,rewardGold:270,rewardXp:350,story:'Rễ cây quấn thành đôi tay khổng lồ, nấm phát sáng mọc dọc lớp giáp vỏ. Linh thú nổi giận khi kẻ săn ấn rút cạn sinh lực của rừng.'},
    mentor:{npcId:'wood-truc',spellId:'wood-lance',clue:'Khám phá Xóm Rễ Cây và Vườn Dược Linh Chi. Trúc Ẩn chờ trong Biển Trúc Thanh Âm.',zoneIds:['root-quarter','herb-garden'],lesson:'Vườn Sinh Mệnh đã bén rễ trong con. Hãy nhờ dây leo giữ đối thủ lại, đừng bẻ gãy cành vì nóng giận. Ta chỉ con Dây Leo Trói Buộc.'},
    houses:[[-18,15,3,3],[-36,16,4,3],[-28,32,3,3],[18,16,3,3],[36,18,4,3],[29,32,3,3],[-23,-19,3,3],[-38,-23,3,3],[19,-25,3,3],[38,-28,3,3],[-11,31,3,3],[11,31,3,3]]
  },
  dark: {
    subtitle:'Thung lũng hoàng hôn · phố đèn lồng và đền trăng khuyết',
    zones:[
      {id:'lantern-street',name:'Phố Đèn Lồng Tím',x:-28,z:22,radius:13,description:'Dải đèn tím uốn theo con dốc đá. Những tấm biển gỗ kể tên người đã đưa khách lạc đường về nhà.'},
      {id:'mirror-pool',name:'Hồ Trăng Không Đáy',x:28,z:22,radius:14,description:'Mặt nước đen phản chiếu một vầng trăng luôn tròn, dù trên trời chỉ có trăng khuyết.'},
      {id:'memorial',name:'Vườn Bia Vọng Hồn',x:-29,z:-29,radius:14,description:'Bia đá nghiêng trong cỏ tím, mỗi ngọn đèn là lời hứa nhớ về một người.'},
      {id:'moon-temple',name:'Đền Nguyệt Thực',x:29,z:-35,radius:15,description:'Cổng đền hình lưỡi liềm ôm một hố tối. Bóng đổ ở đây luôn quay về phía người bước tới.'}
    ],
    npcs:[
      {id:'dark-da',name:'Bà Dạ',role:'Người thắp đèn',kind:'lore',x:-6,z:5,dialogue:'Đừng sợ bóng tối chỉ vì nó im lặng. Ánh đèn của làng này được thắp để đón người trở về, không phải để xua đuổi khách lạ.'},
      {id:'dark-yen',name:'Cô Yên',role:'Người trông hồ trăng',kind:'healer',x:25,z:19,dialogue:'Nếu lạc đường, hãy đếm những chiếc đèn tím. Ta luôn để một ngọn bên hồ cho người đi muộn.'},
      {id:'dark-mac',name:'Mặc Nguyệt',role:'Hiền sư bóng đêm',kind:'mentor',x:-25,z:-25,dialogue:'Bước qua phố đèn, ngồi yên bên hồ trăng. Khi không còn xem bóng mình là kẻ thù, con sẽ biết cách nhờ nó giúp đỡ.'}
    ],
    boss:{id:'dark-eclipse',name:'Nguyệt Ảnh Vô Diện',title:'Bạo chúa đêm nguyệt thực',x:35,z:-46,hp:2450,rewardGold:290,rewardXp:380,story:'Chiếc mặt nạ rỗng trôi trên áo choàng bóng tối. Sau lưng Vô Diện, một vầng trăng đen nuốt ánh đèn của cả thung lũng.'},
    mentor:{npcId:'dark-mac',spellId:'dark-lance',clue:'Dạo Phố Đèn Lồng Tím và Hồ Trăng Không Đáy, sau đó gặp Mặc Nguyệt tại Vườn Bia Vọng Hồn.',zoneIds:['lantern-street','mirror-pool'],lesson:'Phân thân không chỉ là chiếc bóng đứng cạnh con. Hãy để nó nhận ý định của con và tìm đường tới mục tiêu. Nhận lấy Ảnh tập kích.'},
    houses:[[-18,15,3,4],[-36,16,4,3],[-28,32,3,3],[18,16,3,4],[36,18,4,3],[28,32,3,3],[-23,-19,3,4],[-38,-24,3,3],[19,-25,3,4],[38,-28,3,3],[-10,31,3,3],[10,31,3,3]]
  }
};

export const MENTOR_SPELLS = Object.freeze(Object.values(REGIONS).map(region=>region.mentor.spellId));
export const ELEMENT_SPELLS = Object.freeze({
  fire:['fire-volley','fire-lance','fire-meteor','fire-barrier','fire-reflect'],
  water:['water-lance','water-volley','water-tsunami','water-barrier','water-reflect'],
  lightning:['lightning-lance','lightning-volley','lightning-thunder','lightning-barrier','lightning-reflect'],
  wind:['wind-orb','wind-lance','wind-volley','wind-barrier','wind-reflect'],
  earth:['earth-orb','earth-lance','earth-volley','earth-barrier','earth-reflect'],
  light:['light-orb','light-lance','light-volley','light-barrier','light-reflect'],
  dark:['dark-orb','dark-lance','dark-volley','dark-domain','dark-reflect'],
  wood:['wood-orb','wood-lance','wood-volley','wood-barrier','wood-reflect'],
  ice:['ice-orb','ice-lance','ice-volley','ice-barrier','ice-reflect']
});
export const ALL_ADVENTURE_SPELLS = Object.freeze(Object.values(ELEMENT_SPELLS).flat());
const basicArts={nameless:'wind-orb',fire:'fire-volley',water:'water-lance',lightning:'lightning-lance',wind:'wind-orb',earth:'earth-orb',light:'light-orb',dark:'dark-orb',wood:'wood-reflect',ice:'ice-reflect'};
for(const [id,region] of Object.entries(REGIONS)){
  region.mentor.spellIds=id==='water'?['water-lance','water-reflect','water-volley']:[...new Set([basicArts[id],region.mentor.spellId])];
  region.boss.rewardSpells=[...ELEMENT_SPELLS[id==='nameless'?'wind':id]];
  region.boss.hp={nameless:240,water:280,fire:380,lightning:440,earth:560,wind:500,light:620,ice:660,wood:700,dark:950}[id];
  region.boss.story+=' Chiến thắng để nhận sách bí thuật; hãy đạt đủ cấp hệ rồi mở sách để học.';
}
// The great beasts are the leaders' summoned guardians, rather than anonymous encounters.
const leaders={
  water:{name:'Thủy Ảnh Hải Châu',title:'Thủ lĩnh Làng Thủy',story:'Hải Châu thử thách người mang thủy thuật và gọi Hải Xà Đắm Thuyền làm hộ vệ. Thắng cuộc đấu này, bạn sẽ nhận lời cam kết đầu tiên cho hòa ước.'},
  fire:{name:'Hỏa Ảnh Xích Nham',title:'Thủ lĩnh Làng Hỏa',story:'Xích Nham cùng Hỏa Long Tro Tàn bảo vệ danh dự Hỏa làng. Chỉ khi vượt qua cuộc thử sức, bạn mới thuyết phục được ông trở về Vô Danh bàn việc hòa bình.'},
  lightning:{name:'Lôi Ảnh Chấn Thiên',title:'Thủ lĩnh Làng Lôi',story:'Chấn Thiên đứng bên Lôi Bằng Thiên Kiếp trên đỉnh giông. Chiến thắng là lời chứng cho ý chí liên minh của bạn trước hội đồng Lôi làng.'},
  dark:{name:'Ám Ảnh Vô Nguyệt',title:'Thủ lĩnh Làng Ám · Kẻ chủ mưu',story:'Vô Nguyệt đứng sau những vụ phá ấn và chia rẽ các làng. Nguyệt Ảnh Vô Diện là hộ vệ cuối cùng của hắn. Mang hòa ước đã trao khắp năm miền tới đây để khép lại âm mưu.'}
};
for(const [id,leader] of Object.entries(leaders)){
  const boss=REGIONS[id].boss;boss.guardian=boss.name;Object.assign(boss,leader);
}
const hill=(x,z,cx,cz,width,height)=>height*Math.exp(-((x-cx)**2+(z-cz)**2)/(width*width));
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

// Existing place IDs remain stable while the seven great villages expand to 280 x 280 m.
for(const id of ['water','fire','lightning','wind','earth','ice','wood']){const r=REGIONS[id];for(const zone of r.zones){zone.x*=2;zone.z*=2;zone.radius*=1.4;}for(const n of r.npcs)if(n.kind!=='lore'){n.x*=2;n.z*=2;}r.boss.x*=2;r.boss.z*=2;r.houses=r.houses.map(([x,z,w,d])=>[x*2,z*2,w,d]);}
REGIONS.nameless.subtitle='Làng biên địa đổ nát · chiến tuyến giữa Thủy, Hỏa và Lôi';
REGIONS.nameless.npcs[0].dialogue='Thủy, Hỏa và Lôi nhiều lần kéo quân qua đây. Những mái nhà cháy dở và hố đạn là ký ức của người còn sống. Hãy giúp ba làng ngừng chiến.';
REGIONS.nameless.zones[1].description='Quán trà mất nửa mái sau một trận tập kích. Vết chém và đầu tên còn ghim trên cột gỗ.';
REGIONS.water.subtitle='Làng chài đại thủy · những bến bè nối các xóm qua sông sâu';
Object.assign(REGIONS.water.zones[0],{x:78,z:38});Object.assign(REGIONS.water.zones[1],{x:-76,z:46});Object.assign(REGIONS.water.zones[2],{x:-78,z:-62});
Object.assign(REGIONS.water.npcs[1],{x:74,z:34});Object.assign(REGIONS.water.npcs[2],{x:-78,z:-54});
Object.assign(REGIONS.fire.boss,{x:62,z:-108});
const extraZones={
  water:[['net-islet','Cồn Lưới Bạc',-96,98,'Những giàn lưới phơi quanh cồn nhỏ. Chỉ bè của dân chài mới vượt được nhánh sông phía nam.'],['fishing-harbor','Cảng Cá Bình Minh',104,92,'Thuyền câu, thúng cá và nhà sàn quây quanh bến lớn.'],['pearl-shore','Bãi Ngọc Trai',103,-99,'Người mò trai nghỉ bên thuyền thúng và bãi vỏ sò.'],['reed-estuary','Cửa Sông Lau Trắng',-105,-102,'Những luồng nước rộng chạy qua đồng lau, chia làng chài thành nhiều xóm.']],
  fire:[['red-cliff','Vách Tro Hồng',88,-67,'Các bậc đá được đục vào sườn núi, nối nhau bằng những khúc ngoặt. Có thể tự đi bằng WASD hoặc nhấn E ở chân vách rồi giữ W; Space để nhảy và rời dẫn đường.'],['summit-lotus','Đỉnh Hồng Liên',88,-96,'Hồng liên quý mọc trên vách núi biệt lập; phải leo mới lên được.'],['lava-quarry','Mỏ Đá Nham',-102,-96,'Thợ rèn lấy đá chịu lửa từ các tầng bazan.'],['ash-outpost','Trạm Gác Tro',104,88,'Một trạm canh xa bên đường vượt núi.']],
  lightning:[['rain-valley','Thung Lũng Mưa',-106,92,'Mưa rào đi qua cao nguyên theo từng đợt.'],['copper-ridge','Sống Núi Dây Đồng',101,-99,'Dây dẫn sét chạy dọc những cột đá trên đỉnh giông.'],['storm-shelter','Trạm Trú Giông',-103,-98,'Mái che đá cho khách chờ cơn giông qua.'],['thunder-meadow','Đồng Sấm Xa',105,91,'Từ đồng cỏ rộng có thể nhìn sét đánh trên những đỉnh núi.']],
  wind:[['sky-house-west','Nhà Mây Tây',-92,65,'Ngôi nhà treo dưới chùm bóng bay; leo thang dây để lên sàn.', 'sky-west'],['sky-house-east','Nhà Mây Đông',93,57,'Bóng bay giữ một mái nhà và vườn nhỏ lơ lửng trên không.', 'sky-east'],['sky-house-north','Trạm Gió Trên Mây',38,-99,'Người giữ gió thả thang dây xuống cho khách.', 'sky-north'],['wind-farm','Cánh Đồng Cối Xay',-101,-95,'Những cánh quạt lớn quay giữa biển cỏ.']]
};
for(const [id,zones] of Object.entries(extraZones))for(const [key,name,x,z,description,platform] of zones)REGIONS[id].zones.push({id:key,name,x,z,radius:platform?5:13,description,...(platform?{platform}:{} )});
REGIONS.earth.subtitle='Thành đá đại ngàn · đại hang giữa lòng làng';REGIONS.ice.subtitle='Miền cực địa · biển băng, tuyết trắng và sông băng';REGIONS.wood.subtitle='Rừng cổ thụ · nhà trên cây giữa làng';
REGIONS.earth.zones.push({id:'great-cave',name:'Đại Hang Địa Tâm',x:0,z:-32,radius:16,platform:'earth-cave',description:'Một hang động rộng, có nhũ đá, hồ ngầm và tinh khoáng. Đi xuống từ cửa hang giữa làng.'},{id:'stone-wastes',name:'Bãi Đá Cổ',x:103,z:98,radius:16,description:'Những khối sa thạch lớn lộ ra giữa nền đất sỏi.'});
REGIONS.ice.zones.push({id:'polar-sea',name:'Biển Băng Cực Bắc',x:-98,z:111,radius:18,description:'Băng trôi và những tảng băng xanh phủ một vùng biển đóng băng.'},{id:'snow-ridge',name:'Sống Núi Tuyết',x:106,z:-104,radius:15,description:'Tuyết bị gió nén thành các triền dốc. Hãy thận trọng vì nền băng hơi trơn.'});
REGIONS.wood.zones.push({id:'heart-tree-house',name:'Nhà Trên Cây Trung Tâm',x:5,z:0,radius:5,platform:'heart-tree',description:'Cầu thang gỗ ôm quanh thân cổ thụ, dẫn lên căn nhà có hiên và đèn ấm giữa tán lá.'},{id:'deep-canopy',name:'Rừng Tán Kín',x:104,z:-103,radius:18,description:'Những tầng cây rậm che bầu trời; đường đất len giữa các rễ lớn.'});
REGIONS.earth.zones.push({id:'cave-crystals',name:'Mạch Tinh Khoáng',x:11,z:-40,radius:4,platform:'earth-cave',description:'Tinh khoáng phát sáng trong nhánh sâu của Đại Hang.'});

// Rivers share their exact banks and water level with rendering and bridge placement.
export const LANDSCAPES={
  nameless:{river:[-18,8,.047,.3,2.6,-.65,.006],hills:[[-40,-30,23,7],[32,-27,21,5],[42,32,20,4]],plain:[19,18,16]},
  water:{river:[-19,10,.042,0,4.8,-.8,.008],hills:[[-42,-35,22,8],[39,-36,24,5]],plain:[26,21,18]},
  fire:{river:[30,7,.05,1,2.5,-.45,.009],hills:[[-40,-35,24,8],[45,36,21,5]],plain:[-24,22,15]},
  lightning:{river:[-28,6,.04,.6,2.2,-.9,.009],hills:[[36,-39,23,8],[-39,35,20,5]],plain:[25,22,14]},
  earth:{river:[-35,5,.035,1.3,1.8,-1,.006],hills:[[41,-28,22,7],[-46,-38,20,8]],plain:[26,23,17]},
  wind:{river:[27,9,.038,.7,2.8,-.8,.006],hills:[[-34,-31,24,7],[43,38,22,6]],plain:[-26,24,19]},
  light:{river:[-24,7,.043,.4,2.8,-.75,.006],hills:[[34,-39,26,8],[-42,34,21,4]],plain:[26,21,17]},
  ice:{river:[-24,8,.045,.5,3,-.8,.006],hills:[[35,-42,24,9],[-41,-34,22,7]],plain:[27,22,18]},
  wood:{river:[19,9,.048,-.6,2.8,-.7,.006],hills:[[-38,-33,23,7],[40,38,22,5]],plain:[-26,23,17]},
  dark:{river:[-26,7,.04,.2,3.3,-.85,.006],hills:[[34,-39,24,9],[-42,35,23,6]],plain:[27,23,17]}
};
function baseRiverAt(id,z){const r=LANDSCAPES[id]?.river;if(!r)return null;return {x:r[0]+Math.sin(z*r[2]+r[3])*r[1],width:r[4]*(1+.1*Math.sin(z*.11+r[3])),y:r[5]+z*r[6],bank:4.5};}
export function riverAt(id,z){const scale=regionMetrics(id).scale,r=baseRiverAt(id,z/scale);return r?{...r,x:r.x*scale,width:r.width*scale,bank:r.bank*scale,...(id==='water'?{y:-.7}:{} )}:null;}
export function waterwayAt(x,z){const main=riverAt('water',z),east=46+Math.sin(z*.025)*9,north=69+Math.sin(x*.028)*7;return [{distance:Math.abs(x-main.x),width:main.width,y:main.y,axis:'z',center:main.x},{distance:Math.abs(x-east),width:7,y:-.7,axis:'z',center:east},{distance:Math.abs(z-north),width:6,y:-.7,axis:'x',center:north}].sort((a,b)=>(a.distance-a.width)-(b.distance-b.width))[0];}
export function waterSector(x,z){const main=riverAt('water',z),east=46+Math.sin(z*.025)*9,north=69+Math.sin(x*.028)*7;return `${x<main.x?'west':x>east?'east':'center'}-${z>north?'north':'south'}`;}
export const MAX_WADING_DEPTH=1.15;
export function waterDepthAt(x,z){return Math.max(0,waterwayAt(x,z).y-terrainHeight('water',x,z));}
export function isDeepWater(x,z){return waterDepthAt(x,z)>MAX_WADING_DEPTH;}

function uplandHeight(id,x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))return 0;
  let h=0;
  switch(id){
    case 'nameless':h=3*Math.sin(x/27)*Math.cos(z/31)+hill(x,z,-30,-28,25,6);break;
    case 'fire':h=3+4*Math.sin((x-z)/47)+hill(x,z,-34,-25,24,6)-hill(x,z,32,-34,16,5);break;
    case 'water':h=.65*Math.sin(x/24)*Math.cos(z/25)+hill(x,z,-29,-34,22,6);break;
    case 'lightning':h=3*Math.sin((x+z)/34)+hill(x,z,30,-39,25,9)+hill(x,z,-34,-27,24,4);break;
    case 'earth':h=4*(1+Math.tanh((x-12)/25))+2*Math.sin(z/27)+hill(x,z,-31,-28,24,5);break;
    case 'wind':h=4*Math.sin(x/24)*Math.cos(z/30)+2*Math.sin((x+z)/43);break;
    case 'light':h=hill(x,z,29,-35,30,10)+hill(x,z,-30,-28,26,4)+1.5*Math.sin(x/35);break;
    case 'ice':h=hill(x,z,-31,-29,28,6)+hill(x,z,29,-43,25,9)-hill(x,z,28,22,20,2);break;
    case 'wood':h=3*Math.sin(x/24)*Math.cos(z/26)+hill(x,z,30,-35,26,7)+hill(x,z,-30,24,22,3);break;
    case 'dark':h=2*Math.cos(x/28)*Math.sin(z/30)+hill(x,z,29,-37,25,7)-3*Math.exp(-(((x+z-10)/22)**2));break;
    default:return 0;
  }
  const landscape=LANDSCAPES[id],distance=Math.hypot(x,z);
  for(const [cx,cz,width,height] of landscape.hills)h+=hill(x,z,cx,cz,width,height);
  h+=.4*Math.sin(x*.19)*Math.sin(z*.16);
  const [px,pz,radius]=landscape.plain,plain=1-smooth((Math.hypot(x-px,z-pz)-radius*.45)/(radius*.55));
  h*=1-plain*.6;
  return h*.9*smooth((distance-8)/17);
}

// A level village square opens onto meadows, rolling hills and a carved, shallow riverbed.
function baseTerrainHeight(id,x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z)||!LANDSCAPES[id])return 0;
  const river=baseRiverAt(id,z),distance=Math.abs(x-river.x),upland=Math.max(river.y+.3,uplandHeight(id,x,z)),valley=smooth((distance-river.width-river.bank-1)/8),ground=upland+(river.y+.55+(upland-river.y-.55)*valley-upland)*smooth((Math.hypot(x,z)-8)/7);
  if(distance<river.width)return river.y-.75*(1-smooth(distance/river.width));
  if(distance<river.width+river.bank)return river.y+(ground-river.y)*smooth((distance-river.width)/river.bank);
  return ground;
}
export function terrainHeight(id,x,z){const scale=regionMetrics(id).scale;let h=baseTerrainHeight(id,x/scale,z/scale);if(id==='water'){const w=waterwayAt(x,z);h=Math.max(h,-.15);if(w.distance<w.width)h=w.y-4.5*(1-smooth(w.distance/w.width));else if(w.distance<w.width+6)h=w.y+(h-w.y)*smooth((w.distance-w.width)/6);}if(id==='ice')h+=(-.6-h)*smooth((z-86)/8);return h;}

export function districtAt(id,x,z) {
  const zones=REGIONS[id]?.zones;
  if(!zones)return null;
  return zones.find(zone=>Math.hypot(x-zone.x,z-zone.z)<=zone.radius)||null;
}
