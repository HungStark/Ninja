# G, máu bot và cơ chế trùm hiện tại

G của người chơi giữ lướt 3 m trong 0,2 giây và thời gian giữ tăng lực 3 giây; hồi chiêu đổi về 12 giây từ lúc lướt. Mọi AI bỏ G, vẫn di chuyển trái/phải và phản ứng bằng bước né thường 0,2 m. Máu đối thủ tăng 10%, làm tròn số nguyên; áp dụng đúng một lần cho bot tập, bộ ba đầu game, ninja thường, cảnh vệ và trùm. Máu người chơi giữ nguyên.

Ví dụ: bot tập 200 → 220, ninja thường đầu game 110 → 121, mỗi ninja bộ ba 85 → 94.

## Trùm mạnh hơn ở đâu

- Khởi đầu có ba chiêu của hệ. Sang giai đoạn 2 mở cả năm chiêu; đây là cùng các chiêu người chơi học, cùng điều kiện và hồi chiêu, không phải bộ chiêu mới riêng.
- Thủy, Hỏa, Lôi và Vô Danh có hai giai đoạn, chuyển khi máu còn 55%. Các trùm còn lại có ba giai đoạn, chuyển ở 68% và 32%.
- Kết ấn mỗi 0,43 giây, nghỉ 2,1 giây giữa lượt. Sau khi chuyển giai đoạn, các khoảng này còn 85% (0,3655 giây và 1,785 giây).
- Hồi mana thực tế 7/giây lúc đầu, 9/giây sau chuyển giai đoạn (5 cơ bản cộng thêm 2 hoặc 4).
- Hệ số sát thương trùm Thủy/Hỏa/Lôi lần lượt là 0,75 và 0,85 ở hai giai đoạn. Các trùm khác là 0,95 / 1,05 / 1,15 tùy số giai đoạn. Đây là tỷ lệ so với sát thương gốc, không phải phần trăm tăng thêm trên gốc.
- AI dùng các phối hợp theo hệ đã có: bỏng → Phóng hỏa; tĩnh điện → Điện giật; lốc → liên trảm; cầu kính/vòm → laser; lãnh địa → phân thân/voi; vườn → Mộc; gọi tuyết → Băng.

## Chiêu riêng đang có

Chiêu riêng dùng chung cơ chế vùng sát thương mặt đất: đặt vòng sáng tại các điểm quanh vị trí người chơi lúc cảnh báo, rồi dựng cột đánh xuống. Vị trí đã đặt không bám theo người chơi; có thể di chuyển ra khỏi vòng. Tên, màu, sát thương và bố trí khác nhau, nhưng hiện chưa có cơ chế hoàn toàn riêng theo từng trùm.

| Trùm | Máu mới | Tên chiêu riêng | Bố trí |
|---|---:|---|---|
| Thủy | 572 | Thủy triều phân lưu | Hai bên người chơi |
| Hỏa | 638 | Nứt nham thạch | Các điểm thành hàng |
| Lôi | 682 | Lôi vũ truy kích | Tại vị trí người chơi |
| Phong | 858 | Phong nhãn kép | Hai bên người chơi |
| Thổ | 935 | Thạch trụ địa chấn | Tâm; thêm hai nhánh ở giai đoạn 3 |
| Quang | 1078 | Nhật quang phán quyết | Các điểm thành hàng |
| Băng | 1100 | Băng nứt liên hoàn | Tại vị trí người chơi; thêm điểm ở giai đoạn 3 |
| Mộc | 1188 | Rễ cổ thụ săn đuổi | Tâm; thêm hai nhánh ở giai đoạn 3 |
| Ám | 1760 | Nguyệt thực hư không | Hai bên người chơi |

Chiêu riêng bắt đầu từ giai đoạn 2. Cảnh báo 1,5 giây, lặp mỗi 8 giây. Ở giai đoạn 3: cảnh báo 1,25 giây, lặp mỗi 5,8 giây, tăng số điểm ở một số kiểu và nhân sát thương chiêu riêng 1,2. Đòn này không phản lại được; hệ số sát thương trùm và kháng vẫn áp dụng. Chiêu riêng đầu tiên sau chuyển giai đoạn chờ 1,8 giây trước khi đặt cảnh báo.

Vô Danh có cấu hình trùm 396 máu và chiêu Vọng âm cổ thạch; trận giải cứu mở đầu thực tế dùng ba ninja 94 máu/người.
