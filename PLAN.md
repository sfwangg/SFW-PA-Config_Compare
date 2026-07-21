# 開發計畫

> 最後編輯時間：2026-07-21 22:37
> 維護規則：每次修改本文件內容後，須同步更新上述最後編輯時間。

## 目標

建立可在使用者電腦上直接執行的 Palo Alto 防火牆 XML 設定比較工具。使用者選取兩份 XML 後，即可依 36 個比對項目檢視 A、B 主機設定差異，並輸出 Excel 報表。

## 已完成

- 完成 36 個設定類別的比較流程、差異篩選、關鍵字搜尋與 Excel 匯出。
- 支援 XML 內的 vSys 與 Panorama Device Group 範圍選擇。
- MGT 存取設定的 `permitted-ip` 以每個 `<entry name="IP/網段">` 為獨立參數比較；A、B 兩端 IP 清單皆會完整列出。
- 僅存在 A 或僅存在 B 時，表格顯示實際設定欄位和值，而非只顯示「存在」。
- 增加每個分類的主要差異摘要。
- 「Object 差異總表」與「Policy差異總表」在左側導覽以黑色粗體斜體標示。
- 新增免安裝離線版：直接雙擊 `index.html` 即可使用，不需 Node.js 或網頁伺服器。
- 頁首顯示程式最後編輯時間，頁尾顯示 `Powered by Jeff.wang`。
- Security Rules 改為 Rule Name 分組的橫向檢視，支援欄位拖曳排序、忽略常見 member 欄位、狀態醒目標示與 B 設備 PA CLI 產生。
- 新增目前分類的單頁 Excel 匯出，會沿用畫面的篩選與忽略設定。
- Security Rules 可隱藏 PA CLI 補充指令；啟用後，單頁 Excel 不會匯出補充指令欄位。
- Routing Table、Interface、Address、Service 已改為依名稱／物件分組的橫向檢視。
- Address-Group 的 member 順序已正規化，不會因排列不同產生差異。
- MGT 存取設定已從 `mgt-config/users/entry@name` 列出並比較管理人員，參數欄位名稱為 `mgt-config.users`。

## 維護原則

1. 比對規則以 `比對項目.csv` 與使用者確認的需求為依據。
2. 新增規則時，要確認巢狀 XML、`entry@name` 集合、遮罩欄位與 A/B 缺失項目都能正確呈現。
3. 離線版 `index.html` 為交付使用的主要入口；`lib/xlsx.full.min.js` 必須與它一併保留。
4. `CONFIG/` 僅存放測試 XML，不得提交至 GitHub。

## 後續建議

1. 以不同 PAN-OS 與 Panorama 匯出檔驗證 36 類規則。
2. 針對大型 XML 的效能與 Excel 報表格式進行實測。
3. 若需新增比對項目，先補充需求與 XML 範例，再調整 React 版與離線版的對應規則。
