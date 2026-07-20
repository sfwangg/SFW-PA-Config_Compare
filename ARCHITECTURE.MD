# 系統架構與設計說明

## 架構概覽

本系統為 React／Vite（Vinext）單頁應用程式。所有設定檔在瀏覽器記憶體中透過 `File.text()` 與 `DOMParser` 解析，沒有 API、資料庫或伺服器端 XML 處理流程。

```text
使用者選取 XML A、XML B
        ↓
File API / DOMParser
        ↓
偵測 Hostname、版本、vSys、Device Group
        ↓
擷取器：XML 節點 → 正規化 Map
        ↓
比對器：Scalar / Keyed collection / Sequence
        ↓
Rows（統一結果列）
   ├─ 網頁摘要、項目導覽、篩選表格
   └─ XLSX 匯出：摘要 + 36 個明細工作表
```

## 主要程式

| 檔案 | 職責 |
|---|---|
| `app/page.tsx` | 上傳、XML 解析、擷取、比對、介面狀態與 Excel 匯出。 |
| `app/globals.css` | 響應式版面、狀態色彩與表格樣式。 |
| `app/layout.tsx` | 網頁語系與 Metadata。 |
| `比對項目.csv` | 36 個稽核項目的需求清單。 |
| `需修正項目.txt` | 使用端指定的項目 1 至 5 加強需求。 |
| `CONFIG/` | A/B 測試用 PA XML。 |

## 資料模型

每一筆結果統一為：

```ts
type Row = {
  item: number;
  category: string;
  key: string;
  field: string;
  status: "same" | "changed" | "onlyA" | "onlyB" | "moved";
  valueA: string;
  valueB: string;
  description: string;
};
```

`status` 使用中性語意：`onlyA`／`onlyB` 表示只存在其中一端，不表示新增或刪除的時間順序。

## 比對策略

- Scalar：系統、管理、HA 等設定攤平成 dotted path，逐欄位比較。
- Keyed collection：以 PA XML 的 `entry@name` 為 key，比較每個物件的扁平欄位。
- Sequence：政策規則依名稱比較位置；內容差異與順序差異分開呈現。
- Shared + scope：物件類設定先取 `shared`，再以選取的 vSys／Device Group 覆寫同名物件。
- 敏感欄位：欄位名稱含 `phash`、`key`、`community`、`password` 時，畫面與報表顯示遮罩值。

## XML 範圍

- 設備設定：`devices/entry/deviceconfig`。
- Network：`devices/entry/network`。
- vSys：`devices/entry/vsys/entry`。
- Panorama Device Group：`devices/entry/device-group/entry`。
- 共用物件：`shared`。

目前已特別處理 HA、MGT Permitted IP、系統與 Logging、Network Profiles、所有 Interface 類型及 Static Route。Panorama 的 pre/post rulebase 仍是待補強範圍。

## Excel 設計

採用瀏覽器版 SheetJS (`xlsx`) 建立 `.xlsx`：

- `封面摘要`：來源資訊及每項目結果統計。
- `1-設備&HA資訊` 至 `36-DoS順序`：每項一張工作表。
- 固定欄位：類別、名稱／物件、參數、狀態、A 值、B 值、差異說明。

## 執行方式

Windows PowerShell：

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
```

以終端機輸出的 `Local` 網址開啟工具。詳見 `PA防火牆設定比較_操作手冊.md`。

