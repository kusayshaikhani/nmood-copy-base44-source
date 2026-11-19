import {boundaryFailure} from './boundary-diagnostics.mjs';
// No I/O, logging, storage or network. Inputs exist only for this invocation.
export const BOUNDARY_GUARD_M=20000,MAX_ACCURACY_M=1000,MAX_FIX_AGE_MS=30000;
const R=6371008.8,rad=Math.PI/180;
const clamp=x=>Math.max(-1,Math.min(1,x));
const vector=([x,y])=>[Math.cos(y*rad)*Math.cos(x*rad),Math.cos(y*rad)*Math.sin(x*rad),Math.sin(y*rad)];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=v=>Math.hypot(...v);
const angle=(a,b)=>Math.atan2(norm(cross(a,b)),clamp(dot(a,b)));
function segmentDistance(point,start,end){
 const p=vector(point),a=vector(start),b=vector(end),n=cross(a,b),length=norm(n);
 if(length<1e-12)return Math.min(angle(p,a),angle(p,b))*R;
 const unit=n.map(x=>x/length),projection=p.map((x,i)=>x-dot(p,unit)*unit[i]),scale=norm(projection);
 if(scale<1e-12)return Math.min(angle(p,a),angle(p,b))*R;
 const foot=projection.map(x=>x/scale);
 if(angle(a,foot)+angle(foot,b)<=angle(a,b)+1e-9)return Math.asin(Math.min(1,Math.abs(dot(p,unit))))*R;
 return Math.min(angle(p,a),angle(p,b))*R;
}
function adjustedPoint(point,box){return [point[0]+360*Math.round(((box[0]+box[2])/2-point[0])/360),point[1]];}
function inRing(point,ring){
 const [x,y]=adjustedPoint(point,ring.box),[minx,miny,maxx,maxy]=ring.box;if(x<minx||x>maxx||y<miny||y>maxy)return false;
 let inside=false;const p=ring.points;
 for(let i=0,j=p.length-1;i<p.length;j=i++){const [ax,ay]=p[i],[bx,by]=p[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;}
 return inside;
}
function nearRing(point,ring,margin){
 const p=adjustedPoint(point,ring.box),latMargin=margin/110000,lonMargin=latMargin/Math.cos((Math.abs(p[1])+latMargin)*rad);
 if(p[0]<ring.box[0]-lonMargin||p[0]>ring.box[2]+lonMargin||p[1]<ring.box[1]-latMargin||p[1]>ring.box[3]+latMargin)return false;
 for(let i=1;i<ring.points.length;i++)if(segmentDistance(p,ring.points[i-1],ring.points[i])<=margin)return true;
 return false;
}
export function validateCountryPosition(position,now=Date.now()){
 const lat=position?.coords?.latitude,lon=position?.coords?.longitude,accuracy=position?.coords?.accuracy,time=position?.timestamp;
 if(![lat,lon,accuracy,time].every(Number.isFinite)||Math.abs(lon)>180||lat<=-60||lat>=80||accuracy<0||accuracy>MAX_ACCURACY_M||time>now||now-time>MAX_FIX_AGE_MS)throw boundaryFailure('POSITION_INVALID');
}
export function resolveCountry(position,data,isoCodes,now=Date.now()){
 validateCountryPosition(position,now);
 const lat=position.coords.latitude,lon=position.coords.longitude,accuracy=position.coords.accuracy;
 if(data?.format!=='nmood-natural-earth-country-v1'||!Array.isArray(data.countries)||!Array.isArray(data.disputed)||!Array.isArray(data.disputedLines))throw boundaryFailure('DATA_FORMAT_INVALID');
 const p=[lon,lat],margin=BOUNDARY_GUARD_M+3*accuracy;
 // Every polygon in the exclusion layer is a mask, including inner rings.
 for(const f of data.disputed)for(const ring of f.rings)if(inRing(p,ring)||nearRing(p,ring,margin))throw boundaryFailure('DISPUTED_AREA_GUARD');
 for(const f of data.disputedLines)for(const ring of f.rings)if(nearRing(p,ring,margin))throw boundaryFailure('DISPUTED_LINE_GUARD');
 const matches=[];
 for(const f of data.countries){
  let inside=false;
  for(const ring of f.rings)if(inRing(p,ring))inside=!inside;
  if(inside)matches.push(f);
 }
 if(matches.length===0)throw boundaryFailure('NO_LAND_MATCH');
 if(matches.length!==1)throw boundaryFailure('OVERLAPPING_COUNTRIES');
 if(!isoCodes.includes(matches[0].code))throw boundaryFailure('UNSUPPORTED_COUNTRY');
 const country=matches[0];
 // Require strict interior containment; exact boundary points are ambiguous.
 if(country.rings.some(r=>nearRing(p,r,0.01)))throw boundaryFailure('EXACT_BOUNDARY');
 // Preserve the full safety buffer against every other country's territory,
 // including across water and around enclaves. Own coastline proximity alone
 // is not a cross-country risk. Unsupported country codes still block.
 for(const f of data.countries)if(f!==country)for(const ring of f.rings)if(nearRing(p,ring,margin))throw boundaryFailure('OTHER_COUNTRY_GUARD');
 return country.code;
}
