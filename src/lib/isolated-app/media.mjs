async function encodePng(file){
 if(!(file instanceof Blob)||file.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose an image smaller than 5 MB.');
 const bitmap=await createImageBitmap(file);try{const scale=Math.min(1,512/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error();ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/png').split(',')[1];}finally{bitmap.close();}
}
export function createIsolatedMediaAdapter(client,{encode=encodePng}={}){
 const ids=new Map(),urls=new Set();
 async function display(id){const result=await client.media({action:'read',id});if(result?.id!==id||typeof result.png!=='string'||result.png.length>1400000||!/^[A-Za-z0-9+/]*={0,2}$/.test(result.png))throw Error('ISOLATED_MEDIA_RESPONSE');const bytes=Uint8Array.from(atob(result.png),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));urls.add(url);ids.set(url,id);return url;}
 return {
  display,
  upload:async file=>{const png=await encode(file);const result=await client.media({action:'upload',png});if(!result?.id)throw Error('ISOLATED_UPLOAD_UNCONFIRMED');return display(result.id);},
  idFor:url=>{const id=ids.get(url);if(!id)throw Error('Use an image uploaded in this isolated session.');return id;},
  isUploaded:url=>ids.has(url),
  dispose:()=>{for(const url of urls)URL.revokeObjectURL(url);urls.clear();ids.clear();},
 };
}
