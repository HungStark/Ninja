# Hệ Băng: tuyết tích lũy, Tuyết táng và Bão Tuyết

- **Thiên Địa Tuyết Táng** gọi tuyết một lần mỗi trận. Tuyết tích 1/giây và dừng ở 90. Mỗi tuyết đang tích làm đối thủ giảm 0,5% tốc độ di chuyển, tối đa 45%. Tuyết của bên nào chỉ làm chậm bên đối diện; cả hai bên có thể cùng gọi tuyết.
- **Tuyết táng** cần và tiêu hao 35 tuyết. Cầu gom các cụm tuyết trong 1 giây (trước đây 2 giây), tốc độ lăn gốc 6,2 m/giây (trước đây 3,1), tiếp tục nhận hệ số tốc độ đạn chung của game. Cầu lăn thẳng theo hướng đã chỉ định khi thi triển, không tự bám theo đối thủ, vẫn chặn đòn khi đang lăn. Khi chạm đối thủ, cầu gây 250 sát thương gốc một lần rồi vỡ thành các mảnh tuyết. Áp dụng hệ số sát thương, kháng và khiên thông thường. Không nhốt, kéo người hay tự động kết thúc trận.
- Sau khi dùng Tuyết táng, chỉ trừ 35 khỏi lượng hiện có: đang có 90 thì còn 55. Tuyết vẫn rơi và tích tiếp. Hiệu ứng gom không hút toàn bộ hạt tuyết trên trời, không kéo các ụ tuyết hay xóa lớp tuyết phủ sân.
- **Bão Tuyết** thay Huyền Băng Thiên Bích, giữ mã `ice-barrier`, chuỗi ấn `Z X V`, hồi chiêu và mana hiện tại. Cần đã gọi tuyết. Trong 8 giây, lượng tuyết tích tăng từ 1 lên 2/giây; số hạt hiển thị tăng gấp đôi, rơi nhanh hơn và hơi chéo. Khi hết hiệu lực trở lại bình thường; không tạo tường hoặc có độ bền. Dùng lại làm mới hiệu lực, không cộng dồn thành ×4.

Giữ nguyên các tinh chỉnh đang có của người dùng. Chỉ bỏ thuộc tính `shield` đã hết tác dụng ở `ice-barrier`. Bảng cân bằng nội bộ hiển thị sát thương mới của Tuyết táng, hiệu lực Bão Tuyết và các chỉ số tuyết bổ sung. Mã chiêu giữ nguyên để bộ chiêu và tiến trình học đã lưu vẫn tương thích.

Logic và hiệu ứng nằm trong `src/nature-arts.js`; hệ số giảm tốc được áp dụng vào di chuyển người chơi, đối thủ chính và các thành viên đội địch trong `src/main.js`. Thông tin chiêu động nằm trong `src/ice-spell-stats.js`, hình chiêu ở `src/spell-art.js`.

Kiểm tra bằng `npm run test:ice-snow`. Bộ kiểm tra bao gồm hai bên thi triển, đúng ngưỡng 35, sát thương 250 và vỡ một lần, không cuốn người/ép thắng, tuyết còn trên mặt đất, tuyết tiếp tục tích, giới hạn 90, giảm tốc thực tế, Bão Tuyết hết hạn chính xác và giao diện web / Android / tiếng Anh. `npm run test:balance-editor` kiểm tra bảng chỉnh riêng.

`tools/build-android.mjs` chuẩn bị lại dữ liệu web và thư mục Android. APK đã cài và website đang triển khai cần được build / phát hành lại để nhận thay đổi.
