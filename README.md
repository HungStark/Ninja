# Ấn Hỏa — Đấu trường Cửu Hệ

Game ninja 3D góc nhìn thứ nhất, kết ấn bằng hai tay và quyết đấu với đối thủ máy. Bản 0.3 thay sân tập bia bằng trận đấu có sinh lực, chakra, phòng ngự và phản đòn.

## Chơi ngay

Mở **index.html** bằng Chrome hoặc Edge hỗ trợ WebGL 2. Game đã được đóng gói để chơi ngoại tuyến, không cần CDN, Node.js hoặc Internet. Giữ index.html, style.css, game-core.js, game.js và ket_an.jpg cùng thư mục.

Nếu có Node.js, chạy **npm start** rồi mở http://127.0.0.1:4173.

## Quyển trục trước trận

Có **9 hệ, 45 chiêu**: Hỏa, Thủy, Lôi, Phong, Thổ, Quang, Ám, Mộc và Băng. Hỏa, Thủy và Lôi có 3 chiêu công, 2 chiêu thủ; Ám và Thổ có 4 chiêu công, 1 chiêu thủ; Phong và Quang có 3 công, 2 thủ. Mộc có 3 công, 1 thủ và 1 chiêu gieo hạt; Băng có 3 chiêu câu giờ, 1 chiêu tạo tuyết và 1 chiêu kết thúc trận. Lọc theo hệ hoặc loại chiêu, bấm một chiêu để mang theo; bấm lại hoặc bấm ô chiêu đã chọn để bỏ. Nút **Bộ Hỏa** chọn nhanh liên đạn, rồng, thiên thạch và hai chiêu thủ.

- Mang **từ 1 đến tối đa 5 chiêu**, có **ít nhất 1 chiêu tấn công**.
- Tự do phối công/thủ: có thể chọn **5 công**, **4 công + 1 thủ** hoặc **1 công + 4 thủ**. Có thể chọn chiêu thủ trước; nút vào trận chỉ bật khi bộ chiêu có ít nhất một chiêu công.
- Có thể phối nhiều hệ. Hai nút bộ mẫu giúp chọn nhanh cả hai cách chia.
- Chỉ các chiêu mang theo mới nhận chuỗi ấn và thi triển được trong trận.
- Bộ chiêu được lưu trên trình duyệt khi có localStorage. Mỗi trận tiếp theo đều quay lại quyển trục để thay bộ chiêu.

## Chiêu thức và trận đấu

Mỗi lần kết ấn, bóng tương ứng xuất hiện phía sau hai tay với độ đậm **55%** và ẩn sau **0,2 giây**.
Ấn **F — Đối quyền**: co cả bốn ngón, ôm ngón cái ngoài nắm tay rồi đưa hai nắm đấm chạm khớp ngón ở giữa.
Ấn mới thay bóng cũ và bắt đầu lại thời gian hiển thị. Bảng ghép 12 ấn với ảnh bóng
nằm trong [assets/seal-shadows.md](assets/seal-shadows.md). Khi nút **SPACE** sẵn sàng
cho chiêu Hỏa, tay được bao quanh bởi vầng lửa và tàn lửa chuyển động; vầng lửa tắt
khi tung chiêu, xóa chuỗi, tạm dừng hoặc chưa đủ chakra/hồi chiêu.
Chiêu Thủy sẵn sàng tạo vòng nước xanh quanh hai tay, có dòng nước và giọt nước xoay theo vòng; vòng nước dùng cùng điều kiện sẵn sàng và được tắt khi thi triển, xóa chuỗi, tạm dừng hoặc thiếu chakra/hồi chiêu.
Phong, Ám và Quang cũng có vòng thuộc tính riêng quanh hai tay khi chiêu sẵn sàng: Phong là một vòng xanh ngọc mảnh, sáng nhẹ theo dòng gió; Ám là vòng tím đen với viền tím mảnh; Quang là vòng trắng vàng với tia và hạt sáng hình thoi. Vòng Phong và Ám thu gọn thành quầng thấp phía sau lòng bàn tay, giới hạn độ rộng, giảm hạt sáng và bỏ các dải xoay lớn bên ngoài. Vòng theo vị trí tay và chỉ sáng khi Space dùng được, gồm cả điều kiện lãnh địa, phân thân, hất tung. Các vòng tắt khi tung chiêu, xóa/sai/hết hạn chuỗi, thiếu chakra, hồi chiêu hoặc tạm dừng; hỗ trợ đồ họa thấp và giảm chuyển động.

Tay được dựng trong Blender dựa trên mesh 3D `anime_style_hand.glb` do người dùng cung cấp. Giữ cấu trúc lòng bàn tay cong, kẽ ngón và khối cơ gốc ngón cái của mẫu; dựng lại đầu ngón bằng các tiết diện tròn thuôn, đóng cổ tay và dùng subdivision để nối mượt. Các phần móng dài của mẫu được thay bằng móng riêng nhỏ, mỏng và ôm theo bề mặt. Model được gắn 16 xương theo tỷ lệ mới, với trọng số chuyển tiếp mượt và giữ 12 thế kết ấn. Vị trí FPS, giáp xanh đen, vòng vàng và ánh sáng/vật liệu hiện tại được giữ nguyên.

Hình khối được kiểm tra riêng bằng vật liệu xám trung tính ở chính diện, nghiêng 45° và nhìn ngang trước khi áp màu. Trong game, da/móng dùng cel shading nhẹ dựa trên normal của mesh với bốn mức sáng; giáp giữ bảng màu cũ. Viền da rộng 0,35 pixel, móng 0,18 pixel và giáp 0,40 pixel theo kích thước màn hình. Tay được vẽ sau bước chuyển màu của cảnh; vòng Hỏa–Thủy–Lôi vẫn đi qua bloom. Ánh sáng chạng vạng của môi trường được giữ nguyên. Model được xuất sẵn thành GLB và nhúng trong game để chơi ngoại tuyến.

Phong cảnh dùng ánh sáng chạng vạng, bầu trời và sương tối hơn để chiêu thức nổi bật.

Hiệu ứng Hỏa–Thủy–Lôi–Phong–Ám dùng mảng màu cel rõ: lửa có lõi vàng và vùng cam/đỏ, nước có dòng chảy và bọt lớn, Lôi điểu có thân tím rõ với lõi sét trắng mảnh, phân thân và đầm mực dùng các vùng tím đen thay bề mặt bóng. Thuyền Thủy có buồm và cờ rách nhẹ, lỗ thủng thật, miếng vá có đường khâu, ván boong sửa và lan can sứt. Các thay đổi đồ họa giữ thời điểm thi triển, góc nhìn, sát thương và ánh sáng chạng vạng.

Hệ Hỏa có hiệu ứng và cơ chế riêng:

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Hỏa liên đạn | 4 | Q W D F | 40 | Ba hỏa cầu nhỏ xếp ngang phía trên tay, giữ 0,5 giây rồi phóng lần lượt cách nhau 0,1 giây tới điểm ngắm đã chọn; mỗi viên 9,6 sát thương (40% ban đầu; tổng 28,8), không để lại lửa trên đối thủ |
| Rồng lửa | 6 | Q W C V Z X | 56 | Rồng cuộn thành vòng lửa trước mặt trong 1,1 giây rồi lao tới; camera chuyển lên trên bên trái và trở lại sau cú đánh, 104 sát thương |
| Thiên thạch | 8 | Q W C V Z X E R | 82 | Bay một đường thẳng từ trời tới đất trong 3,4 giây; camera ngước lên, zoom in trong 0,24 giây rồi zoom out dần trong cảnh trời 1,4 giây, trở về trong 0,4 giây; 150 sát thương trong bán kính 5,5 m |
| Khiên lửa | 3 | Q W A | 26 | Vòm lửa bao quanh người, hấp thụ 75 sát thương trong 4,5 giây |
| Tường lửa | 5 | Q W Z X C | 36 | Tường rộng 7 m, cao 4,2 m, dựng cách 3 m phía trước; 120 độ bền, tồn tại 5 giây |

Tường đứng yên khi người chơi né, chặn đạn đối phương đi xuyên qua mặt tường và có thể tồn tại cùng khiên. Dựng tường mới thay tường cũ của người thi triển. Thiên thạch xuyên một tầng mây bị đẩy tách ra, có dấu báo vùng rơi và đuôi lửa. Khi chạm đất, đá lớn nhỏ bật tung theo quỹ đạo, bụi đất lan ra, tia lửa bắn lên và vết nứt nóng sáng xuất hiện quanh tâm nổ; có thể né khỏi vùng nổ, nhưng không phản được thiên thạch. Nhắm ngang sẽ thả ở khoảng cách 31 m; nhắm xuống sẽ chọn điểm trên mặt đất (6–55 m). Camera giữ hướng ngắm gốc khi trở về; đối thủ thi triển không đổi camera của người chơi. Các ID chiêu Hỏa cũ được giữ để bộ chiêu đã lưu vẫn dùng được.

Camera giật nhẹ và zoom out khi phóng liên đạn; zoom in lúc tích lực rồng rồi giật khi phóng và trúng mục tiêu. Thiên thạch chạm đất gây rung và zoom out theo khoảng cách tới vụ nổ. Khiên, tường, phản đòn và trúng đạn có nhịp rung riêng; hướng ngắm được giữ nguyên. Hiệu ứng dừng khi tạm dừng, được xóa khi bắt đầu lại và tắt rung/zoom nếu trình duyệt yêu cầu giảm chuyển động.

Hệ Thủy có năm chiêu riêng:

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Thủy ngục | 5 | W E Z X C | 38 | 12 sát thương; khi xuyên khiên, giam đối thủ trong cầu nước 3 giây, ngắt chuỗi ấn và khóa di chuyển/thi triển |
| Ném thuyền | 6 | W E C V Z X | 56 | Thuyền hải tặc trồi từ dưới đất lên trong 1,2 giây, rồi bay thẳng tới điểm ngắm đã chọn; camera chuyển lên trên như Rồng lửa và trở lại sau cú đánh; 90 sát thương trong bán kính 3,5 m |
| Sóng thần | 8 | W E C V Z X E R | 72 | Camera nhìn xuống chân, nước tụ và dựng thành sóng trong 1,8 giây rồi trả hướng ngắm; sóng rộng 12 m, cao 5 m, dày khoảng 7 m, có ngọn cuộn, bọt và nước bắn; cuốn đạn/mặt chắn, gây 30 sát thương một lần |
| Khiên nước | 3 | W E A | 26 | Bao quanh bản thân, hấp thụ 65 sát thương trong 4,5 giây |
| Thủy thuẫn | 4 | W E D F | 32 | Mặt chắn nước hình tròn bán kính 2,2 m, dựng cách 3 m phía trước; 95 độ bền, tồn tại 5 giây |

Thủy thuẫn đứng tại vị trí thi triển, chặn chiêu bay qua mặt chắn, không phản đòn và có thể tồn tại cùng khiên bao thân. Sóng thần cuốn chiêu khi chúng thực sự đi qua thể tích sóng; chiêu bay cao hơn hoặc ngoài bề rộng sóng vẫn đi tiếp. Thuyền và sóng thần không bị phản đòn. Giữ các ID Thủy cũ để bộ chiêu đã lưu vẫn dùng được. Thủy ngục và sóng cùng khiên đều dừng thời gian khi tạm dừng, được xóa khi đấu lại.

Hệ Lôi có năm chiêu với hiệu ứng điện riêng:

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Lôi thương | 4 | E R D F | 40 | Thương sét dài và nhanh, 62 sát thương |
| Lôi điểu | 6 | E R C V Z X | 56 | Cầu sét tụ trước mặt, chim hiện ra và dang cánh trong 1,1 giây rồi lao tới; camera chuyển lên cao như Rồng lửa, 102 sát thương |
| Thiên lôi | 8 | E R C V Z X E R | 82 | Ngước nhìn mây chớp điện 1,4 giây, trả góc nhìn trong 0,4 giây rồi sét đánh xuống điểm ngắm, 150 sát thương trong bán kính 4,5 m |
| Lôi thuẫn | 3 | E R A | 26 | Khiên điện bao thân, hấp thụ 80 sát thương trong 5 giây |
| Lôi trận | 5 | E R Z X C | 36 | Vùng điện bán kính 9 m, cao 8 m, tồn tại 10 giây; đạn đối phương còn 30% tốc độ trong vùng |

Thiên lôi ngước camera lên đám mây chớp điện, trả về góc ngắm ban đầu trước khi tia sét đánh xuống; chiêu của máy không điều khiển camera người chơi. Vòng báo trên đất cho phép né trước khi sét đánh; sét không bị phản đòn. Lôi trận đứng tại vị trí thi triển, giữ nguyên sát thương và vận tốc gốc của đạn: đạn rời vùng sẽ nhanh trở lại, đạn cùng bên không bị làm chậm, vùng chồng nhau không nhân độ chậm. Thi triển lại thay vùng cũ của cùng người chơi. Khiên và trận có thể tồn tại cùng nhau; hiệu ứng, thời gian và camera dừng khi tạm dừng, được xóa khi đấu lại. Giữ các ID Lôi cũ để bộ chiêu đã lưu vẫn dùng được.

Kết đủ ấn và sẵn sàng thi triển bất kỳ chiêu Lôi nào sẽ hiện vòng sét tím trắng cùng tia điện chạy quanh tay. Vòng tắt khi tung chiêu, xóa/sai/hết hạn chuỗi ấn, tạm dừng, đang hồi chiêu hoặc thiếu chakra; khi đủ điều kiện, vòng hiện lại như Hỏa và Thủy. Chế độ giảm chuyển động làm điện và tia sáng chuyển động chậm hơn.

Kết đủ ấn và sẵn sàng thi triển bất kỳ chiêu Lôi nào sẽ hiện vòng sét tím trắng cùng tia điện chạy quanh tay. Vòng tắt khi tung chiêu, xóa/sai/hết hạn chuỗi ấn, tạm dừng, đang hồi chiêu hoặc thiếu chakra; khi đủ điều kiện, vòng hiện lại như Hỏa và Thủy. Chế độ giảm chuyển động làm điện và tia sáng chuyển động chậm hơn.

### Phong thuật

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Phong nhận | 2 | R A | 24 | Phóng nhát chém gió lưỡi liềm, 36 sát thương |
| Phong liên trảm | 3 | R A D | 22 | Chỉ nối khi đối thủ đang bị lốc của mình hất tung; 8 nhát chém trong 2 giây, tổng 70 sát thương và giữ trên không thêm 2 giây |
| Phong bích | 4 | R A Z X | 32 | Tường gió trước mặt rộng 7 m, cao 5 m, 110 độ bền, tồn tại 5 giây |
| Phong lốc | 6 | R A C V Z X | 46 | Lốc xoáy 3D lao tới, 70 sát thương và hất tung/khóa thao tác 2 giây |
| Tiên linh gió | 8 | R A C V Z X E R | 70 | Tinh linh toon xuất hiện trước mặt; giữ góc nhìn FPS, thổi gió trong 5 giây |

Phong có đúng năm chiêu, giữ các ID đã lưu. Lốc nâng mô hình đối thủ và góc nhìn của người bị trúng lên thật khỏi mặt đất. Trong cửa sổ 2 giây, người tung lốc có thể kết **R A D → SPACE** để nối liên trảm đúng mục tiêu đó, một lần mỗi lốc; thời gian giữ trên không được cộng thêm 2 giây vào thời gian còn lại. Liên trảm không dùng độc lập hoặc nối lốc của bên kia, không trừ chakra/xóa ấn khi điều kiện không còn hợp lệ. Lốc bị khiên hấp thụ hoàn toàn hoặc đánh trượt không hất tung; có thể né hoặc dùng độn thổ để tránh. Hất tung cộng với các trạng thái khống chế khác mà không xóa chúng.

Tinh linh nhỏ xinh dạng tiên bướm, hai đôi cánh 3D tròn mềm, râu bướm, ánh xanh lá nhẹ và đốm sáng bay quanh; vật liệu cel với viền rất mảnh xuất hiện trong 1,8 giây, sau đó thổi gió và bảo vệ trong 5 giây. Tinh linh xuất hiện trước mặt ở tầm mắt, lệch nhẹ khỏi đường ngắm, chào người triệu hồi rồi quay về phía đối thủ. Camera giữ FPS trong toàn bộ quá trình; vẫn kết ấn, ngắm và né bình thường. Mã camera nhìn thẳng xuống 90°, mô hình người chơi 3D và mũi tên hướng ngắm vẫn được giữ, mặc định tắt; kiểm tra bằng `test:wind-camera` có thể bật riêng qua hook test `setWindCameraEnabled(true)`. Tinh linh đi theo người triệu hồi, hướng gió theo hướng ngắm hiện tại; bảo vệ vùng trước mặt rộng 8 m, sâu 10 m, cao 10 m. Chiêu đang bay vào vùng từ phía trước bị thổi ngược về đối thủ, giữ sát thương và tốc độ; phản liên tục nhiều chiêu, gồm cả thuyền và sóng đang di chuyển. Đòn từ bên hông, phía sau, sét đánh thẳng từ trên trời, hoặc chiêu chưa hình thành/bắt đầu bay không bị phản. Phản bởi gió không phụ thuộc thuộc tính phản khiên thông thường; chiêu qua hai tinh linh đối nghịch vẫn có thời gian sống hữu hạn. Tường gió đứng ở vị trí thi triển, có thể tồn tại cùng tinh linh; thi triển lại thay tường/tinh linh cũ của cùng bên. Hoạt ảnh, combo, thời gian bảo vệ và camera đều dừng khi tạm dừng, xóa khi đấu lại. Đồ họa thấp giữ toàn bộ cơ chế.

### Ám thuật và Hắc lãnh địa

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Hắc lãnh địa | 8 | D F C V Z X E R | 70 | Mở mắt thấy mái vòm đen 3D trước mặt, rồi mực lan ra thành lãnh địa; tồn tại 30 giây sau khi mở xong |
| Ảnh phân thân | 3 | D F A | 26 | Thêm một chó bóng; đủ 3 bóng thì mỗi lần thi triển nâng một chó thành bò bóng, giữ nửa sân và ánh đỏ |
| Ảnh tập kích | 2 | D F | 34 | Ra lệnh cho phân thân lao tới điểm ngắm; chó đánh 38, bò đánh 57 sát thương rồi biến mất |
| Ảnh tượng | 6 | D F C V Z X | 56 | Voi bóng 3D rơi từ trên xuống trong 0,7 giây, gây 90 sát thương khi đáp và nhấn chìm, khóa thao tác 2 giây |
| Ảnh độn | 5 | D F Z X C | 32 | Lặn dưới đất 3 giây, miễn nhiễm mọi đòn tấn công; nhìn ra qua lớp bóng đen mờ, vẫn ngắm, né, kết ấn và thi triển |

Ám có đúng năm chiêu. Phân thân và lệnh tấn công dùng được ngoài lãnh địa. Phân thân đứng nguyên hàng cho đến khi nhận lệnh; lệnh chọn điểm ngắm cố định, có thể đánh trượt nếu đối thủ né. Phân thân biến mất ngay sau khi tấn công (kể cả đánh trượt) hoặc dính một chiêu: ngoài lãnh địa không hồi lại; trong lãnh địa chờ 0,7 giây rồi trồi lên từ vị trí đứng ban đầu. Mỗi lần triệu hồi thêm một phân thân, giữ nguyên các phân thân đã tạo; mỗi bên có giới hạn riêng 3 con. Hàng phân thân nằm ở một phần tư khoảng cách từ bên triệu hồi tới đối thủ, thuộc nửa sân của mình. Phân thân đang chờ hồi vẫn giữ chỗ. Khi đủ 3 bóng, thi triển Ảnh phân thân thêm lần nữa sẽ nâng đúng một chó thành bò bóng, theo thứ tự được tạo; mỗi lần vẫn tốn 26 chakra, bò gây 57 sát thương (38 × 1,5). Không tăng số lượng, không đổi vị trí/lệnh đang nhận. Bò có thân lớn, sừng và móng guốc; vẫn không cản đạn. Nâng được cả bóng đang chờ trồi lại trong lãnh địa; khi hồi lại vẫn là bò và giữ sát thương 57. Khi cả ba đã là bò, thi triển thêm không trừ chakra hoặc xóa chuỗi ấn. Nếu mất một con ngoài lãnh địa, lần thi triển sau tạo chó mới vào chỗ trống trước. Đạn phá hủy mọi phân thân đối phương trên đường bay rồi tiếp tục di chuyển, không mất sát thương hoặc tốc độ do va chạm với phân thân. Ra lệnh khi chưa có phân thân không trừ chakra hoặc xóa chuỗi ấn.

Chỉ Ảnh tượng và Ảnh độn cần lãnh địa đã mở. Ảnh tượng rơi xuống điểm ngắm cố định: đối thủ có thể né trong lúc voi đang rơi. Khi đáp trúng, voi gây 90 sát thương trực tiếp một lần, nhấn đối thủ xuống nền bóng và khóa ngắm, né, kết ấn, thi triển trong 2 giây; sau đó đối thủ nổi lại. Voi có thân, bốn chân, tai, vòi và ngà 3D theo phong cách toon của các thú bóng. Ảnh độn chặn cả đạn, vụ nổ, Thủy ngục, Thiên lôi và Ảnh tượng, không tiêu hao khiên hoặc phản đòn. Ảnh độn hạ mắt nhìn xuống dưới mặt đất, lớp mực phía trên chuyển thành màn đen bán trong suốt để thấy đối thủ và chiêu thức ngoài sân. Sau 3 giây nổi lại trong 0,35 giây. Hướng ngắm, kết ấn và thi triển vẫn hoạt động; khi đang lặn, chiêu có camera điện ảnh vẫn thi triển nhưng giữ góc nhìn dưới đất. Ảnh tượng giữ góc nhìn FPS khi khóa thao tác.

Lãnh địa dùng được cho cả hai bên. Mở mắt vẫn thấy sân đấu và một mái vòm đen 3D trước mặt. Mái vòm bán cầu nở rộng, mực phủ dần đường, núi và bầu trời. Khi mở xong, lãnh địa bắt đầu tính 30 giây. Thi triển lại làm mới thời gian; hết hạn trả cảnh cũ, kết thúc kéo/lặn và khả năng hồi phân thân, nhưng các phân thân còn sống vẫn đứng chờ ngoài lãnh địa. Tạm dừng đóng băng tất cả hiệu ứng và đồng hồ; đấu lại hoặc về chọn chiêu xóa phân thân, kéo, lặn và khôi phục cảnh. Máy hệ Ám mở lãnh địa, tạo phân thân rồi phát lệnh tấn công.

### Thổ thuật

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Thổ Thứ | 2 | A S | 24 | Chạy ngầm với vệt nứt, đất nhô nhẹ và vụn đá dạt sang hai bên theo đường đi; tới đối thủ mới bật cụm gai gây 40 sát thương; để lại gờ đá 3 giây |
| Địa Ngục Chông | 4 | A S D F | 34 | Phủ chông trong hố Địa Bộc Thiên Tinh của chính bạn; gây 50 sát thương một lần khi địch rơi xuống hoặc bước vào; chông biến mất cùng hố |
| Sơn Hà Đảo Chuyển | 6 | A S C V Z X | 56 | Địa hình nâng/hạ theo 5 đợt trong 5 giây, mỗi đợt 30 sát thương; còn mô đất và hõm sâu thêm 5 giây |
| Thổ Bích | 5 | A S Z X C | 32 | Tường đá cong trước mặt, cao 3,2 m, 180 độ bền chung, tồn tại 6 giây; chặn đạn, laser và đường đi; có thể đi vòng |
| Địa Bộc Thiên Tinh | 8 | A S C V Z X E R | 82 | Ném cầu và nứt đất trong 1 giây; nâng mảng trung tâm trước, đá ngoài bay theo đợt 5 viên cách nhau 0,2 giây, tăng tốc khi gần quả cầu; giam 3 giây gây 80 sát thương, rơi trong 0,65 giây gây 100; hố biến mất 1,5 giây sau cú rơi |

Địa hình thay đổi thật: mặt đất, đường lát đá, cỏ, hoa và đá nhỏ biến dạng theo vùng chiêu; độ cao nhân vật, camera và tốc độ né cùng dùng bề mặt đó. Đòn bay và laser bị địa hình nhô cao chặn. Hết hạn hoặc đấu lại trả bề mặt về trạng thái ban đầu. Vật thể chỉ xuất hiện khi thi triển thành công, không có mô hình xem trước lúc kết ấn.

Địa Bộc Thiên Tinh ném lõi đen theo cung từ tay lên trên vị trí đã ngắm. Khi cầu tới nơi, các vết nứt tỏa ra mặt đất; mảng đất trung tâm nhấc mục tiêu lên trước, rồi các mảnh xung quanh tách khỏi mặt đất và gom thành khối cầu. Đá ngoài được chia thành 20 đợt, mỗi đợt 5 viên, bắt đầu cách nhau 0,2 giây. Mỗi viên tăng tốc liên tục khi bay về quả cầu (vận tốc đầu 10 m/s, gia tốc 42 m/s²), vẫn giữ đường cong và độ xoay riêng để các đợt bay lên từ nhiều hướng. Khối cầu chỉ hoàn thành khi đợt cuối cùng đã tới nơi. Có thể né khỏi vùng hút bán kính 5,5 m trong giây đầu. Người bị bắt bị khóa di chuyển/kết ấn cho tới khi rơi xuống; khiên vẫn hấp thụ sát thương, miễn nhiễm ngăn bắt. Camera theo cầu, hạ xuống vùng đất nứt rồi theo khối đất nâng lên trước khi trở về hướng ngắm. Hố có bán kính 6,5 m, được lấp lại trong 1,5 giây kể từ cú rơi; chông trong hố hết hạn cùng lúc. Các chiêu dùng được cho cả hai bên, gồm AI; tạm dừng đóng băng hiệu ứng, hỗ trợ đồ họa thấp và giảm chuyển động.

Hố bắt đầu dùng được cho Địa Ngục Chông khi đất đá đã gom xong. Có thể đặt chông khi địch còn bị giam để đón cú rơi. Không có hố của mình thì chiêu 4 ấn bị khóa và không tốn chakra. Thổ Thứ chạy ngầm theo hướng đã ngắm, không tự đuổi theo địch né sang bên.

Kết đủ ấn của một chiêu Thổ có thể thi triển sẽ hiện vòng nâu quanh tay, kèm đá vụn nổi và bụi bay. Vòng tắt khi thi triển, xóa/sai/hết hạn chuỗi, tạm dừng hoặc chưa đủ chakra/điều kiện của chiêu.

Giữ năm ID Thổ cũ cho bộ chiêu đã lưu. `earth-lance` nay là Địa Ngục Chông; `earth-reflect` là Địa Bộc Thiên Tinh (chiêu công), còn `earth-barrier` là tường địa hình.

### Quang thuật

Ánh sáng chủ đạo là **trắng và vàng**. Chỉ laser xuyên qua cầu thủy tinh mới chuyển thành đủ **7 sắc cầu vồng**.

Cầu thủy tinh, mái vòm và gương **chỉ xuất hiện sau khi bấm SPACE và thi triển thành công**. Chọn chiêu hoặc kết đủ ấn không dựng mô hình xem trước; kết ấn chiêu khác không tạo thêm vật thể.

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Quang laser | 2 | S D | 24 | Một tia thẳng trắng–vàng, 40 sát thương; tích sáng 0,08 giây |
| Cầu thủy tinh | 6 | S D C V Z X | 32 | Cầu trong suốt cách mặt 3 m, tồn tại 8 giây; laser xuyên qua thành 7 sắc và 70 sát thương |
| Mái vòm gương | 8 | S D C V Z X S D | 54 | 96 tấm gương rơi ghép vòm trong 1,2 giây; bán kính 6,2 m, đủ 3 nhịp né mỗi phía; giữ địch bên trong, vòm kín tồn tại 10 giây |
| Quang kính | 5 | S D Z X C | 28 | Gương cách mặt 2,4 m, tồn tại 2,5 giây; phản đòn bay tới từ phía trước, kể cả laser |
| Nấc thang của Jacob | 6 | S D Z X C V | 82 | Cột sáng giáng từ trời xuống điểm ngắm, 160 sát thương trong bán kính 3,5 m |

**Cầu thủy tinh:** laser phải thực sự xuyên qua cầu của bên thi triển mới được tăng 75% sát thương. Phần tia trước cầu vẫn trắng–vàng; từ cầu trở đi là bảy dải màu. Cầu giữ vị trí lúc tạo. Mỗi bên có một cầu; tạo lại thay cầu cũ.

**Mái vòm gương:** các tấm gương rơi từ trên cao, xoay và ghép lần lượt từ chân vòm lên đỉnh trong 1,2 giây. Vành chân đánh dấu vùng và chặn mục tiêu đi ra ngoài ngay khi bắt đầu dựng; phạm vi cho phép 3 nhịp né (5,4 m) về mỗi phía. Sau khi ghép kín mới bắt laser, rồi tồn tại đủ 10 giây. Bản thân vòm không gây sát thương. Bắn laser vào vòm kín của mình để giữ tia bên trong. Tia phản xạ theo các mặt gương và nền, liên tục nảy cho tới khi vòm biến mất. Mỗi tia bị giữ gây 20 sát thương mỗi giây, hoặc 35 nếu đã đi qua cầu thủy tinh. Màu và sức mạnh của tia đã giữ không mất khi cầu thủy tinh hết hạn. Các laser bắn thêm được giữ riêng và cộng dồn sát thương: hai tia thường gây 40/giây, hai tia 7 sắc gây 70/giây, một tia thường và một tia 7 sắc gây 55/giây. Mỗi bên chỉ có một mái vòm. Mục tiêu có thể di chuyển trong vòm nhưng không vượt qua thành; hết hạn hoặc thay vòm sẽ giải phóng đường đi. Tường nằm trước vòm chặn laser và ngăn kích hoạt.

**Quang kính:** gương đặt cố định theo hướng ngắm lúc tạo, rộng 2,2 m và cao 2,8 m. Các đòn bay tới từ phía trước và chạm mặt gương được phản lại theo góc tới, đổi bên gây sát thương; đạn đi ngoài gương hoặc từ sau lưng không bị phản. Gương không tiêu hao sau một lần phản, nhưng chỉ tồn tại 2,5 giây. Laser trực tiếp cũng bị gương phản. Các đòn giáng từ trời không bay qua gương trước mặt.

**Nấc thang của Jacob:** camera ngước lên vòng sáng trên trời trong 1,25 giây, sau đó lia xuống theo cột sáng đang giáng trong 0,55 giây. Cột chạm đất mới gây sát thương, rồi tan trong 1,1 giây. Trả lại hướng ngắm và góc nhìn ban đầu. Điểm rơi giữ nguyên khi đã thi triển nên có thể ngắm trượt hoặc né. Màu cột sáng là trắng với hào quang vàng.

Sát thương vẫn tôn trọng khiên và miễn nhiễm. Cả người chơi và AI dùng bộ chiêu mới. HUD hiển thị thời gian còn lại của cầu, gương và mái vòm. Tạm dừng đóng băng hiệu ứng và camera; đấu lại/về quyển trục xóa toàn bộ. Hỗ trợ đồ họa thấp và giảm chuyển động. Giữ năm ID chiêu cũ để bộ chiêu đã lưu vẫn dùng được, chuỗi ấn được đổi theo bảng trên.

**Mộc** có ba chiêu công, một chiêu thủ và một chiêu gieo hạt:

| Chiêu | Số ấn | Phím | Tác dụng |
| --- | --- | --- | --- |
| Độc Hoa | 3 | F Z C | Miệng hoa nhả khói tím thành vùng độc 6 giây; bán kính mỗi vùng tăng từ 2 lên 5 m theo cây; địch chỉ mất 5–15 máu/giây khi ở trong vùng |
| Dây Leo Trói Buộc | 4 | F Z D F | Dây leo bò từ vườn tới quấn đối thủ; 18–54 sát thương, trói 2–6 giây |
| Trúc Diệp Phi Vũ | 6 | F Z C V Z X | Mỗi bụi tre rung, mọc cành lá phát sáng trong 0,55 giây rồi phóng theo 1–3 đợt tới điểm ngắm; tổng 75–225 sát thương; lá phải bay tới mới gây sát thương và có thể bị né/chắn/phản |
| Óc Chó Hộ Vệ | 5 | F Z Z X C | Cây phía trước bên phải thả quả óc chó; quả rơi, hóa lớn và chắn phía trước trong 5–7 giây, độ bền 90–270 |
| Vườn Sinh Mệnh | 10 | F Z C V Z X E R Q W | Tự gieo 37 hạt: 12 hoa độc, 12 dây leo và 12 bụi tre bao quanh đối thủ, cả trước, sau và hai bên, 1 cây óc chó phía trước bên phải; không gây sát thương, một lần mỗi trận |

Hạt bay theo quỹ đạo từ người thi triển rồi đáp đất và nảy mầm. Bốn chiêu điều khiển cây chỉ mở sau khi rừng đã mọc. Cây trưởng thành hoàn toàn sau 60 giây kể từ khi thi triển và tồn tại đến hết trận, mọc quanh vị trí đối thủ lúc gieo hạt trong vùng rộng khoảng 20 m, có cây ở cả trước, sau và hai bên. Cây phía trước đối thủ, nằm giữa hai người, chỉ cao tối đa nửa chiều cao đối thủ, kể cả khi trưởng thành và lay động; cây ở nửa vùng phía sau giữ quy mô rừng lớn với nhiều chiều cao xen kẽ, kể cả giữa các cây cùng loại. Cây óc chó có 23 cụm tán lá nhỏ xếp thành nhiều tầng thay cho vài tán lớn. Các cây mọc rải rác với khoảng trống giữa các thân, không xếp thành hàng hoặc cột. Cây trưởng thành cao tới khoảng 5,9 m, giữ kích thước bằng 3/4 cổng cũ sau khi dọn map. Cây càng lớn thì vùng khói độc càng rộng, sát thương tăng, dây leo dày hơn và trói lâu hơn, tre phóng nhiều đợt lá lớn hơn, quả óc chó to và bền hơn. Sức mạnh được lấy tại lúc ra lệnh. Rừng không tự gây sát thương khi chưa ra lệnh tấn công. Khói tím phun từ miệng hoa, loang ra và ở lại quanh cây; sát thương dừng ngay khi đối thủ rời vùng, không đeo độc theo người. Các vùng khói của cùng một rừng không nhân sát thương khi chồng lên nhau; gọi lại Độc Hoa thay đợt khói cũ. Lá tre bay từ tán tre tới điểm ngắm lúc thi triển, không tự đuổi mục tiêu. Quả óc chó mất 1,05 giây để rơi và hóa lớn trước khi chặn đòn, đứng cố định phía trước tại vị trí thi triển, không cấp giáp bao thân và không đỡ đòn tới từ phía sau.

Kết đủ ấn và đủ điều kiện thi triển chiêu Mộc sẽ hiện vòng xanh với lá bay quanh tay. Vòng Băng có màu trắng xanh, kèm bông tuyết sáu cánh bay vòng. Hiệu ứng đi theo tay, tắt khi tung chiêu, xóa/sai/hết hạn chuỗi ấn, tạm dừng hoặc chưa đủ điều kiện; chế độ giảm chuyển động làm lá và tuyết bay chậm hơn.

**Băng** có ba chiêu câu giờ, một chiêu tạo tuyết và một chiêu kết thúc trận:

| Chiêu | Số ấn | Phím | Tác dụng |
| --- | --- | --- | --- |
| Tuyết Táng | 2 | Z X | Khóa đến khi tích đủ 90 tuyết; gom tuyết thành cầu khổng lồ tự tìm đối thủ |
| Băng Phược | 4 | Z X D F | Gom tuyết trong không khí 0,75 giây rồi bắn tinh thể; trúng địch thì đóng băng 3 giây, không gây sát thương |
| Huyễn Sương | 6 | Z X C V Z X | Sương mù 6 giây, ẩn người thật và tạo bản sao ở vị trí lệch |
| Băng Bích | 5 | Z X Z X C | 7 mảng tường băng mọc từ đất trong 0,82 giây, chắn đòn phía trước; 120 độ bền, tồn tại 5 giây |
| Băng Thiên Tuyết Địa | 10 | Z X C V Z X E R Q W | Tạo mưa tuyết dày dần, không gây sát thương, một lần mỗi trận |

Mưa tuyết tích 1 tuyết mỗi giây, tối đa 90. Băng Phược, Huyễn Sương và Băng Bích mỗi lần tốn 3 tuyết; cần gọi mưa tuyết và đủ dự trữ trước khi dùng. Không dùng chiêu hỗ trợ thì đủ tuyết sau 90 giây; mỗi lần dùng kéo dài thêm 3 giây. Dùng khi đã đầy làm lượng tuyết giảm còn 87 và khóa lại Tuyết Táng đến khi tích bù đủ. Tuyết và hiệu ứng trên sân giảm theo lượng còn lại; tạm dừng cũng dừng tích tuyết và cây lớn. Băng Phược gom các mảnh tuyết trong không khí về tinh thể trong 0,75 giây rồi mới bắn; chỉ đóng băng 3 giây khi chạm địch. Băng Bích dựng 7 mảng tinh thể trong suốt có cạnh sáng và vân nứt từ mặt đất lên trong 0,82 giây; tường đứng cố định phía trước, cao khoảng 3,9 m, rộng 5,9 m, 120 độ bền và tồn tại 5 giây, chắn đạn phía trước thay cho giáp bao người. Huyễn Sương phủ quanh vị trí thật và đi theo người dùng; từ bên trong, sương ở rìa tầm nhìn và để giữa màn hình trong để nhìn địch. Đối phương thấy sương dày che người thật và một bản sao lệch khoảng 4,3 m; AI ngắm bản sao thay vì vị trí thật. Tuyết Táng gom tuyết trong 2,2 giây: tuyết trên mặt đất và trong không khí cuốn về tâm, các cụm tuyết bay lên tăng tốc, lớp tuyết rút dần và quả cầu lớn dần tại chỗ. Cầu hoàn chỉnh mới bắt đầu lăn; không cần ngắm, tự đuổi đối thủ ở tốc độ 3,1 m/giây, xuyên tường, khiên, phản đòn và miễn nhiễm. Cầu nuốt đối thủ rồi lăn tiếp 2,8 giây để kết thúc trận thắng/thua thật. Toàn bộ tuyết của người thi triển được gom vào cầu. Đấu lại sẽ xóa cây, tuyết, ảo ảnh, khống chế, cầu tuyết và lượt dùng chiêu 10 ấn. AI Mộc/Băng mở trận bằng chiêu khởi tạo tương ứng; AI Băng câu giờ rồi dùng Tuyết Táng khi đủ tuyết.

Chuỗi của mỗi hệ bắt đầu bằng hai ấn nhận diện hệ. Nếu mang chiêu 2 ấn, có thể nhấn Space sau hai ấn để thi triển, hoặc tiếp tục kết ấn cho chiêu dài hơn. Hỏa, Thủy và Lôi không còn chiêu cầu 2 ấn; game không tự tung chiêu. Khi đang xem chiêu dài, quyển trục giữ công thức đó để theo dõi tiến trình. Rồng lửa có thể nối thêm **E R** thành Thiên thạch nếu mang cả hai chiêu.

Thi triển khiên bao thân mới thay thế khiên cũ. Đạn đã phản không được phản tiếp để tránh vòng lặp. Mỗi đạn có màu, ánh sáng và vệt theo hệ.

Hai bên có **1000 sinh lực** và **100 chakra**. Chakra hồi 11 mỗi giây, cách hai lần thi triển ít nhất 1 giây. Kết đủ chuỗi 2–10 ấn của chiêu theo quyển trục rồi nhấn Space. Cấp và số ấn được ghi trên từng thẻ chiêu. Nhập sai sẽ thử bắt đầu chuỗi mới từ phím vừa bấm; chuỗi hết hạn sau 7 giây không nhập ấn.

Quyển trục mang theo trong trận hiện đủ tên và phím kết ấn của cả 5 chiêu, không cần cuộn; trên màn hình nhỏ, bảng chiêu nằm phía dưới. Nhấn Space sẽ tung đạn hoặc tạo khiên ngay, đồng thời đọc tên chiêu và trừ chakra. Có thể kết chuỗi tiếp theo khi giọng đọc vẫn đang chạy; khoảng cách giữa hai lần thi triển vẫn là 1 giây. Giọng đọc dùng tính năng tổng hợp tiếng nói của trình duyệt, ưu tiên giọng tiếng Việt trên máy. Tắt âm thanh, thiếu giọng đọc hoặc lỗi dịch vụ giọng nói không làm chậm chiêu. Tạm dừng cũng dừng giọng đọc; đấu lại hoặc về chọn chiêu sẽ hủy giọng đang đọc. Banner 12 hình kết ấn được ẩn.

Đối thủ đứng ở đầu sân bên kia, cách vị trí xuất phát của người chơi 31 m, sử dụng model tay có khớp và bộ 12 thế tay như người chơi. Máy kết từng ấn theo đúng độ dài của từng chiêu trước khi tung chiêu, ngắm vị trí của người chơi lúc phóng đạn, có chakra và có thể chọn phòng ngự khi bị tấn công. Thanh trên cùng cho biết máu, hệ, chakra và chiêu đang kết ấn. Qua mỗi trận, máy dùng tổ hợp hệ khác.

Tuyết Táng kết thúc trận khi chôn vùi và cuốn đối thủ đi. Với các chiêu gây sát thương thông thường, trúng chiêu vẫn mất máu sau khi trừ khiên. Khi sinh lực chạm 0, bên đó hồi ngay đầy 1000 máu và trận đấu tiếp tục. Tạm dừng giữ nguyên máu, chakra, khiên, đạn, chuỗi ấn và tiến trình máy.

## Điều khiển

- **Q W E R A S D F Z X C V:** 12 ấn. Xem chuỗi phím trên quyển trục mang theo; banner hình ấn được ẩn.
- **Space:** thi triển chiêu đã kết đủ ấn. **Backspace:** xóa chuỗi.
- **Lia chuột:** xoay hướng ngắm. Con trỏ được khóa và thay bằng tâm ngắm chính giữa màn hình khi vào trận. Hướng bắn luôn đi qua tâm ngắm.
- **Click chuột trái:** né một bước 1,8 m sang trái. **Click chuột phải:** né một bước 1,8 m sang phải. Hướng né theo nút bấm, độc lập vị trí hoặc hướng lia chuột. Giữ nút không tự di chuyển tiếp; bấm thêm để né tiếp, trong giới hạn sân đấu.
- Không còn di chuyển tiến/lùi hoặc di chuyển bằng phím mũi tên. Q/W/A/S/D dành cho kết ấn.
- Trên màn hình cảm ứng, kéo trên sân đấu để ngắm.
- **1–5:** xem công thức chiêu mang theo. **H:** ẩn/hiện quyển trục trong trận. **M:** bật/tắt âm thanh.
- **Enter:** vào trận, tiếp tục sau tạm dừng, hoặc về quyển trục sau kết thúc. **Esc:** tạm dừng và thả con trỏ để thao tác giao diện. Bấm vào sân đấu để khóa lại nếu trình duyệt chưa khóa con trỏ.
- Chuyển khỏi tab hoặc cửa sổ tự tạm dừng. Màn hình tạm dừng có nút đấu lại cùng bộ chiêu hoặc trở về chọn chiêu.

12 hình ấn từ bốn hàng đầu của ket_an.jpg, đọc trái sang phải, trên xuống dưới. Tên mô tả thế tay và chuỗi chiêu là thiết kế của game, không phải công thức chính thức trong Naruto.

## Triển khai trên Vercel

Bản production: https://an-hoa-ninja.vercel.app.

Chạy **npm run build:vercel** để tạo thư mục **dist/** chỉ chứa game và asset công khai.
Cấu hình **vercel.json** dùng **npm ci**, **npm run build:vercel** và output **dist**.

Để triển khai bằng CLI: chạy **npx vercel login**, sau đó **npx vercel --prod** ở thư mục dự án.
Cũng có thể import repository GitHub vào Vercel; cấu hình build được đọc từ **vercel.json**.

## Phát triển

Node.js 20 trở lên; **npm ci** để cài dependency.

- **npm run build:** bundle src/main.js thành game.js để chơi trực tiếp ngoại tuyến.
- **npm run assets:** chạy Blender Python để dựng model từ `anime_style_hand.glb` ở thư mục gốc, lưu `.blend`, xuất GLB, thêm 12 clip kết ấn và tạo dữ liệu nhúng. File mẫu được giữ nguyên; runtime dùng model đã đóng gói. Cần Blender 4.5 LTS: đặt bản portable trong `.tools/`, đặt biến `BLENDER_PATH` trỏ tới `blender.exe`, hoặc cài Blender vào PATH. `node tools/generate-hands.mjs` chỉ đóng gói lại bản GLB đã xuất từ Blender. `npm run assets -- --procedural` dựng lại bản loft cũ để so sánh.
- **npm test:** luật 45 chiêu, giới hạn bộ chiêu, chuỗi ấn, chakra, khóa kéo/lặn ngoài lãnh địa và lệnh khi thiếu phân thân, miễn nhiễm, khiên/phản đòn/hồi máu, va chạm tường, vùng làm chậm và vị trí thiên thạch, GLB, animation và máy chủ.
- **npm run test:hand-volume:** đo độ dày lòng bàn tay, khối cơ ngón cái, độ cong mặt lưng, tiết diện ngón, độ sát của móng và vị trí/góc FPS. Kiểm tra trực tiếp geometry của GLB, độc lập với shader.
- **npm run test:browser:** Edge headless, WebGL 2/SwiftShader; kiểm tra chọn chiêu, 12 thế tay, di chuyển chuột, máy kết ấn, sát thương, khiên, phản đòn, hồi đầy máu, tạm dừng, chọn lại và giao diện nhỏ.
- **npm run test:ranks:** kiểm tra vị trí xuất phát của đối thủ, độ dài 2–8 ấn, tiến trình chiêu dài, sức mạnh theo cấp, thời gian đạn bay và máy kết đúng số ấn.
- **npm run test:lightning:** năm chiêu Lôi, khiên, trận 10 giây, tốc độ đạn, Thiên lôi, né, camera, tạm dừng/đấu lại và đồ họa thấp.
- **npm run test:dark:** năm Ám thuật, mái vòm và lãnh địa, chó bóng đứng chờ/nhận lệnh, mỗi lần một con, tối đa ba con mỗi bên, đạn xuyên qua, biến mất/hồi lại trong và ngoài lãnh địa, voi bóng rơi gây 90 sát thương và khóa 2 giây, né hoặc lặn trước khi voi đáp, lặn miễn nhiễm với thao tác bình thường, hai bên và máy, hết hạn, tạm dừng/reset, đồ họa thấp và giảm chuyển động.
- **npm run test:wind:** năm Phong thuật, combo hất tung 2 + 2 giây, sát thương 70 + 70, tường gió, camera tinh linh, phản liên tục phía trước và theo hướng ngắm, thuyền/sóng đổi hướng, hai bên, tạm dừng/reset/hết hạn, đồ họa thấp, giảm chuyển động và máy nối combo.
- **npm run test:earth:** luật và trình duyệt cho năm Thổ thuật, địa hình thật, độ cao/chậm bước/khôi phục, gai đá, năm đợt Sơn Hà, tường cong chặn đạn và di chuyển, Địa Bộc Thiên Tinh và góc máy, né/khiên/miễn nhiễm, hai bên/AI, tạm dừng/reset và các chế độ đồ họa; ảnh tại `test-results/earth/`.
- **npm run test:nature:** luật và trình duyệt cho Băng/Mộc: chiêu 10 ấn một lần mỗi trận, vườn bốn loại cây, giới hạn chiều cao, độc theo thời gian, dây leo/trúc/quả óc chó chắn trước, hoạt ảnh và mật độ phun theo tăng trưởng, tuyết đủ 90 giây và gom thành cầu, sương mù và ảo ảnh, cầu tuyết không thể chặn, thắng/thua, AI hai hệ, tạm dừng/reset và đồ họa thấp; ảnh tại `test-results/nature/`.
- **npm run test:light:** luật và trình duyệt cho laser trắng–vàng, cầu thủy tinh 8 giây/7 sắc, mái vòm 10 giây/laser nảy/sát thương mỗi giây, gương 2,5 giây/phản đòn, Jacob và góc máy; kiểm tra hai bên, AI, ngắm trượt/tường/khiên/miễn nhiễm, tạm dừng/reset, đồ họa thấp và giảm chuyển động; ảnh tại `test-results/light/`.
- **npm run test:fire:** kiểm tra năm chiêu Hỏa, ba viên liên đạn giữ 0,5 giây, rồng lửa, thiên thạch trúng/trượt/vụ nổ lan, khiên, tường chặn đạn, tạm dừng và reset; chụp hiệu ứng và kiểm tra giao diện tám ấn.
- **npm run test:water:** kiểm tra năm chiêu Thủy, khống chế hai bên, thuyền trúng/trượt điểm ngắm, sóng cuốn chiêu, hai kiểu khiên, tạm dừng/reset và hiệu ứng ở ba mức đồ họa.
- **npm run test:impact-motion:** kiểm tra hàng ba viên đạn, điểm ngắm cố định, cú trúng không để lại lửa, quỹ đạo thiên thạch thẳng và phản ứng camera khi tích lực/phóng/trúng/chặn đòn, tạm dừng, reset và giảm chuyển động.
- **npm run test:incantation:** kiểm tra đọc tên đồng thời tung chiêu công/thủ, trừ chakra ngay, hồi chiêu, nhập chuỗi tiếp khi đang đọc, tạm dừng/hủy giọng đọc, lỗi giọng nói, hiện đủ 5 chiêu ở 8 kích thước màn hình và ẩn banner hình ấn.
- **npm run test:controls:** kiểm tra khóa con trỏ, hướng bắn trùng tâm ngắm, click trái/phải độc lập vị trí chuột, giữ nút không đi tiếp và giới hạn sân đấu.
- **npm run test:layout:** kiểm tra nút vào trận trên cửa sổ nhỏ và điện thoại, tâm ngắm ở giữa màn hình, khóa/thả con trỏ, nút HUD không gây né và đổi kích thước cửa sổ.
- **npm run test:graphics:** kiểm tra pixel môi trường ở ba mức đồ họa và chụp thế tay/giao diện.
- **npm run test:anime:** chụp dáng nghỉ và đủ 12 thế tay, viền theo khung xương, vòng Hỏa–Thủy–Lôi, camera Lôi điểu, ba mức đồ họa, cửa sổ nhỏ/điện thoại và giảm chuyển động; kiểm tra lỗi shader.
- **npm run test:hand-vfx:** kiểm tra 12 bóng, thời gian 0,2 giây, kết ấn liên tiếp, vầng lửa khi Space sẵn sàng, hồi chiêu/chakra, tạm dừng/reset và chế độ đồ họa thấp.
- **npm run test:hand-element-rings:** kiểm tra vòng Phong–Ám–Quang–Thổ–Mộc–Băng cho cả 30 chiêu, điều kiện thi triển, màu/hoạt ảnh, đi theo tay, chuyển hệ, hồi chiêu/chakra, tạm dừng/reset, đồ họa thấp và giảm chuyển động; xuất ảnh vào `test-results/hand-element-rings/`.
- **npm run test:meteor-zoom:** kiểm tra zoom in/out trên trời, tạm dừng, đổi kích thước/chất lượng, khôi phục hướng ngắm, reset và chế độ giảm chuyển động.

Đặt **BROWSER_PATH** để dùng Chrome/Chromium khác đường dẫn Edge mặc định trên Windows. Ảnh và báo cáo kiểm thử nằm trong test-results. Chỉ URL có **test=1** cung cấp bước thời gian xác định; gameplay bình thường dùng requestAnimationFrame.

**npm run test:loadout** kiểm tra chọn thủ trước, bắt buộc ít nhất một chiêu công khi vào trận, bộ 1 công + 4 thủ và 5 công, giới hạn 5 ô, thi triển chiêu và khôi phục bộ đã lưu.

## Cấu trúc

- **game-core.js:** 9 hệ, 45 chiêu, kiểm tra bộ chiêu, luật kết ấn/chakra và điều kiện dùng Ám thuật, sinh lực/khiên/phản đòn/miễn nhiễm/khống chế, va chạm tường, vùng làm chậm và chọn vùng thiên thạch.
- **src/main.js:** quyển trục, HUD, điều khiển chuột, AI, va chạm và vòng trận đấu.
- **src/opponent.js:** nhân vật ninja, tay kết ấn có khớp, tay áo đi theo cổ tay, khiên máy.
- **src/scene.js:** môi trường anime, toon shading, ánh sáng, bóng và gió; map giữ cỏ lay động, đã dọn cây thân gỗ mặc định, cổng và bốn cột đèn. Cây triệu hồi hệ Mộc vẫn xuất hiện qua kỹ năng.
- **src/effects.js:** đạn theo màu hệ, ánh sáng, vệt, khói và vòng va chạm.
- **src/fire-arts.js:** shader lửa, rồng có thân uốn lượn, thiên thạch, dấu báo vùng rơi, vòm khiên, tường lửa và vụ nổ.
- **src/lightning-arts.js:** cầu điện, thương sét, chim điện, mây và tia Thiên lôi, khiên và Lôi trận.
- **src/dark-domain.js:** khép/mở mắt, lãnh địa, thú bóng đứng chờ/nhận lệnh/hồi lại, voi bóng 3D rơi, nhấn chìm đối thủ và lặn miễn nhiễm.
- **src/wind-arts.js:** lốc xoáy 3D, nâng/hạ đối thủ, liên trảm, tường gió, tinh linh có cánh và luồng gió phản chiêu phía trước.
- **src/dark-domain-intro.js:** mái vòm đen 3D và vùng mực lan trong không gian 3D, phủ dần môi trường nhưng giữ nhân vật và bàn tay; hỗ trợ tạm dừng/reset và giảm chuyển động.
- **src/water-arts.js:** mặt nước, cầu giam giữ, thuyền hải tặc, sóng cuốn chiêu và hai kiểu khiên nước.
- **src/vfx-materials.js:** bảng bốn mức sáng dùng chung cho các vật liệu rắn của chiêu thức.
- **src/worn-sail.js:** lưới buồm/cờ rách có lỗ thủng, độ cong và miếng vá có đường khâu của thuyền Thủy.
- **src/hands.js / poses.js:** nạp GLB Blender và điều khiển 12 thế kết ấn.
- **tools/blender-hands.py / build-hands.mjs:** lưới tay kín có cấu trúc quad, subdivision, móng, nếp ngón, giáp và trọng số xương; kiểm tra lưới manifold trước khi xuất.
- **tools/reference-hand.py:** nhập bản sao file mẫu, hàn các đỉnh trùng ở seam, giữ topology lòng bàn tay, thay đầu ngón/móng dài, đóng cổ tay, subdivision và gán trọng số 16 xương.
- **tools/inspect-hand-reference.py:** kiểm tra mesh gốc và xuất ba preview xám của mẫu đã chuẩn hóa góc nhìn; file đầu vào không bị chỉnh sửa.
- **tools/preview-hand-geometry.py:** render xám không outline ở ba góc, đo mesh và lưu hash trang phục/rig trong `test-results/hand-volume/<stage>/`. Chạy `blender --background assets/anime-hands.blend --python tools/preview-hand-geometry.py -- clay`.
- **tools/audit-hand-intersections.py:** kiểm tra giao cắt giữa các tam giác của mesh ở tư thế nghỉ; lưu báo cáo trong `test-results/hand-volume/intersections.json`.
- **tools/capture-hand-turntable.mjs:** chụp ba góc từ GLB và vật liệu cel/viền thực tế trong game; chạy `node tools/capture-hand-turntable.mjs 05-final`.
- **src/hand-model.js / hand-sculpt.js:** bộ dựng tay Three.js cũ, không còn dùng trong pipeline tạo asset hiện tại.
- **src/hand-materials.js:** bảng màu anime, cel shading nhẹ cho da/móng và màu phẳng cho giáp.
- **src/ink-outline.js:** viền mảnh theo kích thước màn hình cho tay có khớp, móng, giáp và vật thể chính; viền cây chuyển động theo gió.
- **assets/anime-hands.blend / blender-hands.glb:** nguồn Blender chỉnh sửa được và bản xuất trung gian.
- **assets/ninja-hands.glb / hand-data.js:** model chỉnh sửa được và dữ liệu nhúng ngoại tuyến.

Asset nhân vật và môi trường được dựng từ mã nguồn của dự án. Giấy phép Three.js trong THIRD_PARTY_NOTICES.md.
