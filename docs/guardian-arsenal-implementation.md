# Bộ kỹ năng linh thú theo thiết kế được duyệt

Chuẩn nội dung là [bản thiết kế người dùng](guardian-arsenal-user-design.md). Áp dụng cho linh thú trong các trận góc nhìn thứ ba, gồm phiêu lưu và luyện tập. Các chiêu phản kích của boss được giữ. Không thêm đòn đánh trả tự động cho người chơi và không sửa cơ chế của NPC ninja, bộ chiêu, sát thương, tốc độ, nhiệm vụ hay dữ liệu lưu của người chơi.

| Linh thú | Kỹ năng | Cơ chế chính |
|---|---:|---|
| Cửu Viêm Hồ | 9 | Nhóm đuôi, dấu chân nổ, hỏa cầu chờ lướt, tường lửa, phân thân, hút lửa và chín mặt trời |
| Thủy Long | 8 | Xoáy xuất hiện sau vòng báo tại vị trí cố định, Hải Triều liền mạch, Thủy Lao bắn cầu có báo trước và giam 1,5 giây, lặn, áp suất và đại dương trên trời |
| Lôi Thần Lang | 10 | Mở, truy kích, kết thúc; dư ảnh, hoán vị, lưới điện, phản kích phá được từ phía sau |
| Phong Ưng | 8 | Động lượng, cắt cánh khi lao, mắt bão an toàn, bổ nhào nhiều lượt |
| Sơn Quy | 8 | Độ bền từng chân, đầu và mai; hai chân cùng phía bị phá làm lật, cột đá có HP |
| Kim Ưng | 9 | Lông làm tài nguyên, truy đuổi, phản đạn phía trước, hồi kiếm, kiếm trận và đại kiếm |
| U Minh Lang | 9 | Ảo ảnh thật/giả, hoán vị, phát lại vệt đánh, phản kích, mắt tím báo đòn thật |
| Thanh Lộc | 9 | Cây tăng trưởng, hồi máu, hoa và rễ truy đuổi, người cây, hi sinh cây, phá rễ cây thần |
| Băng Hổ | 10 | Băng phá được, trượt có quán tính, gương phá được, chuyển vị trước khi lao và bão mảnh băng |

Tổng cộng 80 kỹ năng có tên, mô tả, vai trò, giai đoạn mở khóa và thông số riêng. Danh mục: `src/guardian-arsenal.json`; thông số: `src/guardian-arsenal-data.js` và bảng cân bằng. Trình chỉnh thông số hiện có 89 dòng: 80 kỹ năng và 9 nội tại.

## Luật chia sân

Đi bộ luôn bị chặn theo phần sân nhà ghi lúc vào trận, tính cả kích thước linh thú. Boss chỉ vượt rào bằng đợt kỹ năng tấn công có chuyển động lao/nhảy. Vị trí xuất phát được lưu trước combo; sau khi kết thúc chuỗi hoặc bị ngắt, boss quay về điểm đó. AI không mở đợt đánh mới khi đang quay về. Trong khoảng nghỉ cuối combo, boss đi qua lại trong sân nhà, đổi hướng ở hai đầu và không bắt đầu chiêu mới. Boss không ở lại đi bộ bên sân người chơi.

Hải Triều Xung Kích giữ bề ngang 18 m và báo trước, nhưng dùng một dải hình ảnh/va chạm liền, không có khe hoặc dấu hành lang an toàn. Đợt sóng cuối của Hải Thiên Nghịch Chuyển vẫn giữ cơ chế riêng. Thủy Lao Giam Cầm gồng 0,9 giây kèm đường cảnh báo, sau đó bắn một quả cầu không tự đuổi từ miệng; chỉ trúng mới giam 1,5 giây. Quả cầu giam tự tan, không có HP và không thể phá bằng sát thương.

## AI và nhịp đánh

AI quan sát lại vị trí/vận tốc sau mỗi 0,24 giây, không đọc phím bấm. Chọn kỹ năng dựa trên khoảng cách, mục tiêu đang chạy, đội hình gần nhau, đạn đang tới và tài nguyên hiện có. Dư ảnh, lông vũ, cây, băng và vùng nguyên tố là điều kiện sử dụng các chiêu khai thác tài nguyên.

Các giai đoạn mở khóa ở 100–70%, 70–35% và dưới 35% máu của dạng linh thú. Boss nối combo 2–3 chiêu, ngắt 0,25 giây giữa các chiêu và nghỉ 1,4 giây sau cả combo. Chiêu cuối nhiều đợt là một đợt đánh riêng rồi nghỉ. Nếu cần quay về sân nhà thì chỉ bắt đầu đếm nghỉ cuối combo sau khi về. Dưới 30% máu, ngắt giữa chiêu còn 0,12 giây, nghỉ cuối combo còn 0,6 giây và hồi chiêu riêng còn 65%. Thời gian gồng, cảnh báo và diễn tiến chiêu giữ nguyên để vẫn né được. Đòn phản kích của boss nối sau thế phòng thủ qua khoảng ngắt ngắn. Đánh hụt cận chiến từ chiêu thứ hai có thể chấm dứt chuỗi. Đường lao khóa sau dấu báo; vị trí bắt đầu lấy tại thời điểm thực sự lao để tránh giật lùi giữa hai lượt.

Máu giai đoạn 2 mặc định bằng hai lần máu giai đoạn 1. Các thông số giai đoạn 2 đang lưu trong bảng cân bằng, cả boss cốt truyện, được cập nhật theo tỷ lệ này; máu giai đoạn 1, giai đoạn 3, sát thương và thông số ninja giữ nguyên. Trận giải cứu Phong Ưng dùng cùng 720 HP với Phong Ưng giai đoạn 2. Bảng cân bằng vẫn cho phép chỉnh tay riêng từng giai đoạn về sau.

Tham khảo nguyên tắc mỗi đòn buộc người chơi phản ứng có chủ đích và mọi đòn đều có cách xử lý trong [phân tích Valkyrie của Denny Yeh, Santa Monica Studio](https://blog.playstation.com/archive/2019/02/01/how-god-of-wars-nine-epic-valkyrie-boss-battles-were-created). Chuyển động tiến vào không gian chiến đấu được đối chiếu với [Evolving Combat in God of War, GDC 2019](https://media.gdcvault.com/gdc2019/presentations/Sheth_Mihir_EvolvingCombat.pdf). Đây là nguyên tắc tham khảo, không phải tuyên bố game đạt chất lượng sản xuất AAA.

## Kiểm tra

Quy tắc cảnh báo và kết quả rà soát nằm trong [cảnh báo kỹ năng linh thú](guardian-telegraph-audit.md).

`npm run test:guardian-bosses` kiểm tra 80 kỹ năng, luật về sân, điểm yếu, phản kích, tài nguyên, WebGL, bản VI/EN và luồng phiêu lưu. `npm run test:guardian-mobile` kiểm tra giao diện cảm ứng. Giao chiến ninja và di chuyển người chơi được kiểm tra riêng để phát hiện ảnh hưởng ngoài phạm vi.

Hiệu ứng dùng bộ đệm 96 hạt và dùng chung hình học/vật liệu. Vật thể, lịch đánh và trạng thái được dọn khi đổi trận; tạm nghỉ đóng băng mô phỏng.

Đòn quét có vệt chém hình quạt; đòn theo đường có luồng nguyên tố; vùng sát thương kéo dài có hiệu ứng nổi trên mặt đất. Hình ảnh dùng chính vị trí, bán kính, hướng và góc của phép tính sát thương. Chuyển động chân/cánh/đuôi nhận nhịp ra đòn thực tế, kể cả đòn nhiều lượt. Cầu lửa của Cửu Nhật bay theo đường đã báo và đại kiếm của Kim Ưng hạ xuống theo hành lang chém. Hình ảnh chiêu nằm riêng với lớp cảnh báo nên tắt đường dự đoán vẫn thấy chiêu. Bộ đệm tối đa 40 hiệu ứng đánh được dọn khi rời trận. Kiểm tra bằng `npm run test:guardian-strike-vfx`.

Thủy Long không có chân và không dùng nhịp bước của thú bốn chân. Hai lưới thân/bụng uốn theo từng vòng; lịch sử đường di chuyển cho đuôi trễ tối đa 0,35 giây khi đổi hướng. Đầu dẫn hướng, vây và vảy bụng đi theo thân; tụ chiêu thu đầu, khi phóng thì vươn ra. Tia áp suất bắt đầu từ mốc miệng đang hoạt ảnh. Kiểm tra riêng: `tests/guardian-dragon-motion-core.mjs`; ảnh WebGL di chuyển/tụ/phóng nằm trong `test-results/guardian-arsenal-render/water-*.png`.
