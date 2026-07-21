# PA 防火牆設定比較工具：操作手冊

本工具用來比較兩份 Palo Alto 防火牆 XML 設定檔。XML 檔只會在使用者的瀏覽器中讀取與比對，不會上傳至外部伺服器。

## 1. 最簡單的使用方式：離線版

直接在檔案總管雙擊 `index.html` 即可開啟工具。此方式不需要安裝 Node.js，也不需要啟動 PowerShell。

請保留同一資料夾內的 `lib/xlsx.full.min.js`，否則 Excel 匯出功能無法使用。

## 2. 開發版使用前準備

### 必要軟體

請先安裝 [Node.js](https://nodejs.org/)，建議使用 LTS 版本（Node.js 22 或更新版本）。安裝後，重新開啟 PowerShell。

### 開啟專案資料夾

在檔案總管開啟以下資料夾：

```text
E:\User\S.F.Wang\Dropbox\AI_project\工具開發\PA設定比較
```

在資料夾空白處按住 `Shift` 並按滑鼠右鍵，選擇「在這裡開啟 PowerShell 視窗」或「在終端機中開啟」。

## 3. 開發版第一次使用：安裝必要元件

在 PowerShell 輸入：

```powershell
npm.cmd install
```

等待安裝完成即可。此步驟通常只需要在第一次使用，或專案的 `package.json` 有更新時執行。

> 為避免 Windows PowerShell 的指令碼執行政策限制，請使用 `npm.cmd`，不要使用 `npm`。

## 4. 啟動開發版網頁

在專案資料夾的 PowerShell 輸入：

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

終端機會出現類似以下訊息：

```text
Local: http://localhost:3001/
```

請在瀏覽器開啟該網址。實際連接埠可能是 `3000`、`3001`、`3002` 或其他數字；**請以終端機顯示的 Local 網址為準**。

啟動後請保持該 PowerShell 視窗開啟。關閉視窗會停止網站服務。

## 5. 執行 XML 比對

1. 在頁面「來源 A」選擇第一份 PA XML 設定檔。
2. 在「來源 B」選擇第二份 PA XML 設定檔。
3. 網頁會讀取檔名、Hostname、設定版本，並偵測可用的 vSys 或 Device Group。
4. 若 XML 有多個 vSys／Device Group，分別選擇要對應比較的 A 與 B 範圍；只有一個時可維持預設值。
5. 點選「開始比對」。
6. 在左側選擇項目 1 至 36，查看每個設定項目的結果。

測試檔案位於：

```text
CONFIG\A-VER\1150706_G_189.xml
CONFIG\B-VER\10.1.110.153.xml
```

## 6. 如何閱讀結果

每筆結果會顯示「名稱／物件、參數、A 值、B 值與差異說明」。A 與 B 為對等比較，不代表新舊版本。

| 狀態 | 意義 |
|---|---|
| 一致 | A、B 的參數值相同。 |
| 變更 | 同一設定在 A、B 都存在，但參數值不同。 |
| 僅存在 A | 設定只存在於來源 A。 |
| 僅存在 B | 設定只存在於來源 B。 |
| 順序提示 | 規則內容可能一致，但在 A、B 的排列位置不同；雙機核對時此項為提示，不代表錯誤。 |

可使用右上方功能縮小結果範圍：

- 「僅看差異」：隱藏一致項目。
- 狀態選單：只顯示指定狀態。
- 搜尋欄：依物件名稱、欄位或說明搜尋。

### Security Rules 專用檢視

選擇第 23 項「Security Rules」時，每個 Rule Name 會獨立成一個區塊，參數以橫向欄位呈現。可拖曳欄位標題調整顯示順序，也可啟用「忽略 to／from／profile 成員」排除 `to.member`、`from.member` 與 `profile-setting.group.member`。

每個 Rule 最下方的「補充指令」會依 A/B 差異產生用於 B 設備的 PA CLI。請先檢閱命令與實際設定，再於 B 設備的 SSH 連線中執行；敏感欄位只會提示人工設定。

## 7. 匯出 Excel

比對完成後，點選右上方「下載 Excel 報表」。

如只需要目前分類，可使用工具列的「下載本頁 Excel」。檔案會套用目前的搜尋、狀態、僅看差異與 Security Rules 忽略欄位設定。

下載的 Excel 包含：

- 封面摘要：來源檔案的 Hostname、版本，以及每項目的參數數量與差異數。
- 36 個比對項目分頁：逐列列出設定／物件與比對結果。
- 狀態、A 值、B 值與差異說明欄位，可在 Excel 中繼續篩選。

檔名格式如下：

```text
PA比對_{A主機名稱}_vs_{B主機名稱}_{日期}.xlsx
```

## 8. 常見問題

### 網頁顯示「無法連線至這個網站」

請確認 PowerShell 視窗仍在執行 `npm.cmd run dev -- --host 127.0.0.1`。若服務已停止，重新執行該指令。

另外，不要固定使用舊網址。例如終端機顯示 `http://localhost:3002/` 時，請開啟 `3002`，不要開啟先前使用過的 `3001`。

### 顯示「Port 3000 is in use」

這不是錯誤。代表 `3000` 已被其他程式使用，工具會自動改用 `3001`、`3002` 等可用連接埠。請開啟終端機顯示的 Local 網址。

### PowerShell 顯示 npm 無法執行或指令碼被停用

請使用以下格式：

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
```

不要省略 `.cmd`。

### 上傳後顯示不是有效的 PA XML

請確認選擇的是 Palo Alto 的 XML 設定匯出檔，根節點應為 `<config>`。文字檔、裝置狀態報告或不完整 XML 不可使用。

### 為何某些敏感值沒有顯示？

為避免敏感資料外洩，密碼雜湊、金鑰、SNMP community 與密碼類欄位會以遮罩呈現；工具仍會比較是否有差異。

## 9. 停止開發版服務

回到執行網站的 PowerShell 視窗，按下：

```text
Ctrl + C
```

看到結束提示後即可關閉 PowerShell 視窗。
