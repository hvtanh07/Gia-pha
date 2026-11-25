# Gia phả họ Hứa

Cây gia phả tương tác của họ Hứa (Văn Hàn, Thái Thụy, Thái Bình), chạy trên cả máy tính và điện thoại.

- Kéo để di chuyển, cuộn chuột hoặc chụm hai ngón để phóng to / thu nhỏ.
- Nhấn vào ô tên để xem chi tiết và mở các con; nút “▸ N con” / “Thu gọn” để mở hoặc đóng nhánh.
- Trên điện thoại cây mọc từ dưới lên (Thủy tổ ở dưới cùng).
- Ô tìm kiếm không cần gõ dấu (tìm theo tên, vợ/chồng, năm sinh, quê quán).
- Mỗi người có liên kết riêng (`#id`) để chia sẻ.
- Nút **Xem 3D / Xem 2D** chuyển giữa sơ đồ phẳng và cây 3D hình nón (mỗi đời là một vòng tròn). Ở chế độ 3D: kéo để xoay, chụm hoặc cuộn để phóng to. Thêm `?che-do=3d` vào link để mở thẳng chế độ 3D. Chế độ 3D tự vẽ bằng canvas, không cần WebGL hay thư viện ngoài.

## Dữ liệu

`data/gia-pha.json` được tạo từ `tools/build_data.py` (chép tay từ file docx gốc):

```
python3 tools/build_data.py data/gia-pha.json
```

Muốn sửa hoặc bổ sung người, sửa `tools/build_data.py` rồi chạy lại lệnh trên. Những chỗ tài liệu gốc chưa rõ được đánh dấu trường `issue` và hiện viền vàng nét đứt trên cây.

## Chạy thử

```
python3 -m http.server 8000
```

rồi mở http://localhost:8000. Trang là HTML/JS tĩnh (d3 v7 đặt trong `vendor/`), nên host thẳng bằng GitHub Pages.

Trước mỗi lần đăng bản mới, chạy `sh tools/stamp.sh` để đổi số phiên bản, tránh trình duyệt dùng lại file cũ.
