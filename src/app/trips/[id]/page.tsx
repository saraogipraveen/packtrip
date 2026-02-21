import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function TripPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Fetch the current trip
    const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("*, group:groups(name)")
        .eq("id", params.id)
        .single()

    if (tripError || !trip) {
        redirect("/dashboard")
    }

    // Determine user's role in this trip
    const { data: membership } = await supabase
        .from("trip_members")
        .select("role")
        .eq("trip_id", trip.id)
        .eq("user_id", user.id)
        .single()

    // Fetch Itinerary
    const { data: itinerary } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("trip_id", trip.id)
        .order("day_date", { ascending: true })
        .order("start_time", { ascending: true })

    // Calculate generic trip stats based on expenses table (stubbed for now)
    const { data: expenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("trip_id", trip.id)

    const totalSpent = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
            {/* Navigation */}
            <nav className="border-b border-zinc-200 bg-white">
                <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
                    <Link
                        href={trip.group_id ? `/groups/${trip.group_id}` : "/dashboard"}
                        className="text-sm font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-2"
                    >
                        &larr; Back to {trip.group ? trip.group.name : "Dashboard"}
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-sm border border-zinc-200 px-3 py-1.5 rounded-full font-medium">
                            {user.email}
                        </span>
                    </div>
                </div>
            </nav>

            {/* Hero Header */}
            <header className="bg-zinc-900 text-white border-b border-zinc-800">
                <div className="max-w-5xl mx-auto p-8 py-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex gap-3 mb-3">
                                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                                    Upcoming Trip
                                </span>
                                {trip.destination && (
                                    <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        {trip.destination}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">{trip.title}</h1>
                            <p className="text-zinc-400 text-lg">
                                {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : "Dates TBD"}
                                {trip.end_date ? ` - ${new Date(trip.end_date).toLocaleDateString()}` : ""}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button className="bg-white text-zinc-900 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-100 transition shadow-sm">
                                Add Itinerary
                            </button>
                            <button className="bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/20 transition">
                                Add Expense
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto p-8 flex flex-col gap-8">

                {/* Quick Stats Banner */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200 flex flex-col">
                        <span className="text-zinc-500 text-sm font-medium mb-1">Total Expenses</span>
                        <span className="text-2xl font-bold">${totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200 flex flex-col">
                        <span className="text-zinc-500 text-sm font-medium mb-1">My Status</span>
                        <span className="text-2xl font-bold text-green-600">All Settled</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200 flex flex-col md:col-span-2">
                        <span className="text-zinc-500 text-sm font-medium mb-1">Your Role</span>
                        <span className="text-xl font-bold capitalize">{membership?.role || 'Traveler'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - Itinerary */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Itinerary</h2>
                        </div>

                        {!itinerary || itinerary.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center text-zinc-500">
                                You haven't scheduled anything for this trip yet.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {/* Rendering itinerary logically */}
                                {itinerary.map((item) => (
                                    <div key={item.id} className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex gap-4">
                                        <div className="min-w-16 flex flex-col items-center justify-center border-r border-zinc-100 pr-4">
                                            <span className="text-sm font-bold text-zinc-400">{item.start_time ? item.start_time.substring(0, 5) : "--:--"}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{item.title}</h4>
                                            {item.description && <p className="text-zinc-500 text-sm mt-1">{item.description}</p>}
                                            {item.location && (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded mt-2">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                                                    {item.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Secondary Actions & Files */}
                    <div className="flex flex-col gap-6">

                        {/* Splitwise Mini-Panel */}
                        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                                <h3 className="font-bold text-lg">Finances</h3>
                                <span className="text-xs font-bold uppercase text-zinc-500">Overview</span>
                            </div>
                            <div className="p-5 text-center text-sm text-zinc-500">
                                No debts tracked yet. <br />Add expenses to see who owes who.
                            </div>
                        </div>

                        {/* Documents Mini-Panel */}
                        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                                <h3 className="font-bold text-lg">Documents</h3>
                                <button className="text-zinc-900 border border-zinc-200 bg-white px-3 py-1 rounded shadow-sm text-xs font-bold hover:bg-zinc-50">Upload</button>
                            </div>
                            <div className="p-5 text-center text-sm text-zinc-500">
                                Flights and hotel docs will appear here.
                            </div>
                        </div>

                    </div>

                </div>
            </main>
        </div>
    )
}
