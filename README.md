# PA 防火牆設定比較工具

> 最後編輯時間：2026-07-21 22:41
> 維護規則：每次修改本文件內容後，須同步更新上述最後編輯時間。

比較兩份 Palo Alto Networks 防火牆 XML 設定檔的純前端網頁工具，適合雙機 HA 核對、設定稽核與變更檢查。

> XML 設定檔只會在使用者瀏覽器中讀取與比對，不會上傳至任何伺服器。

## 功能

- 上傳兩份 PA XML 設定檔，對等比較來源 A 與來源 B。
- 自動識別 Hostname、設定版本、vSys 與 Panorama Device Group。
- 提供 36 項比對導覽，涵蓋設備／HA、MGT、系統、Network、路由、VPN、物件與政策。
- 支援「一致、變更、僅存在 A、僅存在 B、順序提示」五種狀態。
- 完整稽核模式：保留一致項目，也可切換為僅看差異。
- 支援搜尋與狀態篩選。
- 匯出 Excel：摘要頁與 36 個明細工作表。
- Security Rules 以 Rule Name 分組、參數橫向顯示且可拖曳調整欄位順序；可忽略 `to.member`、`from.member` 與 `profile-setting.group.member`。
- Security Rules 會依 A/B 差異產生對齊 B 設備的 PA CLI；也可將目前篩選的分類下載為單頁 Excel。
- Routing Table、Interface、Address 與 Service 會依名稱／物件合併呈現相關參數；Address-Group 的 member 順序不影響比較結果。
- MGT 存取設定會從 `<mgt-config><users>` 列出管理人員帳號，並逐筆比較 A/B 是否存在。
- 自動遮罩密碼雜湊、金鑰、SNMP community 等敏感資訊。

## 支援的重點範圍

- 設備與 HA：Hostname、管理設定、HA group／介面／監控等設定。
- MGT：帳號與 Permitted IP。
- 系統：Timezone、DNS、NTP、SNMP、Logging、vSys 數量等。
- Network Profiles：Interface Management、Zone Protection、Monitor Profile。
- Interface：Ethernet、Loopback、VLAN、Tunnel。
- Routing：Static Route。
- VPN：IKE/IPSec Crypto Profile、IKE Gateway、IPSec Tunnel。
- Objects：Address、Address Group、Service、Tag、Application、External List 等。
- Policies：Security、NAT、QoS、PBF、Decryption、DoS 與規則順序。

## 免安裝離線版（建議）

直接開啟專案根目錄的 [index.html](./index.html) 即可使用，不需要 Node.js、網頁伺服器或網路連線。

請勿移動或刪除 `lib/xlsx.full.min.js`；此檔案提供離線 Excel 匯出功能。

## 使用環境

- Windows、macOS 或 Linux。
- 支援現代 JavaScript 的瀏覽器，例如 Microsoft Edge、Google Chrome。
- 不需要安裝 Node.js、npm 或啟動本機網頁伺服器。

詳細操作請參閱 [操作手冊](./PA防火牆設定比較_操作手冊.md)。

## 使用方式

1. 在「來源 A」選擇第一份 PA XML。
2. 在「來源 B」選擇第二份 PA XML。
3. 如有多 vSys／Device Group，選擇 A、B 的對應範圍。
4. 點選「開始比對」。
5. 從左側選擇比對項目，利用搜尋或狀態篩選查看結果。
6. 點選「下載 Excel 報表」產生稽核檔案。

## 狀態定義

| 狀態 | 說明 |
|---|---|
| 一致 | A 與 B 的設定值相同。 |
| 變更 | A、B 都有該設定，但內容不同。 |
| 僅存在 A | 設定只存在於來源 A。 |
| 僅存在 B | 設定只存在於來源 B。 |
| 順序提示 | 規則內容不一定不同，但排列位置不同；雙機核對時為提示而非錯誤。 |

## 專案文件

- [設計文件](./PA防火牆設定比較_設計文件.md)
- [操作手冊](./PA防火牆設定比較_操作手冊.md)
- [開發計畫](./PLAN.md)
- [系統架構](./ARCHITECTURE.MD)
- [工作紀錄](./PROGRESS.MD)
- [需求與長期知識](./MEMORY.MD)

## 資安與資料處理

- `CONFIG/` 目錄存放本機測試 XML，已由 Git 排除，不會提交至 GitHub。
- XML 內容不會傳至後端、資料庫或第三方服務。
- 敏感欄位會以遮罩顯示，避免在畫面與 Excel 報表洩漏內容。

## 免責聲明

- 本工具僅供設定檢視、核對與稽核輔助，不構成 Palo Alto Networks 的官方產品、技術支援、設定建議或資安保證。
- 比對結果可能受 XML 匯出範圍、PAN-OS 版本、vSys／Device Group 選擇與工具支援範圍影響；部署、刪除或變更設定前，請由具授權的人員於目標設備完成覆核、備份與測試。
- 使用者應自行負責 XML 設定檔、匯出報表及由其採取的任何操作；作者不對直接或間接損失承擔責任。

## 已知限制與後續規劃

- Panorama 的 `pre-rulebase`／`post-rulebase` 仍需進一步完整擷取。
- Excel 已支援摘要與多工作表；進階儲存格色彩與超連結仍可持續加強。
- 應持續使用不同 PAN-OS 版本與實際設定檔驗證全部 36 項擷取結果。

## 授權

尚未指定授權條款；如需公開發布或供其他團隊使用，請補上適用的 License。
