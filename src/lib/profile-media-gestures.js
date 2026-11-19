export const IDENTITY_ZOOM = Object.freeze({ scale:1, x:0, y:0 });
export function clampZoom(scale,x=0,y=0,width=0,height=0) {
 const s=Math.min(4,Math.max(1,Number.isFinite(scale)?scale:1));
 const bound=(value,size)=>Math.max(-size*(s-1)/2,Math.min(size*(s-1)/2,value));
 return {scale:s,x:bound(x,width),y:bound(y,height)};
}
export function swipeDirection(dx,dy) {
 return Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.25?(dx<0?1:-1):0;
}
