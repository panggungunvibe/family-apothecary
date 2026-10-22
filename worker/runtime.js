const ASSETS=__ASSET_MAP__;
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const CATEGORIES=['中成药','西药','中药','其他'];

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:JSON_HEADERS})}
function decodeBase64(value){const raw=atob(value),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes}
function outputText(response){
 for(const item of response.output||[])for(const content of item.content||[])if(content.type==='output_text'&&content.text)return content.text;
 return '';
}

const schema={
 type:'object',additionalProperties:false,
 properties:{
  name:{type:'string',description:'包装上清晰可见的完整药品或医疗用品名称；看不清则为空字符串'},
  category:{type:'string',enum:['中成药','西药','中药','其他','未知']},
  ingredients:{type:'string',description:'包装上清晰可见的成分或配方原文；不得凭药名补全'},
  production:{type:'string',description:'生产日期，能确定时规范为 YYYY-MM-DD，否则为空字符串'},
  expiry:{type:'string',description:'到期或有效期至日期，能确定时规范为 YYYY-MM-DD，否则为空字符串'},
  shelfLife:{type:'string',description:'包装印刷的有效期长度原文，例如 24个月；未见则为空'},
  frequency:{type:'string',description:'包装明确写出的每日服用次数原文；未见则为空'},
  dosage:{type:'string',description:'包装明确写出的每次用量原文；未见则为空'},
  quantity:{type:'string',description:'包装明确写出的数量或规格；未见则为空'},
  confidence:{type:'number',minimum:0,maximum:1},
  uncertainFields:{type:'array',items:{type:'string'},description:'模糊、遮挡、冲突或未出现的字段中文名称'},
  warnings:{type:'array',items:{type:'string'},description:'需要用户特别核对的识别问题；不提供诊疗建议'}
 },
 required:['name','category','ingredients','production','expiry','shelfLife','frequency','dosage','quantity','confidence','uncertainFields','warnings']
};

async function recognize(request,env){
 if(!env.OPENAI_API_KEY)return json({code:'ai_not_configured',message:'AI 识别服务尚未配置。你仍可以先使用手动录入。'},503);
 const length=Number(request.headers.get('content-length')||0);
 if(length>8*1024*1024)return json({code:'image_too_large',message:'图片数据过大，请重新拍摄或裁剪后再试。'},413);
 let body;try{body=await request.json()}catch{return json({code:'invalid_json',message:'无法读取图片数据。'},400)}
 if(typeof body.image!=='string'||!/^data:image\/(jpeg|png|webp);base64,/.test(body.image))return json({code:'invalid_image',message:'请选择有效的 JPG、PNG 或 WebP 图片。'},400);
 if(body.image.length>7_500_000)return json({code:'image_too_large',message:'图片数据过大，请重新拍摄或裁剪后再试。'},413);
 const categoryHint=CATEGORIES.includes(body.categoryHint)?body.categoryHint:'未知';
 const today=new Date().toISOString().slice(0,10);
 const prompt=`你是药品包装文字抄录助手。今天是 ${today}。只读取图片里清晰可见的印刷文字，不使用常识补全，不根据药名猜配方、日期、有效期或用法用量。日期只有在包装明确可辨时才能规范为 YYYY-MM-DD；批号不能当生产日期。相对有效期只有同时看清生产日期和有效期长度时才可计算到期日，否则留空。看不清、被遮挡、互相冲突或图片未包含的字段必须返回空字符串，并把字段名加入 uncertainFields。categoryHint 仅是用户当前抽屉 ${categoryHint}，包装证据更明确时可以更正。不要提供服药建议、诊断或推断。`;
 let upstream;
 try{
  upstream=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'authorization':`Bearer ${env.OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({
   model:env.OPENAI_VISION_MODEL||'gpt-5-mini',store:false,max_output_tokens:1800,
   input:[
    {role:'developer',content:[{type:'input_text',text:prompt}]},
    {role:'user',content:[{type:'input_text',text:'请抄录这张药品或医疗用品包装上的信息，并严格按结构返回。'},{type:'input_image',image_url:body.image,detail:'high'}]}
   ],
   text:{format:{type:'json_schema',name:'medicine_package_record',strict:true,schema}}
  })});
 }catch{return json({code:'model_unreachable',message:'暂时无法连接识别服务，请稍后再试。'},502)}
 const result=await upstream.json().catch(()=>null);
 if(!upstream.ok){
  console.error('OpenAI response error',upstream.status,result?.error?.code||'unknown');
  return json({code:'model_error',message:upstream.status===401?'AI 识别密钥无效，请联系站点维护者。':'识别服务暂时没有完成请求，请稍后再试。'},502);
 }
 let data;try{data=JSON.parse(outputText(result))}catch{return json({code:'invalid_model_output',message:'识别结果无法解析，请换一张更清晰的照片。'},502)}
 return json({data});
}

function serveAsset(path,method){
 const key=path==='/'?'/index.html':path;
 const asset=ASSETS[key];if(!asset)return new Response('Not found',{status:404});
 const headers={'content-type':asset.type,'x-content-type-options':'nosniff','cache-control':key==='/index.html'?'no-cache':'public, max-age=86400'};
 return new Response(method==='HEAD'?null:decodeBase64(asset.body),{headers});
}

export default{
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/recognize'){
   if(request.method!=='POST')return json({message:'Method not allowed'},405);
   return recognize(request,env);
  }
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
  return serveAsset(url.pathname,request.method);
 }
};
