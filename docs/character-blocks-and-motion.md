# Nhân vật ít chi tiết và dáng chạy Naruto

Game dùng ba bản biến thể riêng: `hero-ninja-simple.glb`,
`npc_nam-simple.vrm`, `npc_nu-simple.vrm`. Ba file gốc được giữ nguyên.

Tóc được dựng thành các cụm đặc, ít mặt, với đường bao rõ. Quần áo giữ 73%
số mặt sau khi giảm lưới, giữ UV và nội suy trọng số xương. Khuôn mặt,
bàn tay, các biểu cảm, hệ xương, ma trận bind và các điểm gắn trang bị
được giữ nguyên. Công cụ chỉ thay geometry trong file gốc, không xuất lại
hệ xương qua Blender nên không làm đổi trục xương hoặc tên khớp.

| Model | Số tam giác gốc | Bản mới |
| --- | ---: | ---: |
| Hero | 30.535 | 20.705 |
| NPC nam | 23.163 | 19.436 |
| NPC nữ | 30.157 | 19.966 |

Chạy lại bằng Blender:

```sh
blender --background --python tools/character-blocks.py
```

`assets/character-blocks.json` ghi số liệu sau mỗi lần tạo. Đổi các kích thước
cụm tóc trong `hair_geometry()` hoặc tỷ lệ trong `simplify_cloth()` để tinh chỉnh.
Số tam giác là số trong mesh nguồn, chưa tính các lượt vẽ viền và bóng.

`src/hero-gait.js` tính quỹ đạo chân rồi giải góc hông, gối và cổ chân.
Chân thu về có độ nhấc và độ gập lớn hơn; chân trụ giữ bàn chân cân bằng.
Trọng tâm hạ theo tốc độ và chuyển về tư thế nghỉ khi dừng.

Chạy nhanh giữ hai tay duỗi ra sau theo kiểu Naruto, không đánh tay đối chân.
Khuỷu tay hơi thả lỏng. Đi bộ, nhảy và leo dùng độ gập riêng. Với rig này,
gập khuỷu tay cần xoay quanh trục Y cục bộ; trục X chỉ xoắn dọc cánh tay.
Cả model thật và nhân vật dự phòng đều được cập nhật.

Kiểm tra:

```sh
npm run build:android
npm run build:vercel
npm run test:character-style
npm run test:locomotion
npm run test:sprint-pose
```

Bộ kiểm tra model tải cả ba asset thật qua HTTP, so sánh biểu cảm và rig với
bản gốc, kiểm tra trọng số xương, độ gập chân/tay và vị trí giày khi chạy.
Ảnh so sánh nằm trong `test-results/character-style-motion/`.
