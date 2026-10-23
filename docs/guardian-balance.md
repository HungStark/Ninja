# Hộ vệ: dạng người, quái vật và hợp nhất

G của người chơi lướt 3 m trong 0,2 giây, giữ tăng lực 3 giây, hồi 12 giây từ lúc lướt. Mọi AI bỏ G nhưng vẫn bước né thường và di chuyển trái/phải. Máu bot đã tăng 10%; thay đổi hộ vệ này không nhân thêm máu lần nữa.

## Luồng vào trận

Từ phiêu lưu sang chiến đấu có màn hình VS: nhân vật chính cùng trang bị bên trái, toàn bộ đối thủ thực tế bên phải, kể cả bộ ba mở đầu. Hai bên trượt vào 0,65 giây, giữ đến khi tải xong rồi trượt ra 0,65 giây. Trận đấu và hồi chiêu chỉ chạy sau khi màn hình này đóng. Chân dung dựng từ mô hình thật trong game, hoạt động offline.

## Các phase

- Phase 1: người, đủ năm chiêu hệ gốc, kết ấn như bình thường, chi phí mana bằng 0. Vẫn tuân thủ hồi chiêu và điều kiện phối hợp của từng chiêu.
- Phase 2: quái vật hộ vệ của chính làng đó. Bỏ toàn bộ chiêu hệ cũ, kết ấn và ném phi tiêu. Dùng trực tiếp đúng năm chiêu mới mô tả dưới đây.
- Phase 3 chỉ có ở làng Ám: người kết ấn, phía sau có hình quái vật hộ vệ trong suốt. Người dùng chiêu Ám cường hóa; hào quang dùng độc lập năm chiêu quái vật, kể cả khi người bị khống chế. Sát thương chiêu hào quang bằng 60% chiêu quái vật tương ứng để bù việc hai bộ chiêu hoạt động song song.

Mỗi phase có thanh máu riêng, phải đánh về 0 mới đổi dạng. Giữ ngân sách tổng máu đã có, chia 45% / 55% cho hai phase; Ám chia 30% / 35% / 35%, làm tròn và cộng phần dư vào phase cuối.

| Hộ vệ | Máu từng phase |
|---|---|
| Vô Danh | 178 / 218 |
| Thủy | 257 / 315 |
| Hỏa | 287 / 351 |
| Lôi | 307 / 375 |
| Phong | 386 / 472 |
| Thổ | 421 / 514 |
| Quang | 485 / 593 |
| Băng | 495 / 605 |
| Mộc | 535 / 653 |
| Ám | 528 / 616 / 616 |

Đổi dạng kéo dài 3,2 giây: camera tiến gần hộ vệ, các vòng năng lượng và chớp sáng bao quanh, mô hình đổi ở giây 1,35, sau đó camera trở lại. Hai bên không hành động và không nhận sát thương trong hoạt cảnh. Dọn các đòn, lãnh địa và bẫy còn lại của phase trước; giữ máu, mana, chuỗi ấn, hồi chiêu, tuổi vườn Mộc và lượng tuyết Băng của người chơi (các chiêu chuẩn bị dùng một lần vẫn tiếp tục qua các phase). Tuyết Táng kết thúc một phase sẽ tiêu thụ lượng tuyết đã tích; mưa tuyết tiếp tục tích lại từ 0 ở phase sau. Bộ ba mở đầu vẫn là trận ba ninja.

## Ba chiêu chung của dạng quái vật

1. **Thiên giáng chấn địa:** gồng 0,8 giây, nhảy theo đường vòng cung rồi dậm vào vị trí người chơi đã đánh dấu. Chạm đất ở giây 2, bán kính 3,5 m, sát thương gốc 38; rời vòng cảnh báo để né. Sau cú dậm hộ vệ trở lại vị trí ban đầu.
2. **Hơi thở nguyên tố:** tụ cầu trước miệng 0,95 giây, nuốt cầu đến giây 1,3 rồi phun luồng năng lượng đến giây 4,6. Tia xoay đuổi người chơi với tốc độ hữu hạn 0,05 rad/giây, gây 18 sát thương gốc/giây theo nhiều lần chạm nhỏ; có thể né ngang và dùng vật chắn. Hình hạt theo hệ: nước, lửa, đá, điện, gió, quang, bóng tối, băng hoặc lá.
3. **Giáp hộ vệ:** bao giáp năng lượng trong 6 giây, giảm 35% sát thương nhận vào; không cộng thêm thanh máu.

Sau khoảng nghỉ đầu 2 giây, thứ tự là dậm → đặc trưng thứ nhất → hơi thở → giáp → đặc trưng thứ hai. Nghỉ 1,5 giây giữa đòn; hào quang phase 3 nghỉ 2,6 giây. Các vùng nguy hiểm có báo trước. Quái vật bị khống chế sẽ hủy đòn đang chuẩn bị; hào quang Ám không phụ thuộc khống chế của người.

## Hai chiêu riêng của mỗi hệ

| Hệ | Chiêu riêng 1 | Chiêu riêng 2 |
|---|---|---|
| Thủy | **Thủy trụ nghịch lưu:** ba cột nước trồi lần lượt, cách nhau 0,32 giây, 24 sát thương/cột. | **Hải triều phân lộ:** hai sóng nước đi vào từ hai bên, chừa đường ở giữa, 28 sát thương/lần trúng. |
| Hỏa | **Hỏa sơn liên bạo:** ba cột nham bùng lần lượt, cách nhau 0,45 giây, 28 sát thương/cột. | **Vành đai tro nóng:** vùng vành khăn gây 13 sát thương/giây; tâm và ngoài vành an toàn. |
| Lôi | **Lôi trụ liên hoàn:** bốn cột điện, cách nhau 0,24 giây, 22 sát thương/cột. | **Điện võng luân chuyển:** đường điện quét ngang, 15 sát thương/giây khi chạm. |
| Phong | **Phong luân kẹp:** hai luồng gió khép từ hai bên vào, 25 sát thương/lần trúng. | **Mắt bão nghịch lưu:** tâm bão an toàn di chuyển ngang, người chơi phải bám theo; bên ngoài chịu 12 sát thương/giây. |
| Thổ | **Địa trụ xung kích:** năm cột đá đánh lần lượt, cách nhau 0,28 giây, 23 sát thương/cột. | **Thạch trận khe hở:** ba vị trí, chỉ hai vị trí dựng đá; chọn khe không có dấu cảnh báo để né 30 sát thương. |
| Quang | **Lăng kính hội tụ:** ba cột sáng đánh cùng lúc sau cảnh báo, 25 sát thương/cột. | **Nhật luân quét ngang:** một tia sáng quét ngang, 16 sát thương/giây khi chạm. |
| Băng | **Băng trụ truy dấu:** ba lần ghi vị trí mới, cách nhau 0,65 giây; mỗi dấu chờ 1,2 giây rồi phóng trụ, 22 sát thương. | **Vành sương kết tinh:** vùng băng gây 10 sát thương/giây và giảm 35% tốc độ khi đứng trong vùng. |
| Mộc | **Rễ cổ thụ săn đuổi:** bốn lần ghi vị trí mới, cách nhau 0,5 giây; rễ trồi sau cảnh báo 1,2 giây, 20 sát thương. | **Cổ mộc hồi sinh:** cây quấn quanh hộ vệ, hồi tổng 5% thanh máu phase trong 4 giây; gây đủ 8% máu phase sát thương trong lúc hồi để ngắt. |
| Ám | **Nguyệt thực cấm vực:** vành bóng tối gây 15 sát thương/giây, tâm và ngoài vành an toàn. | **Bóng ma đoạn mệnh:** hai khối bóng tối khép từ hai bên, 28 sát thương/lần trúng. |
| Vô Danh (dự phòng) | **Cổ thạch trồi dậy:** ba cột đá lần lượt, 24 sát thương/cột. | **Thạch trận khe hở:** hai vùng đá và một khe an toàn, 28 sát thương. |

Các con số là sát thương gốc, sau đó áp dụng hệ số trùm, kháng và phòng thủ thông thường. Hệ số trùm Thủy/Hỏa/Lôi là 0,75 / 0,85 ở hai phase; các hộ vệ khác 0,95 / 1,05, riêng Ám thêm 1,15 ở phase 3.

## Ám hợp nhất

- Hắc lãnh địa luôn tồn tại đến kết thúc trận; thi triển lãnh địa khác không làm nó hết hạn.
- Mọi chiêu Ám của người: không tốn mana, hồi chiêu còn 60%, sát thương gốc ×1,5. Không đổi chiêu của người chơi.
- Ảnh phân thân: mỗi lần gọi hai bóng, tối đa bốn, chó 33 sát thương, bò 49,5.
- Ảnh tập kích điều khiển toàn bộ bóng như bình thường.
- Ảnh tượng: 135 sát thương gốc, voi rơi nhanh hơn (0,5 giây), vẫn có thể né.
- Ảnh độn: kéo dài 4,5 giây.
- Hào quang trong suốt vẫn nhảy dậm, phun năng lượng, tạo giáp và dùng hai chiêu Ám riêng trong lúc người kết ấn.
