# Hình ảnh fantasy và nhân vật chính

Tạo hình ninja theo bảng tham khảo gồm tóc đen buộc cao, khăn che mặt, vai rộng hơn, giáp vai viền đồng, mặt nạ hồ ly ở thắt lưng và áo choàng đỏ họa tiết lá phong. Áo choàng có chuyển động nhẹ theo tư thế và tốc độ.

- `assets/hero-maple.blend` chứa rig, vật liệu đã đóng gói và camera để chỉnh sửa trong Blender.
- `assets/hero-ninja-reference.glb` là model dùng trong game, giữ 113 xương, các khớp ngón tay và chuyển động chớp mắt.
- `assets/hero-maple-preview.png` và `assets/hero-maple-back.png` là hai góc xem từ Blender.
- `tools/build-hero-reference.py`, `tools/hero-maple-outfit.py` và `tools/hero-maple-textures.py` dựng model và texture. `tools/preview-maple-blender.py` dựng cảnh xem trước.

Giáp làng thay các lớp giáp Lữ Khách tương ứng. Khăn, áo choàng và mặt nạ hồ ly đi cùng các bộ trang bị.

## Cảnh quan

Bộ `assets/fantasy-scenery.blend` và `assets/fantasy-kit.json` gồm thân cây có rễ/nhánh, tán cây nhiều lớp, tán lá kim, dương xỉ và ba mẫu đá. Nguồn dựng là `tools/build-fantasy-kit.py`. JSON được nhúng vào bundle nên tài nguyên mới có mặt trong bản web và Android ngoại tuyến.

Cây, cỏ và dương xỉ giữ màu thảm thực vật của từng vùng. Vô Danh giữ cây khô và nhà tranh đổ nát. Vùng khô giữ mật độ thưa; Băng giữ tuyết và nước đóng băng; Hỏa giữ sông dung nham. Kiến trúc, địa danh, tuyến đường và dữ liệu chiến đấu của các làng tiếp tục dùng bố cục hiện có.

Các thay đổi khác gồm cỏ cong có gân, vỏ cây/đá/đất có relief riêng, ngói và gỗ rõ bề mặt hơn, bậu cửa và mộng gỗ, kính cửa sổ, bầu trời chuyển sắc theo làng và gợn nước theo tọa độ thế giới. Linh thú giữ hình dạng riêng với vật liệu mềm hơn; bề mặt rắn của chiêu thức có bắt sáng viền nhẹ. Geometry xuất từ Blender tham gia va chạm thực và được tách batch theo bộ thuộc tính để giữ vertex color.

## Dựng và kiểm tra

```powershell
.\.tools\node.exe tests/hero-reference-core.mjs
.\.tools\node.exe tests/fantasy-visuals-core.mjs
.\.tools\node.exe tests/fantasy-visuals-browser.cjs
.\.tools\node.exe tools/preview-hero-reference.cjs kage-final
.\.tools\node.exe tests/hero-equipment-motion-browser.cjs
.\.tools\node.exe tools/build-portraits.mjs --hero
.\.tools\node.exe tools/build-android.mjs
.\.tools\node.exe tools/build-vercel.mjs
```

`npm run test:fantasy-visuals` chạy kiểm tra tài nguyên, dựng bundle và kiểm tra trình duyệt. Ảnh các làng nằm trong `test-results/fantasy-visuals/`; ảnh nhân vật ở `test-results/hero-reference/kage-final/`. Kiểm tra trình duyệt dùng Edge WebGL 2 với SwiftShader; FPS trên GPU phần cứng chưa được đo.

Hai kiểm tra cũ đã được đối chiếu với nguồn HEAD và cũng lỗi ở bản gốc: `landscape-core.mjs` thiếu `solidMesh` trong fixture; `guardian-motion-core.mjs` có kỳ vọng âm thanh `rock-shift` không còn khớp. Các lỗi này độc lập với thay đổi hình ảnh.
