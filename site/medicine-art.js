/* Decorative identity is selected deterministically from a record.
   The atlas never writes or infers ingredients; it only chooses a drawer mark. */
const BOTANICAL_ART={
 banlangen:{label:'板蓝根',sheet:'herbs-v4.png',cols:2,rows:2,cell:0},
 lianqiao:{label:'连翘',sheet:'herbs-v4.png',cols:2,rows:2,cell:1},
 guanghuoxiang:{label:'广藿香',sheet:'herbs-v4.png',cols:2,rows:2,cell:2},
 chenpi:{label:'陈皮',sheet:'herbs-v4.png',cols:2,rows:2,cell:3},
 jinyinhua:{label:'金银花',sheet:'botanical-atlas-v3.png',cols:3,rows:2,cell:1},
 juhua:{label:'菊花',sheet:'botanical-atlas-v3.png',cols:3,rows:2,cell:4},
 mint:{label:'薄荷',sheet:'botanical-atlas-v3.png',cols:3,rows:2,cell:2},
 ginkgo:{label:'银杏',sheet:'botanical-atlas-v3.png',cols:3,rows:2,cell:5},
 chaihu:{label:'柴胡',sheet:'tcm-atlas-a.png',cols:3,rows:2,cell:0},
 huangqin:{label:'黄芩',sheet:'tcm-atlas-a.png',cols:3,rows:2,cell:1},
 danggui:{label:'当归',sheet:'tcm-atlas-a.png',cols:3,rows:2,cell:2},
 baishao:{label:'白芍',sheet:'tcm-atlas-a.png',cols:3,rows:2,cell:3},
 baizhu:{label:'白术',sheet:'tcm-atlas-a.png',cols:3,rows:2,cell:4},
 fuling:{label:'茯苓',sheet:'tcm-atlas-a.png',cols:3,rows:2,cell:5},
 gancao:{label:'甘草',sheet:'tcm-atlas-b.png',cols:3,rows:2,cell:0},
 shudihuang:{label:'熟地黄',sheet:'tcm-atlas-b.png',cols:3,rows:2,cell:1},
 shanyao:{label:'山药',sheet:'tcm-atlas-b.png',cols:3,rows:2,cell:2},
 shanzhuyu:{label:'山茱萸',sheet:'tcm-atlas-b.png',cols:3,rows:2,cell:3},
 moutan:{label:'牡丹皮',sheet:'tcm-atlas-b.png',cols:3,rows:2,cell:4},
 zexie:{label:'泽泻',sheet:'tcm-atlas-b.png',cols:3,rows:2,cell:5}
};
const HERB_RULES=[
 ['banlangen',/板蓝根/],['guanghuoxiang',/广藿香/],['chenpi',/陈皮/],['juhua',/菊花/],
 ['lianqiao',/连翘/],['jinyinhua',/金银花/],['mint',/薄荷/],['ginkgo',/银杏/],
 ['chaihu',/柴胡/],['huangqin',/黄芩/],['danggui',/当归/],['baishao',/白芍/],
 ['baizhu',/白术/],['fuling',/茯苓/],['gancao',/甘草/],['shudihuang',/熟地黄/],
 ['shanyao',/山药|淮山/],['shanzhuyu',/山茱萸|山萸肉/],['moutan',/牡丹皮|丹皮/],['zexie',/泽泻/]
];
// Formula marks are representative ingredient collages, not complete prescriptions.
const FORMULA_RULES=[
 ['连花清瘟',/连花清瘟/,['jinyinhua','lianqiao','banlangen','guanghuoxiang']],
 ['藿香正气',/藿香正气/,['guanghuoxiang','chenpi','baizhu','fuling']],
 ['六味地黄',/六味地黄/,['shudihuang','shanyao','shanzhuyu','moutan','fuling','zexie']],
 ['小柴胡',/小柴胡/,['chaihu','huangqin','gancao']],
 ['逍遥丸',/加味逍遥|逍遥丸/,['chaihu','danggui','baishao','baizhu','fuling','gancao']],
 ['银翘解毒',/银翘解毒/,['jinyinhua','lianqiao','mint','gancao']],
 ['双黄连',/双黄连/,['jinyinhua','huangqin','lianqiao']],
 ['桑菊感冒',/桑菊感冒/,['juhua','mint','gancao']],
 ['四君子',/四君子/,['baizhu','fuling','gancao']],
 ['补中益气',/补中益气/,['chaihu','baizhu','danggui','gancao']],
 ['板蓝根',/板蓝根/,['banlangen']]
];
const TOOL_RULES=[
 ['bandage','创可贴',/创可贴|止血贴/],['iodine','碘伏',/碘伏|碘酊/],['swab','棉签',/棉签/],
 ['gauze','纱布或绷带',/纱布|绷带/],['thermometer','体温计',/体温计|温度计/],['mask','口罩',/口罩/],
 ['alcohol','酒精消毒',/酒精|消毒液|消毒喷雾/],['gloves','医用手套',/手套/],['tape','医用胶带',/胶带|胶布/],
 ['tweezers','镊子',/镊子/],['scissors','医用剪刀',/剪刀/],['coldpack','冷敷袋',/冷敷|冰袋|退热贴/]
];

function medicineMark(m){
 const name=String(m.name||'').trim(),ingredients=String(m.ingredients||'');
 const textMark=()=>({kind:'text',label:name||'药品',text:name.replace(/（.*?）|\(.*?\)/g,'').replace(/缓释胶囊|胶囊|颗粒|口服液|片剂|片|丸|散|膏/g,'').replace(/\s+/g,'').slice(0,4)||'药'});
 if(m.visualMode==='text')return textMark();
 for(const [key,label,test] of TOOL_RULES)if(test.test(name))return {kind:'icon',key,label};
 if(m.category==='其他')return {kind:'icon',key:'medicalbox',label:'医疗用品'};
 if(m.category==='西药')return {kind:'icon',key:'pill',label:'西药'};
 if(m.category==='中成药'){
  for(const [label,test,keys] of FORMULA_RULES)if(test.test(name))return {kind:'formula',label,keys};
 }
 if(m.category==='中药'||m.category==='中成药'){
  for(const [key,test] of HERB_RULES)if(test.test(name))return {kind:'herb',key,...BOTANICAL_ART[key]};
  for(const [key,test] of HERB_RULES)if(test.test(ingredients))return {kind:'herb',key,...BOTANICAL_ART[key]};
 }
 return textMark();
}

function specimenSvg(key,x,y,w,h){
 const a=BOTANICAL_ART[key];if(!a)return '';
 const sx=a.cell%a.cols*512,sy=Math.floor(a.cell/a.cols)*512;
 return `<svg class="formula-specimen" x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${sx} ${sy} 512 512" aria-hidden="true"><image href="assets/${a.sheet}" width="${a.cols*512}" height="${a.rows*512}"/></svg>`;
}
let artSerial=0;
function medicineArt(m){
 const a=medicineMark(m),title=a.kind==='herb'?'图样：'+a.label:a.kind==='formula'?'配方图样（节选）：'+a.label:a.kind==='icon'?'医学图标：'+a.label:'文字标识：'+a.label;
 if(a.kind==='formula'){
  const layouts={1:[[22,12,56,70]],3:[[4,14,44,56],[52,8,44,56],[29,43,44,52]],4:[[5,7,43,48],[52,7,43,48],[5,45,43,48],[52,45,43,48]],6:[[1,3,32,43],[34,3,32,43],[67,3,32,43],[1,45,32,43],[34,45,32,43],[67,45,32,43]]};
  const slots=layouts[a.keys.length]||layouts[4];
  return `<svg class="medicine-art formula-art" role="img" aria-label="${esc(title)}" viewBox="0 0 100 100"><title>${esc(title)}</title>${a.keys.slice(0,slots.length).map((key,i)=>specimenSvg(key,...slots[i])).join('')}</svg>`;
 }
 if(a.kind==='herb'){
  const x=a.cell%a.cols*512,y=Math.floor(a.cell/a.cols)*512,id='specimen-'+(++artSerial);
  return `<svg class="medicine-art botanical-art" role="img" aria-label="${esc(title)}" viewBox="${x} ${y} 512 512"><title>${esc(title)}</title><defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="512" height="512"/></clipPath></defs><image href="assets/${a.sheet}" width="${a.cols*512}" height="${a.rows*512}" clip-path="url(#${id})"/></svg>`;
 }
 if(a.kind==='text')return `<span class="medicine-art word-art" role="img" aria-label="${esc(title)}"><span class="word-seal ${a.text.length>=4?'long-word':''}">${esc(a.text)}</span></span>`;
 const paths={
 pill:'<g><path d="M27 25a17 17 0 0124 0l24 24a17 17 0 01-24 24L27 49a17 17 0 010-24Z" fill="#eef0e7"/><path d="m39 61 24-24"/><path d="M57 31l12 12-24 24-12-12Z" fill="#a6b89f"/><circle cx="31" cy="76" r="10" fill="#d7c7a5"/><path d="M25 76h12"/></g>',
 bandage:'<g transform="rotate(-35 50 50)"><rect x="13" y="32" width="74" height="36" rx="15" fill="#d4bda1"/><rect x="36" y="36" width="28" height="28" rx="4" fill="#f5ede0"/><path d="M23 42h1m-1 8h1m-1 8h1m51-16h1m-1 8h1m-1 8h1" stroke-width="3"/></g>',
 iodine:'<rect x="35" y="13" width="30" height="16" rx="3" fill="#526358"/><path d="M37 29v9c-12 3-14 9-14 17v26c0 6 4 8 9 8h36c5 0 9-2 9-8V55c0-8-2-14-14-17v-9" fill="#a8794b"/><rect x="29" y="49" width="42" height="27" rx="2" fill="#f7f1e5"/><path d="M50 54v17m-8-8h16" stroke="#657b66" stroke-width="4"/>',
 swab:'<g transform="rotate(32 50 50)"><path d="M36 20v61m28-61v61" stroke="#a89370" stroke-width="4"/><rect x="30" y="9" width="12" height="25" rx="6" fill="#fdfbf3"/><rect x="58" y="9" width="12" height="25" rx="6" fill="#fdfbf3"/><rect x="30" y="67" width="12" height="25" rx="6" fill="#fdfbf3"/><rect x="58" y="67" width="12" height="25" rx="6" fill="#fdfbf3"/></g>',
 gauze:'<rect x="19" y="22" width="62" height="58" rx="6" fill="#faf8ef"/><path d="M29 32h42M29 42h42M29 52h42M29 62h42M29 72h42M30 32v40M40 32v40M50 32v40M60 32v40M70 32v40" stroke="#b1b5a6"/>',
 thermometer:'<path d="M43 61V19a7 7 0 0114 0v42a15 15 0 11-14 0Z" fill="#f8f6eb"/><path d="M50 30v42" stroke="#ad7466" stroke-width="4"/><circle cx="50" cy="74" r="7" fill="#ad7466"/><path d="M57 30h7m-7 10h7m-7 10h7"/>',
 mask:'<path d="M24 36C0 20 4 72 24 65m52-29c24-16 20 36 0 29" fill="none"/><path d="M24 29q26-10 52 0v40q-26 20-52 0Z" fill="#dbe8df"/><path d="M32 41h36M32 51h36M32 61h36" stroke="#8da699"/>',
 alcohol:'<path d="M38 14h24v15H38zM34 29h32l7 13v44H27V42z" fill="#eef1e8"/><path d="M33 53h34v24H33z" fill="#b8d5cb"/><path d="M50 58v14m-7-7h14" stroke="#657b66" stroke-width="4"/>',
 gloves:'<path d="M38 81c-9-8-12-18-10-29l3-21c1-5 8-4 8 1v15l2-29c1-5 8-5 8 0v27l3-31c1-5 8-4 8 1v31l3-25c1-5 8-4 8 1v34c0 15-9 26-22 29z" fill="#dfe8df"/>',
 tape:'<circle cx="50" cy="50" r="31" fill="#eee9d9"/><circle cx="50" cy="50" r="14" fill="#fcfbf5"/><path d="M23 65l-9 14 24-5" fill="#eee9d9"/>',
 tweezers:'<path d="M32 15c4 25 8 46 18 70M68 15c-4 25-8 46-18 70M32 15h36" stroke-width="5"/>',
 scissors:'<circle cx="32" cy="70" r="12"/><circle cx="60" cy="70" r="12"/><path d="M40 61l38-43M52 61L22 18" stroke-width="4"/>',
 coldpack:'<rect x="20" y="19" width="60" height="66" rx="10" fill="#dfe9e5"/><path d="M50 31v42M32 42l36 20M68 42L32 62" stroke="#789a91" stroke-width="4"/>',
 medicalbox:'<rect x="18" y="28" width="64" height="55" rx="7" fill="#eef0e7"/><path d="M37 28v-9h26v9M50 41v28M36 55h28" stroke="#6c806c" stroke-width="5"/>'
 };
 return `<svg class="medicine-art medical-art" role="img" aria-label="${esc(title)}" viewBox="0 0 100 100" fill="none" stroke="#736f5e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><title>${esc(title)}</title>${paths[a.key]||paths.medicalbox}</svg>`;
}
