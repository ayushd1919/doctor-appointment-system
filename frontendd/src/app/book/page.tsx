import BookingWidget from './widget';


export const dynamic = 'force-dynamic';
export default async function BookPage() {
// SSR: could prefetch featured doctors/specialties here if desired
return (
<div className="space-y-6">
<h1 className="text-xl font-semibold">Book an appointment</h1>
<BookingWidget />
</div>
);
}