import {normalizeImageUrl} from './gallery-normalizer';
// Crop metadata stays in the URL fragment: never transmitted to Storage and
// never changes the original bytes, path, query/signature or access policy.
const clamp=value=>Math.max(0,Math.min(100,Number(value)));
export function imageCrop(src) {
 const value=normalizeImageUrl(src)||'';
 const match=value.match(/#nmood-crop=(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/);
 return match?{x:clamp(match[1]),y:clamp(match[2])}:null;
}
export function withImageCrop(src,{x,y}) {
 if(!Number.isFinite(Number(x))||!Number.isFinite(Number(y)))throw Error('Invalid crop position');
 const value=normalizeImageUrl(src);if(!value)throw Error('Photo unavailable');
 return value.split('#')[0]+`#nmood-crop=${clamp(x)},${clamp(y)}`;
}
export function imagePresentation(src,width=0,height=0) {
 const crop=imageCrop(src)||{x:50,y:height>width?25:50};
 return {objectFit:'cover',objectPosition:`${crop.x}% ${crop.y}%`,imageOrientation:'from-image'};
}
export function applyImagePresentation(event,src) {
 const image=event.currentTarget;
 Object.assign(image.style,imagePresentation(src,image.naturalWidth,image.naturalHeight));
}
