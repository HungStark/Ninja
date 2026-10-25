# Giữ nút di chuyển và cập nhật ảnh thú — 25/10/2026

- Giữ nút trái/phải trên Android hoặc nút chuột tương ứng để nối bước khi bước hiện tại hoàn tất. Giữ nguyên tốc độ, khoảng cách bước và cơ chế G. Thả nút sẽ hoàn tất bước đang diễn ra rồi dừng; hủy chạm, đổi màn hình, tạm dừng hoặc rời trận đều xóa trạng thái giữ. Nhiều ngón tay được quản lý riêng, ưu tiên hướng vừa nhấn gần nhất.
- Ảnh phân thân tạo 2 chó mỗi lần, tối đa 4 ảnh mỗi bên. Nếu chỉ còn một chỗ thì tạo thêm một ảnh. Đủ 4 ảnh, mỗi lần tiếp theo vẫn nâng một chó thành bò theo cơ chế hiện có.
- Sát thương gốc ghi trực tiếp: chó **20**, bò **30**. Không có hệ số giảm sát thương lúc va chạm. Biến thể thủ lĩnh Ám tăng cường dùng chó 30 và bò 45.
- Ảnh tập kích: lấy đà tại chỗ 0,3 giây rồi chạy lao theo điểm ngắm đã chốt; chó chạy 26 m/s, bò 24 m/s, có nhịp co chân, vươn chân và nhún thân. Đối thủ vẫn có thể né điểm tập kích.
- Chó, bò và voi có thân trắng ngà cùng họa tiết đỏ; giữ màu mực của lãnh địa và các hiệu ứng khác.

Kiểm tra: `npm run test:hold-and-clones` xác nhận thao tác giữ/thả thật bằng chuột và cảm ứng, nhiều ngón tay, G, giới hạn sân, tạm dừng, kết ấn khi di chuyển, số ảnh/sát thương thực tế, hồi sinh trong lãnh địa, lấy đà/chạy và hình ảnh cả ba loại thú.

APK cập nhật: `android-apk/out/AnHoa-0.3.0-android.3.apk`.
