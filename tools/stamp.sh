#!/bin/sh
# Đổi số phiên bản trong index.html để trình duyệt không dùng lại file cũ trong bộ nhớ đệm.
V=$(date +%Y%m%d%H%M)
sed -i -E "s/(\?v=)[0-9a-z]+/\1$V/g; s/APP_VERSION = \"[^\"]*\"/APP_VERSION = \"$V\"/" index.html
echo "$V"
