# 長期知識與需求

## 使用情境

- 使用者需比較兩份 Palo Alto 防火牆 XML 設定檔。
- 目標使用者可不安裝 Node.js；優先交付直接開啟的 `index.html` 離線版。
- XML 僅在本機瀏覽器解析，不應傳送到外部服務。

## 不可省略的需求

- 比對範圍依 `比對項目.csv` 的 36 個分類。
- A/B XML 可選擇 vSys 或 Panorama Device Group 範圍。
- 支援差異篩選、狀態篩選、搜尋與 Excel 匯出。
- `CONFIG/` 含測試用 XML，絕不可上傳至 GitHub。
- README 與操作文件採繁體中文。

## MGT Permitted IP 規則

- XML 路徑內 `<permitted-ip>` 到 `</permitted-ip>` 的所有 `<entry name="IP/網段">` 都必須列出。
- 每一個 entry name 是一筆獨立參數，而不是只統計差異數量。
- 畫面須能看見 A、B 主機各自全部 Permitted IP；缺少的一端以 `—` 表示。
- 不應以「Permitted IP 白名單筆數」作為單獨資訊欄。

## 顯示規則

- `onlyA` / `onlyB` 不可只顯示「存在」；必須顯示實際設定欄位和值。
- 表格要提供簡短的主要差異描述，例如常見 IP 由哪個值改為哪個值。
- 左側第 11 項「Object 差異總表」與第 22 項「Policy差異總表」需以黑色、粗體、斜體顯示。
- 「僅看差異」的核取方塊與文字需緊鄰，不能受搜尋輸入框的固定寬度影響而遮擋。
- 頁首顯示最後編輯時間；頁尾固定顯示 `Powered by Jeff.wang`。

## 維護注意事項

- 離線版依賴 `lib/xlsx.full.min.js` 進行 Excel 匯出；移動或發佈時必須與 `index.html` 一起保留。
- React 版和離線版若同時保留，調整比較規則時應同步檢查兩者。
- 密碼、金鑰與 community 等敏感值需遮罩後再顯示或匯出。
