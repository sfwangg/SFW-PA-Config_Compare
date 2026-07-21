# 工作紀錄

> 最後編輯時間：2026-07-21 22:37
> 維護規則：每次修改本文件內容後，須同步更新上述最後編輯時間。

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
- 新增 Security Rules 的「隱藏補充指令」開關；同時套用至本頁 Excel 匯出。
- Routing Table、Interface、Address、Service 改為依名稱／物件分組呈現。
- 確認 Address-Group member 以排序後結果比較，不因成員順序不同而顯示差異。
- MGT 存取設定新增從 `<mgt-config><users>` 擷取的管理人員清單，並以 `mgt-config.users` 欄位逐筆比較。
- 將第 11 項 Object 差異總表與第 22 項 Policy差異總表調整為黑色、粗體、斜體。
- 更新最後編輯時間為 `2026-07-21 15:59`。
- Security Rules 改為 Rule Name 分組的橫向檢視；支援欄位拖曳、忽略指定 member 欄位與狀態醒目標示。
- 每條 Security Rule 下方新增依 A/B 差異產生的 B 設備 PA CLI；敏感欄位僅提示人工設定。
- 新增「下載本頁 Excel」，會匯出目前分類及畫面篩選後的資料與 Security Rules CLI。
