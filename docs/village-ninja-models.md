# Ninja các làng từ model hero

`assets/village-ninja.glb` sao chép thân hình và bộ xương của
`hero-ninja-simple.glb`, bắt nguồn từ `hero-ninja.glb`. File hero được giữ nguyên.
Model mới bỏ dây áo chữ X và biểu tượng riêng của hero, thêm mặt nạ vải,
huy hiệu ngực/lưng và các bề mặt tay áo dành riêng cho chiến đấu.

Một asset nền dùng chung cho mười biến thể trong game, thay vì tải mười bản
trùng lặp của cùng bộ xương. `src/village-ninja-style.js` định nghĩa từng bộ:

| Làng | Trang phục | Tóc | Họa tiết |
| --- | --- | --- | --- |
| Vô Danh | Rêu, viền cát | Ngắn nâu | Nút thắt, hình thoi |
| Thủy | Lam đậm, viền ngọc | Rẽ mái xanh đen | Sóng nước |
| Hỏa | Đỏ đất, viền vàng ấm | Tóc dựng | Ngọn lửa |
| Lôi | Tím xám, viền vàng | Vuốt lệch sáng | Tia sét |
| Thổ | Nâu đất, viền cát | Cắt sát | Núi và tầng đá |
| Phong | Xanh xám, viền kem | Búi cao | Gió xoáy |
| Quang | Ngà, viền vàng | Mào tóc vàng | Mặt trời |
| Băng | Lam xám, viền trắng | Tóc trắng ngắn | Bông tuyết |
| Mộc | Xanh rừng, viền lá | Đuôi tóc | Lá và gân lá |
| Ám | Tím than, viền tím nhạt | Mái lệch đen | Trăng khuyết |

Màu da thay đổi theo bảng màu làng. Huy hiệu là texture canvas được cache;
hoa văn áo dùng tọa độ trước khi skinning nên đi theo vải khi tay/thân xoay.
Tóc là các khối đặc ít mặt, có khoảng hở với da đầu.

`character-motion.js` là bộ tính bước chân dùng chung với hero: nhịp chạy,
gập gối, cân bằng cổ chân, hạ hông và chuyển tiếp tốc độ giống nhau. Cảnh vệ
đuổi theo người chơi ở 5,8 m/s dùng tư thế chạy Naruto, tay duỗi ra sau.
Nhân vật Hạ Ly tiếp tục giữ model riêng vốn có.
Ảnh ở màn hình vào trận cũng đợi model tải và áp dụng tư thế đứng trước khi chụp.

Trong trận đánh, `createOpponent()` dùng tay áo skinned và bộ bàn tay kết ấn
chi tiết của game. Bàn tay gốc ẩn đi; tay áo riêng được cắt ngắn trước cổ tay
để không che lòng bàn tay. Hai đoạn tay được giải tới `wristAnchor` ở mép
cổ tay của bộ kết ấn, không nối nhầm vào giữa lòng bàn tay. Các đường may
dài của tay áo rig kết ấn và giáp dự phòng cũng ẩn khi model thật đã sẵn sàng.
Tư thế kết ấn nâng hai khuỷu tay và mở sang hai bên, cẳng tay gần ngang và
bàn tay ở giữa ngực theo ảnh tham chiếu. Hướng gập khuỷu này chỉ áp dụng
cho ninja chiến đấu; các tư thế lao động của cư dân vẫn dùng hướng riêng.

Tạo lại asset và kiểm tra:

```sh
blender --background --python tools/build-village-ninja.py
npm run test:village-ninjas
node tests/ninja-models.mjs
node tests/enemy-movement-core.mjs
npm run build:android
npm run build:vercel
```

Kiểm tra trình duyệt tải cả mười model, so sánh nhịp bước với hero, đo nối
cổ tay ở tư thế nghỉ và đủ 12 thế ấn cho từng làng, rồi mở trận đánh thật
trên desktop và màn hình nhỏ. Ảnh ở `test-results/village-ninja/`.
