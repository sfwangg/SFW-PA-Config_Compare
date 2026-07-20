# PA 防火牆設定檔比較工具 — 設計與實作文件

> 版本：v1.0　建立日期：2026-07-20
> 目標：開發一個網頁工具，上傳兩份 Palo Alto (PA) 防火牆 XML 設定檔，依「比對項目.csv」定義的 36 個項目逐一比對，對每個參數差異提供明確說明，並可下載 Excel 格式的比對結果。

---

## 1. 需求摘要

| 需求 | 說明 |
|------|------|
| 輸入 | 兩份 PA 防火牆 XML 設定檔（約 550–600 KB／檔，含 740+ 位址物件、153 服務、96 靜態路由等） |
| 比對範圍 | 「比對項目.csv」定義之 36 個項目（設備/HA、MGT、系統、Network Profiles、介面、路由、VPN、物件、政策…） |
| 差異呈現 | 每一參數的差異須有**明確文字說明**（新增 / 移除 / 變更、舊值→新值） |
| 輸出 | 網頁即時檢視 + **下載 Excel（.xlsx）** 比對結果 |
| 使用情境 | **主要：雙機 (A/B) 設定核對**；兼顧稽核完整性 |

### 已確認關鍵決策（2026-07-20 需求方回覆）
| # | 議題 | 決策 | 對設計的影響 |
|---|------|------|--------------|
| 1 | 主要使用情境 | **雙機 A/B 核對** | A/B 對等呈現、方向以 hostname 標示；不假設「舊→新」。順序差異視為正常（雙機規則順序可不同），以「提示」而非「錯誤」呈現 |
| 2 | Panorama / 多 vsys | **需支援** | 解析器需迭代多 device-group / 多 vsys；UI 提供 vsys/device-group 選擇器；路徑一律用「尾段相對搜尋」不寫死 |
| 3 | Excel 呈現 | **每一物件/參數逐一列出，差異處提示** | 全量輸出（非僅差異）；每項目獨立分頁；狀態欄 + 差異處填色/圖示標記 |
| 4 | 稽核範圍 | **完整稽核，保留「相同」項目** | `same` 狀態也輸出至畫面與 Excel；畫面預設可切換「只看差異／全部」 |
| 5 | 報表語言 | **僅繁體中文**（不需雙語） | 說明樣板單一語系，簡化實作 |

### 資料敏感性（關鍵設計前提）
PA 設定檔內含 **管理者密碼雜湊 (`phash`)、內網 IP、VPN 金鑰、SNMP community** 等高度敏感資訊。
→ **設計原則：檔案內容絕不離開使用者電腦。** 採「純前端（Client-side）」架構，所有解析與比對都在瀏覽器記憶體內完成，不經任何伺服器。

---

## 2. 架構選型

### 建議方案：純前端單頁應用（Client-side SPA）

```
┌─────────────────────────────────────────────────────────┐
│                     瀏覽器 (單一 HTML)                     │
│                                                           │
│  [檔案A] [檔案B] ──► FileReader ──► DOMParser (XML)        │
│                                        │                  │
│                                        ▼                  │
│                          ┌──────────────────────┐         │
│                          │   Extractors (36)     │  每個項目一個 │
│                          │  XML → 正規化資料模型  │  擷取器      │
│                          └──────────┬───────────┘         │
│                                     ▼                      │
│                          ┌──────────────────────┐         │
│                          │   Diff Engine         │  逐鍵比對    │
│                          │  A vs B → 差異清單      │  產生說明    │
│                          └──────────┬───────────┘         │
│                                     ▼                      │
│              ┌──────────────┬───────────────────┐         │
│              ▼              ▼                   ▼         │
│         畫面渲染        Excel 匯出         摘要儀表板       │
│         (分頁表格)      (SheetJS)         (差異統計)        │
└─────────────────────────────────────────────────────────┘
```

**優點**
- 資料零外流，符合資安需求（可離線、可在隔離網段使用）。
- 部署簡單：單一 `index.html`（或少量靜態檔），可直接以檔案開啟或放內部靜態站台。
- 無伺服器維運成本。

**技術棧**
| 用途 | 選型 | 理由 |
|------|------|------|
| XML 解析 | 瀏覽器內建 `DOMParser` | 免外部依賴、效能足夠 |
| Excel 匯出 | [SheetJS (xlsx)](https://sheetjs.com) 或 ExcelJS | 純前端產生 .xlsx；需多分頁/樣式時用 ExcelJS |
| UI | 原生 JS + 少量框架（Vue 3 / React 皆可，或純 JS） | 資料量中等，原生即可；團隊熟 Vue/React 再用 |
| 表格/篩選 | 原生 table + 自寫篩選，或 Tabulator/AG-Grid | 大表（政策/物件）需排序、篩選、搜尋 |
| 打包 | 可選 Vite | 需模組化開發時採用；否則單檔內嵌 |

### 備選方案：Python 後端（僅在需要伺服器端批次/存檔時採用）
- Flask/FastAPI + `lxml` 解析 + `openpyxl` 產 Excel。
- 缺點：敏感檔案需上傳伺服器，需額外資安控管（傳輸加密、暫存清除、存取權限）。
- **除非有「集中式報表存檔」或「排程批比對」需求，否則不建議。**

> 本文件後續以**純前端方案**為主軸撰寫。

---

## 3. PA XML 結構對照（36 項目 → 解析路徑）

實測範例檔的根結構：`config` → `mgt-config` / `shared` / `devices/entry/{network, deviceconfig, vsys}`。
物件（address/service…）在 **shared** 與 **vsys/entry** 皆可能出現，需兩處合併。以下 XPath 以 `devices/entry` 為 `DEV`、`vsys/entry` 為 `VSYS` 簡寫。

| # | 項目 | 主要路徑（相對於 `config`） | 比對粒度 |
|---|------|------------------------------|----------|
| 1 | 設備&HA資訊 | `DEV/deviceconfig/system/hostname`、`.../ip-address`、`.../high-availability` | 單值欄位逐項 |
| 2 | MGT存取設定 | `mgt-config/users/entry`、`mgt-config/password-complexity`、`DEV/deviceconfig/system/{permitted-ip, service, ssh}` | 帳號清單 + 參數 |
| 3 | 系統設定 | `DEV/deviceconfig/system/{timezone, dns-setting, ntp-servers, snmp-setting, update-schedule}`、`shared/log-settings` | 參數逐項 |
| 4 | Network Profiles | `DEV/network/profiles/{interface-management-profile, zone-protection-profile, monitor-profile}` | 具名物件 |
| 5 | Interface對應表 | `DEV/network/interface/{ethernet, loopback, vlan, tunnel}` | 介面→IP/zone/comment |
| 6 | Routing Table | `DEV/network/virtual-router/entry/routing-table/ip/static-route/entry` | 每路由：destination/nexthop/metric |
| 7 | IKE Crypto Profiles | `DEV/network/ike/crypto-profiles/ike-crypto-profiles/entry` | 加密/hash/dh/lifetime |
| 8 | IPSec Crypto Profiles | `DEV/network/ike/crypto-profiles/ipsec-crypto-profiles/entry` | 同上 |
| 9 | IKE Gateway | `DEV/network/ike/gateway/entry` | peer/介面/認證 |
| 10 | IPSec Tunnel | `DEV/network/tunnel/ipsec/entry` | 綁定/proxy-id |
| 11 | Object 差異總表 | （彙總 12–21 的統計） | 統計 |
| 12 | Address | `shared/address/entry` + `VSYS/address/entry` | ip-netmask/fqdn/range |
| 13 | Address-Group | `.../address-group/entry` | static member / dynamic filter |
| 14 | Service | `.../service/entry` | protocol/port |
| 15 | Service-Group | `.../service-group/entry` | members |
| 16 | Schedule | `.../schedule/entry` | 時段 |
| 17 | Tag | `VSYS/tag/entry` | color/comment |
| 18 | Application | `shared/application/entry` + `VSYS/application/entry` | 自訂應用 |
| 19 | Application-Group | `.../application-group/entry` | members |
| 20 | Custom-URL | `.../profiles/custom-url-category/entry` | URL 清單/type |
| 21 | External-List | `.../external-list/entry` | URL/type/recurring |
| 22 | Policy差異總表 | （彙總 23–36 的統計） | 統計 |
| 23 | Security Rules | `VSYS/rulebase/security/rules/entry` | 依 rule 名比對全欄位 |
| 24 | Security順序 | 同上，比對 entry 出現順序 | 序列差異 |
| 25 | NAT Rules | `VSYS/rulebase/nat/rules/entry` | 全欄位 |
| 26 | NAT順序 | 同上，順序 | 序列差異 |
| 27 | QoS Rules | `VSYS/rulebase/qos/rules/entry` | 全欄位 |
| 28 | QoS順序 | 同上，順序 | 序列差異 |
| 29 | App-Override Rules | `VSYS/rulebase/application-override/rules/entry` | 全欄位 |
| 30 | App-Override順序 | 同上，順序 | 序列差異 |
| 31 | PBF Rules | `VSYS/rulebase/pbf/rules/entry` | 全欄位 |
| 32 | PBF順序 | 同上，順序 | 序列差異 |
| 33 | Decryption Rules | `VSYS/rulebase/decryption/rules/entry` | 全欄位 |
| 34 | Decryption順序 | 同上，順序 | 序列差異 |
| 35 | DoS Rules | `VSYS/rulebase/dos/rules/entry` | 全欄位 |
| 36 | DoS順序 | 同上，順序 | 序列差異 |

> 註：實際檔案若為 Panorama 匯出或含多 vsys / device-group，路徑需再加一層迭代。程式應以「找出所有符合尾段路徑的節點」而非寫死單一絕對路徑，以增加相容性。

---

## 4. 比對引擎設計

### 4.1 三種比對型態

依項目性質分成三類處理，讓每個項目掛對應的比較器 (comparator)：

1. **單值/參數型（Scalar）**：#1 #2 #3 #7 #8 等。
   - 正規化成 `{ 欄位路徑: 值 }` 的扁平字典，逐鍵比對。
   - 例：`ntp-servers.primary = 10.1.1.1` vs `10.1.1.2`。

2. **具名物件型（Keyed collection）**：#4~#21、#23 #25 #27 #29 #31 #33 #35。
   - 以 `entry@name`（或 uuid）為主鍵，建成 `Map<name, 正規化物件>`。
   - 對每個 name 判定：**只在A（移除）／只在B（新增）／兩邊皆有但內容不同（變更）／相同**。
   - 「變更」時再逐欄位 diff，列出每個不同欄位的舊值→新值。

3. **順序型（Sequence）**：#24 #26 #28 #30 #32 #34 #36。
   - 取兩邊 rule 名稱的有序清單，比對序列。
   - 呈現：位置變動（rule X 由第 5 條移到第 8 條）、僅存在於單邊者標註。
   - 演算法：以 LCS（最長共同子序列）找出穩定序，其餘標記為 moved/added/removed。

### 4.2 正規化（Normalization）— 準確比對的關鍵
PA XML 有多值 `<member>` 清單、巢狀結構、順序無意義的集合，直接比字串會誤判。正規化規則：

- **member 清單**：轉為陣列；若語意上無序（如 source/destination 位址集合）→ **排序後比對**，避免順序造成假差異；比對政策「規則順序」時才保留原順序。
- **巢狀單值**：攤平為 dotted key（如 `protocol.tcp.port`）。
- **布林/預設值**：`yes/no`、缺省欄位統一填預設，避免「未設定 vs 明確設 no」被當差異（可設為選項）。
- **忽略欄位**：`uuid`、`phash`（密碼雜湊，資安上不比對內容只比對「有無變更」）、時間戳記等可加入忽略清單。

### 4.3 差異物件資料模型
每筆差異統一結構，方便渲染與匯出：

```js
{
  item: 23,                 // 比對項目編號
  category: "Security Rules",
  key: "Deny 01",           // 物件名稱 / 參數路徑
  field: "destination",     // 差異欄位（物件型才有）
  status: "changed",        // added(僅B) | removed(僅A) | changed | moved | same
  valueA: ["H_10.53.124.67", "..."],
  valueB: ["H_10.53.124.67"],
  description: "目的位址移除 1 筆：H_10.53.128.58"  // 明確人話說明；same 時為「一致」
}
```

> **完整稽核（決策 #4）**：`same` 為第一級狀態，會完整產出至畫面與 Excel。每個物件、每個參數欄位皆逐列輸出（決策 #3），差異列才加色彩/圖示提示，一致列以灰階呈現。這使報表可作為「逐參數核對清單」，稽核者不需回頭比對原始檔。

> **雙機情境（決策 #1）**：A/B 為對等關係，`added`/`removed` 僅表示「只在 A / 只在 B」，不隱含新舊；欄位方向一律以檔案 hostname 標示。順序差異 (`moved`) 以中性「提示」呈現。

### 4.4 差異說明（description）產生規則
「每一參數差異必須要有明確說明」是核心需求。說明由**樣板 + 值差**自動組出：

| status | 說明樣板 | 範例 |
|--------|----------|------|
| added | `新增 {category}「{key}」` | 新增 Address「H-10.1.1.5」（10.1.1.5/32） |
| removed | `移除 {category}「{key}」` | 移除 Service「tcp-8080」 |
| changed（單欄） | `{key} 的 {field}：{valueA} → {valueB}` | tcp-80 的 protocol.tcp.port：80 → 8080 |
| changed（清單） | `{field} 新增 N 筆 / 移除 M 筆：…` | destination 移除 1 筆：H_10.53.128.58 |
| moved | `{key} 順序：A 第 {i} 條 / B 第 {j} 條` | Rule「Allow-Web」順序：A 第 3 條 / B 第 7 條 |
| same | `一致` | tcp-80 的 protocol.tcp.port：一致（80） |

- 清單型差異進一步拆成「新增成員 / 移除成員」明列，讓稽核者不需自行比對。
- **雙機用語（決策 #1）**：`added`/`removed` 說明用「僅存在於 B / 僅存在於 A」等中性描述，避免「新增/刪除」暗示先後。
- **完整稽核（決策 #4）**：`same` 也產生說明列，欄位與差異列一致，確保逐參數皆有紀錄。

---

## 5. UI 設計

### 版面
```
┌──────────────────────────────────────────────────────────┐
│  PA 防火牆設定比較工具                    [下載 Excel 報表] │
├──────────────────────────────────────────────────────────┤
│  來源 A: [選擇檔案] 1150706_DCSSG_189.xml  (hostname/版本)  │
│  來源 B: [選擇檔案] 10.63.180.53.xml       (hostname/版本)  │
│  vsys/DG: A[vsys1 ▾]  B[vsys1 ▾]   (多 vsys/Panorama 時)   │
│                                          [ 開始比對 ]      │
├──────────────────────────────────────────────────────────┤
│  摘要儀表板：  總差異 128 │ 新增 40 │ 移除 22 │ 變更 66     │
│  各項目差異數量長條 / 卡片                                  │
├──────────────────────────────────────────────────────────┤
│  左側：36 項目導覽（顯示各項差異數徽章）                     │
│  右側：選定項目的差異明細表                                 │
│        [僅顯示差異] [搜尋] [狀態篩選: 新增/移除/變更]        │
│  ┌────────┬────────┬──────────┬──────────┬──────────────┐ │
│  │ 名稱    │ 欄位    │ A 值      │ B 值      │ 差異說明      │ │
│  └────────┴────────┴──────────┴──────────┴──────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### 互動重點
- **色彩標示**：僅存在於B=綠、僅存在於A=紅、變更=橙、相同=灰。
- **完整稽核預設（決策 #4）**：預設**顯示全部（含相同）**，提供「只看差異」快速切換；相同列灰階弱化，差異列高亮。
- **A/B 標籤**：讀取後自動顯示各檔 hostname 與版本（`config@version`）；雙機情境下方向以 hostname 標示，欄位標題直接用 hostname 取代「A/B」。
- **vsys/DG 選擇（決策 #2）**：檔案含多 vsys 或 Panorama device-group 時，於上方提供 A、B 各自的下拉選擇；預設自動配對同名 vsys，可手動改綁定。
- **搜尋/篩選**：物件與政策表可能上百列，需即時搜尋、狀態篩選、只看差異。
- **大表效能**：政策/位址表採虛擬滾動或分頁（如 AG-Grid / Tabulator）。
- **展開細節**：政策變更列可展開，並排顯示 A/B 全欄位（highlight 差異欄）。

---

## 6. Excel 匯出設計

使用 **ExcelJS**（支援樣式，本案採此）。輸出檔名：`PA比對_{A hostname}_vs_{B hostname}_{日期}.xlsx`。

依決策 #3、#4，Excel 採 **「每項目獨立分頁 + 每參數逐列全量輸出 + 差異處提示」** 的完整稽核格式。

### 分頁規劃（每項目一頁，共約 36+3 頁）
| 分頁 | 內容 |
|------|------|
| 封面/摘要 | 兩檔資訊（hostname、版本、檔名）、比對時間、vsys/DG 綁定、**各項目 相同/差異 統計表**（含相同數） |
| Object 差異總表 (#11) | 各物件類別 僅A/僅B/變更/**相同** 數量 |
| Policy 差異總表 (#22) | 各政策類別 僅A/僅B/變更/**相同** 數量 |
| #1 設備&HA … #36 DoS順序 | **每個項目各一個分頁**，逐物件逐參數完整列出（含相同列） |

### 明細欄位（每分頁一致）
`類別 | 名稱/物件 | 參數(欄位) | 狀態 | {A-hostname} 值 | {B-hostname} 值 | 差異說明`
- 物件型：每個物件的每個參數欄位各一列（如一個 Address 展開 name/type/value/tag 多列），完整呈現。
- A/B 欄標題直接用各自 hostname，符合雙機情境。

### 樣式與提示（差異處提示 — 決策 #3）
- **整列填色**：僅B=綠、僅A=紅、變更=橙、相同=無色/淺灰。
- **差異儲存格再強調**：變更列的 A、B 值儲存格加粗＋較深底色，並於狀態欄加「⚠ / ●」圖示，讓差異點一眼可辨。
- **相同列（決策 #4）**：仍完整輸出，狀態欄標「一致」，弱化樣式（淺灰字）以利閱讀但保留稽核紀錄。
- 每頁首列凍結、套用 AutoFilter（可就地篩「僅看差異」）、欄寬自動、狀態欄凍結。
- 摘要頁對每個項目分頁建立超連結，方便跳轉。

> 若後續希望減少分頁數，可保留「摘要＋兩總表」不變，將 36 項明細合併為單頁並增設「項目」欄；預設仍採每項目獨立分頁以符合逐項稽核需求。

---

## 7. 實作計畫（分階段）

### Phase 0：骨架與 I/O（0.5 天）
- 單頁 HTML；雙檔上傳、`FileReader` + `DOMParser`；讀取後顯示 hostname/版本。
- 建立「路徑工具」：以尾段相對路徑搜尋節點、合併 shared+vsys、entry→物件轉換。

### Phase 1：比對引擎核心（1–1.5 天）
- 三個通用比較器：Scalar / KeyedCollection / Sequence。
- 正規化模組（member 排序、攤平、忽略清單、預設值）。
- 差異物件模型 + description 產生器。

### Phase 2：擷取器（Extractors）逐項接上（2–3 天）
- 依第 3 節對照表，為 36 項各寫一個 extractor，回傳正規化資料 + 指定比較器型態 + 該項要比對的欄位清單。
- 建議先做高價值項目：#1 設備/HA、#12 Address、#14 Service、#23 Security Rules、#6 Routing，再補齊其餘。
- 總表 (#11 #22) 由其他項目結果彙總。

### Phase 3：UI 與渲染（1.5–2 天）
- 摘要儀表板、項目導覽（差異徽章）、明細表、搜尋/篩選/只看差異、政策展開並排檢視。

### Phase 4：Excel 匯出（0.5–1 天）
- 摘要 + 兩張總表 + 明細；狀態填色、AutoFilter、凍結列。

### Phase 5：驗證與強化（1 天）
- 用 CONFIG/A-VER 與 B-VER 實測**雙機 A/B 核對**主情境。
- 邊界：檔案非 PA XML、單 vsys/多 vsys、**Panorama 匯出（pre/post-rulebase）**、空區段、超大檔效能。
- 驗證完整稽核輸出（相同項目齊全）與 Excel 差異提示樣式正確。

**預估總工時：約 7–10 個工作天（單人）。**

### 建議專案結構
```
/PA設定比較
  index.html
  /src
    io.js            # 讀檔、DOMParser、hostname/版本
    xpath-utils.js   # 節點搜尋、shared+vsys 合併、entry→obj
    normalize.js     # 正規化、忽略清單、member 排序
    comparators.js   # Scalar / Keyed / Sequence
    describe.js      # 差異說明樣板
    extractors/      # 36 個項目擷取器（可分檔）
    diff-engine.js   # 串接 extractor → comparator → 差異清單
    ui.js            # 渲染、篩選
    export-excel.js  # ExcelJS 匯出
  /lib               # exceljs.min.js（或以 CDN/內嵌）
  /CONFIG            # 測試檔（A-VER / B-VER）
```

---

## 8. 邊界情況與注意事項

- **多 vsys / Panorama（決策 #2，必須支援）**：
  - 不寫死絕對路徑；以「所有符合尾段」的節點迭代。
  - Panorama 匯出檔結構為 `config/devices/entry/device-group/entry/*` 與 `config/shared/*`，物件與 rulebase 在 device-group 下（含 `pre-rulebase`/`post-rulebase` 兩段，需分別比對並標示）；防火牆本機檔則在 `vsys/entry` 下。解析器需同時支援兩種佈局。
  - UI 提供 A、B 各自的 vsys / device-group 下拉選擇；預設自動配對同名，允許手動改綁定（雙機情境常見 vsys 名相同）。
  - 掃描時列出檔案中所有 vsys/DG 供選擇；shared 層物件與所選 vsys/DG 合併為「有效集合」再比對。
- **shared vs vsys 物件同名**：需標明來源；比對時以「有效物件」為準（vsys 覆寫 shared）或分開比對，需與需求確認。
- **member 無序集合**：務必排序後比對，否則政策位址順序不同會產生大量假差異。
- **敏感欄位**：`phash`、預共享金鑰等只比對「是否變更」，不在畫面/Excel 顯示明碼。
- **順序比對**：與「規則內容比對」分離為兩個項目（CSV 已如此設計），內容比對忽略順序、順序比對專責序列。
- **效能**：600KB XML、上千物件，DOMParser 與 Map 比對於現代瀏覽器 < 1 秒；大表渲染才是瓶頸 → 虛擬滾動。
- **編碼**：確認 XML 為 UTF-8；讀檔以 UTF-8 解析避免中文說明亂碼。
- **可設定的忽略清單**：提供 UI 讓使用者勾選忽略欄位（如 uuid、log-setting），提高稽核彈性。

---

## 9. 需求決策紀錄（已確認，2026-07-20）

| # | 議題 | 決策 |
|---|------|------|
| 1 | 使用情境 | **雙機 A/B 核對**為主（A/B 對等、以 hostname 標示方向，順序差異中性提示） |
| 2 | Panorama / 多 vsys | **需支援**（含 device-group 的 pre/post-rulebase；UI 提供 vsys/DG 選擇） |
| 3 | Excel 呈現 | **每一物件/參數逐一列出**、每項目獨立分頁、**差異處加色彩＋圖示提示** |
| 4 | 稽核範圍 | **完整稽核**：保留「相同」項目於畫面與報表 |
| 5 | 報表語言 | **僅繁體中文** |

後續開發若遇新歧義（如 shared 與 vsys 同名物件覆寫的呈現方式），於此表續補。
```
