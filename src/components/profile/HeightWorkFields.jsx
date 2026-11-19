import WorkDetailsFields from './WorkDetailsFields';
import React, { useId, useState } from 'react';
import { heightInFeet } from '@/lib/height';
export default function HeightWorkFields({data, update, showSharingControls = true}) {
 const id=useId();const [unit,setUnit]=useState('cm');
 const imperial=heightInFeet(data.height_cm);
 const supplied=Number.isFinite(data.height_cm) && data.height_cm>0;
 // Preserve saved values outside the normal adult range; never clamp on mount.
 const minimum=supplied?Math.min(120,Math.floor(data.height_cm)):120;
 const maximum=supplied?Math.max(220,Math.ceil(data.height_cm)):220;
 const sliderValue=unit==='cm'?Math.round(data.height_cm||170):Math.round((data.height_cm||170)/2.54);
 const sliderMin=unit==='cm'?minimum:Math.floor(minimum/2.54);
 const sliderMax=unit==='cm'?maximum:Math.ceil(maximum/2.54);
 const setHeight=value=>{const whole=Math.round(value);update({height_cm:unit==='cm'?whole:Math.round(whole*254)/100});};
 const displayed=supplied?(unit==='cm'?`${Math.round(data.height_cm)} cm`:`${imperial.feet} ft ${imperial.inches} in`):'Unit';
 return <section aria-label="Height and work" className="space-y-3 rounded-xl border border-border p-4">
  <h2 className="font-semibold">Height and work (optional)</h2>
  <div className="flex items-center justify-between gap-3">
   <label htmlFor={`${id}-height`}>Height (optional)</label>
   <div className="flex items-center gap-2">
    <output id={`${id}-height-value`} htmlFor={`${id}-height`} className="font-semibold tabular-nums">{displayed}</output>
    <label htmlFor={`${id}-unit`} className="sr-only">Height units</label>
    <select id={`${id}-unit`} className="min-h-11 rounded-xl border border-border bg-card px-2" value={unit} onChange={e=>setUnit(e.target.value)}><option value="cm">cm</option><option value="ft">ft/in</option></select>
   </div>
  </div>
  <input id={`${id}-height`} type="range" min={sliderMin} max={sliderMax} step="1"
    value={sliderValue} aria-valuetext={supplied?displayed:(unit==='cm'?'170 cm, drag to choose height':'5 ft 7 in, drag to choose height')} aria-describedby={`${id}-height-help`}
    onChange={event=>setHeight(Number(event.target.value))}
 className="w-full min-h-11 accent-primary focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"/>
  <p id={`${id}-height-help`} className="text-xs text-muted-foreground">Drag to adjust. Arrow keys adjust by {unit==='cm'?'1 cm':'1 inch'}. Changing units does not change your saved height.</p>
  {supplied ? <><button type="button" className="min-h-11 text-primary" onClick={()=>update({height_cm:null})}>Remove height</button></>
    : null}
  {showSharingControls && <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={data.share_height===true} onChange={e=>update({share_height:e.target.checked})}/>Show my height with permitted profile viewers</label>}
  <WorkDetailsFields data={data} update={update} />
  {showSharingControls && <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={data.share_work===true} onChange={e=>update({share_work:e.target.checked})}/>Show my work with permitted profile viewers</label>}
  <p className="text-xs text-muted-foreground">{showSharingControls ? 'Optional and private unless you choose to share. Neither is needed to complete your profile. Premium does not override these choices.' : 'Height and work are optional. Supplied values are included only for permitted viewers. Leave them blank to omit them.'}</p>
 </section>;
}
