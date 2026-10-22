# 家庭药箱

百子柜风格、移动端自适应的家庭药品管理站点。药品档案保存在浏览器 `localStorage`，支持按名称搜索、效期筛选、抽屉开启动效与打印小票。

**在线体验：** [family-apothecary-yunjie.ivory-cedar-9569.chatgpt.site](https://family-apothecary-yunjie.ivory-cedar-9569.chatgpt.site/)

> 本项目用于家庭药品信息整理，不提供诊断、处方或用药建议。OCR 结果请始终与药品包装、说明书或医嘱核对。

## 浏览器本地 OCR

照片识别完全在浏览器内运行：

1. 浏览器拍摄或选择药品包装，分别生成识别用高清副本与保存用轻量副本。
2. 首次使用从固定版本 CDN 下载 Tesseract.js、WebAssembly 核心和简体中文/英文文字库，之后由浏览器缓存。
3. Web Worker 在设备本地执行 OCR，不把照片发送到站点 Worker 或模型 API。
4. 本地规则从 OCR 原文中整理药名、分类、成分/配方、生产日期、到期日期、有效期、每日次数、每次用量和包装数量。
5. 未识别字段保持空白，并在确认页标出；用户对照实物包装核对后才能保存。

本地 OCR 不理解医学语义，不根据药名猜配方或用量，也不提供诊疗建议。保存时只保留用户确认过的字段和压缩照片，OCR 原文不会写入档案。

## 图样库

`site/medicine-art.js` 是统一的确定性匹配层，药柜、效期列表和小票共用：

- 中成药：按药名匹配 11 组常用配方标识，包括连花清瘟、藿香正气、六味地黄、小柴胡、逍遥丸、银翘解毒、双黄连、桑菊感冒、四君子、补中益气和板蓝根。复方图仅展示代表性原料，明确标注“配方图样（节选）”，不会自动补写配方字段。
- 中药：按名称或已录入成分匹配 20 味单味图样；未收录时回退到药名文字印记。
- 西药：统一使用胶囊与药片的医学图标，不再用植物图。
- 其他：内置创可贴、碘伏、棉签、纱布/绷带、体温计、口罩、酒精/消毒液、手套、医用胶带、镊子、剪刀和冷敷袋图标；未收录工具回退到通用医疗箱图标。
- 用户可以在编辑表单中强制改为药名文字印记。

植物与配方图样只用于收纳识别，不作药材鉴定或处方依据。新图谱由内置 imagegen 生成，提示词与文件说明见 `botanical-generation-v5.md`。

### 植物图谱预览

图谱原图已收录在 [`site/assets`](site/assets)，运行时会按药名和配方规则裁切、组合成抽屉标识。

| 单味植物图谱 | 基础中药图谱 |
| --- | --- |
| <img src="site/assets/botanical-atlas-v3.png" alt="单味植物图谱" width="420"> | <img src="site/assets/herbs-v4.png" alt="基础中药图谱" width="420"> |

| 中药图谱 A | 中药图谱 B |
| --- | --- |
| <img src="site/assets/tcm-atlas-a.png" alt="中药图谱 A" width="420"> | <img src="site/assets/tcm-atlas-b.png" alt="中药图谱 B" width="420"> |

## 手机端

760px 以下启用底部导航、固定拍照入口、双列抽屉、横向分类、底部录入弹层和安全区适配。320px 窄屏表单降为单列；桌面保持每排五格。植物/配方标本缩为抽屉面积约四分之一，药名黑色签牌与金属圆环扣保持突出。

## 本地构建与验证

源码页面位于 `site/`，构建脚本会将页面和图片嵌入 Cloudflare Worker，并输出 Sites 需要的 `dist/server/index.js`。

```sh
npm run build
npm test
```

运行本地 Worker 预览时可按 Sites 本地预览说明启动。OCR 需要网络首次加载文字识别组件，但照片与识别结果不会上传。

本地 OCR 使用 [Tesseract.js](https://github.com/naptha/tesseract.js) 6.0.1；运行时从 jsDelivr 加载，项目未复制其源码或训练数据。

小票撕边与打印动效参考 [shengyuanshi/daily-receipt-opensource](https://github.com/shengyuanshi/daily-receipt-opensource)，MIT 许可保存在 `site/licenses/daily-receipt-MIT.txt`。

## 开源许可

项目源码按 [MIT License](LICENSE) 开源。第三方组件和参考项目仍遵循各自的许可条款。
