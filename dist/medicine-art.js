/* Display identity is derived from the record, never from legacy random plant indices.
   Botanical drawings are decorative; these rules do not infer a drug's formula. */
const BOTANICAL_ART={
 banlangen:{label:'板蓝根',sheet:'herbs-v4.png',cols:2,rows:2,cell:0},
 lianqiao:{label:'连翘',sheet:'herbs-v4.png',cols:2,rows:2,cell:1},
 guanghuoxiang:{label:'广藿香',sheet:'herbs-v4.png',cols:2,rows:2,cell:2},
 chenpi:{label:'陈皮',sheet:'herbs-v4.png',cols:2,rows:2,cell:3},
 jinyinhua:{label:'金银花',sheet:'botanical-atlas-v3.png',cols:3,rows:2,cell:1},
 juhua:{label:'菊花',sheet:'botanical-atlas-v3.png',cols:3,rows:2,cell:4},
 mint:{label:'薄荷',sheet:'botanical-atlas-v3.png',cols:3,rows:2,cell:2},
 ginkgo:{label:'银杏',sheet:'botanical-atlas-v3.png',cols:3,rows:2,cell:5}
};
const HERB_RULES=[['banlangen',/板蓝根/],['guanghuoxiang',/广藿香/],['chenpi',/陈皮/],['juhua',/菊花/],['lianqiao',/连翘/],['jinyinhua',/金银花/],['mint',/薄荷/],['ginkgo',/银杏/]];
const TOOL_RULES=[['bandage','创可贴',/创可贴/],['iodine','碘伏',/碘伏|碘酊/],['swab','棉签',/棉签/],['gauze','纱布',/纱布|绷带/],['thermometer','体温计',/体温计|温度计/],['mask','口罩',/口罩/]];
function medicineMark(m){
 const name=String(m.name||'').trim(),ingredients=String(m.ingredients||'');
 const textMark=()=>({kind:'text',label:name||'药品',text:name.replace(/（.*?）|\(.*?\)/g,'').replace(/缓释胶囊|胶囊|颗粒|口服液|片剂|片|丸|散|膏/g,'').replace(/\s+/g,'').slice(0,4)||'药'});
 if(m.visualMode==='text')return textMark();
 for(const [key,label,test] of TOOL_RULES)if(test.test(name))return {kind:'icon',key,label};
 // Synthetic medicines never acquire a botanical image from a name fragment.
 if(m.category==='西药')return textMark();
 if(m.category==='中药'||m.category==='中成药'){
  // Match specific plant names on the label first, then explicitly entered ingredients.
  // 藿香 is not treated as 薄荷; only the explicit 广藿香 ingredient has an illustration.
  for(const [key,test] of HERB_RULES)if(test.test(name))return {kind:'herb',key,...BOTANICAL_ART[key]};
  for(const [key,test] of HERB_RULES)if(test.test(ingredients))return {kind:'herb',key,...BOTANICAL_ART[key]};
 }
 return textMark();
}
let artSerial=0;
function medicineArt(m){
 const a=medicineMark(m),title=a.kind==='herb'?'图样：'+a.label:a.kind==='icon'?'医学图标：'+a.label:'文字标识：'+a.label;
 if(a.kind==='herb'){
  const x=a.cell%a.cols*512,y=Math.floor(a.cell/a.cols)*512,id='specimen-'+(++artSerial);
  return `<svg class="medicine-art botanical-art" role="img" aria-label="${esc(title)}" viewBox="${x} ${y} 512 512"><title>${esc(title)}</title><defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="512" height="512"/></clipPath></defs><image href="assets/${a.sheet}" width="${a.cols*512}" height="${a.rows*512}" clip-path="url(#${id})"/></svg>`;
 }
 if(a.kind==='text')return `<span class="medicine-art word-art" role="img" aria-label="${esc(title)}"><span class="word-seal ${a.text.length>=4?'long-word':''}">${esc(a.text)}</span></span>`;
 const paths={
 bandage:'<g transform="rotate(-35 50 50)"><rect x="13" y="32" width="74" height="36" rx="15" fill="#d4bda1"/><rect x="36" y="36" width="28" height="28" rx="4" fill="#f5ede0"/><path d="M23 42h1m-1 8h1m-1 8h1m51-16h1m-1 8h1m-1 8h1" stroke-width="3"/></g>',
 iodine:'<rect x="35" y="13" width="30" height="16" rx="3" fill="#526358"/><path d="M37 29v9c-12 3-14 9-14 17v26c0 6 4 8 9 8h36c5 0 9-2 9-8V55c0-8-2-14-14-17v-9" fill="#a8794b"/><rect x="29" y="49" width="42" height="27" rx="2" fill="#f7f1e5"/><path d="M50 54v17m-8-8h16" stroke="#657b66" stroke-width="4"/>',
 swab:'<g transform="rotate(32 50 50)"><path d="M36 20v61m28-61v61" stroke="#a89370" stroke-width="4"/><rect x="30" y="9" width="12" height="25" rx="6" fill="#fdfbf3"/><rect x="58" y="9" width="12" height="25" rx="6" fill="#fdfbf3"/><rect x="30" y="67" width="12" height="25" rx="6" fill="#fdfbf3"/><rect x="58" y="67" width="12" height="25" rx="6" fill="#fdfbf3"/></g>',
 gauze:'<rect x="19" y="22" width="62" height="58" rx="6" fill="#faf8ef"/><path d="M29 32h42M29 42h42M29 52h42M29 62h42M29 72h42M30 32v40M40 32v40M50 32v40M60 32v40M70 32v40" stroke="#b1b5a6"/>',
 thermometer:'<path d="M43 61V19a7 7 0 0114 0v42a15 15 0 11-14 0Z" fill="#f8f6eb"/><path d="M50 30v42" stroke="#ad7466" stroke-width="4"/><circle cx="50" cy="74" r="7" fill="#ad7466"/><path d="M57 30h7m-7 10h7m-7 10h7"/>',
 mask:'<path d="M24 36C0 20 4 72 24 65m52-29c24-16 20 36 0 29" fill="none"/><path d="M24 29q26-10 52 0v40q-26 20-52 0Z" fill="#dbe8df"/><path d="M32 41h36M32 51h36M32 61h36" stroke="#8da699"/>'
 };
 return `<svg class="medicine-art medical-art" role="img" aria-label="${esc(title)}" viewBox="0 0 100 100" fill="none" stroke="#736f5e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><title>${esc(title)}</title>${paths[a.key]}</svg>`;
}
