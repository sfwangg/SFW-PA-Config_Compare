# 工作紀錄

## 2026-07-20

- 建立 React/Vinext 網頁，完成 PA XML A/B 上傳、36 類比對、範圍選擇、差異表格與 Excel 匯出。
- 改用 SheetJS `xlsx` 產生 Excel 報表。
- 依 `需修正項目.txt` 擴充設備與 HA、系統、Network Profiles、Interface、Routing Table 等規則。
- 建立操作手冊、README、系統設計與專案知識文件。

## 2026-07-21

- 修正 MGT `permitted-ip`：每個 `entry@name` 都成為獨立比較參數，並顯示 A/B 兩端完整 IP/網段清單。
- 修正僅存在 A/B 的結果列，改顯示實際欄位和值。
- 增加各分類的主要差異摘要。
- 在左側導覽突出 Object 與 Policy 差異總表。
- 加入最後編輯時間與 `Powered by Jeff.wang` 頁尾。
- 新增免 Node.js 的離線版 `index.html` 與本機 `lib/xlsx.full.min.js`；已檢查離線版 JavaScript 語法。
- 修正離線版「僅看差異」核取方塊的寬度與文字間距，避免文字遭遮擋。
- 將第 11 項 Object 差異總表與第 22 項 Policy差異總表調整為黑色、粗體、斜體。
