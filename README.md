# 家庭药箱

静态 HTML、CSS、JavaScript 网站。打开 `dist/index.html` 或通过静态服务器运行：

```sh
python3 -m http.server 4173 --directory dist
```

功能：四类百子柜、植物插画展示、抽屉动画、按药名搜索、模拟拍照 OCR、编辑与删除、本地保存、独立效期列表与筛选、手机布局。

第三版：深色细框、素色平整抽屉面，重新生成清晰的复古植物插画。移除右侧栏、草木手记、备份入口与冗余文案。效期页按到期顺序展示药名、日期和剩余天数；点击仍可打开药品小票。保留吐纸、落纸、锯齿撕边与打印布局，删除纸面折痕、黑色出纸槽与金属托盘。小票可重播动画或使用浏览器打印。系统设置减少动态效果时跳过动画。

小票撕边与打印动效参考 [shengyuanshi/daily-receipt-opensource](https://github.com/shengyuanshi/daily-receipt-opensource)，保留 MIT 许可于 `dist/licenses/daily-receipt-MIT.txt`。没有接入或复制该项目的个人数据、API 配置或账号集成。旧版托盘资产保留但不再展示。

OCR 当前返回固定模拟数据，不解析上传照片。所有初始药品均为演示资料，用量默认待核对。数据使用当前浏览器 localStorage，未接入云同步或真实 OCR。照片在客户端压缩保存。沿用 localStorage 键与数据结构，更新不重置现有药品。

新版植物素材使用内置 imagegen 生成，最终资产为 `dist/assets/botanical-atlas-v3.png`，1536 × 1024 RGBA，3 列 2 行，每个图样约 512 × 512；并非放大后的伪 4K。按单元用 SVG viewBox 展示。生成记录与提示词见 `botanical-generation.md`。插画仅作装饰，不作植物或药物鉴定依据。

后续真实 OCR 接入位置：`dist/app.js` 中的 `scan` 函数。识别结果仍应进入 `editForm` 由用户确认后保存。生产环境密钥应放在服务端，不可嵌入浏览器脚本。
