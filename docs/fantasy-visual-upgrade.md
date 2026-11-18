# Hình ảnh fantasy và nhân vật Kage

Ninja chính được dựng lại theo bảng tham khảo ở phong cách 3D cách điệu: mũ trùm có đường gấp, mặt nạ, khăn đỏ sẫm, tay áo ngắn, dây đeo chéo, tà áo tách lớp, dây thắt lưng, giáp vai bất đối xứng, giáp tay/chân và katana đeo sau lưng. Katana hiện là phụ kiện hiển thị. Tà khăn có morph chuyển động nhẹ.

- `assets/hero-kage.blend`: nhân vật có rig, pose xem trước, vật liệu và camera để chỉnh sửa trong Blender.
- `assets/hero-ninja-reference.glb`: tài nguyên đang dùng trong game; 25.832 tam giác, 4.849.060 byte, giữ nguyên 113 xương, bind matrices, biểu cảm mắt và khớp ngón tay.
- `assets/hero-kage-preview.png`: ảnh thật từ Three.js, cùng bộ dựng hình của game.
- `tools/build-hero-reference.py` và `tools/hero-kage-outfit.py`: nguồn dựng GLB từ model gốc.
- `tools/preview-kage-blender.py`: đưa GLB vào workshop Blender có thể chỉnh sửa.

Trang phục ninja/NPC từng làng, màu áo do người chơi chọn và bộ trang bị đã lưu tiếp tục dùng dữ liệu hiện có. Các lớp giáp Kage, dây đeo, katana và tà áo được ẩn khi mặc giáp làng để nhường chỗ cho bộ giáp đang trang bị. Mũ trùm và tay áo ngắn vẫn thuộc trang phục nền.

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
