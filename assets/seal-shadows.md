# Ghép bóng với kết ấn

Đối chiếu 12 ấn đang dùng trong `ket_an.jpg` (3 cột, đọc từ trái sang phải)
với ảnh `bong.png` (4 cột, đọc từ trái sang phải), riêng D dùng hình chim dang cánh
theo ảnh người dùng xác nhận. Hàng/cột bên dưới bắt đầu từ 1.

| Phím | Tên ấn | Hàng trong bong.png | Cột | Hướng |
| --- | --- | --- | --- | --- |
| Q | Mỏ nhọn | 1 | 1 | Giữ nguyên |
| W | Tai kép | 1 | 2 | Giữ nguyên |
| E | Trụ thẳng | 1 | 3 | Giữ nguyên |
| R | Móc tay | 2 | 1 | Giữ nguyên |
| A | Chụm ngang | 2 | 2 | Giữ nguyên |
| S | Song chỉ | 2 | 3 | Giữ nguyên |
| D | Xòe chéo — chim dang cánh | 4 | 4 | Giữ nguyên |
| F | Khóa ngón | 3 | 2 | Giữ nguyên |
| Z | Vòng cung | 3 | 3 | Giữ nguyên |
| X | Chắp nghiêng | 3 | 4 | Giữ nguyên |
| C | Mở lòng | 4 | 2 | Giữ nguyên |
| V | Cuộn tay | 3 | 1 | Lật ngang để khớp ảnh gốc |

Ánh xạ và khung cắt nằm trong `src/hand-vfx.js`. `assets/shadow-data.js` nhúng
ảnh bóng gốc để game chạy trực tiếp từ `index.html` và qua máy chủ mà không
cần tải thêm ảnh. Shader loại nền trắng và giữ phần bóng đen cùng lỗ mắt.
Các hình còn lại trong ảnh bóng chưa được gán vì game hiện có 12 ấn.
