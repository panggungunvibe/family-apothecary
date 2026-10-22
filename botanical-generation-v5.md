# 中药图谱 V5 生成记录

模式：内置 `imagegen`。项目最终文件：

- `site/assets/tcm-atlas-a.png`（768 × 512，3 × 2）：柴胡、黄芩、当归、白芍、白术、茯苓。
- `site/assets/tcm-atlas-b.png`（768 × 512，3 × 2）：甘草、熟地黄、山药、山茱萸、牡丹皮、泽泻。

图谱使用透明背景、古典本草图谱式水墨与矿物水彩，单元内留出大量空白，供小尺寸抽屉标识使用。浏览器通过 SVG `viewBox` 按单元裁切；原始生成结果为 1536 × 1024，集成时缩小到 768 × 512，以减少移动端负载。

## Atlas A prompt

Use case: scientific-educational. Asset type: transparent botanical specimen sprite atlas for a refined Chinese family apothecary web interface. Create exactly six separate traditional Chinese medicinal botanical ingredient illustrations arranged as a precise 3-column by 2-row atlas. Cell order: 柴胡、黄芩、当归、白芍、白术、茯苓. Delicate antique Chinese materia medica botanical plate, restrained ink and mineral watercolor, scientifically legible silhouettes, elegant and quiet. One centered isolated specimen per cell, generous transparent negative space, consistent scale. No cell borders, labels, text, captions, shadows or frames; six unique specimens.

## Atlas B prompt

Use case: scientific-educational. Asset type: transparent cutout sprite sheet for a mobile medicine cabinet UI. Make exactly six separate small cutout illustrations in an exact 3-column by 2-row grid. Cell order: 甘草、熟地黄、山药、山茱萸、牡丹皮、泽泻. Delicate antique Chinese medicinal botanical cutouts, restrained ink with soft mineral watercolor, recognizable at thumbnail size. One isolated specimen per cell filling about 55 percent of its cell. No gradient, color wash, vignette, halo, glow, shadows, white rectangle, borders, labels, text or frames.

这些插画是装饰性收纳标识，不是经过药材鉴定的科学图版。
