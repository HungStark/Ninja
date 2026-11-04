# Ninja đối thủ của nhiệm vụ phụ

Các mục tiêu `combat` trong `villageSidequests` chỉ tạo mô hình và điểm tương tác khi `story.sidequests[id] === 1` (đã nhận, đang làm). Nhận việc qua hội thoại đồng bộ ngay mục tiêu; không cần đổi bản đồ. Khi thắng, nhiệm vụ chuyển sang trạng thái 2 và mục tiêu bị xóa. Trạng thái 3 (đã trả thưởng) tiếp tục ẩn mục tiêu. Tải lại tiến trình hoặc quay về làng giữ đúng quy tắc này.

Nhiệm vụ chưa nhận không cho mở trận hoặc ghi nhận chiến thắng sớm. Dữ liệu cũ đã hoàn thành sớm vẫn được giữ để nhận thưởng, không tạo lại ninja. Vật phẩm, điểm khảo sát, cảnh vệ, ninja lang thang và đối thủ tuyến chính giữ hành vi riêng hiện có.

Kiểm tra bằng `npm run test:quest-ninjas`: cả 10 làng, mô hình thật và điểm tương tác, mục tiêu không trùng, tiến trình được nạp lại, đồ nhặt sớm, giữ nguyên cư dân/cảnh vệ/địa hình; hội thoại nhận việc, lùi lại, chiến thắng và trả thưởng trên web / giao diện Android.
