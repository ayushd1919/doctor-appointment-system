import Link from 'next/link';


export default function HomePage() {
return (
<section className="grid md:grid-cols-2 gap-8 items-center">
<div className="space-y-6">
<h1 className="text-3xl md:text-4xl font-semibold leading-tight">
Book a doctor appointment in minutes
</h1>
<p className="text-slate-600">Browse by specialty or pick the next available slot across all doctors.</p>
<div className="flex gap-3">
<Link href="/book" className="btn btn-primary">Find a slot</Link>
<a href="#how" className="btn btn-outline">How it works</a>
</div>
<ul id="how" className="text-sm text-slate-600 list-disc pl-5">
<li>Choose a doctor or select Any Available</li>
<li>Pick a time from the 7–14 day calendar</li>
<li>Confirm with your details — done</li>
</ul>
</div>
<div className="card p-6">
<div className="h-64 bg-gradient-to-br from-emerald-100 to-amber-100 rounded-xl" />
<p className="text-xs text-slate-500 mt-3">Clean, minimal interface optimized for mobile + desktop</p>
</div>
</section>
);
}