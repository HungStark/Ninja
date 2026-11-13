import {heroSpeaker,campaignLines} from './adventure-dialogue.js';
import {encounterAppearance} from './encounter-appearance.js';
import {ninjaProfile} from './ninja.js';
import {village} from './adventure-data.js';
import {villagerAppearance} from './villager-appearance.js';
import {isEarthDepartureTrial,EARTH_DEPARTURE_TRIAL} from './earth-departure-trial.js';
import {PLOT,companionPresent} from './campaign-plot.js';

// Combat setup stays in the encounter. The conversation only contains what
// these characters would actually say to one another in the world.
export function battleConversation(encounter,save){
  if(isEarthDepartureTrial(encounter))return campaignLines(EARTH_DEPARTURE_TRIAL.opening,save,'earth');
  if(encounter.storyBoss)return campaignLines(PLOT.villages[encounter.village].stages[encounter.eventStep].script,save,encounter.village);
  const hero=heroSpeaker(save),lines=[],say=(speaker,text)=>lines.push({speaker,text});
  const opponent=(entry=encounter,index=0)=>{const look=encounterAppearance({...encounter,...entry});return {id:'challenge-'+look.id+'-'+index,name:entry.name||encounter.name,role:village(look.village||look.id).name,appearance:look.kind==='creature'?look:ninjaProfile(look)};};
  const enemy=encounter.kind==='boss'?{id:'chief-'+encounter.village,name:encounter.name,role:village(encounter.village).name,appearance:villagerAppearance(encounter.village,{kind:'chief'})}:opponent();
  if(encounter.kind==='infiltrator'){say(enemy,encounter.infiltrationMode==='ambush'?companionPresent(save)?'Giết hắn, bắt sống cô gái! Đó là mệnh lệnh của thủ lĩnh.':'Giết hắn! Không được để lộ đường dây của chúng ta.':'Ngươi đã nhìn thấy quá nhiều. Không thể để ngươi rời khỏi đây!');say(hero,'Huy hiệu Trăng Khuyết... Các ngươi đang điều tra điều gì trong làng?');}
  else if(encounter.militaryIntrusion){say(enemy,'Ta đã cảnh cáo. Ngươi vẫn cố xâm nhập khu quân sự — chuẩn bị chịu bắt!');say(hero,'Vậy ta sẽ tự mở đường.');}
  else if(encounter.storyBattle==='fire-jail'){return campaignLines(PLOT.villages.fire.stages[1].script,save,'fire');}
  else if(encounter.occupation){say(enemy,'Lãnh địa này thuộc binh đoàn Trăng Khuyết. Bắt lấy chúng!');say(hero,'Ta sẽ giải thoát những người các ngươi đang giam giữ.');}
  else if(encounter.kind==='guardian-order'){
    const beast=opponent({kind:'boss',guardianForm:'beast'});
    say(beast,'Trưởng làng đã nhận lời thách đấu. Hai hộ vệ sẽ cùng kiểm tra bản lĩnh của ngươi trước khi ngươi bước vào phòng họp.');
    say(hero,'Ta đã mang chứng cứ và cứu những người gặp nạn. Giờ ta sẽ giữ lời hứa với Làng Vô Danh.');
    say(beast,'Tả vệ, hữu vệ, cùng tiến lên. Đây là cuộc so tài; dừng tay khi đối phương nhận thua.');
    say(hero,'Ta đã sẵn sàng.');
  }else if(encounter.kind==='intro-trio'){
    const foes=encounter.squad.map(opponent);
    say(hero,'Các người dừng lại đi! Đây là làng của tôi, không phải nơi để các người thanh toán lẫn nhau!');
    say(foes[0],'Tránh ra! Chuyện giữa Hỏa, Thủy và Lôi chưa đến lượt ngươi xen vào.');
    say(hero,'Các người đánh nhau đã làm bị thương hộ vệ thú của làng tôi. Người dân ở đây còn phải chịu đựng đến bao giờ nữa?');
    say(foes[1],'Con thú đó dám chen vào trận chiến. Nếu ngươi còn cản đường, ngươi cũng sẽ chịu chung số phận.');
    say(foes[2],'Muốn chúng ta dừng lại ư? Thử buộc chúng ta hạ vũ khí xem!');
    say(hero,'Tôi sẽ bảo vệ hộ vệ và những người còn lại. Hãy hạ vũ khí, đây là cơ hội cuối cùng.');
    say(foes[0],'Vậy thì bước tới đây! Đừng trách chúng ta không nương tay.');
  }else if(encounter.kind==='arena'){
    say(enemy,'Ngươi đã bước lên võ đài. Sẵn sàng thử sức với ta chưa?');
    say(hero,'Tôi đã sẵn sàng. Mong được cùng anh so tài.');
    say(enemy,'Đừng giữ sức. Nếu không trụ nổi, cứ nhận thua!');
    say(hero,'Tôi sẽ chiến đấu hết mình. Xin chỉ giáo!');
  }else if(encounter.kind==='boss'){
    say(hero,'Tôi đến để chấm dứt chiến tranh giữa các làng. Xin hãy nghe tôi nói.');
    say(enemy,'Một kẻ lữ hành mà đòi quyết định vận mệnh của '+enemy.role+' sao? Lời nói của ngươi có sức nặng gì?');
    say(hero,'Tôi không muốn thêm ai bị thương. Nhưng nếu phải vượt qua ông để bảo vệ họ, tôi sẽ không lùi bước.');
    say(enemy,'Vậy hãy chứng minh quyết tâm ấy. Nếu sợ hãi, chịu thua và quay về ngay lúc này!');
    say(hero,'Tôi đã hứa sẽ mang hòa bình trở lại. Tôi nhất định không bỏ cuộc.');
  }else if(encounter.kind==='village-guard'){
    say(enemy,encounter.guardRole==='guardian'?'Đứng lại! Phía sau ta là nơi hộ vệ trấn giữ. Ngươi không được bước tiếp.':'Dừng lại! Kẻ từ làng khác không được tự tiện đi qua đây.');
    say(hero,'Tôi đến để tìm một con đường hòa bình. Tôi không muốn giao chiến với các anh.');
    say(enemy,'Ta không tin những lời hứa suông. Chịu thua đi, hoặc cho ta thấy bản lĩnh của ngươi!');
    say(hero,'Nếu không thể thuyết phục bằng lời nói, tôi sẽ chứng minh bằng hành động.');
  }else if(encounter.kind==='village-event'){
    const scripts={
      'water-base':[['hero','Thả những ninja đang bị rút chakra ra! Ta sẽ phá thiết bị này.'],['guide','Nguồn năng lượng phải tiếp tục chạy. Không ai được bước tới tinh thể!']],
      'fire-general':[['haly','Quân lệnh giả và mật mã đều dẫn tới ngươi. Lần này, ngươi sẽ không thể bịt miệng nhân chứng.'],['commander','Hai người giữ ngục đã thất bại, nhưng các ngươi chưa thoát khỏi mạng lưới của ta.'],['haly','Ta tự đến để bắt ngươi chịu trách nhiệm.']],
      'wind-courier':[['haly','Những bức thư đã bị thay nội dung. Ngươi đang làm các làng tin rằng hòa ước đã bị phá vỡ.'],['guide','Tin tức thuộc về kẻ kiểm soát được đường đi của nó.'],['hero','Chúng ta sẽ mang sự thật trở lại.']],
      'wind-eagle':[['haly','Phong ấn đang khống chế Phong Ưng. Đừng làm nó bị thương quá nặng!'],['hero','Mảnh lõi đã tìm ra điểm bất thường. Ta sẽ phá ấn để giải thoát nó.']],
      'earth-base':[['haly','Khoáng thạch này hấp thụ cả chakra lẫn ma lực. Các ngươi định chế tạo thứ vũ khí gì?'],['guide','Những chuyến hàng đã rời đi. Các ngươi đến quá muộn!'],['hero','Nhưng chúng ta vẫn có thể cứu những người bị giữ ở đây.']],
      'gatekeeper':[['gatekeeper','Các ngươi vẫn có thể quay lưng với nhau như lần trước.'],['haly','Liên minh đã ở đây. Lần này chúng ta cùng giữ phong ấn.'],['hero','Ta sẽ chiến đấu cùng thế giới.']]
    };
    if(scripts[encounter.storyBattle])return campaignLines(scripts[encounter.storyBattle],save,encounter.village);
    const protecting=encounter.village==='fire';
    say(hero,protecting?'Mở cửa nhà lao và thả Hạ Ly ra! Cô ấy đã bị thương. Tôi đã hứa với mẹ cô ấy sẽ đưa cô ấy trở về.':'Ta đã lần ra dấu vết của ngươi. Đừng tiếp tục che giấu sự thật sau màn sương này.');
    say(enemy,protecting?'Muốn lấy chìa khóa ư? Đánh bại chúng ta trước đã. Không ai được đưa tù nhân ra khỏi đây!':'Ngươi biết quá nhiều rồi. Đừng mong rời khỏi đây để kể lại chuyện này.');
    if(encounter.squad?.length>1)say(opponent(encounter.squad[1],1),'Chịu thua đi! Một mình ngươi không thể cản được chúng ta.');
    say(hero,'Chừng nào vẫn còn người gặp nạn, tôi sẽ không lùi bước.');
    say(enemy,'Vậy hãy thử sống sót qua trận này!');
  }else if(encounter.kind==='quest'){
    say(hero,'Ta đến vì những người đã bị ngươi làm hại. Dừng chuyện này lại và chịu trách nhiệm đi.');
    say(enemy,'Chỉ bằng ngươi mà đòi ra lệnh cho ta? Quay về đi, khi còn có thể!');
    say(hero,'Nếu ngươi chịu hạ vũ khí, chúng ta vẫn còn cách giải quyết.');
    say(enemy,'Muốn ta chịu thua? Cứ bước tới mà thử!');
  }else{
    say(enemy,'Đứng lại! Ngươi nghĩ có thể ung dung đi qua địa bàn của ta sao?');
    say(hero,'Tôi không tìm kiếm rắc rối. Tránh đường và để người dân được yên.');
    say(enemy,'Chịu thua rồi giao hết những gì ngươi có đây!');
    say(hero,'Ta sẽ không để ngươi tiếp tục uy hiếp người khác. Chuẩn bị đi!');
  }
  return lines;
}
