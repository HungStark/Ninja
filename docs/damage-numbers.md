# Số sát thương trong không gian trận đấu

- `Fighter.receive()` thông báo lượng HP thực sự mất sau kháng/giáp và khiên, gồm sát thương bị giới hạn bởi HP còn lại. Miễn nhiễm, phản đòn chưa nhận sát thương, hấp thụ hoàn toàn và hồi máu không tạo số.
- Số dùng sprite trong cảnh 3D, viền tối, mặt chữ sáng và lớp đổ tạo độ nổi. Vàng cho đối thủ, đỏ cho người chơi/đồng hành. Số lớn dần theo HP mất, có giới hạn kích thước; nảy lên rồi mờ trong 1,05 giây. Các hit cùng người trong 0,08 giây gộp số; đợt sau tạo số mới.
- Các mục tiêu có thông báo riêng. Góc nhìn thứ nhất đặt số sát thương của chính người chơi phía trước mắt để không bị mất sau camera. Tạm dừng đóng băng hiệu ứng, đổi trận xóa sạch.
- Tối đa 40 số đồng thời, tái sử dụng sprite/material, tối đa 48 texture chữ trong bộ đệm. Không tạo font/tài nguyên tải mạng.

Xác minh: `tests/damage-numbers-core.mjs` kiểm tra sát thương thực, giáp/khiên, miễn nhiễm, hồi máu, overkill, tự hồi trong luyện tập, gộp hit, tài nguyên giới hạn và dọn dẹp. `tests/damage-numbers-browser.cjs` mở `index.html` thật, dùng chiêu thật đánh hai bên, cả hai góc nhìn trên máy tính và trình duyệt giả lập điện thoại, cùng trường hợp sóng trúng ba người.

Hai kiểm thử cũ `tests/core.cjs:30` (điều kiện thi triển) và `tests/elemental-status.mjs:5` (kỳ vọng sát thương nước 14,4 thay vì dữ liệu hiện tại 15) vẫn lỗi giống hệt khi chạy với `game-core.js` từ HEAD trước thay đổi này; đã đối chiếu riêng, không đổi cân bằng để khớp kiểm thử cũ.
