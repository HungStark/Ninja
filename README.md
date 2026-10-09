# Ấn Hỏa — Đấu trường Cửu Hệ

Game ninja 3D góc nhìn thứ nhất, kết ấn bằng hai tay và quyết đấu với đối thủ máy. Bản 0.3 thay sân tập bia bằng trận đấu có sinh lực, chakra, phòng ngự và phản đòn.

## Chơi ngay

Mở **index.html** bằng Chrome hoặc Edge hỗ trợ WebGL 2. Game đã được đóng gói để chơi ngoại tuyến, không cần CDN, Node.js hoặc Internet. Giữ index.html, style.css, game-core.js, game.js và ket_an.jpg cùng thư mục.

Nếu có Node.js, chạy **npm start** rồi mở http://127.0.0.1:4173.

## Quyển trục trước trận

Có **9 hệ, 45 chiêu**: Hỏa, Thủy, Lôi, Phong, Thổ, Quang, Ám, Mộc và Băng. Mỗi hệ có 3 chiêu công, 2 chiêu thủ. Lọc theo hệ hoặc loại chiêu, bấm một chiêu để mang theo; bấm lại hoặc bấm ô chiêu đã chọn để bỏ.

- Mang **từ 1 đến tối đa 5 chiêu**, tối đa 3 chiêu mỗi loại.
- Khi mang đủ 5: **3 công + 2 thủ** hoặc **2 công + 3 thủ**.
- Có thể phối nhiều hệ. Hai nút bộ mẫu giúp chọn nhanh cả hai cách chia.
- Chỉ các chiêu mang theo mới nhận chuỗi ấn và thi triển được trong trận.
- Bộ chiêu được lưu trên trình duyệt khi có localStorage. Mỗi trận tiếp theo đều quay lại quyển trục để thay bộ chiêu.

## Chiêu thức và trận đấu

| Cấp | Số ấn | Loại chiêu | Cách hoạt động |
| --- | --- | --- | --- |
| D | 2 | Đạn cầu | Đạn cơ bản, sát thương 38 trước hệ số hệ, 28 chakra |
| C | 3 | Bích / giáp / thành / thuẫn | Khiên hấp thụ 65 sát thương trong 4,5 giây; Thổ 78 |
| B | 4 | Long / thương / nhận | Đạn thon và nhanh, sát thương 46 trước hệ số hệ, 34 chakra |
| A | 5 | Kính / phản / hồi | Phản một đạn về đối thủ, khiên 25 trong 2,8 giây; Thổ 30 |
| S | 6 | Liên kích | Ba đạn mạnh xòe ngang, mỗi đạn 58 sát thương trước hệ số hệ, 56 chakra |

Chuỗi của mỗi hệ bắt đầu bằng hai ấn nhận diện hệ. Ví dụ Hỏa: **Q W** (cấp D), **Q W A** (cấp C), **Q W D F** (cấp B), **Q W Z X C** (cấp A), **Q W C V Z X** (cấp S). Sau hai ấn có thể nhấn Space để dùng chiêu cơ bản, hoặc tiếp tục kết ấn để hoàn thành chiêu mạnh hơn; game không tự tung chiêu. Khi đang xem chiêu dài, quyển trục giữ công thức đó để theo dõi tiến trình.

Chiêu thủ của Mộc và Quang còn hồi 12 sinh lực, không vượt máu tối đa. Thi triển phòng ngự mới thay thế khiên cũ. Đạn đã phản không được phản tiếp để tránh vòng lặp. Mỗi đạn có màu, ánh sáng và vệt theo hệ.

Hai bên có **220 sinh lực** và **100 chakra**. Chakra hồi 11 mỗi giây, cách hai lần thi triển ít nhất 1 giây. Kết đủ chuỗi 2–6 ấn của chiêu theo quyển trục rồi nhấn Space. Cấp và số ấn được ghi trên từng thẻ chiêu. Nhập sai sẽ thử bắt đầu chuỗi mới từ phím vừa bấm; chuỗi hết hạn sau 7 giây không nhập ấn.

Đối thủ đứng ngay dưới cổng, cách vị trí xuất phát của người chơi 31 m, sử dụng model tay có khớp và bộ 12 thế tay như người chơi. Máy kết từng ấn theo đúng độ dài của từng chiêu trước khi tung chiêu, ngắm vị trí của người chơi lúc phóng đạn, có chakra và có thể chọn phòng ngự khi bị tấn công. Thanh trên cùng cho biết máu, hệ, chakra và chiêu đang kết ấn. Qua mỗi trận, máy dùng tổ hợp hệ khác.

Hết máu sẽ kết thúc trận: có màn hình thắng hoặc thua, thời gian trận và số lần thi triển. Tạm dừng giữ nguyên máu, chakra, khiên, đạn, chuỗi ấn và tiến trình máy.

## Điều khiển

- **Q W E R A S D F Z X C V:** 12 ấn; cũng có thể bấm nút ấn bên dưới.
- **Space:** thi triển chiêu đã kết đủ ấn. **Backspace:** xóa chuỗi.
- **Lia chuột:** xoay hướng ngắm. Con trỏ được khóa và thay bằng tâm ngắm chính giữa màn hình khi vào trận. Hướng bắn luôn đi qua tâm ngắm.
- **Click chuột trái:** né một bước 1,8 m sang trái. **Click chuột phải:** né một bước 1,8 m sang phải. Hướng né theo nút bấm, độc lập vị trí hoặc hướng lia chuột. Giữ nút không tự di chuyển tiếp; bấm thêm để né tiếp, trong giới hạn sân đấu.
- Không còn di chuyển tiến/lùi hoặc di chuyển bằng phím mũi tên. Q/W/A/S/D dành cho kết ấn.
- Trên màn hình cảm ứng, kéo trên sân đấu để ngắm.
- **1–5:** xem công thức chiêu mang theo. **H:** ẩn/hiện quyển trục trong trận. **M:** bật/tắt âm thanh.
- **Enter:** vào trận, tiếp tục sau tạm dừng, hoặc về quyển trục sau kết thúc. **Esc:** tạm dừng và thả con trỏ để thao tác giao diện. Bấm vào sân đấu để khóa lại nếu trình duyệt chưa khóa con trỏ.
- Chuyển khỏi tab hoặc cửa sổ tự tạm dừng. Màn hình tạm dừng có nút đấu lại cùng bộ chiêu hoặc trở về chọn chiêu.

12 hình ấn từ bốn hàng đầu của ket_an.jpg, đọc trái sang phải, trên xuống dưới. Tên mô tả thế tay và chuỗi chiêu là thiết kế của game, không phải công thức chính thức trong Naruto.

## Phát triển

Node.js 20 trở lên; **npm ci** để cài dependency.

- **npm run build:** bundle src/main.js thành game.js để chơi trực tiếp ngoại tuyến.
- **npm run assets:** xuất lại model tay GLB và dữ liệu nhúng.
- **npm test:** luật 45 chiêu, giới hạn bộ chiêu, chuỗi ấn, chakra, khiên/phản đòn/hồi máu, GLB, animation và máy chủ.
- **npm run test:browser:** Edge headless, WebGL 2/SwiftShader; kiểm tra chọn chiêu, 12 thế tay, di chuyển chuột, máy kết ấn, sát thương, khiên, phản đòn, thắng/thua, tạm dừng, chọn lại và giao diện nhỏ.
- **npm run test:ranks:** kiểm tra đối thủ ở dưới cổng, độ dài 2–6 ấn, tiến trình chiêu dài, sức mạnh theo cấp, thời gian đạn bay và máy kết đúng số ấn.
- **npm run test:controls:** kiểm tra khóa con trỏ, hướng bắn trùng tâm ngắm, click trái/phải độc lập vị trí chuột, giữ nút không đi tiếp và giới hạn sân đấu.
- **npm run test:layout:** kiểm tra nút vào trận trên cửa sổ nhỏ và điện thoại, tâm ngắm ở giữa màn hình, khóa/thả con trỏ, nút HUD không gây né và đổi kích thước cửa sổ.
- **npm run test:graphics:** kiểm tra pixel môi trường ở ba mức đồ họa và chụp thế tay/giao diện.

Đặt **BROWSER_PATH** để dùng Chrome/Chromium khác đường dẫn Edge mặc định trên Windows. Ảnh và báo cáo kiểm thử nằm trong test-results. Chỉ URL có **test=1** cung cấp bước thời gian xác định; gameplay bình thường dùng requestAnimationFrame.

## Cấu trúc

- **game-core.js:** 9 hệ, 45 chiêu, kiểm tra bộ chiêu, luật kết ấn/chakra, sinh lực/khiên/phản đòn.
- **src/main.js:** quyển trục, HUD, điều khiển chuột, AI, va chạm và vòng trận đấu.
- **src/opponent.js:** nhân vật ninja, tay kết ấn có khớp, tay áo đi theo cổ tay, khiên máy.
- **src/scene.js:** môi trường anime, toon shading, ánh sáng, bóng, gió, cây hoa và cánh hoa.
- **src/effects.js:** đạn theo màu hệ, ánh sáng, vệt, khói và vòng va chạm.
- **src/hands.js / hand-model.js / poses.js:** model tay, rig và 12 thế kết ấn.
- **assets/ninja-hands.glb / hand-data.js:** model chỉnh sửa được và dữ liệu nhúng ngoại tuyến.

Asset nhân vật và môi trường được dựng từ mã nguồn của dự án. Giấy phép Three.js trong THIRD_PARTY_NOTICES.md.
