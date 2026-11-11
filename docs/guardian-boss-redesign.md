# Linh thú trong góc nhìn thứ ba

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

Đạn bay đi qua cơ chế phòng thủ hiện có, giữ sát thương còn lại sau khi phá tường. Cột lửa, sét từ trời, dây leo và các hiệu ứng mặt đất hoạt động theo vùng cảnh báo. Cột đá và mũi băng là vật cản có HP; phân thân, Mộc Linh và cổ thụ có thể bị phá bằng đạn hoặc sát thương diện rộng. Phá cổ thụ ngắt chiêu và gây choáng 1,5 giây.

HUD hiển thị dấu ấn, làm chậm, trói chân, miễn nhiễm đóng băng, giáp đá và cuồng nộ. U Minh Lĩnh Vực giảm tầm nhìn bằng lớp phủ quanh nhân vật. Kim Ưng tiếp tục dùng ID làng/hệ light của game để tương thích dữ liệu lưu, mô hình và bảng khắc hệ hiện có.

Mô phỏng: src/guardian-moba-combat.js. Choreography: src/guardian-moba-skills.js. Danh mục: src/guardian-boss-designs.js. Thông số: src/guardian-balance.js. Mọi timer và vật thể thuộc trận đấu, được dọn khi đổi trận hoặc giai đoạn; tạm dừng không làm tiến triển mô phỏng.

Kiểm tra: npm run test:guardian-bosses (mô phỏng 27 chiêu, nội tại, va chạm, AI, WebGL, trận thật VI/EN và Android cảm ứng); npm run test:guardian-balance (36 dòng dữ liệu, kiểm tra giá trị, giao diện chỉnh sửa, lưu và build).
