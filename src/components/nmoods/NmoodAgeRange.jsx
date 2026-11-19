import * as Slider from '@radix-ui/react-slider';
export default function NmoodAgeRange({value,onChange}) {
 const range=value||[18,99];
 return <fieldset className="space-y-2"><legend className="font-semibold">Age range (optional)</legend>
  <p aria-live="polite">{value?`Ages ${range[0]}–${range[1]} inclusive`:'No age preference'}</p>
  <Slider.Root aria-label="Age range" min={18} max={99} step={1} value={range} onValueChange={onChange} className="relative flex h-12 w-full touch-none select-none items-center">
   <Slider.Track className="relative h-2 grow rounded-full bg-purple-100"><Slider.Range className="absolute h-full rounded-full bg-purple-700" /></Slider.Track>
   <Slider.Thumb aria-label="Minimum age" aria-valuetext={`${range[0]} years`} className="relative block h-11 w-11 border-0 bg-transparent shadow-none focus-visible:outline focus-visible:outline-2 after:absolute after:left-1/2 after:top-1/2 after:h-4 after:w-4 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border-2 after:border-purple-700 after:bg-white after:shadow after:content-['']" />
   <Slider.Thumb aria-label="Maximum age" aria-valuetext={`${range[1]} years`} className="relative block h-11 w-11 border-0 bg-transparent shadow-none focus-visible:outline focus-visible:outline-2 after:absolute after:left-1/2 after:top-1/2 after:h-4 after:w-4 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border-2 after:border-purple-700 after:bg-white after:shadow after:content-['']" />
  </Slider.Root>
  <div className="flex justify-between text-sm"><span>Minimum {range[0]}</span><span>Maximum {range[1]}</span></div>
  <button type="button" className="min-h-11 text-purple-800" onClick={()=>onChange(null)}>No age preference</button>
 </fieldset>;
}
