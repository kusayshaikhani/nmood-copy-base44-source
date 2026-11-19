import React from 'react';
import {Link} from 'react-router-dom';
import {Users,CalendarDays,Sparkles,ArrowUpRight} from 'lucide-react';
const types={circles:{label:'Circle',Icon:Users,path:'circle'},experiences:{label:'Experience',Icon:CalendarDays,path:'experience'},posts:{label:'Nmood share',Icon:Sparkles}};
export default function ContentResult({kind,row}){
 const {label,Icon,path}=types[kind];
 const title=row.name||row.title||row.intention_text||label;
 return <article data-search-card={kind} className="discovery-card min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
  <Link className="flex min-w-0 items-start gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to={path?`/${path}/${encodeURIComponent(row.id)}`:`/nmood/${encodeURIComponent(row.id)}`}>
   <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon aria-hidden size={24}/></span>
   <div className="min-w-0 flex-1"><p className="text-xs font-medium text-primary">{label}</p><h2 className="font-semibold [overflow-wrap:anywhere]">{title}</h2>{row.description&&<p className="mt-1 line-clamp-3 text-sm text-muted-foreground [overflow-wrap:anywhere]">{row.description}</p>}
   {typeof row.category==='string'&&<span className="mt-3 inline-block max-w-full rounded-full bg-muted px-2 py-1 text-xs [overflow-wrap:anywhere]">{row.category.replaceAll('_',' ')}</span>}</div><ArrowUpRight aria-hidden size={18} className="shrink-0 text-muted-foreground"/>
  </Link>
 </article>;
}
