# Giá Vô Danh và nhịp kết ấn — 25/10/2026

Giáp nhập môn Vô Danh giá 140 xu; giáp tay 100 xu. Cả ba cặp Hỏa–Thủy, Thủy–Lôi, Lôi–Hỏa dùng chung giá trang bị thường của các làng khác. Phi tiêu, túi và nâng bình thuốc giữ bảng giá chung hiện có.

Tốc độ kết ấn so với đối thủ thường trong cùng làng:

| Đối thủ | Tốc độ | Thời gian giữa hai ấn |
|---|---:|---:|
| Thường, nhiệm vụ, sự kiện | ×1 | Nhịp thường |
| Cảnh vệ | ×1,15 | Nhịp thường ÷ 1,15 |
| Hai hộ vệ của linh thú | ×1,3 | Nhịp thường ÷ 1,3 |
| Thủ lĩnh/linh thú ở dạng kết ấn | ×1,5 | Nhịp thường ÷ 1,5 |

Nhịp thường vẫn theo độ khó hiện tại của làng, từ 0,9 giây ở Vô Danh tới 0,45 giây ở Làng Ám. Hệ số áp dụng nhất quán cho các phase kết ấn của thủ lĩnh. Dạng linh thú thi triển trực tiếp vẫn dùng thời gian báo chiêu/gồng sức của bộ chiêu riêng.

Võ đài Làng Mộc dùng mốc chung 0,9 giây mỗi ấn cho mọi đại diện làng. Vòng 1 tốc độ ×1,0; vòng 2 ×1,1; vòng 3 ×1,2; vòng n ×(1 + 0,1 × (n − 1)). Mỗi chiến thắng mở vòng kế tiếp; thua thử lại vòng hiện tại. Tiến độ lưu trong `save.arena.round`, bản lưu cũ bắt đầu vòng 1. Trận giao hữu vẫn không thưởng xu và trả người chơi về võ đường.

Kiểm tra: `npm run test:enemy-seal-speed`.
