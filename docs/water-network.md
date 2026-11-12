# Nhánh sông và bè tại làng Thủy

Bố cục hiện tại theo hình đánh dấu:

- Bỏ kênh dọc phía đông trong vùng khoanh đỏ; phần đất được phục hồi cả hình ảnh lẫn va chạm.
- Nhánh ngang phía nam chạy từ sông chính qua khoảng trống giữa khu quân sự và trường học, kéo dài tới mép phải theo nét xanh.
- Bỏ nhánh ngang phía bắc nằm giữa nhà họp và khu quân sự theo vùng khoanh xanh mới nhất. Phần đất liền, bản đồ và va chạm cùng được cập nhật; tuyến bè trên nhánh này cũng được bỏ.
- Giữ nhánh phía tây. Mạng nước hiển thị gồm sông chính và hai nhánh.
- Làng Thủy có **0 cầu**, **5 tuyến bè hai chiều**, mỗi tuyến có bến ở hai bờ. Dấu trên bản đồ là tuyến bè nét đứt, không phải cầu.

`water-network.js` cung cấp chung đường sông, bề rộng, khoảng cách tới bờ, các vùng đất nối liền và hình vẽ bản đồ. Mặt nước dùng một mesh nhẹ, có phần bịt tròn ở đầu nhánh; không chồng nhiều lớp nước trong suốt tại chỗ giao nhau. Mô hình bè được gộp theo vật liệu để giảm số lượt vẽ.

Vật thể vướng sông tìm phần đất khô gần nhất có đủ diện tích đặt toàn bộ chân vật thể và không chặn công trình/lối đi. Tìm kiếm theo khoảng cách, bước 0,5 m, chỉ thực hiện lúc dựng bản đồ. Vị trí không tích lũy dịch chuyển khi tải lại. Giữ đúng danh tính và thứ tự của 20 nhà; sau khi bỏ nhánh bắc, chỉ còn một nhà cần dạt lên bờ. Dữ liệu hai bờ cũ chỉ còn được giữ nội bộ để tái tạo bố cục nhà trước khi dịch chuyển; kênh đông cũ không được dựng hoặc dùng cho va chạm.

Cây, đá, cụm đồ, công trình địa danh, NPC và mục tiêu nhiệm vụ dùng cùng kiểm tra bờ. Vị trí lưu cũ nằm trong nhánh mới được đưa lên bờ gần nhất có thể đứng. Đường qua làng dùng các chặng đi bộ và đi bè; kiểm tra vùng đất giúp tránh tìm đường đi bộ xuyên một dòng sông không thể vượt qua.

Kiểm tra:

- `tests/water-network-core.mjs`: sông bị bỏ, nhánh kéo tới biên, chân vật thể khô, 20 nhà giữ nguyên danh tính, bè chạy hai chiều, lòng sông chặn đi bộ, 34 điểm tương tác tới được, mọi thay đổi trạng thái nhiệm vụ và vị trí ổn định sau tải lại.
- `tests/water-network-browser.cjs`: WebGL thực, bản đồ máy tính/điện thoại, lên bè và qua nhánh kéo dài, không có cầu, xử lý vị trí lưu cũ và tải lại ổn định.
- `tests/quest-refresh-core.mjs`: nhận/hoàn thành/nhận thưởng trên cả mười làng không dựng lại hoặc làm xê dịch cảnh.
- `tests/inventory-map-core.mjs`: các điểm trên bản đồ và hành trang.

Ảnh kiểm tra ở `test-results/water-network/overview.png`, `map-desktop.png`, `map-phone.png` và `ferry-crossing.png`. Lệnh kiểm tra gộp: `npm run test:water-network`. Đã build lại gói web và dữ liệu offline Android.
