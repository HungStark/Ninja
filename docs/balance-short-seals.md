# Bản thử cân bằng: phân tầng hồi chiêu

Bản thử `tiered-cooldowns-v2` giữ chuỗi ấn ngắn, giảm sức mạnh đòn cơ bản và tạo khoảng hồi rõ hơn cho các chiêu mạnh.

- Thuộc tính chung: mỗi lần nâng Sinh lực thêm 5 máu; mỗi lần nâng Sức mạnh thêm 1,5% sát thương gốc. Mana thêm 2/điểm. Các bản lưu giữ số điểm đã phân bổ và tính lại theo mức mới.
- G: giữ trạng thái tăng lực tối đa 3 giây; cú lướt sau đó dài 3 m trong 0,2 giây, hồi 5 giây tính từ khi lướt. Người chơi và bot dùng chung thông số; bước né thường giữ 0,2 m.
- Hồi mana vẫn là 5/giây. Sáu đòn cơ bản trong bảng dưới giảm cả sát thương và mana; phần lớn hồi 4 giây. Thủy bộc cầu hồi 5 giây để bốn vụ nổ hoàn tất trước lần tiếp theo.
- Chiêu mạnh hồi 20–24 giây; đại chiêu hồi 30–45 giây tùy sát thương, khống chế và khả năng chi phối trận. Sát thương các chiêu mạnh giữ nguyên.
- Phòng thủ, khống chế và kích hoạt combo dùng hồi riêng theo vai trò, không bị ép chung theo hạng. Chuẩn bị phân thân hồi 2 giây; Độc Hoa cần vườn và là vùng sát thương kéo dài nên giữ hồi 6 giây.
- Bỏng tồn tại 6 giây mỗi tầng; tĩnh điện 8 giây mỗi điểm. Mỗi tầng tự hết hạn; đánh thêm không làm mới toàn bộ các tầng cũ. Ở mức tối đa chỉ thay tầng cũ nhất.
- Mọi loại phi tiêu giảm một nửa sát thương: sắt 2, bạc 2,5, vàng 3,5, bạch kim 5. Phi tiêu mặc định của bot và đấu tập là 2. Giữ nguyên tốc độ, nhịp ném và hệ số trang bị/chỉ số.
- Chuỗi 2–6 ấn, hai ấn đầu cố định theo hệ. Mỗi hệ tối đa một chiêu 2 ấn. Đuôi dùng 10 ấn còn lại, không lặp liền nhau. Chuỗi không hết hạn, giữ qua khống chế và ném phi tiêu.
- Khi hành trình mới học đúng một thuật khởi đầu: thuật đó hồi 4 giây. Học thêm thuật sẽ dùng hồi chuẩn, kể cả khi chỉ trang bị một chiêu. Điều này chỉ còn tạo khác biệt cho Thủy bộc cầu (chuẩn 5 giây).
- Tường tồn tại 8–10 giây, giữ độ bền; hồi 12–14 giây. Óc Chó Hộ Vệ tăng thời lượng từ 8 lên 10 giây khi vườn trưởng thành. Quang kính giữ 2,5 giây, 3 ấn và 22 mana.
- Vườn Sinh Mệnh và Băng Thiên Tuyết Địa vẫn chỉ dùng một lần mỗi trận, dù dữ liệu hồi là 15 giây. Tuyết Táng vẫn cần đủ 90 tuyết. Giữ Ảnh độn 3 giây, Tiên linh gió 5 giây, Băng Phược 1,5 giây và Huyễn Sương 5 giây.
- Gợi ý nối chiêu chỉ áp dụng cho chiêu đã trang bị, đủ mana, hết hồi và thỏa điều kiện; không thêm thưởng sát thương/mana.

## Đòn cơ bản

Sát thương là giá trị gốc, trước chỉ số, trang bị, kháng và phòng thủ. Tổng sát thương nhiều đạn giả định tất cả đều trúng.

| Chiêu | Sát thương | Mana | Hồi (giây) |
|---|---:|---:|---:|
| Hỏa liên đạn | 3 × 6 = 18 | 20 | 4 |
| Thủy bộc cầu | 4 × 7,5 = 30 | 22 | 5 |
| Lôi thương | 22 | 20 | 4 |
| Phong nhận | 24 | 16 | 4 |
| Thổ Thứ | 26 | 16 | 4 |
| Quang laser | 26 (45,5 qua cầu thủy tinh) | 16 | 4 |

Hỏa và Lôi còn tạo tầng để nối chiêu nên có sát thương trực tiếp thấp hơn. Hồi mana 5/giây cho phép hồi 20 mana trong 4 giây; các chiêu lớn vẫn cần tiết kiệm tài nguyên. Bộ số này là bản thử, cần theo dõi tỷ lệ lặp chiêu và hiệu quả thực tế trong thống kê trận.

## Toàn bộ chiêu

| Chiêu | Chuỗi ấn | Mana | Hồi (giây) | Tồn tại / khống chế (giây) |
|---|---|---:|---:|---:|
| Hỏa liên đạn | Q W | 20 | 4 | — |
| Rồng lửa | Q W F A R | 56 | 20 | — |
| Thiên thạch | Q W R E R A | 82 | 35 | — |
| Phóng hỏa | Q W Z | 26 | 8 | — |
| Tường lửa | Q W C | 28 | 13 | 9 |
| Thủy ngục | W E V | 38 | 10 | 3 |
| Ném thuyền | W E R D X | 56 | 22 | 1 |
| Sóng thần | W E R C V A | 72 | 30 | — |
| Thủy bộc cầu | W E | 22 | 5 | 4 |
| Thủy thuẫn | W E F | 26 | 12 | 8 |
| Lôi thương | E R | 20 | 4 | — |
| Lôi điểu | E R X Q X | 56 | 20 | — |
| Thiên lôi | E R F Z V Q | 82 | 35 | — |
| Điện giật | E R A | 26 | 10 | — |
| Lôi trận | E R Q W | 36 | 8 | 5 |
| Phong nhận | R A | 16 | 4 | — |
| Phong lốc | R A S W | 46 | 12 | 2 |
| Phong liên trảm | R A E | 22 | 10 | 2 |
| Phong bích | R A Z | 26 | 13 | 9 |
| Tiên linh gió | R A Q X Z X | 70 | 24 | 5 |
| Thổ Thứ | A S | 16 | 4 | 3 |
| Địa Ngục Chông | A S E | 34 | 8 | — |
| Sơn Hà Đảo Chuyển | A S D X | 56 | 24 | 5 |
| Thổ Bích | A S Q | 30 | 14 | 10 |
| Địa Bộc Thiên Tinh | A S V C W C | 82 | 40 | — |
| Quang laser | S D | 16 | 4 | — |
| Cầu thủy tinh | S D E X | 32 | 12 | 8 |
| Mái vòm gương | S D Z W C W | 54 | 30 | 10 |
| Quang kính | S D A | 22 | 8 | 2.5 |
| Nấc thang của Jacob | S D Z F Z X | 82 | 35 | — |
| Ảnh phân thân | D F Z | 26 | 2 | — |
| Ảnh tập kích | D F | 34 | 8 | — |
| Ảnh tượng | D F W Q | 56 | 20 | 2 |
| Hắc lãnh địa | D F R Z S Q | 70 | 45 | 30 |
| Ảnh độn | D F A | 32 | 8 | 3 |
| Độc Hoa | F Z | 22 | 6 | — |
| Dây Leo Trói Buộc | F Z X | 34 | 10 | 2 |
| Trúc Diệp Phi Vũ | F Z V D | 50 | 20 | — |
| Óc Chó Hộ Vệ | F Z A | 24 | 13 | 8 |
| Vườn Sinh Mệnh | F Z R E R D | 50 | 15 | — |
| Tuyết Táng | Z X | 20 | 45 | — |
| Băng Phược | Z X S | 28 | 8 | 1.5 |
| Huyễn Sương | Z X C E | 34 | 11 | 5 |
| Băng Bích | Z X V | 24 | 12 | 8 |
| Băng Thiên Tuyết Địa | Z X W Q W Q | 50 | 15 | — |

## Thống kê bản thử

Mở **Thống kê trận** trong menu tạm dừng hoặc màn kết quả: số chiêu khác nhau, tỷ lệ lặp liên tiếp, thời gian nhập chuỗi, chờ hồi/mana khi đã đủ ấn và hiệu quả tường.

Thời gian nhập tính từ ấn đầu tới ấn cuối của chuỗi thi triển thành công, gồm thời gian suy nghĩ, không gồm tạm dừng hoặc khống chế. Thời gian chờ sau ấn cuối lưu riêng. Chờ hồi và chờ mana có thể trùng nhau. Giữ mẫu của 256 lần thi triển gần nhất; tổng số lần và tỷ lệ lặp tính toàn trận.

Lưu tối đa 20 báo cáo trên thiết bị tại `anhoa-battle-history-v1`, phân biệt điện thoại/máy tính và phiên bản cân bằng. Không gửi dữ liệu lên mạng.

## Kiểm tra

- `npm run test:balance`: dữ liệu, gợi ý, thống kê và chiến đấu thực tế trên Android/máy tính.
- `node tests/core.cjs`, `node tests/nature-core.mjs`, `node tests/light-core.mjs`, `node tests/combat-core.mjs`: quy tắc, Mộc/Băng, Quang và va chạm/phá tường.
