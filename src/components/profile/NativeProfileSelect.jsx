import React from 'react';

// Use the platform picker: no nested modal, floating portal, pointer capture or
// Radix focus transfer inside the profile sheet. Keep existing stored strings.
export default function NativeProfileSelect({id, value, options, onChange, path, placeholder, className}) {
 const known=options.some(option=>option.value===value);
 return <select id={id} value={typeof value==='string'?value:''} className={className}
  onFocus={()=>window.NmoodRecovery?.profileField?.(path)}
  onChange={event=>{
   const next=event.target.value;
   if(next!==''&&!options.some(option=>option.value===next))return;
   window.NmoodRecovery?.profileField?.(path);
   const change=()=>onChange(next);
   if(window.NmoodRecovery)window.NmoodRecovery.trace(path,change);else change();
  }}>
  <option value="">{placeholder}</option>
  {value && typeof value==='string' && !known && <option value={value}>{value}</option>}
  {options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
 </select>;
}
