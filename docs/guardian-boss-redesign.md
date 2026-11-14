# Linh thú trong góc nhìn thứ ba

Bản thiết kế hiện hành 80 kỹ năng và luật trở về sân được mô tả trong [triển khai bộ kỹ năng mới](guardian-arsenal-implementation.md). Nội dung bên dưới ghi lại bộ ba chiêu trước đó.

Bộ chiến đấu mới chỉ áp dụng ở góc nhìn thứ ba, gồm tập luyện và các trận phiêu lưu dùng góc nhìn này. Chín linh thú có ba kỹ năng và một nội tại riêng. Vô Danh Thú và dạng đồng hành giữ bộ chiêu riêng. Góc nhìn thứ nhất tiếp tục dùng dữ liệu và mô phỏng legacy; đợt cập nhật này không chạy kiểm tra góc nhìn thứ nhất.

| Linh thú | Độ khó | Nội tại | Ba kỹ năng |
|---|---|---|---|
| Hồ Ly Cửu Hỏa | 4/5 | Cửu Vĩ Hỏa Ấn | Thiên Hỏa Trụ; Hồ Hỏa Truy Hồn; Cửu Vĩ Phần Thiên |
| Long Vương Cuồng Hải | 4/5 | Thủy Triều Dâng | Long Thủy Phá; Hải Tuyền Lao Ngục; Hải Long Nộ Triều |
| Thiên Lôi Cuồng Lang | 5/5 | Lôi Điện Tích Tụ | Lôi Ảnh Tập Kích; Thiên Lôi Giáng; Lôi Lang Phân Thân |
| Thiên Phong Ưng Vương | 4/5 | Phong Linh Chi Dực | Phong Nhận Liên Hoàn; Cuồng Phong Toàn; Thiên Ưng Trụy Kích |
| Huyền Sơn Cự Quy | 3/5 | Bất Động Như Sơn | Địa Nham Trụ; Sơn Quy Chấn Địa; Huyền Quy Toái Sơn |
| Kim Sí Thần Ưng | 4/5 | Kim Vũ Sát Khí | Vạn Kiếm Kim Vũ; Kim Dực Trảm; Thiên Vũ Kiếm Trận |
| Minh Giới Ma Lang | 5/5 | U Minh Tiềm Hành | Ảnh Lang Tập Sát; Minh Ảnh Phân Thân; U Minh Lĩnh Vực |
| Vạn Mộc Linh Lộc | 3/5 | Sinh Mệnh Cộng Hưởng | Mộc Đằng Trói Buộc; Linh Hoa Bạo Liệt; Vạn Mộc Hồi Sinh |
| Hàn Thiên Bạch Hổ | 4/5 | Hàn Khí Xâm Thực | Băng Trảo Liên Kích; Hàn Băng Địa Thứ; Bạch Hổ Băng Phong |

AI giữ khoảng cách theo vai trò, dự đoán di chuyển, tạo ít nhất một vùng nhắm mục tiêu và dành hành lang né cho các vùng ngẫu nhiên. Boss ưu tiên tương tác với hiệu ứng đang tồn tại, không lặp cùng một chuỗi quá hai lần, giảm 18% thời gian nghỉ/hồi chiêu dưới 30% máu. Không cộng sát thương riêng vì cuồng nộ.

Đợt chỉnh nhịp giao tranh ngày 14/11/2026:

- Mở combo sau 0,75 giây, nghỉ giữa chiêu 0,28 giây và nghỉ cuối combo 0,95 giây. Hồi chiêu riêng vẫn được giữ để tránh lặp một chiêu liên tục. Sát thương các đòn chủ lực và tốc độ di chuyển được tăng trong bảng cân bằng.
- Thời gian boss bận thi triển tách khỏi thời gian hiệu ứng tồn tại. Mưa lửa, kiếm trận và bão tuyết tiếp tục chạy khi boss chuyển sang chiêu khác; phân thân, lốc và cổ thụ tự hoạt động sau khi được gọi. Các tiến trình này thuộc trận đấu và dừng đúng khi tạm nghỉ.
- Lôi Lang và Ma Lang khóa đường lao theo chuyển động dự đoán, có dấu báo trước. Bạch Hổ vồ tới mục tiêu ở xa rồi nối vuốt. Ma Lang báo hướng tập kích trước khi dịch chuyển, phân thân vẫn phải hoàn tất cảnh báo riêng.
- Sóng thần mặc định rộng 18 m thay vì 36 m, khe né rộng 4,6 m, dày 1 m và cao 1,4 m. Ba đợt đi kế tiếp, không tạo hai mặt sóng cắt nhau trong đợt cuối. Mỗi khe nằm gần người chơi, có ít nhất 0,9 giây cảnh báo; xóa xoáy gây nguy hiểm trong hành lang đã báo. Phần hình ảnh và va chạm cùng chừa khe hở thực.
- Đi bộ bị giới hạn trong phần sân hiện tại, tính cả kích thước linh thú. Sơn Quy va hàng rào khi lao trên đất và đổi hướng. Nhảy, bổ nhào và dịch chuyển có thể đổi phần sân, luôn đáp trong biên hợp lệ; các cú lao của thú có độ cao nhảy thay vì trượt ngang qua rào.
- Bộ khớp có chân, gối, cánh và đuôi; Thủy Long có thân uốn. Hoạt ảnh lấy đà, hạ trọng tâm, gồng, bật chân, quạt cánh và ra đòn nhận thời gian từ trạng thái chiến đấu. Chuyển động chân theo vận tốc thực.
- Hiệu ứng dùng chất liệu phân dải sáng và dòng năng lượng theo từng hệ, lõi/vệt đạn, cột lửa, tia nước, xoáy ba chiều, vết vuốt và va chạm. Vùng cảnh báo giữ màu rõ; bọt sóng không che khe né. Hạt sáng dùng một InstancedMesh tối đa 96 hạt; hình học và vật liệu dùng lại, chế độ thấp giảm lớp lõi đạn.

Các phần mới: src/guardian-tactics.js, src/guardian-animation.js và src/guardian-vfx.js. Chạy npm run test:guardian-pressure để kiểm tra 9 vòng AI, đường né sóng ở tốc độ đi bộ có làm chậm, rào chắn, hoạt ảnh, 27 kỹ năng, bản VI/EN và Android cảm ứng.

Đạn bay đi qua cơ chế phòng thủ hiện có, giữ sát thương còn lại sau khi phá tường. Cột lửa, sét từ trời, dây leo và các hiệu ứng mặt đất hoạt động theo vùng cảnh báo. Cột đá và mũi băng là vật cản có HP; phân thân, Mộc Linh và cổ thụ có thể bị phá bằng đạn hoặc sát thương diện rộng. Phá cổ thụ ngắt chiêu và gây choáng 1,5 giây.

HUD hiển thị dấu ấn, làm chậm, trói chân, miễn nhiễm đóng băng, giáp đá và cuồng nộ. U Minh Lĩnh Vực giảm tầm nhìn bằng lớp phủ quanh nhân vật. Kim Ưng tiếp tục dùng ID làng/hệ light của game để tương thích dữ liệu lưu, mô hình và bảng khắc hệ hiện có.

Mô phỏng: src/guardian-moba-combat.js. Choreography: src/guardian-moba-skills.js. Danh mục: src/guardian-boss-designs.js. Thông số: src/guardian-balance.js. Mọi timer và vật thể thuộc trận đấu, được dọn khi đổi trận hoặc giai đoạn; tạm dừng không làm tiến triển mô phỏng.

Kiểm tra: npm run test:guardian-bosses (mô phỏng 27 chiêu, nội tại, va chạm, AI, WebGL, trận thật VI/EN và Android cảm ứng); npm run test:guardian-balance (36 dòng dữ liệu, kiểm tra giá trị, giao diện chỉnh sửa, lưu và build).
