const TESSERACT_CDN='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
let localOcrScriptPromise=null,localOcrWorkerPromise=null,localOcrProgress=()=>{};

function loadLocalOcrEngine(){
 if(window.Tesseract)return Promise.resolve(window.Tesseract);
 if(localOcrScriptPromise)return localOcrScriptPromise;
 localOcrScriptPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=TESSERACT_CDN;script.crossOrigin='anonymous';script.referrerPolicy='no-referrer';
  script.onload=()=>window.Tesseract?resolve(window.Tesseract):reject(new Error('本地 OCR 组件未正确加载'));
  script.onerror=()=>reject(new Error('本地 OCR 组件下载失败，请检查网络后重试'));
  document.head.append(script);
 }).catch(error=>{localOcrScriptPromise=null;throw error});
 return localOcrScriptPromise;
}

async function getLocalOcrWorker(onProgress){
 localOcrProgress=onProgress||(()=>{});
 if(!localOcrWorkerPromise){
  localOcrWorkerPromise=loadLocalOcrEngine().then(async Tesseract=>{
   const worker=await Tesseract.createWorker(['chi_sim','eng'],1,{logger:message=>localOcrProgress(message)});
   await worker.setParameters({preserve_interword_spaces:'1'});
   return worker;
  }).catch(error=>{localOcrWorkerPromise=null;throw error});
 }
 return localOcrWorkerPromise;
}

async function recognizeLocally(image,onProgress){
 const worker=await getLocalOcrWorker(onProgress);
 const result=await worker.recognize(image,{rotateAuto:true});
 return {text:result.data.text||'',confidence:Number(result.data.confidence||0)/100};
}

function normalizeOcrText(value){
 const full='０１２３４５６７８９：，。（）／－％';
 const half='0123456789:,()./-%';
 return String(value||'').split('').map(char=>{const i=full.indexOf(char);return i<0?char:half[i]}).join('')
  .replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
function validIsoDate(year,month,day){
 const y=Number(year),m=Number(month),d=Number(day),date=new Date(Date.UTC(y,m-1,d));
 if(date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d)return '';
 return `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function dateIn(value){
 const text=String(value||'');
 let match=text.match(/((?:19|20)\d{2})\s*[年.\/-]\s*(\d{1,2})\s*[月.\/-]\s*(\d{1,2})\s*日?/);
 if(!match)match=text.match(/\b((?:19|20)\d{2})(\d{2})(\d{2})\b/);
 return match?validIsoDate(match[1],match[2],match[3]):'';
}
function labeledSegment(text,labels,max=100){
 const source=labels.map(label=>label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
 const match=text.match(new RegExp(`(?:${source})\\s*[:：]?\\s*([^\\n]{0,${max}})`,'i'));
 return match?match[1].trim():'';
}
function ingredientSegment(text){
 const lines=text.split('\n').filter(Boolean);
 const start=lines.findIndex(line=>/(?:主要)?成[份分]|配方/.test(line));
 if(start<0)return '';
 const first=lines[start].replace(/^.*?(?:主要)?成[份分]\s*[:：]?|^.*?配方\s*[:：]?/,'').trim();
 const values=first?[first]:[];
 for(let i=start+1;i<Math.min(lines.length,start+4);i++){
  if(/^(用法|用量|规格|包装|批准文号|生产|有效期|贮藏|禁忌|注意)/.test(lines[i]))break;
  values.push(lines[i]);
 }
 return values.join('、').replace(/[、,，]{2,}/g,'、').slice(0,500);
}
function medicineNameFrom(text){
 const lines=text.split('\n').map(line=>line.replace(/^[·•*\-\s]+|[·•*\-\s]+$/g,'')).filter(line=>line.length>=2&&line.length<=40);
 const exclusions=/(成[份分]|用法|用量|生产|日期|有效期|规格|批准文号|国药准字|功能主治|禁忌|贮藏|执行标准|厂家|公司|地址|电话)/;
 const suffix=/(胶囊|颗粒|口服液|滴眼液|喷雾剂|混悬液|糖浆|软膏|乳膏|凝胶|贴剂|片|丸|散|膏|碘伏|酒精|棉签|创可贴|绷带|纱布|体温计|口罩|手套|冷敷袋|退热贴)/;
 const candidates=lines.filter(line=>suffix.test(line)&&!exclusions.test(line)).map(line=>({line,score:(suffix.test(line)?10:0)+(line.length<=18?5:0)-(line.match(/\d/g)||[]).length})).sort((a,b)=>b.score-a.score);
 return candidates[0]?.line.replace(/^(药品名称|品名)\s*[:：]?\s*/,'').trim()||'';
}
function extractDose(text){
 const frequency=text.match(/(?:一日|每日|每天)\s*([一二两三四五六七八九十\d]+)\s*次/);
 const dosage=text.match(/每次\s*([一二两三四五六七八九十半\d.]+\s*(?:片|粒|袋|丸|支|贴|滴|毫升|ml|mL|克|g))/);
 return {frequency:frequency?frequency[0]:'',dosage:dosage?dosage[0]:''};
}
function inferLocalCategory(name,hint){
 if(TOOL_RULES.some(([, ,test])=>test.test(name)))return '其他';
 if(FORMULA_RULES.some(([,test])=>test.test(name)))return '中成药';
 if(HERB_RULES.some(([,test])=>test.test(name))&&name.length<=8)return '中药';
 return CATEGORIES.includes(hint)?hint:'中成药';
}
function parseMedicineText(rawText,categoryHint='中成药'){
 const text=normalizeOcrText(rawText),name=medicineNameFrom(text);
 const production=dateIn(labeledSegment(text,['生产日期','制造日期','生产日'],40));
 const expiry=dateIn(labeledSegment(text,['有效期至','失效日期','限用日期','使用期限至'],40));
 const shelf=(text.match(/(?:有效期|保质期)\s*[:：]?\s*((?:\d+|[一二三四五六七八九十]+)\s*(?:个?月|年))/)||[])[1]||'';
 const dose=extractDose(text);
 const spec=labeledSegment(text,['包装规格','规格','包装'],80);
 const quantity=(spec.match(/(?:\d+|[一二三四五六七八九十]+)\s*(?:片|粒|袋|支|瓶|贴|枚|包|盒|板)/)||[])[0]||'';
 const ingredients=ingredientSegment(text);
 const fields={name,ingredients,production,expiry,shelfLife:shelf,frequency:dose.frequency,dosage:dose.dosage,quantity};
 const labels={name:'药品名称',ingredients:'成分/配方',production:'生产日期',expiry:'到期日期',shelfLife:'有效期',frequency:'每日服用次数',dosage:'每次用量',quantity:'库存数量'};
 const uncertainFields=Object.entries(fields).filter(([,value])=>!value).map(([key])=>labels[key]);
 return {...fields,category:inferLocalCategory(name,categoryHint),uncertainFields,warnings:['浏览器本地 OCR 只识别文字，请对照实物包装逐项核对。'],rawText:text};
}
