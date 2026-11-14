# Bộ kỹ năng linh thú theo thiết kế được duyệt

Chuẩn nội dung là [bản thiết kế người dùng](guardian-arsenal-user-design.md). Áp dụng cho linh thú trong các trận góc nhìn thứ ba, gồm phiêu lưu và luyện tập. Các chiêu phản kích của boss được giữ. Không thêm đòn đánh trả tự động cho người chơi và không sửa cơ chế của NPC ninja, bộ chiêu, sát thương, tốc độ, nhiệm vụ hay dữ liệu lưu của người chơi.

| Linh thú | Kỹ năng | Cơ chế chính |
|---|---:|---|
| Cửu Viêm Hồ | 9 | Nhóm đuôi, dấu chân nổ, hỏa cầu chờ lướt, tường lửa, phân thân, hút lửa và chín mặt trời |
| Thủy Long | 8 | Trạng thái chiến đấu, xoáy hút đạn, khe sóng, Thủy Lao tự phá được, lặn, áp suất và đại dương trên trời |
| Lôi Thần Lang | 10 | Mở, truy kích, kết thúc; dư ảnh, hoán vị, lưới điện, phản kích phá được từ phía sau |
| Phong Ưng | 8 | Động lượng, cắt cánh khi lao, mắt bão an toàn, bổ nhào nhiều lượt |
| Sơn Quy | 8 | Độ bền từng chân, đầu và mai; hai chân cùng phía bị phá làm lật, cột đá có HP |
| Kim Ưng | 9 | Lông làm tài nguyên, truy đuổi, phản đạn phía trước, hồi kiếm, kiếm trận và đại kiếm |
| U Minh Lang | 9 | Ảo ảnh thật/giả, hoán vị, phát lại vệt đánh, phản kích, mắt tím báo đòn thật |
| Thanh Lộc | 9 | Cây tăng trưởng, hồi máu, hoa và rễ truy đuổi, người cây, hi sinh cây, phá rễ cây thần |
| Băng Hổ | 10 | Băng phá được, trượt có quán tính, gương phá được, chuyển vị trước khi lao và bão mảnh băng |

Tổng cộng 80 kỹ năng có tên, mô tả, vai trò, giai đoạn mở khóa và thông số riêng. Danh mục: `src/guardian-arsenal.json`; thông số: `src/guardian-arsenal-data.js` và bảng cân bằng. Trình chỉnh thông số hiện có 89 dòng: 80 kỹ năng và 9 nội tại.

## Luật chia sân

Đi bộ luôn bị chặn theo phần sân nhà ghi lúc vào trận, tính cả kích thước linh thú. Boss chỉ vượt rào bằng đợt kỹ năng tấn công có chuyển động lao/nhảy. Vị trí xuất phát được lưu trước đợt đánh; sau kết thúc chuỗi, đánh hụt cần hồi phục hoặc bị ngắt, boss quay về điểm đó. AI không mở đợt đánh mới khi đang quay về. Boss không ở lại đi bộ bên sân người chơi.

Sóng thần dùng hai mảng hình ảnh và hai phần va chạm cùng chừa khe rộng 4,6 m, bề ngang mặc định 18 m. Khe gần người chơi và có báo trước; xoáy nguy hiểm trong hành lang được dọn. Các kỹ năng lớn chia thành nhiều đợt có cảnh báo và chừa lối di chuyển.

## AI và nhịp đánh

AI quan sát lại vị trí/vận tốc sau mỗi 0,24 giây, không đọc phím bấm. Chọn kỹ năng dựa trên khoảng cách, mục tiêu đang chạy, đội hình gần nhau, đạn đang tới và tài nguyên hiện có. Dư ảnh, lông vũ, cây, băng và vùng nguyên tố là điều kiện sử dụng các chiêu khai thác tài nguyên.

Các giai đoạn mở khóa ở 100–70%, 70–35% và dưới 35% máu của dạng linh thú. Sau chuỗi hoặc đòn kết thúc có khoảng rút về/hồi phục. Đánh hụt cận chiến có thể chấm dứt chuỗi. Đường lao khóa sau dấu báo; vị trí bắt đầu lấy tại thời điểm thực sự lao để tránh giật lùi giữa hai lượt.

Tham khảo nguyên tắc mỗi đòn buộc người chơi phản ứng có chủ đích và mọi đòn đều có cách xử lý trong [phân tích Valkyrie của Denny Yeh, Santa Monica Studio](https://blog.playstation.com/archive/2019/02/01/how-god-of-wars-nine-epic-valkyrie-boss-battles-were-created). Chuyển động tiến vào không gian chiến đấu được đối chiếu với [Evolving Combat in God of War, GDC 2019](https://media.gdcvault.com/gdc2019/presentations/Sheth_Mihir_EvolvingCombat.pdf). Đây là nguyên tắc tham khảo, không phải tuyên bố game đạt chất lượng sản xuất AAA.

## Kiểm tra

`npm run test:guardian-bosses` kiểm tra 80 kỹ năng, luật về sân, điểm yếu, phản kích, tài nguyên, WebGL, bản VI/EN và luồng phiêu lưu. `npm run test:guardian-mobile` kiểm tra giao diện cảm ứng. Giao chiến ninja và di chuyển người chơi được kiểm tra riêng để phát hiện ảnh hưởng ngoài phạm vi.

Hiệu ứng dùng bộ đệm 96 hạt và dùng chung hình học/vật liệu. Vật thể, lịch đánh và trạng thái được dọn khi đổi trận; tạm nghỉ đóng băng mô phỏng.

Thủy Long không có chân và không dùng nhịp bước của thú bốn chân. Hai lưới thân/bụng uốn theo từng vòng; lịch sử đường di chuyển cho đuôi trễ tối đa 0,35 giây khi đổi hướng. Đầu dẫn hướng, vây và vảy bụng đi theo thân; tụ chiêu thu đầu, khi phóng thì vươn ra. Tia áp suất bắt đầu từ mốc miệng đang hoạt ảnh. Kiểm tra riêng: `tests/guardian-dragon-motion-core.mjs`; ảnh WebGL di chuyển/tụ/phóng nằm trong `test-results/guardian-arsenal-render/water-*.png`.
