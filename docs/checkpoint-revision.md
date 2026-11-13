# Tự lưu và bản lưu tại ấn

Tiến trình tự lưu và mốc chơi lại là hai trạng thái riêng. Cả hai được ghi cùng một dữ liệu `anhoa-adventure-v1` để tránh lệch giữa hai lần ghi bộ nhớ.

- `save` là trạng thái đang chơi, dùng khi tiếp tục hành trình sau khi mở lại game. Tự lưu định kỳ tăng từ 3 lên 10 giây khi di chuyển; vẫn lưu sau nhận việc, nhận thưởng, mua đồ, chuyển làng, kết thúc trận và các thay đổi quan trọng khác. Lưu lúc thoát vẫn giữ như trước.
- `save.checkpointSave.snapshot` là bản sao đầy đủ tại lần nhấn E ở ấn gần nhất theo thời gian. Những lần tự lưu không thay thế bản này. Lưu tại một ấn khác sẽ thay mốc cũ, không tạo thêm ô lưu. Bản sao không chứa chính `checkpointSave`, nên không lồng dữ liệu qua mỗi lần lưu.

Nhấn E tại ấn cập nhật mốc hồi sinh và lưu đầy đủ vị trí, sức khỏe, trạng thái Hạ Ly, trang bị, đạn, bình thuốc, tiền, kinh nghiệm, chiêu, nhiệm vụ, cảnh vệ, khám phá, giải đấu, liên minh và kết thúc. Không chữa thương hay nạp bình thuốc. Việc thay mốc chỉ thành công khi ghi dữ liệu thành công; nếu bộ nhớ lỗi, mốc cũ được giữ và giao diện báo chưa lưu được.

Thua một trận tính là chết khôi phục toàn bộ bản tại ấn và dựng lại bản đồ để các đối thủ/nhiệm vụ đã bị hoàn thành sau mốc đó xuất hiện lại. Nếu thoát ngay trên màn hình thất bại, lần tiếp tục cũng khôi phục mốc đó. Giải đấu Mộc và thử thách hữu nghị Thổ giữ luật thất bại riêng, theo xác nhận của người chơi.

Trong cài đặt trò chơi có **Trở về điểm lưu gần nhất**, mở từ menu phiêu lưu, màn hình chính hoặc menu tạm dừng chiến đấu. Giao diện cho biết làng, tên ấn, thời điểm lưu và các tiến trình sẽ bị bỏ. Chức năng dùng mốc nhấn E, dùng được sau end game, không dùng bản tự lưu. Khôi phục một mốc trước khi Hạ Ly hy sinh đưa cô trở lại với đúng trạng thái ở mốc đó; bad end và các nhiệm vụ sau mốc cũng bị xóa.

Mỗi làng ngoài Vô Danh có bốn ấn ở bốn vị trí cách đều trên cùng một vòng quanh làng; vị trí chọn tránh nước và các khu nhà, làm phẳng phần đất nhỏ dưới ấn. Có mô hình 3D, tương tác, ký hiệu minimap và tên trên bản đồ làng cho từng ấn. Vô Danh giữ một ấn. Đã bỏ giao diện và luồng dịch chuyển giữa các làng từ ấn.

Hành trình mới có mốc khởi đầu dự phòng nếu chết trước lần lưu tay đầu tiên; mốc này không hiện như bản lưu tại ấn trong cài đặt. Bản lưu cũ không có dữ liệu lịch sử để tái tạo trạng thái ở lần dùng ấn trước đây: giữ toàn bộ tiến trình tự lưu hiện có, và cần nhấn E lần đầu sau cập nhật để tạo mốc đầy đủ. Trước khi có mốc đó, hành vi hồi sinh cũ được giữ.

Kiểm tra: `npm run test:checkpoint-revision` kiểm tra ảnh chụp trạng thái, lưu/nạp, hồi sinh, ngoại lệ giao hữu, các vị trí trên cả mười làng, PC và mobile, phát lại sau bad end và khôi phục Hạ Ly sau thất bại trong trận thủ lĩnh.
