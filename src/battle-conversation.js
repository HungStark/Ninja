import {heroSpeaker} from './adventure-dialogue.js';
import {encounterAppearance} from './encounter-appearance.js';
import {ninjaProfile} from './ninja.js';
import {village} from './adventure-data.js';

// Combat setup stays in the encounter. The conversation only contains what
// these characters would actually say to one another in the world.
export function battleConversation(encounter,save){
  const hero=heroSpeaker(save),lines=[],say=(speaker,text)=>lines.push({speaker,text});
  const opponent=(entry=encounter,index=0)=>{const look=encounterAppearance({...encounter,...entry});return {id:'challenge-'+look.id+'-'+index,name:entry.name||encounter.name,role:village(look.village).name,appearance:ninjaProfile(look)};};
  const enemy=opponent();
  if(encounter.kind==='intro-trio'){
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
    const protecting=encounter.village==='fire';
    say(hero,protecting?'Dừng tay! Cô ấy đã bị thương. Tôi sẽ không để các người truy sát cô ấy nữa.':'Ta đã lần ra dấu vết của ngươi. Đừng tiếp tục che giấu sự thật sau màn sương này.');
    say(enemy,protecting?'Dám che chở cho cô ta? Vậy ngươi cũng là kẻ thù của chúng ta!':'Ngươi biết quá nhiều rồi. Đừng mong rời khỏi đây để kể lại chuyện này.');
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
