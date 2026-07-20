# 長期知識與需求紀錄

## 產品定位

- 名稱：PA 防火牆設定比較工具。
- 對象：防火牆維運、資安稽核與雙機 HA 核對人員。
- 主要用途：比較兩份 Palo Alto XML 設定檔，產生可稽核的逐項結果與 Excel 報表。

## 不可違反的需求

1. 報表與介面使用繁體中文。
2. A／B 為對等比較，不以「新增／刪除」暗示任一端是新版本。
3. 完整稽核：一致項目不可省略，畫面與 Excel 都必須保留。
4. 支援多 vSys 與 Panorama Device Group；使用者可選擇 A、B 對應範圍。
5. XML 包含敏感資料，所有解析與比較必須在 client-side 進行；不可上傳、儲存或傳送 XML 內容。
6. 密碼雜湊、VPN 金鑰、SNMP community 等敏感內容不可明文顯示。
7. Excel 需要摘要及各項目明細，且應能清楚辨別差異。
8. 僅存在 A 或 B 的設定必須顯示該端的實際參數與值；不可只顯示「存在」。

## 比對項目

需求來源為 `比對項目.csv`，共 36 項：設備／HA、MGT、系統、Network Profiles、Interface、Routing、VPN、Object、Policy 與六種政策的順序比對。

## 近期追加需求

需求來源為 `需修正項目.txt`：

- 項目 1 要完整檢查 HA 的 enabled、mode、group、priority、preemptive、peer、HA1/2/3、Link Monitor、Path Monitor 與 HA netmask。
- 項目 2 必須檢查 Permitted IP。
- 項目 2 的 `permitted-ip` 必須將每個 `<entry name="IP/網段">` 視為獨立參數；畫面必須能直接列出 A、B 各自主機的完整 IP 清單，而非只顯示差異筆數。
- 項目 3 必須涵蓋 Timezone、Update Server、SSL/TLS、vSys Count、DNS、NTP、AAA、SNMP、Syslog、Logging、HIP Match 與指定設定名稱。
- 項目 4 必須涵蓋 Management／Interface Management 的 Services、Permitted IP，及 Zone Protection 的 flood、recon、default 相關設定。
- 項目 5 必須列出 A、B XML 的所有 Interface 設定。

## 名詞約定

- `onlyA`：只存在來源 A。
- `onlyB`：只存在來源 B。
- `changed`：兩端皆存在，但值不同。
- `same`：值相同。
- `moved`：規則在兩端位置不同，是雙機核對提示而非錯誤。
- shared 物件與 vSys／Device Group 同名時，以 scope 內物件優先；此規則應在結果中持續清楚表達。
- 左側的數字是差異筆數，不可被設計成或誤導為單邊參數總數。
- 差異摘要應使用簡短繁體中文，優先說明最常見欄位及其 A→B 值變更，例如 Next Hop IP 的替換。
