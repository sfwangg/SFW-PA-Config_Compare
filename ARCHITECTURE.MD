# 系統架構與設計

> 最後編輯時間：2026-07-21 22:37
> 維護規則：每次修改本文件內容後，須同步更新上述最後編輯時間。

## 執行模式

系統提供兩種前端入口：

- `index.html`：免安裝離線版。使用瀏覽器的 File API 與 DOMParser，在本機解析 XML；雙擊檔案即可使用。
- React/Vinext 開發版：以 `app/page.tsx` 與 `app/globals.css` 維護，適合後續開發與測試。

兩種模式均在瀏覽器端處理資料，不會上傳 XML 設定檔。

## 呈現與正規化規則

- Routing Table、Interface、Address、Service 與 Security Rules 均可依名稱／物件分組呈現；Security Rules 另提供欄位拖曳與 PA CLI 補充指令。
- XML 的重複 `<member>` 節點先排序再比較，避免 Address-Group 等物件僅因成員順序不同而產生差異。
- MGT 管理人員由 `mgt-config/users/entry@name` 擷取，作為獨立比較列，欄位名稱為 `mgt-config.users`。

## 資料流程

```text
XML A / XML B
  → File API 讀取
  → DOMParser 解析 XML
  → 選取 vSys / Device Group 範圍
  → 將設定正規化為比較列（Row）
  → 判斷一致、變更、僅存在 A、僅存在 B
  → 表格、分類導覽、差異摘要、Excel 匯出
```

## 核心資料列

每一筆比較結果包含：分類編號、分類名稱、物件名稱、參數路徑、狀態、A 值、B 值與差異說明。

狀態定義：

- `same`：兩端設定一致。
- `changed`：兩端都有設定，但值不同。
- `onlyA`：只存在 A；A 欄必須顯示完整實際值。
- `onlyB`：只存在 B；B 欄必須顯示完整實際值。
- `moved`：同一設定因範圍或順序差異而被辨識為位置改變。

## XML 比較策略

- 一般單值設定以 XML dotted path 對照。
- 含多筆物件的集合以 `<entry name="…">` 的 name 為鍵值比對。
- MGT `permitted-ip` 直接把每一個 `<entry name="IP/網段">` 視為一筆參數，因此能分別顯示 A、B 全部 IP/網段。
- 密碼、金鑰、community 等敏感欄位以遮罩值顯示。
- 支援 shared、vSys 與 Panorama Device Group 的設定範圍。

## 主要檔案

| 檔案 | 用途 |
|---|---|
| `index.html` | 使用者直接開啟的離線版程式與介面。 |
| `lib/xlsx.full.min.js` | 離線 Excel 匯出所需的 SheetJS 程式庫。 |
| `app/page.tsx` | React 開發版的比較邏輯與介面。 |
| `app/globals.css` | React 開發版樣式。 |
| `比對項目.csv` | 36 個比較分類的需求依據。 |
| `CONFIG/` | 測試 XML；由 Git 忽略。 |

## 介面設計重點

- 上方提供 A/B XML 上傳、範圍選擇與開始比對。
- 左側顯示 36 個分類與差異數量；第 11、22 類用黑色粗體斜體強調。
- 右側表格提供「僅看差異」、狀態篩選、搜尋與差異摘要。
- Security Rules（#23）採 Rule Name 分組的橫向參數檢視，可拖曳欄位排序、忽略指定 member 欄位，並在每條 Rule 最下方顯示依 A 值產生的 B 設備 PA CLI。
- 工具列提供「下載本頁 Excel」，匯出目前分類與套用中的篩選條件。
- 「僅看差異」核取方塊採自動寬度，避免文字被輸入欄位的固定寬度遮住。
