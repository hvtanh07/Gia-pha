#!/usr/bin/env python3
"""Build data/gia-pha.json from the hand-transcribed docx content.
Usage: python3 -I build_data.py <out.json>"""
import json, sys

people = []
def P(id, parent, name, sex="m", gen=None, code=None, life=None, gio=None,
      spouses=None, place=None, note=None, married=None, adopted=False, issue=None, phone=None):
    people.append({k: v for k, v in dict(
        id=id, parent=parent, name=name, sex=sex, gen=gen, code=code, life=life,
        gio=gio, spouses=spouses, place=place, note=note, married=married,
        adopted=adopted or None, issue=issue, phone=phone).items() if v not in (None, [], "")})

def S(name, life=None, gio=None, origin=None, note=None):
    return {k: v for k, v in dict(name=name, life=life, gio=gio, origin=origin, note=note).items() if v}

# ---- Thủy tổ ----
P("tt", None, "Vũ Công Tự Trung Thuận", gen=0, code="Thủy tổ",
  spouses=[S("Đặng Thị Từ Huệ")],
  place="Cư trú tại làng Kênh, nay gọi là thôn Ký Con, Đông Xuân, Đông Hưng, Thái Bình")

# ---- Đời I ----
P("d1-1", "tt", "Vũ Trung Trực", gen=1, code="ĐI.1", spouses=[S("Vũ Thị Hiền")],
  place="Trú tại làng Kênh, nay là thôn Ký Con, Đông Xuân, Thái Bình")
P("d1-2", "tt", "Vũ Trung Thuộc", gen=1, code="ĐI.2", gio="14 tháng 3",
  spouses=[S("Chưa có thông tin")],
  place="Sinh quán: làng Kênh, nay là thôn Ký Con, Đông Xuân, Đông Hưng, Thái Bình. Trú tại: Văn Hàn, Thái Hưng, Thái Thụy, Thái Bình")
P("d1-2-g1", "d1-2", "Vũ Thị Lý", "f", gen=2, note="Con gái thứ nhất",
  married='Lấy chồng họ Trần, "sinh ra chi chòa nhà ông Lái Giao" (họ Trần Hải Dương)')
P("d1-2-g2", "d1-2", "Con gái thứ hai (chưa rõ tên)", "f", gen=2,
  married='Lấy chồng họ Vũ "cụ bạ Tháp" (họ Vũ xóm 4 Văn Hàn). Sinh ra mẹ ông Thủ Chính')
P("d1-2-g3", "d1-2", "Con gái thứ ba (chưa rõ tên)", "f", gen=2,
  married="Lấy chồng họ Vũ xóm 4 Văn Hàn. Sinh ra bố ông Anh, bố ông Phó Biểng v.v...")
P("d1-2-g4", "d1-2", "Vũ Thị Quản", "f", gen=2, note="Con gái thứ tư. Cuối tài liệu có ghi tên chữ Hán \"Hứa Thị Quản (許 氏 管)\", có thể là cùng một người.",
  married="Lấy chồng họ Trương Kim xóm 2 Văn Hàn. Sinh ra bố ông Tịnh, cụ bạ Thinh, bà Vệ Đương v.v...")

# ---- Đời II ----
P("d2", "d1-2", "Hứa Văn Tiêm", gen=2, code="ĐI.2.ĐII", gio="mồng 8 tháng 5",
  spouses=[S("Nguyễn Thị Vọng", gio="16 tháng 6"), S("Nguyễn Thị Nuôi", gio="7 tháng 1")],
  note="Từ đời này dòng họ mang họ Hứa (tài liệu không ghi lý do đổi họ từ Vũ sang Hứa).")

# ---- Đời III (con cụ Tiêm) ----
P("d3-1", "d2", "Hứa Văn Hiệp", gen=3, code="ĐI.2.ĐII.ĐIII.1", life="1862–1935", gio="22 tháng chạp",
  spouses=[S("Giang Thị Huấn", "1862–1940", "15 tháng 5", "Họ Giang xóm 7 Văn Hàn"),
           S("Nguyễn Thị Thuận", gio="20 tháng 1", origin="Họ Nguyễn xóm 5 Văn Hàn"),
           S("Trương Thị Nhận", "1894–1976", "28 tháng 2", "Họ Trương xóm 5 Văn Hàn")])
P("d3-2", "d2", "Hứa Văn Tỉ", gen=3, code="ĐI.2.ĐII.ĐIII.2", gio="30 tháng 10",
  spouses=[S("Tạ Thị Tô", gio="28 tháng chạp")], note='Danh sách con cụ Tiêm ghi là "Hứa Văn Tỷ".')
P("d3-3", "d2", "Hứa Văn Vân", gen=3, code="ĐI.2.ĐII.ĐIII.3", life="Tạ thế 1922", gio="13 tháng giêng",
  spouses=[S("Nguyễn Thị Tha", "Tạ thế 1933", "21 tháng 11")])
P("d3-4", "d2", "Hứa Văn Bơi", gen=3, code="ĐI.2.ĐII.ĐIII.4", gio="19 tháng giêng",
  spouses=[S("Trương Thị Tuyết", gio="5 tháng 11", origin="Họ Trương xóm 6 Văn Hàn")])
P("d3-5", "d2", "Hứa Văn Hoan", gen=3, code="ĐI.2.ĐII.ĐIII.5", gio="3 tháng 5",
  spouses=[S("Nguyễn Thị Điềm", gio="6 tháng 12", origin="Họ Nguyễn xóm 5 Văn Hàn")])
P("d3-6", "d2", "Hứa Văn Liệu", gen=3, code="ĐI.2.ĐII.ĐIII.6", gio="03 tháng chạp",
  spouses=[S("Vũ Thị Khuê", gio="30 tháng 9", origin="Họ Vũ xóm 4 Văn Hàn, thuộc chi chòa nhà ông Cường")])
P("d3-7", "d2", "Hứa Thị Thấm", "f", gen=3, married="Lấy chồng họ Lê, sinh ra ông Hoàn")
P("d3-8", "d2", "Hứa Văn Hựu", gen=3, note="Tài liệu chưa có thông tin chi tiết.")

# ---- Chi Hiệp ----
P("d4-niep", "d3-1", "Hứa Văn Niếp", gen=4, code="ĐI.2.ĐII.ĐIII.1.ĐIV.1'", life="1911–1991", gio="25 tháng 5", adopted=True,
  spouses=[S("Trương Thị Nhớn (tự Nhất)", "1920–1990", "20 tháng 10", "Họ Trương Kim xóm 5 Văn Hàn")])
P("d5-lien", "d4-niep", "Hứa Thị Liên", "f", gen=5, life="1958–1999", gio="27 tháng 5")
P("d4-chi", "d3-1", "Hứa Văn Chí", gen=4, code="ĐI.2.ĐII.ĐIII.1.ĐIV.1", life="1923–1952", gio="mồng 5 tháng 3",
  spouses=[S("Vũ Thị Nuôi", gio="21 tháng 7", origin="Họ Vũ Khắc xóm 3 Văn Hàn"),
           S("Trương Thị Mi", "1916–2000", "21 tháng 11", "Họ Trương Đức xóm 2 Văn Hàn")])
P("d4-niem", "d3-1", "Hứa Thị Niệm", "f", gen=4, married='Lấy chồng họ Trương "Trương Đức Sáng" (họ Trương xóm 4 Văn Hàn)')
P("d4-trung", "d3-1", "Hứa Thị Trung", "f", gen=4, married='Lấy chồng họ Nguyễn "Nguyễn Vĩnh Khôi" (họ Nguyễn xóm 6 Văn Hàn)')
P("d4-uc", "d3-1", "Hứa Thị Ức", "f", gen=4, married='Lấy chồng họ Trương "Trương Đức Lam" (họ Trương xóm 2 Văn Hàn)')

P("d5-thinh", "d4-chi", "Hứa Văn Thịnh", gen=5, code="ĐI.2.ĐII.ĐIII.1.ĐIV.1.ĐV.1", life="Sinh năm 1944",
  spouses=[S("Phạm Thị Ngãi", "Sinh năm 1951", origin="Họ Phạm: Đông La, Đông Hưng, Thái Bình")])
P("d6-truong", "d5-thinh", "Hứa Xuân Trường", gen=6, code="ĐI.2.ĐII.ĐIII.1.ĐIV.1.ĐV.1.ĐVI.1", life="1975–2011", gio="19 tháng 8")
P("d6-thang", "d5-thinh", "Hứa Việt Thắng", gen=6, code="ĐI.2.ĐII.ĐIII.1.ĐIV.1.ĐV.1.ĐVI.2", life="Sinh năm 1979",
  spouses=[S("Nguyễn Thị Thanh Mai", "Sinh năm 1980", origin="Họ Nguyễn Hà Đông")])
P("d7-tduc", "d6-thang", "Hứa Dũng Trí Đức", gen=7, life="Sinh năm 2004")
P("d7-khoa", "d6-thang", "Hứa Việt Khoa", gen=7, life="Sinh năm 2006")
P("d7-vuong", "d6-thang", "Hứa Đức Vượng", gen=7, life="Sinh năm 2011")
P("d5-minh", "d4-chi", "Hứa Văn Mịnh", gen=5, code="ĐI.2.ĐII.ĐIII.1.ĐIV.1.ĐV.2", life="Sinh năm 1952",
  spouses=[S("Vũ Thị Mừng", origin="Họ Vũ xóm 6 Văn Hàn")])
P("d6-hue", "d5-minh", "Hứa Thị Huế", "f", gen=6)
P("d6-hat", "d5-minh", "Hứa Thị Hạt", "f", gen=6)

# ---- Chi Tỉ ----
P("d4-than", "d3-2", "Hứa Văn Thản", gen=4, code="ĐI.2.ĐII.ĐIII.2.ĐIV.1", gio="mồng 6 tháng 3",
  spouses=[S("Lê Thị Chẩn", gio="mồng 7 tháng 10", origin="Họ Lê xóm 4 Văn Hàn"),
           S("Trương Thị Thân", gio="22 tháng 10", origin="Họ Trương xóm 6 Văn Hàn")])
P("d4-tue", "d3-2", "Hứa Văn Tuệ", gen=4, code="ĐI.2.ĐII.ĐIII.2.ĐIV.2", life="Tạ thế 1953", gio="19 tháng 12",
  spouses=[S("Lê Thị Cúc", "Tạ thế 1990", "9 tháng 2", "Họ Lê xóm 4 Văn Hàn")])

P("d5-xa", "d4-than", "Hứa Thị Xa", "f", gen=5, married="Lấy chồng họ ... (chưa có thông tin)")
P("d5-thanh", "d4-than", "Hứa Văn Thành", gen=5, code="ĐI.2.ĐII.ĐIII.2.ĐIV.1.ĐV.1", life="Sinh năm 1936",
  spouses=[S("Trương Thị Tí", gio="mồng 7 tháng 10", origin="Họ Trương Đức xóm 5 Văn Hàn"),
           S("Vũ Thị Việt", "Sinh năm 1956", origin="Họ Vũ xã Thái Tân")])
P("d5-dang", "d4-than", "Hứa Văn Đăng", gen=5, code="ĐI.2.ĐII.ĐIII.2.ĐIV.1.ĐV.2", life="Sinh năm 1940",
  spouses=[S("Đoàn Thị Quất", "Sinh năm 1947", origin="Họ Đoàn, xã Thái Nguyên, Thái Thụy, Thái Bình")])
P("d5-dan", "d4-than", "Hứa Văn Đán", gen=5, note="Tài liệu chưa có thông tin chi tiết.")

P("d6-trung", "d5-thanh", "Hứa Văn Trung", gen=6, code="ĐI.2.ĐII.ĐIII.2.ĐIV.1.ĐV.1.ĐVI.1", life="1954–1988", gio="3 tháng 10")
P("d6-thuy", "d5-thanh", "Hứa Thị Thủy", "f", gen=6, life="Sinh năm 1955",
  married='Lấy chồng họ Nguyễn "Nguyễn Văn Bao" (họ Nguyễn: Phù Lưu Tế, Mỹ Đức, Hà Nội)')
P("d6-lan", "d5-thanh", "Hứa Thị Lan", "f", gen=6)
P("d6-minh", "d5-thanh", "Hứa Văn Minh", gen=6, code="ĐI.2.ĐII.ĐIII.2.ĐIV.1.ĐV.1.ĐVI.2", life="Sinh năm 1964")
P("d6-tan", "d5-thanh", "Hứa Văn Tân", gen=6, code="ĐI.2.ĐII.ĐIII.2.ĐIV.1.ĐV.1.ĐVI.3", life="Sinh năm 1966",
  spouses=[S("Nguyễn Thị Thanh Thủy", "Sinh năm 1974", origin="Họ Nguyễn, Phú Xuyên, Hà Tây")])
P("d7-thang", "d6-tan", "Hứa Văn Thắng", gen=7, life="Sinh năm 1995")
P("d7-haha", "d6-tan", "Hứa Nguyễn Hải Hà", "f", gen=7, life="Sinh năm 2007")
P("d6-quang", "d5-thanh", "Hứa Văn Quang", gen=6, code="ĐI.2.ĐII.ĐIII.2.ĐIV.1.ĐV.1.ĐVI.4", life="Sinh năm 1971",
  spouses=[S("Giang Thị Thúy Nga", "Sinh năm 1982", origin="Họ Giang, thành phố Sơn La")])
P("d7-glinh", "d6-quang", "Hứa Giang Linh", "f", gen=7, life="Sinh năm 2006")
P("d7-bao", "d6-quang", "Hứa Gia Bảo", gen=7, life="Sinh năm 2012")

P("d6-hung", "d5-dang", "Hứa Mạnh Hùng", gen=6, code="ĐI.2.ĐII.ĐIII.2.ĐIV.1.ĐV.2.ĐVI.1", life="Sinh năm 1973",
  spouses=[S("Lê Thị Bích Nhuần", "Sinh năm 1976", origin="Họ Lê: Vũ Thành, Thái Hưng, Thái Thụy")])
P("d7-vanh", "d6-hung", "Hứa Việt Anh", gen=7, life="Sinh năm 2000")
P("d7-blinh", "d6-hung", "Hứa Bảo Linh", "f", gen=7, life="Sinh năm 2007")
P("d6-huong", "d5-dang", "Hứa Thị Hường", "f", gen=6, life="Sinh năm 1975",
  married='Lấy chồng họ Nguyễn "Nguyễn Ngọc Tùng" (họ Nguyễn: thành phố Thái Bình)')
P("d6-ha", "d5-dang", "Hứa Thị Hà", "f", gen=6, life="Sinh năm 1982",
  married='Lấy chồng họ Lê "Lê Đức Cảnh" (họ Lê: Lê Lợi, Kiến Xương, Thái Bình)')

P("d5-quan", "d4-tue", "Hứa Văn Quán", gen=5, code="ĐI.2.ĐII.ĐIII.2.ĐIV.2.ĐV.1", life="1933–1952", gio="16 tháng 8",
  spouses=[S("Trương Thị Bàn", note="Sau khi chồng mất đã xuất giá")])
P("d5-toai", "d4-tue", "Hứa Văn Toại", gen=5, code="ĐI.2.ĐII.ĐIII.2.ĐIV.2.ĐV.2", life="1934–…", gio="20 tháng 8",
  spouses=[S("Nguyễn Thị Rũy", "Sinh năm 1934", origin="Họ Nguyễn xóm 9 Văn Hàn")])
P("d5-thao", "d4-tue", "Hứa Thị Thảo", "f", gen=5)
P("d5-qui", "d4-tue", "Hứa Văn Quí", gen=5, code="ĐI.2.ĐII.ĐIII.2.ĐIV.2.ĐV.3", life="Sinh năm 1943",
  spouses=[S("Phạm Thị Nụ", "Sinh năm 1949", origin="Họ Phạm, xã Tây Tiến, Tiền Hải, Thái Bình")])
P("d5-thach", "d4-tue", "Hứa Thị Thạch", "f", gen=5)
P("d5-ty", "d4-tue", "Hứa Văn Tỵ", gen=5, code="ĐI.2.ĐII.ĐIII.2.ĐIV.2.ĐV.4", life="Sinh năm 1953",
  spouses=[S("Hà Thị Thắng", "Sinh năm 1954", origin="Họ Hà, Đông Hòa, thành phố Thái Bình")],
  issue="Không có trong danh sách \"Các con\" của cụ Hứa Văn Tuệ, nhưng mã đời (ĐIV.2.ĐV.4) xếp ông là con thứ tư của cụ Tuệ. Cần gia đình xác nhận.")

P("d6-vu", "d5-toai", "Hứa Văn Vụ", gen=6, code="ĐI.2.ĐII.ĐIII.2.ĐIV.2.ĐV.2.ĐVI.1", life="Sinh năm 1954",
  spouses=[S("Trần Thị Tách", "Sinh năm 1956", origin="Họ Trần, Thụy Hồng, Thái Thụy")])
P("d6-xuan", "d5-toai", "Hứa Văn Xuân", gen=6, code="ĐI.2.ĐII.ĐIII.2.ĐIV.2.ĐV.2.ĐVI.2", life="1960–2007", gio="30 tháng 10",
  spouses=[S("Đỗ Thị Tròn")])
P("d6-nghia", "d5-toai", "Hứa Văn Nghĩa", gen=6, code="ĐI.2.ĐII.ĐIII.2.ĐIV.2.ĐV.2.ĐVI.3", life="Sinh năm 1968",
  spouses=[S("Đỗ Thị Hồng", "Sinh năm 1976", origin="Họ Đỗ, Thái Học, Thái Thụy")])
P("d6-hien", "d5-toai", "Hứa Thị Hiền", "f", gen=6)
P("d6-que", "d5-toai", "Hứa Thị Quế", "f", gen=6)
P("d6-chi", "d5-toai", "Hứa Thị Chi", "f", gen=6)
P("d6-chit", "d5-toai", "Hứa Thị Chít", "f", gen=6)

P("d7-duc", "d6-vu", "Hứa Văn Đức", gen=7, code="ĐI.2.ĐII.ĐIII.2.ĐIV.2.ĐV.2.ĐVI.1.ĐVII.1", life="Sinh năm 1978",
  spouses=[S("Trần Thị Thu Hương", "Sinh năm 1992", origin="Họ Trần, Thanh Tân, Kiến Xương, Thái Bình")])
P("d8-phuoc", "d7-duc", "Hứa Văn Phước", gen=8, life="Sinh năm 2011")
P("d8-phu", "d7-duc", "Hứa Văn Phú", gen=8, life="Sinh năm 2013")
P("d7-mai", "d6-vu", "Hứa Thị Mai", "f", gen=7, life="Sinh năm 1980")
P("d7-tam", "d6-vu", "Hứa Văn Tâm", gen=7, code="ĐI.2.ĐII.ĐIII.2.ĐIV.2.ĐV.2.ĐVI.1.ĐVII.2", life="Sinh năm 1988",
  note="Mục riêng của ông chưa điền thông tin vợ, con.")
P("d7-dao", "d6-xuan", "Hứa Thị Đào", "f", gen=7, life="Sinh năm 1991")
P("d7-trang", "d6-nghia", "Hứa Thị Trang", "f", gen=7, life="Sinh năm 1996")
P("d7-huyen", "d6-nghia", "Hứa Thị Huyền", "f", gen=7, life="Sinh năm 2000")
P("d7-thu", "d6-nghia", "Hứa Thị Thư", "f", gen=7, life="Sinh năm 2013")

P("d6-huy", "d5-qui", "Hứa Văn Huy", gen=6, code="ĐI.2.ĐII.ĐIII.2.ĐIV.2.ĐV.3.ĐVI.1", life="Sinh năm 1973",
  spouses=[S("Hà Thị Thu Hằng", origin="Họ Hà, Hùng Quan, Đoan Hùng, Phú Thọ")])
P("d7-tanh", "d6-huy", "Hứa Văn Tuấn Anh", gen=7, life="Sinh năm 1999")
P("d7-hieu", "d6-huy", "Hứa Minh Hiếu", gen=7, life="Sinh năm 2004")
P("d6-hoa", "d5-qui", "Hứa Thị Hoa", "f", gen=6, life="Sinh năm 1974", phone=["01677864829", "0367864829"])
P("d6-huong2", "d5-qui", "Hứa Thị Hường", "f", gen=6, phone=["0947421060"])
P("d6-hoa2", "d5-qui", "Hứa Văn Hóa", gen=6, code="ĐI.2.ĐII.ĐIII.2.ĐIV.2.ĐV.3.ĐVI.2", life="Sinh năm 1980", phone=["0979954914"],
  spouses=[S("Vũ Thị Liêm", "Sinh năm 1983", origin="Họ Vũ, Nghĩa Hưng, Nam Định")])
P("d7-hai", "d6-hoa2", "Hứa Văn Hải", gen=7, life="Sinh năm 2008")
P("d7-nam", "d6-hoa2", "Hứa Phương Nam", gen=7, life="Sinh năm 2013")
P("d6-hoang", "d5-qui", "Hứa Văn Hoàng", gen=6, code="ĐI.2.ĐII.ĐIII.2.ĐIV.2.ĐV.3.ĐVI.3", phone=["01678180588", "0367180588"],
  spouses=[S("Chưa rõ tên", "Sinh năm 1983")], note="Mục riêng của ông chưa điền đủ thông tin.")

P("d6-tuanh", "d5-ty", "Hứa Hà Tú Anh", "f", gen=6, life="Sinh năm 1980",
  married='Lấy chồng họ Trịnh "Trịnh Văn Phong" (họ Trịnh: Thuận Vi, Bách Thuận, Vũ Thư, Thái Bình)')
P("d6-vanh", "d5-ty", "Hứa Thị Vân Anh", "f", gen=6, life="Sinh năm 1988",
  married='Lấy chồng họ Bùi "Bùi Thành Trung" (họ Bùi: Vũ Phúc, thành phố Thái Bình)')

# ---- Chi Vân ----
P("d4-than2", "d3-3", "Hứa Thị Thẩn", "f", gen=4, married="Lấy chồng họ Tạ xóm 7 Văn Hàn (Tạ Văn Phú)")
P("d4-thuc", "d3-3", "Hứa Thị Thực", "f", gen=4, married="Lấy chồng họ Trương xóm 4 Văn Hàn (Trương Đức Tác)")
P("d4-thua", "d3-3", "Hứa Thị Thưa", "f", gen=4, married="Lấy chồng họ Trương xóm 4 Văn Hàn (Trương Sĩ Đạm)")
P("d4-vi", "d3-3", "Hứa Văn Vi", gen=4, code="ĐI.2.ĐII.ĐIII.3.ĐIV.1", life="Tạ thế 1945", gio="18 tháng 3",
  spouses=[S("Giang Thị Đậu", origin="Họ Giang xóm 7 Văn Hàn", note="Sau khi chồng mất đã xuất giá")],
  issue="Danh sách \"Các con\" của cụ Hứa Văn Vân chỉ có 3 con gái, nhưng mã đời (ĐIII.3.ĐIV.1) xếp ông là con của cụ Vân. Cần gia đình xác nhận.")
P("d5-minh2", "d4-vi", "Hứa Văn Minh", gen=5, code="ĐI.2.ĐII.ĐIII.3.ĐIV.1.ĐV.1", life="1944–…", gio="(chưa rõ)",
  note='Liệt sĩ. Tài liệu ghi "Các con xinh thành".')

# ---- Chi Bơi ----
P("d4-tam", "d3-4", "Hứa Thị Tâm", "f", gen=4, married='Lấy chồng họ Lê "Lê Quang Toe" (họ Lê xóm 4 Văn Hàn)')
P("d4-tuong", "d3-4", "Hứa Văn Tường", gen=4, code="ĐI.2.ĐII.ĐIII.4.ĐIV.1", gio="26 tháng 6",
  spouses=[S("Nguyễn Thị Tý", gio="9 tháng 2", origin="Họ Nguyễn xóm 3 Văn Hàn")])
P("d4-voi", "d3-4", "Hứa Văn Vòi", gen=4, code="ĐI.2.ĐII.ĐIII.4.ĐIV.2", gio="14 tháng 4",
  spouses=[S("Trương Thị Đương", note="Sau khi chồng mất đã xuất giá")])

P("d5-dinh", "d4-tuong", "Hứa Văn Định", gen=5, code="ĐI.2.ĐII.ĐIII.4.ĐIV.1.ĐV.1", life="1933–1995", gio="8 tháng 11",
  spouses=[S("Lê Thị Hòa", "Sinh năm 1938", origin="Họ Lê (chưa rõ)")])
P("d5-my", "d4-tuong", "Hứa Văn Mỹ", gen=5, code="ĐI.2.ĐII.ĐIII.4.ĐV.2", life="1937–1984", gio="5 tháng 2",
  spouses=[S("Trương Thị Hòa", "Sinh năm 1937", origin="Họ Trương xóm 5 Văn Hàn")],
  issue="Mã đời trong tài liệu thiếu đoạn ĐIV.1 (ghi ĐIII.4.ĐV.2); xếp là con cụ Tường theo danh sách \"Các con\".")
P("d5-ngan", "d4-tuong", "Hứa Thị Ngân", "f", gen=5, life="Tuổi Sửu", note='Tài liệu ghi "sinh năm: 1 tuổi sửu".')
P("d5-hanh", "d4-tuong", "Hứa Thị Hạnh", "f", gen=5, life="Sinh năm 1947",
  married='Lấy chồng họ Nguyễn "Nguyễn Văn Tỵ" (Hòa Tiến, Hưng Hà, Thái Bình)')
P("d5-dung", "d4-tuong", "Hứa Thị Dung", "f", gen=5, life="Sinh năm 1953",
  married='Lấy chồng họ Nguyễn "Nguyễn Hữu Miền" (họ Nguyễn, Thụy Trường, Thụy Anh)')

P("d6-tamanh", "d5-dinh", "Hứa Thị Tâm Anh", "f", gen=6, married="Lấy chồng họ ... (chưa có thông tin)")
P("d6-lananh", "d5-dinh", "Hứa Thị Lan Anh", "f", gen=6, married="Lấy chồng họ ... (chưa có thông tin)")
P("d6-hung2", "d5-dinh", "Hứa Lê Trung Hưng", gen=6, code="ĐI.2.ĐII.ĐIII.4.ĐIV.1.ĐV.1.ĐVI.1", life="Sinh năm 1969",
  issue="Danh sách \"Các con\" của ông Hứa Văn Định chỉ có 2 con gái, nhưng mã đời (ĐV.1.ĐVI.1) xếp ông là con ông Định. Cần gia đình xác nhận.")
P("d6-phuong", "d5-my", "Hứa Thị Phương", "f", gen=6, life="Sinh năm 1971",
  married='Lấy chồng họ Nguyễn "Nguyễn Vĩnh Hằng" (họ Nguyễn Vĩnh xóm 4 Văn Hàn)')
P("d6-nhung", "d5-my", "Hứa Thị Nhung", "f", gen=6, life="Sinh năm 1973",
  married='Lấy chồng họ Nguyễn "Nguyễn Văn Chi" (họ Nguyễn, Hưng Hà, Thái Bình)')
P("d6-dinh2", "d5-my", "Hứa Thị Dinh", "f", gen=6, life="Sinh năm 1974",
  married='Lấy chồng họ Giang "Giang Thế Trường" (họ Giang xóm 7 Văn Hàn)')

# ---- Chi Hoan ----
P("d4-toan", "d3-5", "Hứa Văn Toán", gen=4, code="ĐI.2.ĐII.ĐIII.5.ĐIV.1", gio="3 tháng 7",
  spouses=[S("Trương Thị Thưởng", "1908–2001", "28 tháng 8", "Họ Trương xóm 4 Văn Hàn")])
P("d4-sinh", "d3-5", "Hứa Văn Sinh", gen=4, code="ĐI.2.ĐII.ĐIII.5.ĐIV.2", life="…–1945", gio="10 tháng 10",
  spouses=[S("Vũ Thị Tách", "1921–2001", "28 tháng 8", "họ Trương xóm 4 Văn Hàn (như tài liệu)")],
  issue="Vợ ông là \"Vũ Thị Tách\" nhưng lại ghi \"họ Trương xóm 4 Văn Hàn\", năm mất và ngày giỗ trùng với vợ ông Toán (2001, 28 tháng 8). Có thể do chép nhầm, cần xác nhận.")

# ---- Chi Liệu ----
P("d4-mun", "d3-6", "Hứa Thị Mun", "f", gen=4, married='Lấy chồng họ Lê "Lê Quang Khánh" (họ Lê xóm 4 Văn Hàn)')
P("d4-ry", "d3-6", "Hứa Văn Rỹ", gen=4, life="1928–1985", gio="06 tháng 8",
  spouses=[S("Nguyễn Thị Sáu", "1929–2003", "08 tháng 5", "Họ Nguyễn xóm 4, chi chòa nhà ông Lộng")])
P("d4-co", "d3-6", "Hứa Văn … (chú Cò con)", gen=4, life="Mất năm 6 tuổi")

for p in people:
    if p.get("adopted"):
        p["note"] = (p.get("note", "") + " Con nuôi.").strip()

meta = {
    "title": "Gia phả họ Hứa",
    "origin": "Làng Kênh (nay là thôn Ký Con, Đông Xuân, Đông Hưng, Thái Bình); chi họ Hứa định cư tại Văn Hàn, Thái Hưng, Thái Thụy, Thái Bình.",
    "sourceNotes": [
        "Dữ liệu chép lại từ file \"Cơ sở dữ liệu xây dựng gia phả họ Hứa\" (docx). Một số lỗi chính tả rõ ràng (ví dụ \"Hứa Vă\" → \"Hứa Văn\", \"thangs\" → \"tháng\") đã được sửa.",
        "Số điện thoại chép từ tài liệu gốc. Các số 11 chữ số đầu 0167 đã được nhà mạng đổi sang đầu 0367 từ năm 2018; trang hiện cả số cũ và số mới.",
        "Cụ Hứa Văn Hiệp có ba vợ, cụ Hứa Văn Tiêm có hai vợ, ông Hứa Văn Thành có hai vợ; tài liệu không ghi rõ con nào của bà nào.",
        "Cuối tài liệu có mục \"Hứa Văn Tường\" lặp lại và một dòng \"Hứa Thị Quản (許 氏 管)\" không rõ vị trí; mục lặp được bỏ qua.",
        "Phần \"Tham khảo tự điển Hán Việt cổ đại\" ở cuối tài liệu được đưa vào mục Chú giải chữ Hán."
    ],
}
glossary = [
 ["鄧","Đặng","Họ Đặng"],["賢","Hiền","Người tài đức, hiền đức"],["直","Trực","Trung trực, thẳng thắn"],
 ["字","Tự","Tên tự, tên chữ"],["號","Hiệu","Tên hiệu"],["慈","Từ","Hiền, lành, từ thiện"],
 ["蕙","Huệ","Hoa huệ, hoa lan; người con gái có đức độ tốt"],["望","Vọng","Danh vọng"],
 ["養","Dưỡng","Nuôi, nuôi nấng; có thể dùng làm tên chữ của từ Nuôi"],["勰","Hiệp","Hòa hợp (thường dùng để đặt tên người)"],
 ["認","Nhận","Biết, nhận rõ, bằng lòng, công nhận"],["躡","Niếp","Đi theo"],["蓮","Liên","Cây sen, hoa sen"],
 ["志","Chí","Chí hướng, họ Chí"],["義","Ngãi","Việc nghĩa, tình nghĩa; tên chữ của từ Ngãi"],["範","Phạm","Họ Phạm"],
 ["盛","Thịnh","Thịnh vượng, phồn vinh, đẹp đẽ, phong phú, họ Thịnh"],
 ["暝","Mịnh","Mặt trời lặn, hoàng hôn; dùng để nói lái từ Minh (tránh phạm húy)"],
 ["喜","Mừng / Hỉ","Vui mừng, hoan hỉ"],["惷","Xuân","Mùa xuân, xuân tươi, trẻ trung, họ Xuân"],
 ["長","Trường","Dài, lâu dài, mãi mãi"],["勝","Thắng","Được, thắng, tốt đẹp"],
 ["清","Thanh","Trong sạch, liêm khiết, thanh liêm, họ Thanh"],["梅","Mai","Cây hoa mai, hoa mai, quả mơ, họ Mai"],
 ["","Nhớn","Con cả (chữ Hán không hiển thị được trong tài liệu gốc)"],["秭","Tỉ","Một triệu triệu (1.000.000.000.000)"],
 ["坦","Thản","Bằng phẳng, phẳng phiu, thẳng thắn"],["穌(蘇)","Tô","Sống lại, tỉnh lại, cây tía tô"],
 ["恬","Điềm","Yên tĩnh, thản nhiên"],["員","Vân","Dùng làm tên người"],["瑳","Tha","Vẻ lộng lẫy, đẹp rực rỡ"],
 ["微","Vi","Nhỏ, bé, mầu nhiệm, tinh tế"],["竇","Đậu","Họ Đậu"],["明","Minh","Sáng, người sáng suốt hiền minh"],
 ["湉","Điềm","Nước phẳng lặng"],["𢴾","Bơi","Bơi"],["祥","Tường","Tốt lành, phúc lành, họ Tường"],
 ["子","Tý","Ngôi đầu của mười hai chi: năm Tý, tuổi Tý"],["宥","Hựu","Khoan dung, tha thứ, rộng rãi sâu xa"],
 ["瑰","Côi","Một thứ đá đẹp kém hơn ngọc; đặc biệt, lạ, hiếm có. Mai côi (玫瑰): ngọc đỏ, hoa hồng"],
 ["許 氏 管","Hứa Thị Quản",""],
]
ids = {p["id"] for p in people}
for p in people:
    assert p.get("parent") is None or p["parent"] in ids, p
assert len(ids) == len(people)
json.dump({"meta": meta, "people": people, "glossary": glossary}, open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
print(len(people), "people")
