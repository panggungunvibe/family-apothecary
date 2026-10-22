const $=s=>document.querySelector(s);
const CATEGORIES=['中成药','西药','中药','其他'];
const KEY='family-apothecary-v1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function localDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function daysLeft(date){if(!date)return null;return Math.round((new Date(date+'T00:00:00')-new Date(localDate(new Date())+'T00:00:00'))/86400000)}
function status(m){const d=daysLeft(m.expiry);return d===null?'unknown':d<0?'expired':d<=90?'soon':'valid'}
function statusText(m){const d=daysLeft(m.expiry);return d===null?'效期待补充':d<0?`已过期 ${Math.abs(d)} 天`:d===0?'今日到期':d<=90?`${d} 天后到期`:'效期正常'}
function loadMedicines(){
 try{
  const raw=localStorage.getItem(KEY);if(!raw)return [];
  const saved=JSON.parse(raw);if(!Array.isArray(saved))throw Error();
  const clean=saved.filter(m=>!m?.demo&&!String(m?.id||'').startsWith('demo-'));
  if(clean.length!==saved.length)localStorage.setItem(KEY,JSON.stringify(clean));
  return clean;
 }catch{return []}
}
let medicines=loadMedicines();
let view='cabinet',category='全部',statusFilter='all',query='',currentId=null,photo='',ocrPhoto='',scanToken=0,scanTimer=null,openTimer=null,toastTimer;
function persist(next){try{localStorage.setItem(KEY,JSON.stringify(next));medicines=next;return true}catch{toast('保存失败：浏览器存储空间不足，请减少照片大小后重试。');return false}}
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500)}
function filtered(){return medicines.filter(m=>(category==='全部'||m.category===category)&&(statusFilter==='all'||status(m)===statusFilter)&&(!query||m.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())))}
function render(){
 const count=medicines.filter(m=>['soon','expired'].includes(status(m))).length;
 $('#nav-count').textContent=count||'';$('#mobile-nav-count').textContent=count||'';
 document.querySelectorAll('[data-nav]').forEach(b=>{b.classList.toggle('active',b.dataset.nav===view);if(b.dataset.nav===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 $('#page-title').textContent=view==='cabinet'?'希望你常备，但不常用':'效期管理';
 $('#cabinet-view').hidden=view!=='cabinet';$('#expiry-view').hidden=view!=='expiry';
 $('#tabs').innerHTML=['全部',...CATEGORIES].map(c=>`<button class="${category===c?'selected':''}" aria-pressed="${category===c}" data-category="${c}">${c==='全部'?'全部药品':c}</button>`).join('');
 $('#all-status').value=statusFilter;
 const visible=filtered();$('#cabinet-hint').textContent=`${visible.length} 种药品`;
 if(view==='cabinet'){
 let rows='';
 CATEGORIES.forEach((c,i)=>{
  if(category!=='全部'&&category!==c)return;
  const list=visible.filter(m=>m.category===c);if(query&&!list.length)return;
  const cards=list.map(m=>`<button class="drawer" data-id="${esc(m.id)}" aria-label="打开${esc(m.name)}的抽屉"><div class="drawer-display">${medicineArt(m)}</div><div class="drawer-front"><span class="plaque">${esc(m.name)}</span><span class="handle"></span><i class="status-dot ${status(m)}"></i></div></button>`);
  const add=query?'':`<button class="row-add" data-add="${c}" aria-label="在${c}中添加药品">＋<span>添加</span></button>`;
  const content=cards.length?cards.join(''):`<div class="category-empty"><span>暂未收纳药品</span><button data-add="${c}">＋ 添加第一种</button></div>`;
  rows+=`<section class="cabinet-row"><div class="row-category"><small>0${i+1}</small><b>${c}</b>${add}</div><div class="drawer-grid">${content}</div></section>`;
 });
 $('#cabinet').innerHTML=rows;$('#empty').hidden=!!rows;
 }else{
  $('#expiry-summary').textContent=`${visible.length} 种药品`;
  $('#expiry-list').innerHTML=[...visible].sort((a,b)=>(daysLeft(a.expiry)??Infinity)-(daysLeft(b.expiry)??Infinity)).map(m=>`<button class="expiry-item" data-id="${esc(m.id)}"><span class="expiry-medicine"><span class="expiry-thumb">${medicineArt(m)}</span><span><strong>${esc(m.name)}</strong><small>${esc(m.category)}</small></span></span><time>${esc(m.expiry||'未填写')}</time><span class="expiry-count ${status(m)}">${remaining(m)} <i>↗</i></span></button>`).join('');
  $('#empty').hidden=!!visible.length;
 }
 const results=$('#search-results');results.hidden=!query||view!=='cabinet';results.innerHTML=query?visible.map(m=>`<button data-id="${esc(m.id)}"><span>${esc(m.name)}</span><small>打开抽屉 ↗</small></button>`).join(''):'';
}
function remaining(m){const d=daysLeft(m.expiry);return d===null?'未填写日期':d<0?`已过期 ${-d} 天`:d===0?'今日到期':`剩余 ${d} 天`}
function modal(content,kicker='家庭药箱'){clearTimeout(openTimer);$('#dialog').classList.remove('receipt-dialog');$('#dialog').removeAttribute('aria-label');$('#dialog-content').innerHTML=`<div class="modal-top"><span>${kicker}</span><button class="close" aria-label="关闭">×</button></div><div class="modal-body">${content}</div>`;if(!$('#dialog').open)$('#dialog').showModal();$('#dialog').scrollTop=0;$('.close').onclick=()=>$('#dialog').close()}
$('#dialog').addEventListener('close',()=>{scanToken++;clearTimeout(scanTimer);clearTimeout(openTimer);document.querySelectorAll('.drawer.open').forEach(d=>d.classList.remove('open'));photo='';ocrPhoto=''});
$('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
function openMedicine(id){
 const m=medicines.find(m=>m.id===id);if(!m)return;currentId=id;
 document.querySelectorAll('.drawer.open').forEach(d=>d.classList.remove('open'));
 let target=view==='cabinet'?Array.from(document.querySelectorAll('.drawer[data-id]')).find(d=>d.dataset.id===id):null;
 if(!target&&view==='cabinet'){category=m.category;statusFilter='all';query='';$('#search').value='';render();target=Array.from(document.querySelectorAll('.drawer[data-id]')).find(d=>d.dataset.id===id)}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(target){target.scrollIntoView({behavior:reduced?'instant':'smooth',block:'nearest'});target.classList.add('open')}
 clearTimeout(openTimer);openTimer=setTimeout(()=>{const r=target?.getBoundingClientRect();showDetail(m,r)},reduced?0:280);
}
// Receipt texture, tear edges and printing/settling motion adapted from
// shengyuanshi/daily-receipt-opensource (MIT). See licenses/daily-receipt-MIT.txt.
function showDetail(m,origin){
 const row=(label,value)=>`<div class="receipt-row"><span>${label}</span><strong>${esc(value||'待填写')}</strong></div>`;
 const serial='RX-'+String(medicines.findIndex(x=>x.id===m.id)+1).padStart(4,'0');
 const d=$('#dialog');clearTimeout(openTimer);d.classList.add('receipt-dialog');d.setAttribute('aria-label',m.name+'的药品小票');
 d.style.setProperty('--from-x',origin?`${Math.max(-400,Math.min(400,origin.left+origin.width/2-innerWidth/2))}px`:'0px');
 d.style.setProperty('--from-y',origin?`${Math.max(-240,Math.min(300,origin.top+origin.height/2-innerHeight/2))}px`:'70px');
 $('#dialog-content').innerHTML=`<div class="receipt-toolbar"><div><span class="receipt-led"></span> 药品小票 <small>MEDICINE RECEIPT</small></div><button class="close" aria-label="关闭小票">×</button></div><div class="receipt-viewport" tabindex="0" aria-label="药品小票内容，可向下滚动"><div class="receipt-stage"><div class="receipt-print-window"><article class="medicine-receipt" aria-label="${esc(m.name)}药品档案"><div class="receipt-tear"></div><div class="receipt-content"><header class="receipt-head"><span class="receipt-cross">✚</span><p>家庭药箱</p><small>THE FAMILY APOTHECARY</small><div class="receipt-meta"><span>${serial}</span><span>${localDate(new Date()).replaceAll('-','.')}</span></div></header><div class="receipt-illustration">${medicineArt(m)}</div><div class="receipt-name"><span>${m.category}</span><h2>${esc(m.name)}</h2></div><section class="receipt-section"><h3>01 / 药品信息</h3>${row('收纳类别',m.category)}${row('库存数量',m.quantity)}${m.localOcrRecognized?row('录入来源','浏览器本地 OCR · 已确认'):''}<div class="receipt-paragraph"><span>成分 / 配方</span><p>${esc(m.ingredients||'待填写')}</p></div></section><section class="receipt-section"><h3>02 / 日期与效期</h3>${row('生产日期',m.production)}${row('到期日期',m.expiry)}${row('有效期',m.shelfLife)}<div class="receipt-expiry ${status(m)}"><span>效期状态</span><strong>${statusText(m)}</strong></div>${status(m)==='expired'?'<p class="receipt-warning">已过期，请勿继续使用。</p>':''}</section><section class="receipt-section"><h3>03 / 录入的用法用量</h3>${row('每日服用次数',m.frequency)}${row('每次用量',m.dosage)}<p class="receipt-fineprint">本地 OCR 只整理包装文字，不提供服药建议。<br>请始终以实际说明书或医嘱为准。</p></section>${m.notes?`<section class="receipt-section"><h3>04 / 收纳备注</h3><p class="receipt-notes">${esc(m.notes)}</p></section>`:''}${m.photo?`<details class="receipt-photo"><summary>查看录入时的包装照片</summary><img src="${esc(m.photo)}" alt="药品原始包装照片"></details>`:''}<footer class="receipt-footer"><div class="receipt-barcode" aria-hidden="true"></div><div class="receipt-meta"><span>${serial} · PERSONAL COPY</span></div><small>药品信息记录 · 非处方 / 非购药凭证</small></footer></div><div class="receipt-tear bottom"></div></article></div></div></div><div class="receipt-actions"><button class="secondary" id="reprint">↻ 再出一张</button><button class="secondary" id="print-receipt">打印小票</button><button class="primary" id="edit">编辑资料</button></div><div class="receipt-bottom"><button class="danger" id="delete">移出药柜</button><a href="https://github.com/shengyuanshi/daily-receipt-opensource" target="_blank" rel="noopener noreferrer">Daily Receipt · MIT ↗</a></div>`;
 if(!d.open)d.showModal();d.scrollTop=0;$('.close').onclick=()=>d.close();
 const paper=$('.medicine-receipt');
 paper.addEventListener('animationend',e=>{if(e.animationName==='medicine-print-out'){paper.classList.add('is-settled')}});
 $('#reprint').onclick=()=>showDetail(m);
 $('#print-receipt').onclick=()=>window.print();
 $('#edit').onclick=()=>editForm(m);
 $('#delete').onclick=()=>{modal(`<h2>把它移出药柜？</h2><p class="modal-subtitle">将移除「${esc(m.name)}」及其录入资料。此操作不可撤销。</p><div class="modal-actions"><button class="secondary" id="cancel-delete">保留</button><button class="primary" id="confirm-delete">确认移除</button></div>`);$('#cancel-delete').onclick=()=>showDetail(m);$('#confirm-delete').onclick=()=>{if(persist(medicines.filter(x=>x.id!==m.id))){d.close();render();toast('已移出药柜')}}};
}
function addMedicine(c='中成药'){photo='';ocrPhoto='';modal(`<h2>添加药品</h2><p class="modal-subtitle">拍摄包装正面与信息面，本地 OCR 会识别照片中清晰可见的文字。</p><label class="upload-area" id="upload"><span>◎</span><b>拍摄或选择药品照片</b><small>支持 JPG、PNG、WebP · 最多 10 MB</small><input id="photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden></label><div class="privacy-note"><b>照片不会上传</b><span>识别完全在浏览器内完成。首次使用需下载并缓存中文 OCR 组件；保存后，照片与药品档案也只留在当前浏览器。</span></div><div class="modal-actions"><button class="primary" id="recognize" disabled>本地 OCR 识别</button><button class="secondary" id="manual">手动录入</button></div>`,'拍照入柜 / 01 选择照片');$('#manual').onclick=()=>editForm({category:c});$('#recognize').onclick=()=>scan(c);$('#photo').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)){toast('请选择 JPG、PNG 或 WebP 图片');return}if(f.size>10*1024*1024){toast('请选择 10 MB 以内的图片');return}try{[photo,ocrPhoto]=await Promise.all([compressPhoto(f,900,.75),compressPhoto(f,1800,.9)]);$('#upload').innerHTML=`<img src="${photo}" alt="所选药品包装">`;$('#recognize').disabled=false;$('#recognize').textContent='开始本地 OCR'}catch{toast('图片读取失败，请重新选择。')}}}
function compressPhoto(file,maxEdge=900,quality=.75){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{const scale=Math.min(1,maxEdge/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));const ctx=c.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);resolve(c.toDataURL('image/jpeg',quality))};img.onerror=()=>{URL.revokeObjectURL(url);reject()};img.src=url})}
async function scan(c){
 if(!photo){toast('请先拍摄或选择药品照片');return}
 const savedPhoto=photo,sourcePhoto=ocrPhoto||photo,token=++scanToken;
 const statusLabels={'loading tesseract core':'正在载入识别引擎','initializing tesseract':'正在初始化','loading language traineddata':'正在载入中文文字库','initializing api':'正在准备文字识别','recognizing text':'正在识别包装文字'};
 modal(`<h2>正在本地识别…</h2><p class="modal-subtitle">识别在当前设备中运行，照片不会上传。</p><div class="upload-area"><img src="${savedPhoto}" alt="识别中的药品包装"><div class="scan-line"></div></div><div class="ocr-status"><span id="ocr-progress-text">正在载入本地 OCR 组件</span><strong id="ocr-progress-value">0%</strong><div class="ocr-meter"><i id="ocr-progress-bar"></i></div></div><p class="privacy-note">首次使用需要下载中文 OCR 组件，可能需要一点时间。模糊或缺失字段会留空，稍后由你核对。</p>`,'拍照入柜 / 02 本地 OCR');
 try{
  const ocr=await recognizeLocally(sourcePhoto,message=>{
   if(token!==scanToken)return;
   const progress=Math.max(0,Math.min(1,Number(message.progress||0))),percent=Math.round(progress*100);
   if($('#ocr-progress-text'))$('#ocr-progress-text').textContent=statusLabels[message.status]||'正在处理图片';
   if($('#ocr-progress-value'))$('#ocr-progress-value').textContent=percent+'%';
   if($('#ocr-progress-bar'))$('#ocr-progress-bar').style.width=percent+'%';
  });
  if(token!==scanToken)return;
  if(!ocr.text.trim())throw new Error('没有识别到清晰文字，请换一张更近、更正、更亮的照片');
  const r=parseMedicineText(ocr.text,c);
  editForm({...r,notes:'',photo:savedPhoto,localOcrRecognized:true,ocrConfidence:ocr.confidence,uncertainFields:r.uncertainFields||[],recognitionWarnings:r.warnings||[]},true);
 }catch(error){
  if(token!==scanToken)return;
  modal(`<h2>这次没有识别成功</h2><p class="modal-subtitle">${esc(error.message||'请稍后再试，或先手动录入。')}</p><div class="modal-actions"><button class="primary" id="retry-scan">重新识别</button><button class="secondary" id="manual-after-error">手动录入</button></div>`,'拍照入柜 / 识别未完成');
  $('#retry-scan').onclick=()=>{photo=savedPhoto;ocrPhoto=sourcePhoto;scan(c)};$('#manual-after-error').onclick=()=>editForm({category:c,photo:savedPhoto});
 }
}
function artDescription(m){const a=medicineMark(m);return a.kind==='formula'?`配方图样（节选）：${a.label}`:a.kind==='herb'?`图样：${a.label}`:a.kind==='icon'?`医学图标：${a.label}`:`文字标识：${m.name||'药品'}`}
function editForm(m={},recognized=false){const input=(label,name,type='text',wide=false)=>`<label class="field ${wide?'wide':''}">${label}<input name="${name}" type="${type}" value="${esc(m[name]||'')}" ${name==='name'?'required maxlength="80"':''} ${name!=='name'&&type==='text'?'maxlength="200"':''}></label>`;const uncertain=(m.uncertainFields||[]).filter(Boolean);modal(`<h2>${m.id?'编辑药品档案':'确认药品信息'}</h2><p class="modal-subtitle">${recognized?'本地 OCR 已整理可见文字。保存前请逐项核对包装原文，尤其是日期与用量。':'补充包装上的信息，随时都可以回来修改。'}</p>${recognized?`<div class="ai-review"><b>本地 OCR 结果待确认</b><span>${uncertain.length?`以下字段未识别或不确定：${esc(uncertain.join('、'))}`:'所有字段仍需与实物包装核对。'}</span></div>`:''}<form id="medicine-form"><div class="form-grid">${input('药品名称 *','name','text',true)}<label class="field">收纳分类<select name="category">${CATEGORIES.map(c=>`<option ${m.category===c?'selected':''}>${c}</option>`).join('')}</select></label><label class="field">抽屉标识<select name="visualMode"><option value="auto" ${m.visualMode!=='text'?'selected':''}>按药名与已录入成分匹配</option><option value="text" ${m.visualMode==='text'?'selected':''}>使用药名文字印记</option></select></label><div class="art-preview wide" id="art-preview">${medicineArt(m)}<small>${esc(artDescription(m))}</small></div><label class="field wide">成分 / 配方<textarea name="ingredients" maxlength="2000">${esc(m.ingredients||'')}</textarea></label>${input('生产日期','production','date')}${input('到期日期','expiry','date')}${input('有效期（如 24 个月）','shelfLife')}${input('库存数量','quantity')}${input('每日服用次数','frequency')}${input('每次用量','dosage')}<label class="field wide">备注<textarea name="notes" maxlength="2000">${esc(m.notes||'')}</textarea></label></div>${recognized&&m.rawText?`<details class="ocr-raw"><summary>查看 OCR 识别原文</summary><pre>${esc(m.rawText)}</pre></details>`:''}<p class="modal-subtitle">图样库只负责匹配抽屉标识，不会自动补写配方。用法用量请以说明书或医嘱为准。</p><div class="modal-actions"><button class="primary" type="submit">${m.id?'保存修改':'核对无误，保存入柜'} <span>↗</span></button><button class="secondary" type="button" id="cancel-edit">取消</button></div></form>`,'家庭药箱 / 药品信息');$('#cancel-edit').onclick=()=>m.id?showDetail(m):$('#dialog').close();$('#medicine-form').onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));data.name=data.name.trim();if(!data.name){toast('请填写药品名称');return}if(data.production&&data.expiry&&data.expiry<data.production){toast('到期日期不能早于生产日期');return}const item={...m,...data,id:m.id||crypto.randomUUID(),photo:m.photo||photo||'',updatedAt:new Date().toISOString(),...(m.localOcrRecognized?{ocrConfirmedAt:new Date().toISOString()}: {})};delete item.rawText;const next=m.id?medicines.map(x=>x.id===m.id?item:x):[...medicines,item];if(persist(next)){category=item.category;statusFilter='all';query='';$('#search').value='';$('#dialog').close();render();toast(m.id?'药品档案已更新':'已收入抽屉，下次打开就能看到。');setTimeout(()=>openMedicine(item.id),180)}}}
function expiryView(){view='expiry';category='全部';statusFilter='all';query='';$('#search').value='';render()}
document.addEventListener('click',e=>{const c=e.target.closest('[data-category]');if(c){category=c.dataset.category;render()}const d=e.target.closest('[data-id]');if(d)openMedicine(d.dataset.id);const a=e.target.closest('[data-add]');if(a)addMedicine(a.dataset.add)});
$('#add').onclick=$('#mobile-add').onclick=()=>addMedicine(category==='全部'?'中成药':category);
$('#search').oninput=e=>{query=e.target.value.trim();render()};
$('#search').onkeydown=e=>{if(e.key==='Enter'&&query){const result=filtered()[0];if(result)openMedicine(result.id)}};
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!$('#dialog').open)$('#search').focus()}});
$('#all-status').onchange=e=>{statusFilter=e.target.value;render()};
function reset(){category='全部';statusFilter='all';query='';$('#search').value='';render()}
$('#reset-filter').onclick=reset;
document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{view=b.dataset.nav;reset();if(matchMedia('(max-width:760px)').matches)window.scrollTo({top:0,behavior:'instant'})});
function updateArtPreview(){const form=$('#medicine-form');if(!form)return;const data=Object.fromEntries(new FormData(form));$('#art-preview').innerHTML=medicineArt(data)+`<small>${esc(artDescription(data))}</small>`}
document.addEventListener('input',e=>{if(['name','ingredients'].includes(e.target.name))updateArtPreview()});
document.addEventListener('change',e=>{if(['category','visualMode'].includes(e.target.name))updateArtPreview()});
try{if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify(medicines))}catch{}
render();
