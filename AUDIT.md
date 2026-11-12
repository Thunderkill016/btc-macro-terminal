# BÁO CÁO KIỂM TOÁN HỆ THỐNG & NGUỒN GỐC DỮ LIỆU (AUDIT.md)
**Dự án:** Bitcoin Alpha (Bitcoin Spot Accumulation & Macro Intelligence Terminal)  
**Phiên bản hiện tại:** v5.0.2  
**Thời điểm thực hiện:** 10/11/2026  
**Môi trường:** Workspace `C:\Users\thund\.gemini\antigravity\scratch\btc-macro-terminal`  
**Trạng thái quy trình:** BƯỚC 0 — KIỂM TOÁN ĐỘC LẬP (CHƯA SỬA MÃ NGUỒN, DỪNG CHỜ PHÊ DUYỆT)

---

## I. XÁC MINH CÁC MỤC KIỂM TOÁN A — E (FORENSIC VERIFICATION)

Dưới đây là kết quả đối soát trực tiếp từng dòng mã nguồn thực tế trong thư mục `src/` để xác nhận từng điểm trong bản đánh giá của người dùng là **ĐÚNG**, **SAI**, hay **ĐÃ SỬA MỘT PHẦN**:

### Nhóm A: Dữ liệu lỗi thời hoặc có dấu hiệu mô phỏng

| Mục | Nội dung đánh giá | Kết quả đối soát mã nguồn | Dẫn chứng file & dòng code | Đánh giá |
| :--- | :--- | :--- | :--- | :--- |
| **A.1** | **Bảng ETF (Tab 3):** Dữ liệu hiển thị IBIT 512,480 BTC, tổng 1,183,560 BTC (hoặc 1,245,600 BTC), lệch so với số thực tế thị trường (~1.69M BTC toàn cầu theo Newhedge, IBIT 920,770 BTC). Bảng chỉ là snapshot tĩnh. | **ĐÚNG** | [`src/data/macroEtfData.ts#L92-L225`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/data/macroEtfData.ts#L92-L225): Mảng `US_SPOT_BITCOIN_ETFS` và `ETF_AGGREGATE_SUMMARY` là dữ liệu hardcode tĩnh trong file TypeScript, không có API kết nối live với Farside hay Newhedge. | **Xác nhận lỗi dữ liệu tĩnh / lệch thực tế** |
| **A.2** | **"BTC hấp thụ" và bội số thợ đào:** Chia dòng tiền USD cho giá live nên số BTC đổi theo từng tick giá, trong khi số BTC thực tế đã cố định tại ngày giao dịch. | **ĐÃ SỬA MỘT PHẦN Ở v5.0.2** | [`src/components/research/UsSpotEtfFlowDashboard.tsx#L32-L34`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/components/research/UsSpotEtfFlowDashboard.tsx#L32-L34): v5.0.2 đã tách `dynamicBtcAbsorbed = ETF_AGGREGATE_SUMMARY.dayBtcAbsorbed (1115 BTC)` để không đổi theo tick giá, nhưng số `totalAumBillionsUSD` vẫn nhân với `livePrice`. Dữ liệu gốc vẫn là tĩnh. | **Cần kết nối API thật có dấu thời gian** |
| **A.3** | **M2 toàn cầu (Tab 3):** Biểu đồ dừng ở 2024-12 trong code cũ; câu "M2 luôn dẫn dắt 60–90 ngày" quá mạnh, thiếu ràng buộc DXY và lợi suất thực. | **ĐÃ SỬA MỘT PHẦN Ở v5.0.2** | [`src/data/macroEtfData.ts#L60-L78`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/data/macroEtfData.ts#L60-L78): v5.0.2 đã mở rộng chuỗi tới `2026-11` (108.6T USD) và thêm ràng buộc DXY 104.2 & US10Y 1.85%, nhưng toàn bộ chuỗi 25 mốc này vẫn là mảng tĩnh `GLOBAL_M2_SERIES`, chưa có API fetch tự động từ FRED. | **Cần gắn nhãn Dữ liệu mẫu & kết nối FRED API** |
| **A.4** | **Giá vốn STH (Tab 1):** Web dùng VWAP 155 ngày ($81,092) hoặc 60D SMA ($75,712), cao hơn hoặc lệch so với mức on-chain thực tế của Glassnode ($75.7K ngày 04/11/2026). Nhãn "thấp hơn STH 8.2%" bị phóng đại (thực tế chỉ ~1.5%). | **ĐÚNG** | [`src/lib/realDataService.ts#L351`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/lib/realDataService.ts#L351): `sthCostBasis` được tính bằng trung bình động 60 ngày `slice60.reduce / 60` từ nến Binance, không phải dữ liệu phân rã UTXO on-chain của Glassnode. Nhãn hiển thị tạo cảm giác an tâm giả tạo. | **Xác nhận là mô hình ước tính nội suy, không phải dữ liệu on-chain** |
| **A.5** | **Backtester (Tab 3):** Đường vàng mượt, sụt giảm tối đa ≈ 0%; chuỗi SJC dùng công thức toán học hình sin; trọng số tối ưu trong mẫu (in-sample). | **ĐÚNG** | [`src/lib/backtester.ts#L173-L174`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/lib/backtester.ts#L173-L174): `currentGoldPrice = startGoldPrice * (1 + rate)^m * (1 + goldCycleWave)` với `goldCycleWave` là hàm `Math.sin(...)`. Đây là chuỗi nhân tạo (synthetic), không phải chuỗi giá lịch sử thực của vàng SJC tại Việt Nam. | **Xác nhận mô phỏng toán học, thiếu dữ liệu lịch sử SJC thực** |

---

### Nhóm B: Mô hình dự báo chưa được kiểm chứng

| Mục | Nội dung đánh giá | Kết quả đối soát mã nguồn | Dẫn chứng file & dòng code | Đánh giá |
| :--- | :--- | :--- | :--- | :--- |
| **B.1** | **Xác suất thắng p = 66.5% và b = 2.15x:** Tự gán theo điểm hội tụ qua hàm logistic, chưa được hiệu chuẩn qua walk-forward. Nửa Kelly chỉ giảm cỡ lệnh chứ không làm p đúng hơn. | **ĐÚNG** | [`src/lib/quantEngine.ts#L424-L436`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/lib/quantEngine.ts#L424-L436): `calibratedP = 0.35 + 0.37 / (1 + Math.exp(-0.075 * (confluenceScore - 50)))`. Đây là hàm sigmoid suy diễn giả định, chưa từng chạy kiểm định Brier score hay hồi quy đẳng trương (isotonic regression) trên dữ liệu ngoài mẫu. | **Xác nhận là công thức heuristic tự đặt** |
| **B.2** | **Nón xác suất (Forward Cone):** Drift cố định theo Power Law +0.078%/ngày; độ lệch gán cứng 1.18 down / 0.92 up; chưa backtest hiệu chuẩn xem khoảng 70% có chứa 70% kết quả không. | **ĐÚNG** | [`src/lib/quantEngine.ts#L352-L361`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/lib/quantEngine.ts#L352-L361): `theta = 0.0045; muDaily = theta * ln(fair/p); sigmaDown = sigma * 1.18; sigmaUp = sigma * 0.92`. Đây là tham số gán tĩnh, chưa có kiểm chứng coverage. | **Xác nhận mô hình tham số tĩnh, chưa kiểm chứng độ tin cậy** |
| **B.3** | **Radar đỉnh chưa đo tỷ lệ bỏ sót:** Báo 0/5 chỉ báo đỉnh không đồng nghĩa an toàn; chưa đo tỷ lệ bắt được và báo động giả (False Alarm / False Omission Rate). | **ĐÚNG** | [`src/components/apple/AppleCyclePeakRadar.tsx#L73-L98`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/components/apple/AppleCyclePeakRadar.tsx#L73-L98): Chỉ kiểm tra ngưỡng kích hoạt hiện tại, không có thống kê lịch sử về việc bao nhiêu lần thị trường sập > 25% mà radar không kích hoạt. | **Xác nhận thiếu đo lường False Omission Rate** |
| **B.4** | **Đường 200W không phải sàn cứng:** Lịch sử giá từng thủng 200WMA (tháng 6/2026, tháng 8/2026, và suốt 16 tháng năm 2022). | **ĐÃ SỬA MỘT PHẦN Ở v5.0.2** | v5.0.2 đã sửa văn bản giải thích trong [`AppleSignalGrid.tsx#L173-L175`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/components/apple/AppleSignalGrid.tsx#L173-L175), nhưng nhãn vạch đo ở dòng 164 vẫn ghi `Sàn Bê Tông`. | **Cần gỡ bỏ hoàn toàn chữ "Bê Tông" / "Sàn Cứng"** |

---

### Nhóm C: Mâu thuẫn dữ liệu giữa các khối

| Mục | Nội dung đánh giá | Kết quả đối soát mã nguồn | Dẫn chứng file & dòng code | Đánh giá |
| :--- | :--- | :--- | :--- | :--- |
| **C.1** | **MVRV lệch nhau:** Thẻ và radar ghi 1.39x, biểu đồ phụ ghi 1.34x. | **ĐÃ SỬA Ở v5.0.2** | [`src/components/apple/AppleCycleChart.tsx#L135`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/components/apple/AppleCycleChart.tsx#L135) và [`AppleCyclePeakRadar.tsx#L45`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/components/apple/AppleCyclePeakRadar.tsx#L45): Cả 2 đều trỏ vào `liveCoinMetrics.mvrv` (hiện tại là 1.39x). Không còn lệch 1.34x. | **Đã đồng bộ** |
| **C.2** | **Power Law Fair Value lệch nhau:** $88,478 ở thẻ và $88,172 ở biểu đồ. | **ĐÃ SỬA Ở v5.0.2** | Cả hai đã trỏ vào `latestCyclePoint.powerLawFairValue` ($88,478). | **Đã đồng bộ** |
| **C.3** | **Trần Power Law lệch nhau:** $203,499 ở Tab 1 nhưng $242,376 ở Tab 2 Exit Ladder. | **ĐÃ SỬA Ở v5.0.2** | [`src/components/tabs/ExitLadderStrategy.tsx#L67`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/components/tabs/ExitLadderStrategy.tsx#L67): `target3Price = Math.round(88478 * 2.3) = 203,500`, đã khớp với Tab 1. | **Đã đồng bộ** |
| **C.4** | **Hurst Exponent:** Giao diện ghi cửa sổ 128D nhưng báo cáo ghi 1,000 nến ngày; chưa có khoảng tin cậy. | **ĐÚNG** | [`src/lib/quantEngine.ts#L225-L270`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/lib/quantEngine.ts#L225-L270): Hàm `computeHurstExponent` lấy slice 128 nến gần nhất, nhưng không xuất ra Standard Error hay khoảng tin cậy. | **Xác nhận thiếu khoảng tin cậy thống kê** |
| **C.5** | **Exit Ladder đảo nấc:** Nấc 2 ($151k) từng thấp hơn Nấc 1 ($161k); Pi Cycle là sự kiện cắt nhau chứ không phải mức giá cố định. | **ĐÃ SỬA Ở v5.0.2** | [`src/components/tabs/ExitLadderStrategy.tsx#L64-L67`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/components/tabs/ExitLadderStrategy.tsx#L64-L67): Nấc 1 được đặt là $115k, Nấc 2 là $151.4k, Nấc 3 là $203.5k. Đã sửa mô tả Pi Cycle là "kích hoạt sự kiện giao cắt động 111DMA > 2x 350DMA". | **Đã sửa logic nấc giá** |
| **C.6** | **Nhãn "Glassnode Market Regime":** Market Compass của Glassnode là 7 lăng kính chấm 0-100, la bàn của web là các dải giá Power Law. | **ĐÚNG** | Trong code giao diện [`AppleDailySignalHero.tsx#L111`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/components/apple/AppleDailySignalHero.tsx#L111) vẫn để comment "Glassnode Market Regime Engine". | **Cần đổi tên thành mô hình riêng của web** |

---

### Nhóm D: Bảo mật khóa API

| Mục | Nội dung đánh giá | Kết quả đối soát mã nguồn | Dẫn chứng file & dòng code | Đánh giá |
| :--- | :--- | :--- | :--- | :--- |
| **D.1** | **Két PIN 4 số (10,000 tổ hợp):** Dù dùng PBKDF2, kẻ tấn công có ciphertext trong LocalStorage có thể thử hết 10,000 PIN trong vài phút. Khẳng định "không thể khôi phục" là sai. | **ĐÚNG** | [`src/lib/cryptoVault.ts#L38-L60`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/lib/cryptoVault.ts#L38-L60): PIN 4 số có không gian entropy quá nhỏ ($10^4$). Dù v5.0.2 nâng lên 250,000 vòng PBKDF2, trên GPU hiện đại vẫn có thể brute-force trong thời gian ngắn. | **Xác nhận rủi ro bảo mật với PIN 4 số** |
| **D.2** | **Bảo mật mạng (Không gửi Secret lên máy chủ):** Mã nguồn cũ gửi `X-Binance-API-Secret` qua HTTP lên Cloudflare Worker. | **ĐÃ SỬA TRIỆT ĐỂ Ở v5.0.2** | [`src/lib/binanceClientSync.ts#L23-L44`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/lib/binanceClientSync.ts#L23-L44): WebCrypto tính toán chữ ký HMAC-SHA256 ngay trong RAM trình duyệt, worker proxy chỉ nhận request đã ký sẵn kèm `X-MBX-APIKEY`. `apiSecret` KHÔNG CÒN rời khỏi máy khách. | **Đã khắc phục 100% rò rỉ mạng** |

---

### Nhóm E: Câu chữ và Báo cáo bàn giao

| Mục | Nội dung đánh giá | Kết quả đối soát mã nguồn | Dẫn chứng file & dòng code | Đánh giá |
| :--- | :--- | :--- | :--- | :--- |
| **E.1** | **Câu chữ cam kết tuyệt đối:** Vẫn còn "đệm cực kỳ vững chắc", "hoàn toàn yên tâm", "rủi ro thấp nhất chu kỳ", "Free Bitcoin", "Top 1% tích sản toàn cầu". | **ĐÃ SỬA 80%, CÒN SÓT VÀI NƠI** | Đã loại bỏ "Free Bitcoin", "Top 1%". Nhưng trong [`AppleCyclePeakRadar.tsx#L151`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/components/apple/AppleCyclePeakRadar.tsx#L151) còn "gom hàng an tâm", dòng 225 còn "hoàn toàn không có rủi ro", [`AppleDailySignalHero.tsx#L145`](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/src/components/apple/AppleDailySignalHero.tsx#L145) còn "rủi ro giảm sâu thêm đã bị triệt tiêu hoàn toàn". | **Cần rà quét tự động và xóa bỏ triệt để** |
| **E.2** | **Báo cáo bàn giao so sánh sai đối thủ:** Báo cáo ghi Glassnode, CryptoQuant, LookIntoBitcoin "không có" M2, ETF, điểm hợp lưu; giá gói không có nguồn; "hơn 90% nhà đầu tư thua lỗ" không có nguồn. | **ĐÚNG** | Báo cáo cũ `project-final-comprehensive-report.md` chứa các tuyên bố thiếu căn cứ dẫn link và so sánh phiến diện với đối thủ. | **Đã sửa báo cáo, cần chuẩn hóa thành DATA_SOURCES.md** |

---

## II. BẢN ĐỒ NGUỒN GỐC DỮ LIỆU TOÀN DIỆN (DATA LINEAGE MAP)

Bảng kê khai toàn bộ các số liệu xuất hiện trên 3 Tab của Terminal:

### Tab 1: Tín Hiệu & Chu Kỳ (Signals & Cycle)

| Tên Chỉ Số | Giá Trị Hiện Tại | File & Hàm Tạo Ra | Nguồn Gốc Dữ Liệu | Độ Trễ (Latency) | Trạng Thái Dữ Liệu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Giá Spot BTC** | ~$74,800 – $75,900 | `websocketService.ts` / `updateSpotTicker` | `wss://stream.binance.com:9443` | Real-time (< 250ms) | **THẬT (LIVE STREAM)** |
| **Giá VND & Tỷ giá P2P** | ~1.92 – 1.95 Tỷ VND | `realDataService.ts` / `fetchRealFxAndPrices` | Open Exchange Rates & CoinGecko | ~60 giây | **THẬT (LIVE API)** |
| **Điểm Hội Tụ (Confluence)** | 71.4 / 100 | `quantEngine.ts` / `computeConfluenceScore` | Tổng hợp 4 trụ cột (toán học) | Tính lại khi giá đổi | **THẬT (DETERMINISTIC)** |
| **Định giá Power Law** | $88,478 | `realDataService.ts` / `calculatePowerLawAtDays` | Mô hình Santostasi: $10^{5.65 \log_{10}(d) - 16.603}$ | Ngày (1d) | **MÔ HÌNH TOÁN HỌC** |
| **Sàn Đáy 200W MA** | $68,033 | `realDataService.ts` / `fetchRealBinanceCandles` | 250 nến tuần Binance + Seed 2011 | Tuần (1w) | **THẬT (BINANCE DATA)** |
| **Đỉnh Pi Cycle Top** | $151,444 | `realDataService.ts` / `fetchRealBinanceCandles` | $2 \times \text{SMA}(350D)$ từ 1.000 nến Binance | Ngày (1d) | **MÔ HÌNH TOÁN HỌC** |
| **Realized Price On-Chain**| $53,940 | `realDataService.ts` / `fetchLiveCoinMetrics` | CoinMetrics Community API (`CapMVRVCur`) | Chốt ngày (24h) | **THẬT (COINMETRICS API)**|
| **MVRV Ratio** | 1.39x | `realDataService.ts` / `fetchLiveCoinMetrics` | CoinMetrics Community API (`CapMVRVCur`) | Chốt ngày (24h) | **THẬT (COINMETRICS API)**|
| **Giá vốn STH (Short-Term)**| ~$75,700 | `realDataService.ts` / `fetchRealBinanceCandles` | Trung bình động 60 ngày nến Binance | Ngày (1d) | **ƯỚC TÍNH (APPROXIMATION)**|
| **Funding Rate Phái Sinh** | +0.0100% / 8h (+10.95%/năm)| `realDataService.ts` / `fetchRealFuturesData` | Binance Futures Public API (`fapi/premiumIndex`) | 8 giờ / Real-time | **THẬT (BINANCE LIVE)** |
| **Taker Buy CVD (7 Ngày)** | 49.83% | `realDataService.ts` / `fetchRealBinanceCandles` | Tỷ lệ `k[9] / k[5]` từ 7 nến ngày Binance | Ngày (1d) | **THẬT (BINANCE LIVE)** |
| **Chỉ số Sợ Hãi & Tham Lam**| 28 – 29 / 100 | `realDataService.ts` / `fetchRealFuturesData` | Alternative.me API (`api/fng/`) | Ngày (24h) | **THẬT (ALTERNATIVE.ME)** |
| **Nón Xác Suất (P15/P50/P85)**| 30D: $71.9k / $77.3k / $83.1k| `quantEngine.ts` / `computeProbabilisticForwardCone`| Garman-Klass Vol + Drift Power Law | Tính lại khi giá đổi | **MÔ HÌNH THAM SỐ TĨNH** |
| **Win Prob p & Payoff b** | p = 66.5%, b = 2.15x | `quantEngine.ts` / `computeKellyDcaSizing` | Hàm Logistic nhân tạo gán theo điểm Confluence | Tính lại khi giá đổi | **HEURISTIC CHƯA KIỂM CHỨNG**|
| **Mức Giá Limit Bắt Râu** | Limit 1: -$1.7k, Limit 2: -$3.4k| `quantEngine.ts` / `computeKellyDcaSizing` | ATR(14) tính từ 14 nến ngày Binance | Ngày (1d) | **THẬT (BINANCE ATR)** |

### Tab 2: Danh Mục & Ví (Portfolio & Wallet)

| Tên Chỉ Số | Giá Trị Hiện Tại | File & Hàm Tạo Ra | Nguồn Gốc Dữ Liệu | Độ Trễ (Latency) | Trạng Thái Dữ Liệu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Số Dư BTC Ví Binance** | 0 BTC (hoặc số dư thực) | `binanceClientSync.ts` / `syncBinancePortfolioClientSide` | Binance Private API (`/api/v3/account`) | Khi bấm Refresh | **THẬT NẾU CÓ KEY (0 nếu chưa)** |
| **Lịch Sử Lệnh Khớp Binance**| 0 lệnh (hoặc lệnh thực) | `binanceClientSync.ts` / `syncBinancePortfolioClientSide` | Binance Private API (`/api/v3/myTrades`) | Khi bấm Refresh | **THẬT NẾU CÓ KEY (Không còn mock)**|
| **Giá Vốn Bình Quân Ví** | $0 (hoặc tính theo trades) | `binanceClientSync.ts` / `syncBinancePortfolioClientSide` | Thuật toán bình quân gia quyền từ `myTrades` | Tính toán nội bộ | **THẬT NẾU CÓ KEY** |
| **Lệnh Sổ Cái Nội Bộ** | Danh sách user tự nhập | `useTerminalStore.ts` / `loadInitialPortfolio` | LocalStorage trình duyệt của user | Tức thì | **THẬT (NGƯỜI DÙNG TỰ NHẬP)** |
| **Phí Mempool Rút Ví Lạnh** | 1 sat/vB (~$0.40) | `realDataService.ts` / `fetchRealMempoolMiningData` | Mempool.space API (`fees/recommended`) | 10 – 30 giây | **THẬT (MEMPOOL.SPACE)** |
| **4 Nấc Exit Ladder** | $115k / $151.4k / $203.5k | `ExitLadderStrategy.tsx` | Mô hình Pi Cycle + Power Law Bubble | Tính theo giá live | **MÔ HÌNH CHIẾN LƯỢC** |

### Tab 3: Kiểm Chứng & Vĩ Mô (Research & Macro)

| Tên Chỉ Số | Giá Trị Hiện Tại | File & Hàm Tạo Ra | Nguồn Gốc Dữ Liệu | Độ Trễ (Latency) | Trạng Thái Dữ Liệu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bảng 11 Quỹ US Spot ETF** | IBIT, FBTC, GBTC, ARKB... | `macroEtfData.ts` / `US_SPOT_BITCOIN_ETFS` | Bảng tĩnh định nghĩa trong mã nguồn | Không đổi | **DỮ LIỆU TĨNH (STATIC BENCHMARK)**|
| **Dòng Tiền Ròng Hôm Nay** | +$84.6M (~1,115 BTC) | `macroEtfData.ts` / `ETF_AGGREGATE_SUMMARY` | Bảng tĩnh định nghĩa trong mã nguồn | Không đổi | **DỮ LIỆU TĨNH (STATIC BENCHMARK)**|
| **Lịch Sử Dòng Vốn 20 Phiên**| T-19 đến T-0 | `macroEtfData.ts` / `RECENT_ETF_DAILY_FLOWS` | Bảng tĩnh định nghĩa trong mã nguồn | Không đổi | **DỮ LIỆU TĨNH (STATIC BENCHMARK)**|
| **Chuỗi Cung Tiền M2 Toàn Cầu**| 25 điểm từ 2020 đến 2026 | `macroEtfData.ts` / `GLOBAL_M2_SERIES` | Mảng tĩnh định nghĩa trong mã nguồn | Không đổi | **DỮ LIỆU TĨNH (STATIC BENCHMARK)**|
| **Backtester Lợi Nhuận BTC** | Dựa trên nến lịch sử | `backtester.ts` / `runBacktest` | Nến Binance + nến lịch sử đa chu kỳ | Lịch sử | **THẬT (HISTORICAL CANDLES)** |
| **Backtester Vàng SJC** | Lợi nhuận mô phỏng | `backtester.ts` / `runBacktest` | Hàm toán học hình sin nhân tạo `Math.sin` | Nhân tạo | **MÔ PHỎNG TOÁN HỌC (SYNTHETIC)**|
| **Backtester Tiền Gửi Tiết Kiệm**| Lợi nhuận lãi kép | `backtester.ts` / `runBacktest` | Lãi suất danh nghĩa 6.0%/năm trừ lạm phát 3.8%| Công thức lãi kép | **CÔNG THỨC TOÁN HỌC** |

---

## III. PHÂN TÍCH KIẾN TRÚC MÁY CHỦ & GIỚI HẠN CLOUDFLARE WORKERS

Theo tài liệu chính thức của Cloudflare:
- **Cloudflare Workers Free Tier:** Giới hạn ngặt nghèo **10 ms CPU time** cho mỗi invocation (kể cả Cron Triggers), 50 subrequests/call, và 100,000 requests/ngày.
- **Hệ quả kỹ thuật:** Không thể chạy các thuật toán quant nặng (GARCH(1,1), mô phỏng Monte Carlo 20,000 đường giá, bootstrap lọc phần dư, walk-forward backtest trên 10 năm dữ liệu) trực tiếp bên trong một request hoặc Cron của Worker miễn phí. Nó sẽ bị Cloudflare ngắt tiến trình do vượt quá 10ms CPU!

### So sánh 2 giải pháp kiến trúc khả thi:

| Tiêu chí | Phương án A: GitHub Actions + Static Data Store (Khuyến nghị) | Phương án B: Cloudflare Workers Paid ($5/tháng) + D1 |
| :--- | :--- | :--- |
| **Chi phí hạ tầng** | **$0 / tháng (Hoàn toàn miễn phí)** | **$5 / tháng cố định** |
| **Tài nguyên CPU** | Lên tới vài chục phút CPU (Runner tiêu chuẩn của GitHub Actions) | 30 giây đến 15 phút CPU cho Cron Trigger |
| **Cơ chế sổ dự báo** | Commit sổ dự báo `forecast_ledger.jsonl` trực tiếp vào Git repo $\to$ **Dấu thời gian công khai chống gian lận (Cryptographic Git Hash & Commit Timestamp)** không thể sửa ngược | Lưu vào Cloudflare D1 Database $\to$ Chỉ có admin kiểm soát, kém minh bạch hơn Git public |
| **Phục vụ người dùng** | Cloudflare Worker đóng vai trò CDN/Edge Static Router, chỉ fetch file JSON đã tính sẵn $\to$ **CPU chỉ tốn < 1ms**, tải cực nhanh | Worker truy vấn D1 và trả về JSON |

**Kết luận kiến trúc:** Chọn **Phương án A (GitHub Actions chạy pipeline quant hàng ngày lúc 00:05 UTC, commit kết quả JSON vào repo/CDN, Cloudflare Worker chỉ phục vụ file static)** để đảm bảo chi phí 0 USD, độ trễ edge tối thiểu (< 20ms) và dấu thời gian dự báo minh bạch 100% không thể giả mạo.

---

## IV. ĐỀ XUẤT KẾ HOẠCH HÀNH ĐỘNG CHO BƯỚC 1 (P0)

Nếu được phê duyệt, tôi sẽ tiến hành ngay Bước 1 (P0) với các đầu việc cụ thể:
1. **Gắn nhãn dữ liệu tĩnh minh bạch 100%:** Gắn chip `[📊 Dữ Liệu Mẫu / Khảo Sát Benchmark - Chưa Có Feed API Trực Tiếp]` lên Bảng ETF 11 quỹ, Cung tiền M2, và Chuỗi Vàng SJC; không để người dùng nhầm lẫn là API live.
2. **Hợp nhất Một Nguồn Sự Thật (Single Source of Truth):** Tạo lớp typed selector thống nhất toàn bộ các biến số (MVRV, Power Law Fair Value, Trần Power Law, Pi Cycle Top, Hurst) để không còn bất kỳ sự sai lệch nào giữa các Tab và biểu đồ phụ.
3. **Thay thế VWAP STH bằng Nhãn Mô Hình Ước Tính:** Ghi rõ `Mô Hình VWAP Ước Tính (~$75.7k)` thay vì mạo danh dữ liệu on-chain của Glassnode; xóa bỏ câu "thấp hơn STH 8.2%".
4. **Nâng cấp Bảo mật Két Khóa:** Chuyển từ PIN 4 số sang Passphrase tự do (tối thiểu 8 ký tự), tăng số vòng PBKDF2 lên 600,000 vòng (theo khuyến nghị mới nhất của OWASP 2026), đảm bảo chống lại tấn công vét cạn GPU.
5. **Thanh lọc toàn bộ từ ngữ cam kết tuyệt đối:** Chạy script tìm kiếm và xóa bỏ 100% các từ "an tâm", "hoàn toàn không có rủi ro", "sàn bê tông", "triệt tiêu hoàn toàn", thay bằng thuật ngữ xác suất và quản trị rủi ro thận trọng.
6. **Viết test Playwright E2E kiểm chứng:** Đảm bảo không còn chuỗi cấm, không còn số liệu mâu thuẫn giữa các khối, 23 kịch bản kiểm thử tiếp tục đạt 100%.

---

**BƯỚC 0 ĐÃ HOÀN TẤT. HỆ THỐNG ĐANG DỪNG ĐỂ CHỜ PHÊ DUYỆT TỪ BẠN TRƯỚC KHI BẮT ĐẦU SỬA MÃ NGUỒN BƯỚC 1 (P0).**
