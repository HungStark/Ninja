# Cảnh báo kỹ năng linh thú

Phạm vi là 80 kỹ năng của 9 linh thú và bộ kỹ năng góc nhìn thứ nhất cũ. Không áp dụng các thay đổi cảnh báo này cho NPC ninja hay thuật của người chơi.

| Nhóm | Cảnh báo trước tác dụng |
|---|---|
| Đạn bay, đạn tỏa, đạn từ vật triệu hồi | Đường đạn rộng bằng đường va chạm; ít nhất 0,45 giây trước khi đạn riêng của boss bắt đầu bay |
| Tường lửa, vệt gây sát thương, vùng làm chậm, băng và vật triệu hồi | Vòng hoặc dải dưới đất 0,6 giây; hình ảnh và tác dụng được hoãn tới khi cảnh báo kết thúc |
| Quét cận chiến | Vùng hình quạt đủ tầm và góc quét, báo 0,42 giây trước đòn |
| Lao/nhảy | Đường lao và vòng đáp tại điểm đã khóa; bề rộng khớp bán kính đánh |
| Tia xuyên, chém dài | Dải cảnh báo đủ rộng cho va chạm; giữ thời gian chuẩn bị đã thiết kế |
| Vòng sóng lan | Vòng đỏ đi trước vòng gây sát thương 0,6 giây |
| Phản kích của boss | Vòng báo ở boss trước khi thế phản kích có hiệu lực |

Các hiệu ứng phát sinh từ combo cũng phải báo đúng phạm vi mới. Ví dụ vụ nổ do đủ tầng bỏng có bán kính lớn hơn dấu chân lửa thì phải tạo cảnh báo riêng, thay vì dùng lại vòng nhỏ. Ảnh giả lao tới dùng đường báo rộng đủ cho thân ảnh.

Thủy Long Quyển khóa một vị trí dưới chân mục tiêu, vẽ vòng bán kính 1,5 m trong 1,1 giây rồi mới dựng xoáy tại đó. Xoáy đứng yên, tồn tại 1,5 giây, hút nhẹ và chỉ hất ngắn một lần; không bám theo nhân vật hay giam giữ liên tục. Người chơi có thể rời vùng đỏ trước khi xoáy dựng lên.

Thủy Lao Giam Cầm là chiêu khác: sau gồng và đường báo, boss dùng cùng luồng tạo đạn, hiển thị và va chạm với Huyền Thủy Lao Lung của ninja. Chỉ trúng đạn mới giam 1,5 giây; không có cơ chế đánh phá quả cầu.

`tests/guardian-telegraphs-core.mjs` chạy 640 tình huống: đủ 80 kỹ năng, mục tiêu đứng yên/di chuyển, gần/xa, có/không có tài nguyên combo. Kiểm tra vùng đã báo trước mỗi lần trúng và trước khi vật thể nguy hiểm kích hoạt. `tests/guardian-local-file-browser.cjs` mở trực tiếp `index.html` và `game.js` đã build, không thay bundle bằng mã kiểm thử; xác nhận đối thủ thực sự ở dạng linh thú và chụp cảnh báo, xoáy, đạn và va chạm. Ảnh nằm trong `test-results/guardian-local-file/`.
