import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AddExpenseButton } from "@/components/AddExpenseButton"
import { calculateBalances } from "@/lib/balances"
import { SettleUpButton } from "@/components/SettleUpButton"

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

    // Fetch all members of this trip to pass to the Expense Splitter
    const { data: members } = await supabase
        .from("trip_members")
        .select(`
            user_id,
            role,
            profiles:user_id (name)
        `)
        .eq("trip_id", trip.id)

    const safeMembers = members?.map(m => {
        const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        return {
            id: m.user_id,
            name: profile && typeof profile === 'object' && 'name' in profile ? String(profile.name) : "Unknown User"
        }
    }) || []

    // Determine current user's role in this trip
    const membership = members?.find(m => m.user_id === user.id)

    // Fetch Itinerary
    const { data: itinerary } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("trip_id", trip.id)
        .order("day_date", { ascending: true })
        .order("start_time", { ascending: true })

    // Fetch expenses to calculate total
    const { data: expenses } = await supabase
        .from("expenses")
        .select("id, amount, paid_by")
        .eq("trip_id", trip.id)

    const totalSpent = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    // Fetch splits to calculate Splitwise balances
    const { data: splits } = await supabase
        .from("expense_splits")
        .select("*, expenses!inner(trip_id)")
        .eq("expenses.trip_id", trip.id)

    const balances = calculateBalances(
        safeMembers,
        expenses || [],
        splits || []
    )

    const myBalance = balances.find(b => b.userId === user.id)
    const myStatus = myBalance && Math.abs(myBalance.netBalance) > 0.01
        ? (myBalance.netBalance > 0 ? `You are owed $${myBalance.netBalance.toFixed(2)}` : `You owe $${Math.abs(myBalance.netBalance).toFixed(2)}`)
        : "All Settled"
    const statusColor = myBalance && myBalance.netBalance < -0.01 ? "text-red-600" : "text-green-600"

    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 pb-20">
            {/* Navigation */}
            <nav className="border-b border-zinc-200 bg-white sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
                    <Link
                        href={trip.group_id ? `/groups/${trip.group_id}` : "/dashboard"}
                        className="text-sm font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-2 truncate pr-4"
                    >
                        &larr; <span className="hidden sm:inline">Back to {trip.group ? trip.group.name : "Dashboard"}</span><span className="sm:hidden">Back</span>
                    </Link>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-sm border border-zinc-200 px-3 py-1.5 rounded-full font-medium truncate max-w-[120px] sm:max-w-none">
                            {user.email}
                        </span>
                    </div>
                </div>
            </nav>

            {/* Hero Header */}
            <header className="bg-zinc-900 text-white border-b border-zinc-800">
                <div className="max-w-5xl mx-auto p-4 py-8 md:p-8 md:py-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex gap-2 mb-3 flex-wrap">
                                <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide uppercase">
                                    Upcoming Trip
                                </span>
                                {trip.destination && (
                                    <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide uppercase flex items-center gap-1">
                                        <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        {trip.destination}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 leading-tight">{trip.title}</h1>
                            <p className="text-zinc-400 text-base md:text-lg">
                                {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : "Dates TBD"}
                                {trip.end_date ? ` - ${new Date(trip.end_date).toLocaleDateString()}` : ""}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button className="bg-white text-zinc-900 px-5 py-3 md:py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-100 transition shadow-sm w-full sm:w-auto text-center justify-center flex">
                                Add Itinerary
                            </button>
                            <div className="w-full sm:w-auto flex">
                                <AddExpenseButton tripId={trip.id} members={safeMembers} />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-6 md:gap-8">

                {/* Quick Stats Banner */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200 flex flex-col">
                        <span className="text-zinc-500 text-sm font-medium mb-1">Total Expenses</span>
                        <span className="text-2xl font-bold">${totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200 flex flex-col">
                        <span className="text-zinc-500 text-sm font-medium mb-1">My Status</span>
                        <span className={`text-2xl font-bold ${statusColor}`}>{myStatus}</span>
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
                            <div className="p-0">
                                {balances.length === 0 || balances.every(b => b.netBalance === 0) ? (
                                    <div className="p-5 text-center text-sm text-zinc-500">
                                        No debts tracked yet. <br />Add expenses to see who owes who.
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-zinc-100">
                                        {balances.map(balance => {
                                            if (Math.abs(balance.netBalance) < 0.01) return null; // Skip perfectly flat balances

                                            const isOwed = balance.netBalance > 0;

                                            return (
                                                <li key={balance.userId} className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 text-xs shadow-inner">
                                                            {balance.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-sm">{balance.userId === user.id ? "You" : balance.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-sm font-bold ${isOwed ? 'text-green-600' : 'text-red-600'}`}>
                                                            {isOwed ? "+" : "-"}${Math.abs(balance.netBalance).toFixed(2)}
                                                        </span>
                                                        {!isOwed && balance.userId !== user.id && membership?.role === 'admin' ? (
                                                            // If someone owes money (negative balance) and we are the admin, we can settle them
                                                            <SettleUpButton tripId={trip.id} settledUserId={balance.userId} amount={Math.abs(balance.netBalance)} />
                                                        ) : null}
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
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
