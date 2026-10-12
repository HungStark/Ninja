# Ấn Hỏa — Đấu trường Cửu Hệ

Game ninja 3D góc nhìn thứ nhất, kết ấn bằng hai tay và quyết đấu với đối thủ máy. Bản 0.3 thay sân tập bia bằng trận đấu có sinh lực, chakra, phòng ngự và phản đòn.

## Chơi ngay

Mở **index.html** bằng Chrome hoặc Edge hỗ trợ WebGL 2. Game đã được đóng gói để chơi ngoại tuyến, không cần CDN, Node.js hoặc Internet. Giữ index.html, style.css, game-core.js, game.js và ket_an.jpg cùng thư mục.

Nếu có Node.js, chạy **npm start** rồi mở http://127.0.0.1:4173.

## Quyển trục trước trận

Có **9 hệ, 49 chiêu**: Hỏa, Thủy, Lôi, Phong, Thổ, Quang, Ám, Mộc và Băng. Hỏa, Thủy, Lôi và Ám có 4 chiêu công, 2 chiêu thủ; các hệ còn lại có 3 công, 2 thủ. Lọc theo hệ hoặc loại chiêu, bấm một chiêu để mang theo; bấm lại hoặc bấm ô chiêu đã chọn để bỏ. Nút **Bộ Hỏa** chọn nhanh liên đạn, rồng, thiên thạch và hai chiêu thủ; có thể thay một chiêu công bằng Hỏa cầu.

- Mang **từ 1 đến tối đa 5 chiêu**, tối đa 3 chiêu mỗi loại.
- Khi mang đủ 5: **3 công + 2 thủ** hoặc **2 công + 3 thủ**.
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

Tay được dựng trong Blender dựa trên mesh 3D `anime_style_hand.glb` do người dùng cung cấp. Giữ cấu trúc lòng bàn tay cong, kẽ ngón và khối cơ gốc ngón cái của mẫu; dựng lại đầu ngón bằng các tiết diện tròn thuôn, đóng cổ tay và dùng subdivision để nối mượt. Các phần móng dài của mẫu được thay bằng móng riêng nhỏ, mỏng và ôm theo bề mặt. Model được gắn 16 xương theo tỷ lệ mới, với trọng số chuyển tiếp mượt và giữ 12 thế kết ấn. Vị trí FPS, giáp xanh đen, vòng vàng và ánh sáng/vật liệu hiện tại được giữ nguyên.

Hình khối được kiểm tra riêng bằng vật liệu xám trung tính ở chính diện, nghiêng 45° và nhìn ngang trước khi áp màu. Trong game, da/móng dùng cel shading nhẹ dựa trên normal của mesh với bốn mức sáng; giáp giữ bảng màu cũ. Viền da rộng 0,35 pixel, móng 0,18 pixel và giáp 0,40 pixel theo kích thước màn hình. Tay được vẽ sau bước chuyển màu của cảnh; vòng Hỏa–Thủy–Lôi vẫn đi qua bloom. Ánh sáng chạng vạng của môi trường được giữ nguyên. Model được xuất sẵn thành GLB và nhúng trong game để chơi ngoại tuyến.

Phong cảnh dùng ánh sáng chạng vạng, bầu trời và sương tối hơn để chiêu thức nổi bật.

Hệ Hỏa có hiệu ứng và cơ chế riêng:

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Hỏa cầu | 2 | Q W | 28 | Cầu lửa xoáy, 43 sát thương |
| Hỏa liên đạn | 4 | Q W D F | 40 | Ba hỏa cầu nhỏ xếp ngang phía trên tay, giữ 0,5 giây rồi phóng lần lượt cách nhau 0,1 giây tới điểm ngắm đã chọn; mỗi viên 24 sát thương, không để lại lửa trên đối thủ |
| Rồng lửa | 6 | Q W C V Z X | 56 | Rồng cuộn thành vòng lửa trước mặt trong 1,1 giây rồi lao tới; camera chuyển lên trên bên trái và trở lại sau cú đánh, 104 sát thương |
| Thiên thạch | 8 | Q W C V Z X E R | 82 | Bay một đường thẳng từ trời tới đất trong 3,4 giây; camera ngước lên, zoom in trong 0,24 giây rồi zoom out dần trong cảnh trời 1,4 giây, trở về trong 0,4 giây; 150 sát thương trong bán kính 5,5 m |
| Khiên lửa | 3 | Q W A | 26 | Vòm lửa bao quanh người, hấp thụ 75 sát thương trong 4,5 giây |
| Tường lửa | 5 | Q W Z X C | 36 | Tường rộng 7 m, cao 4,2 m, dựng cách 3 m phía trước; 120 độ bền, tồn tại 5 giây |

Tường đứng yên khi người chơi né, chặn đạn đối phương đi xuyên qua mặt tường và có thể tồn tại cùng khiên. Dựng tường mới thay tường cũ của người thi triển. Thiên thạch xuyên một tầng mây bị đẩy tách ra, có dấu báo vùng rơi và đuôi lửa. Khi chạm đất, đá lớn nhỏ bật tung theo quỹ đạo, bụi đất lan ra, tia lửa bắn lên và vết nứt nóng sáng xuất hiện quanh tâm nổ; có thể né khỏi vùng nổ, nhưng không phản được thiên thạch. Nhắm ngang sẽ thả ở khoảng cách 31 m; nhắm xuống sẽ chọn điểm trên mặt đất (6–55 m). Camera giữ hướng ngắm gốc khi trở về; đối thủ thi triển không đổi camera của người chơi. Các ID chiêu Hỏa cũ được giữ để bộ chiêu đã lưu vẫn dùng được.

Camera giật nhẹ và zoom out khi phóng hỏa cầu/liên đạn; zoom in lúc tích lực rồng rồi giật khi phóng và trúng mục tiêu. Thiên thạch chạm đất gây rung và zoom out theo khoảng cách tới vụ nổ. Khiên, tường, phản đòn và trúng đạn có nhịp rung riêng; hướng ngắm được giữ nguyên. Hiệu ứng dừng khi tạm dừng, được xóa khi bắt đầu lại và tắt rung/zoom nếu trình duyệt yêu cầu giảm chuyển động.

Hệ Thủy có sáu chiêu riêng:

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Thủy đạn | 2 | W E | 28 | Ném cầu nước, 38 sát thương |
| Thủy ngục | 5 | W E Z X C | 38 | 12 sát thương; khi xuyên khiên, giam đối thủ trong cầu nước 3 giây, ngắt chuỗi ấn và khóa di chuyển/thi triển |
| Ném thuyền | 6 | W E C V Z X | 56 | Thuyền hải tặc trồi từ dưới đất lên trong 1,2 giây, rồi bay thẳng tới điểm ngắm đã chọn; camera chuyển lên trên như Rồng lửa và trở lại sau cú đánh; 90 sát thương trong bán kính 3,5 m |
| Sóng thần | 8 | W E C V Z X E R | 72 | Camera nhìn xuống chân, nước tụ và dựng thành sóng trong 1,8 giây rồi trả hướng ngắm; sóng rộng 12 m, cao 5 m, dày khoảng 7 m, có ngọn cuộn, bọt và nước bắn; cuốn đạn/mặt chắn, gây 30 sát thương một lần |
| Khiên nước | 3 | W E A | 26 | Bao quanh bản thân, hấp thụ 65 sát thương trong 4,5 giây |
| Thủy thuẫn | 4 | W E D F | 32 | Mặt chắn nước hình tròn bán kính 2,2 m, dựng cách 3 m phía trước; 95 độ bền, tồn tại 5 giây |

Thủy thuẫn đứng tại vị trí thi triển, chặn chiêu bay qua mặt chắn, không phản đòn và có thể tồn tại cùng khiên bao thân. Sóng thần cuốn chiêu khi chúng thực sự đi qua thể tích sóng; chiêu bay cao hơn hoặc ngoài bề rộng sóng vẫn đi tiếp. Thuyền và sóng thần không bị phản đòn. Giữ các ID Thủy cũ để bộ chiêu đã lưu vẫn dùng được. Thủy ngục và sóng cùng khiên đều dừng thời gian khi tạm dừng, được xóa khi đấu lại.

Hệ Lôi có sáu chiêu với hiệu ứng điện riêng:

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Lôi cầu | 2 | E R | 28 | Cầu điện với hồ quang, 40 sát thương |
| Lôi thương | 4 | E R D F | 40 | Thương sét dài và nhanh, 62 sát thương |
| Lôi điểu | 6 | E R C V Z X | 56 | Cầu sét tụ trước mặt, chim hiện ra và dang cánh trong 1,1 giây rồi lao tới; camera chuyển lên cao như Rồng lửa, 102 sát thương |
| Thiên lôi | 8 | E R C V Z X E R | 82 | Ngước nhìn mây chớp điện 1,4 giây, trả góc nhìn trong 0,4 giây rồi sét đánh xuống điểm ngắm, 150 sát thương trong bán kính 4,5 m |
| Lôi thuẫn | 3 | E R A | 26 | Khiên điện bao thân, hấp thụ 80 sát thương trong 5 giây |
| Lôi trận | 5 | E R Z X C | 36 | Vùng điện bán kính 9 m, cao 8 m, tồn tại 10 giây; đạn đối phương còn 30% tốc độ trong vùng |

Thiên lôi ngước camera lên đám mây chớp điện, trả về góc ngắm ban đầu trước khi tia sét đánh xuống; chiêu của máy không điều khiển camera người chơi. Vòng báo trên đất cho phép né trước khi sét đánh; sét không bị phản đòn. Lôi trận đứng tại vị trí thi triển, giữ nguyên sát thương và vận tốc gốc của đạn: đạn rời vùng sẽ nhanh trở lại, đạn cùng bên không bị làm chậm, vùng chồng nhau không nhân độ chậm. Thi triển lại thay vùng cũ của cùng người chơi. Khiên và trận có thể tồn tại cùng nhau; hiệu ứng, thời gian và camera dừng khi tạm dừng, được xóa khi đấu lại. Giữ các ID Lôi cũ để bộ chiêu đã lưu vẫn dùng được.

Kết đủ ấn và sẵn sàng thi triển bất kỳ chiêu Lôi nào sẽ hiện vòng sét tím trắng cùng tia điện chạy quanh tay. Vòng tắt khi tung chiêu, xóa/sai/hết hạn chuỗi ấn, tạm dừng, đang hồi chiêu hoặc thiếu chakra; khi đủ điều kiện, vòng hiện lại như Hỏa và Thủy. Chế độ giảm chuyển động làm điện và tia sáng chuyển động chậm hơn.

Kết đủ ấn và sẵn sàng thi triển bất kỳ chiêu Lôi nào sẽ hiện vòng sét tím trắng cùng tia điện chạy quanh tay. Vòng tắt khi tung chiêu, xóa/sai/hết hạn chuỗi ấn, tạm dừng, đang hồi chiêu hoặc thiếu chakra; khi đủ điều kiện, vòng hiện lại như Hỏa và Thủy. Chế độ giảm chuyển động làm điện và tia sáng chuyển động chậm hơn.

### Ám thuật và Hắc lãnh địa

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Hắc lãnh địa | 8 | D F C V Z X E R | 70 | Nhắm mắt rồi mở ra trong đầm lầy mực đen; lãnh địa tồn tại 30 giây |
| Ảnh phân thân | 2 | D F | 24 | Một phân thân lao tới đánh, 38 sát thương |
| Ảnh đạn | 4 | D F D F | 34 | Hai phân thân, mỗi phân thân bắn hai đạn mực, mỗi đạn 22 sát thương |
| Ảnh vây sát | 6 | D F C V Z X | 56 | Bốn phân thân trồi lên quanh điểm ngắm rồi đánh vào đó, mỗi phân thân 24 sát thương; có thể đánh trượt |
| Ảnh vệ | 3 | D F A | 26 | Phân thân phía trước chặn đạn, hấp thụ 72 sát thương trong 5 giây |
| Ảnh hoán | 5 | D F Z X C | 32 | Đổi chỗ với phân thân bắn đạn hoặc gọi bóng bên cạnh để đổi chỗ; để lại thế thân hút đạn trong 4 giây |

Năm chiêu phân thân chỉ dùng khi lãnh địa đã mở. Ngoài lãnh địa, nút thi triển bị khóa, Space báo lý do và không trừ chakra hoặc xóa chuỗi đang kết; cần mang Hắc lãnh địa trong bộ chiêu nếu muốn tự mở nó. Lãnh địa dùng được cho cả hai bên. Cây, cổng, núi, đường và ánh sáng sân đấu được ẩn khi mắt khép hoàn toàn, thay bằng mặt mực đen chuyển động và chân trời tối. Nhân vật và chiêu thức vẫn hoạt động trong lãnh địa. Thi triển lại làm mới thời gian 30 giây; hết thời gian sẽ khép/mở mắt để trả cảnh cũ, xóa phân thân, đạn mực và Ảnh vệ. Tạm dừng đóng băng cả hoạt ảnh mắt, phân thân và đồng hồ; đấu lại, về chọn chiêu hoặc kết thúc trận trả lại cảnh cũ ngay. Máy dùng hệ Ám tự mở lãnh địa trước khi gọi phân thân.

Các hệ còn lại dùng bảng cấp sau:

| Cấp | Số ấn | Loại chiêu | Cách hoạt động |
| --- | --- | --- | --- |
| D | 2 | Đạn cầu | Đạn cơ bản, sát thương 38 trước hệ số hệ, 28 chakra |
| C | 3 | Bích / giáp / thành / thuẫn | Khiên hấp thụ 65 sát thương trong 4,5 giây; Thổ 78 |
| B | 4 | Long / thương / nhận | Đạn thon và nhanh, sát thương 46 trước hệ số hệ, 34 chakra |
| A | 5 | Kính / phản / hồi | Phản một đạn về đối thủ, khiên 25 trong 2,8 giây; Thổ 30 |
| S | 6 | Liên kích | Ba đạn mạnh xòe ngang, mỗi đạn 58 sát thương trước hệ số hệ, 56 chakra |

Chuỗi của mỗi hệ bắt đầu bằng hai ấn nhận diện hệ. Sau hai ấn có thể nhấn Space để dùng chiêu cơ bản, hoặc tiếp tục kết ấn để hoàn thành chiêu mạnh hơn; game không tự tung chiêu. Khi đang xem chiêu dài, quyển trục giữ công thức đó để theo dõi tiến trình. Rồng lửa có thể nối thêm **E R** thành Thiên thạch nếu mang cả hai chiêu.

Chiêu thủ của Mộc và Quang còn hồi 12 sinh lực, không vượt máu tối đa. Thi triển khiên bao thân mới thay thế khiên cũ. Đạn đã phản không được phản tiếp để tránh vòng lặp. Mỗi đạn có màu, ánh sáng và vệt theo hệ.

Hai bên có **1000 sinh lực** và **100 chakra**. Chakra hồi 11 mỗi giây, cách hai lần thi triển ít nhất 1 giây. Kết đủ chuỗi 2–8 ấn của chiêu theo quyển trục rồi nhấn Space. Cấp và số ấn được ghi trên từng thẻ chiêu. Nhập sai sẽ thử bắt đầu chuỗi mới từ phím vừa bấm; chuỗi hết hạn sau 7 giây không nhập ấn.

Quyển trục mang theo trong trận hiện đủ tên và phím kết ấn của cả 5 chiêu, không cần cuộn; trên màn hình nhỏ, bảng chiêu nằm phía dưới. Nhấn Space sẽ tung đạn hoặc tạo khiên ngay, đồng thời đọc tên chiêu và trừ chakra. Có thể kết chuỗi tiếp theo khi giọng đọc vẫn đang chạy; khoảng cách giữa hai lần thi triển vẫn là 1 giây. Giọng đọc dùng tính năng tổng hợp tiếng nói của trình duyệt, ưu tiên giọng tiếng Việt trên máy. Tắt âm thanh, thiếu giọng đọc hoặc lỗi dịch vụ giọng nói không làm chậm chiêu. Tạm dừng cũng dừng giọng đọc; đấu lại hoặc về chọn chiêu sẽ hủy giọng đang đọc. Banner 12 hình kết ấn được ẩn.

Đối thủ đứng ngay dưới cổng, cách vị trí xuất phát của người chơi 31 m, sử dụng model tay có khớp và bộ 12 thế tay như người chơi. Máy kết từng ấn theo đúng độ dài của từng chiêu trước khi tung chiêu, ngắm vị trí của người chơi lúc phóng đạn, có chakra và có thể chọn phòng ngự khi bị tấn công. Thanh trên cùng cho biết máu, hệ, chakra và chiêu đang kết ấn. Qua mỗi trận, máy dùng tổ hợp hệ khác.

Trúng chiêu vẫn mất máu sau khi trừ khiên. Khi sinh lực chạm 0, bên đó hồi ngay đầy 1000 máu và trận đấu tiếp tục. Tạm dừng giữ nguyên máu, chakra, khiên, đạn, chuỗi ấn và tiến trình máy.

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
- **npm test:** luật 49 chiêu, giới hạn bộ chiêu, chuỗi ấn, chakra, khóa Ám thuật ngoài lãnh địa, khiên/phản đòn/hồi máu, va chạm tường, vùng làm chậm và vị trí thiên thạch, GLB, animation và máy chủ.
- **npm run test:hand-volume:** đo độ dày lòng bàn tay, khối cơ ngón cái, độ cong mặt lưng, tiết diện ngón, độ sát của móng và vị trí/góc FPS. Kiểm tra trực tiếp geometry của GLB, độc lập với shader.
- **npm run test:browser:** Edge headless, WebGL 2/SwiftShader; kiểm tra chọn chiêu, 12 thế tay, di chuyển chuột, máy kết ấn, sát thương, khiên, phản đòn, hồi đầy máu, tạm dừng, chọn lại và giao diện nhỏ.
- **npm run test:ranks:** kiểm tra đối thủ ở dưới cổng, độ dài 2–8 ấn, tiến trình chiêu dài, sức mạnh theo cấp, thời gian đạn bay và máy kết đúng số ấn.
- **npm run test:lightning:** sáu chiêu Lôi, khiên, trận 10 giây, tốc độ đạn, Thiên lôi, né, camera, tạm dừng/đấu lại và đồ họa thấp.
- **npm run test:dark:** sáu Ám thuật, khóa chiêu, hoạt ảnh mắt, đổi môi trường, lãnh địa 30 giây, phân thân công/thủ/đổi chỗ, máy mở lãnh địa, hết hạn, tạm dừng/reset/hồi máu, đồ họa thấp và giảm chuyển động.
- **npm run test:fire:** kiểm tra sáu chiêu Hỏa, ba viên liên đạn giữ 0,5 giây, rồng lửa, thiên thạch trúng/trượt/vụ nổ lan, khiên, tường chặn đạn, tạm dừng và reset; chụp hiệu ứng và kiểm tra giao diện tám ấn.
- **npm run test:water:** kiểm tra sáu chiêu Thủy, khống chế hai bên, thuyền trúng/trượt điểm ngắm, sóng cuốn chiêu, hai kiểu khiên, tạm dừng/reset và hiệu ứng ở ba mức đồ họa.
- **npm run test:impact-motion:** kiểm tra hàng ba viên đạn, điểm ngắm cố định, cú trúng không để lại lửa, quỹ đạo thiên thạch thẳng và phản ứng camera khi tích lực/phóng/trúng/chặn đòn, tạm dừng, reset và giảm chuyển động.
- **npm run test:incantation:** kiểm tra đọc tên đồng thời tung chiêu công/thủ, trừ chakra ngay, hồi chiêu, nhập chuỗi tiếp khi đang đọc, tạm dừng/hủy giọng đọc, lỗi giọng nói, hiện đủ 5 chiêu ở 8 kích thước màn hình và ẩn banner hình ấn.
- **npm run test:controls:** kiểm tra khóa con trỏ, hướng bắn trùng tâm ngắm, click trái/phải độc lập vị trí chuột, giữ nút không đi tiếp và giới hạn sân đấu.
- **npm run test:layout:** kiểm tra nút vào trận trên cửa sổ nhỏ và điện thoại, tâm ngắm ở giữa màn hình, khóa/thả con trỏ, nút HUD không gây né và đổi kích thước cửa sổ.
- **npm run test:graphics:** kiểm tra pixel môi trường ở ba mức đồ họa và chụp thế tay/giao diện.
- **npm run test:anime:** chụp dáng nghỉ và đủ 12 thế tay, viền theo khung xương, vòng Hỏa–Thủy–Lôi, camera Lôi điểu, ba mức đồ họa, cửa sổ nhỏ/điện thoại và giảm chuyển động; kiểm tra lỗi shader.
- **npm run test:hand-vfx:** kiểm tra 12 bóng, thời gian 0,2 giây, kết ấn liên tiếp, vầng lửa khi Space sẵn sàng, hồi chiêu/chakra, tạm dừng/reset và chế độ đồ họa thấp.
- **npm run test:meteor-zoom:** kiểm tra zoom in/out trên trời, tạm dừng, đổi kích thước/chất lượng, khôi phục hướng ngắm, reset và chế độ giảm chuyển động.

Đặt **BROWSER_PATH** để dùng Chrome/Chromium khác đường dẫn Edge mặc định trên Windows. Ảnh và báo cáo kiểm thử nằm trong test-results. Chỉ URL có **test=1** cung cấp bước thời gian xác định; gameplay bình thường dùng requestAnimationFrame.

## Cấu trúc

- **game-core.js:** 9 hệ, 49 chiêu, kiểm tra bộ chiêu, luật kết ấn/chakra và khóa Ám thuật, sinh lực/khiên/phản đòn, va chạm tường, vùng làm chậm và chọn vùng thiên thạch.
- **src/main.js:** quyển trục, HUD, điều khiển chuột, AI, va chạm và vòng trận đấu.
- **src/opponent.js:** nhân vật ninja, tay kết ấn có khớp, tay áo đi theo cổ tay, khiên máy.
- **src/scene.js:** môi trường anime, toon shading, ánh sáng, bóng, gió, cây hoa và cánh hoa.
- **src/effects.js:** đạn theo màu hệ, ánh sáng, vệt, khói và vòng va chạm.
- **src/fire-arts.js:** shader lửa, rồng có thân uốn lượn, thiên thạch, dấu báo vùng rơi, vòm khiên, tường lửa và vụ nổ.
- **src/lightning-arts.js:** cầu điện, thương sét, chim điện, mây và tia Thiên lôi, khiên và Lôi trận.
- **src/dark-domain.js:** hoạt ảnh khép/mở mắt, đổi và khôi phục môi trường, shader mực đen, phân thân tấn công/bắn đạn/phòng ngự/đổi chỗ và đạn mực.
- **src/water-arts.js:** mặt nước, cầu giam giữ, thuyền hải tặc, sóng cuốn chiêu và hai kiểu khiên nước.
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
