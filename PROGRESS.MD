# 工作紀錄

## 2026-07-20：專案建立與第一版完成

- 讀取 `PA防火牆設定比較_設計文件.md` 與 `比對項目.csv`。
- 建立 React／Vinext 網頁專案與純前端 XML 比對介面。
- 實作 A/B XML 上傳、Hostname／版本顯示與 vSys／Device Group 選擇。
- 實作 36 項目導覽、結果摘要、搜尋、狀態篩選、完整稽核顯示與 Excel 匯出。
- 新增安全遮罩，避免將密碼雜湊、金鑰、community 等敏感值直接呈現。

## 2026-07-20：啟動問題修正

- 原 ExcelJS 套件在本機相依性最佳化時無法解析，造成開發服務無法啟動。
- 改用 SheetJS `xlsx` 產生 Excel 報表。
- 確認本機服務可回應 HTTP 200；實際連接埠由開發服務自動選擇，曾使用 `3001`、`3002`。
- 已建立 `PA防火牆設定比較_操作手冊.md`，說明 Windows 上以 `npm.cmd` 執行的方式。

## 2026-07-20：依使用者修正清單補強

- 讀取 `需修正項目.txt`。
- 項目 1：納入 Device 與 HA 子樹設定。
- 項目 2：納入 MGT Permitted IP。
- 項目 3：納入 System、Shared Logging 與 vSys Count。
- 項目 4：修正 Network Profiles 的巢狀 `entry` 搜尋。
- 項目 5：修正 Interface 類別的巢狀 `entry` 搜尋，涵蓋 ethernet／loopback／vlan／tunnel。
- 項目 6：改為擷取 static route entry。

## 2026-07-21：比對結果可讀性與 MGT Permitted IP 補強

- #1、#2、#3 的責任範圍分離，避免整段 `deviceconfig/system` 導致設備、MGT、系統設定重複稽核。
- #2 MGT 的 `permitted-ip` 改為讀取每個直接子節點 `entry@name`。
- 在 #2 中新增 A、B 各自的 Permitted IP 清單，讓每一個 IP／網段可直接查看。
- 移除容易誤導的 Permitted IP 筆數摘要欄；左側差異數維持只表示差異，不代表參數總數。
- 「僅存在 A/B」由單一「存在」狀態改為逐欄位顯示實際設定值。
- 各項目標題下加入「差異摘要」，可自動說明最常見的欄位變更與 A→B 值。
- #11、#22 左側導覽改為粗體黑色，強化兩個彙總項目的辨識度。

## 已知限制

- Dropbox 可能鎖定 `dist` 產物，造成 production build 清理舊產物時失敗；不影響以開發模式啟動與使用。
- Excel 目前可輸出多分頁與篩選範圍，但差異儲存格的進階色彩樣式待加強。
- Panorama pre-rulebase／post-rulebase 尚未完整接入。
- 尚未逐一以四組範例 XML 對 36 項比對結果進行人工驗收。
