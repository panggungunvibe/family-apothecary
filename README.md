# 家庭药箱

静态 HTML、CSS、JavaScript 网站。打开 `dist/index.html` 或通过静态服务器运行：

```sh
python3 -m http.server 4173 --directory dist
```

功能：四类百子柜、植物插画展示、抽屉动画、按药名搜索、模拟拍照 OCR、编辑与删除、本地保存、独立效期列表与筛选、手机布局。

第四版：桌面每排五格，恢复带圆形底座的金属环扣、柜顶线脚与抽屉嵌板。植物缩成小型贴花，药签字体增大；手机仍保留两列。独立效期列表、平整打印小票和精简后的页面结构保持不变。

标识匹配由 `dist/medicine-art.js` 统一提供，药柜、效期列表和小票共用。旧的随机 plant 编号保留在记录中但不再用于展示，不修改用户的药名、成分和日期。按实际录入的名称/成分匹配素材；未知成分不猜测，使用药名文字印记。西药使用文字，工具类匹配创可贴、碘伏、棉签、纱布、体温计、口罩线描图标。可在编辑表单手动选择文字模式。相同原料可共享同一图样，不为追求差异制造错误对应。复方展示的是其中一个已录入原料，不代表完整配方。植物插画不是药材鉴定图谱。

对应关系自动测试：`node tests/medicine-art.test.cjs`。

小票撕边与打印动效参考 [shengyuanshi/daily-receipt-opensource](https://github.com/shengyuanshi/daily-receipt-opensource)，保留 MIT 许可于 `dist/licenses/daily-receipt-MIT.txt`。没有接入或复制该项目的个人数据、API 配置或账号集成。旧版托盘资产保留但不再展示。

OCR 当前返回固定模拟数据，不解析上传照片。所有初始药品均为演示资料，用量默认待核对。数据使用当前浏览器 localStorage，未接入云同步或真实 OCR。照片在客户端压缩保存。沿用 localStorage 键与数据结构，更新不重置现有药品。

新版植物素材使用内置 imagegen 生成，最终资产为 `dist/assets/botanical-atlas-v3.png`，1536 × 1024 RGBA，3 列 2 行，每个图样约 512 × 512；并非放大后的伪 4K。按单元用 SVG viewBox 展示。生成记录与提示词见 `botanical-generation.md`。插画仅作装饰，不作植物或药物鉴定依据。

第四版补充资产：`dist/assets/herbs-v4.png`，1254 × 1254 RGBA，2 × 2 图谱，内置 imagegen 生成。包含板蓝根根材、连翘、广藿香、陈皮；提示词见 `botanical-generation-v4.md`。医学图标为项目内的原创 SVG 线描。

后续真实 OCR 接入位置：`dist/app.js` 中的 `scan` 函数。识别结果仍应进入 `editForm` 由用户确认后保存。生产环境密钥应放在服务端，不可嵌入浏览器脚本。
