# Tách mã nguồn tu tiên thành module chức năng (bản nạp dần)

## Mục tiêu
Bộ này chia mã nguồn gốc `tutien.txt` thành các nhóm theo chức năng thay vì cắt đều theo số ký tự. Nội dung trong các file mã được trích theo từng khoảng dòng liên tục từ nguồn gốc, giữ nguyên thứ tự và văn bản để có thể ghép phục hồi.

## Cách dùng
1. Giải nén ZIP.
2. Mở `MODULE_INDEX.csv` để chọn module theo thứ tự và chức năng.
3. Đưa từng file mã vào hệ thống đang dùng, kèm yêu cầu ở `PROMPT_REFAC_TOI_VI.txt`.
4. Nạp các nhóm nền/dữ liệu trước, rồi các cơ chế game, rồi logic trong `App()`, cuối cùng mới đến JSX/giao diện.
5. Dùng `FUNCTION_INDEX.csv` để tra tên hàm và dòng nguồn; thư mục `function_units/` có bản trích riêng từng hàm để nạp riêng lẻ.

## Lưu ý quan trọng về khả năng build
Đây là **gói phân rã mã nguồn để nạp/tái cấu trúc từng chức năng**, chưa phải dự án React đã tách import/export và build độc lập.

Nguồn ban đầu chứa gần như toàn bộ ứng dụng trong một `App()` rất lớn. Nhiều handler phụ thuộc trực tiếp vào `useState`, `useRef`, `useEffect`, `gameState`, các setter và nhiều hàm khác nằm trong closure của `App()`. Do đó, chuyển nguyên xi một handler sang file `.ts` riêng sẽ gây lỗi biến chưa khai báo hoặc thay đổi vòng đời state. Các file `13`–`33` là các đoạn code trong scope `App()`, còn `34`–`46` là các đoạn JSX con nằm trong `return`; chúng cần được tái cấu trúc thành custom hook/component với dependency hoặc context/props được khai báo rõ trước khi build. Thư mục `function_units/` cung cấp bản trích từng hàm riêng; với hàm nằm trong `App()`, đó vẫn là mã phụ thuộc closure chứ chưa tự chạy độc lập.

Module `27_ai_turn_engine` vẫn rất lớn vì `callGeminiAPI` hiện là một handler khổng lồ chứa nhiều bước xử lý lượt chơi. Không nên tách bằng cách cắt giữa câu lệnh. Cần chia tiếp theo các giai đoạn xử lý có đầu vào/đầu ra xác định và test từng giai đoạn để tránh đổi hành vi.

## Bảo toàn mã nguồn
Các file mã được chia theo các khoảng dòng liên tiếp và không chồng lấn. Chạy `python rebuild_source.py` để ghép lại thành `tutien_rebuilt.txt`; script sẽ kiểm tra hash của kết quả có trùng file gốc không.

## Thứ tự refactor khuyến nghị
- Giai đoạn A: module `01`–`12` (kiểu dữ liệu, dữ liệu tĩnh, helper và luật game).
- Giai đoạn B: tạo `GameState` type/store/context từ state nền của `App()`; thống nhất API cho `gameState` và setter.
- Giai đoạn C: chuyển nhóm handler `15`–`33` thành custom hooks theo từng miền: trang bị, co-op, bản đồ, admin, backup/profile, tửu quán, chiến đấu, NPC, di chuyển.
- Giai đoạn D: tách `callGeminiAPI` ở module `27` thành các hàm nhỏ, giữ thứ tự áp dụng thay đổi state.
- Giai đoạn E: tách JSX `34`–`46` thành component UI riêng và truyền props/context có kiểu.
- Giai đoạn F: kết nối imports/exports, lint/typecheck/build và test luồng chơi chính.

Bộ này không tự sửa thuật toán, dữ liệu game hay lỗi logic của nguồn. Mục đích là tổ chức lại theo chức năng để quá trình tái cấu trúc được kiểm soát, không âm thầm thay đổi nội dung.
