import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { GroupPageClientButtons, GroupPageEmptyStateButton } from "@/components/GroupClientButtons"

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const resolvedParams = await params
    const id = resolvedParams.id

    // Fetch the current group
    const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", id)
        .single()

    if (groupError || !group) {
        console.error("Group Page Fetch Error:", groupError);
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-200 text-center max-w-md">
                    <h1 className="text-xl font-bold text-red-600 mb-2">Error Loading Group</h1>
                    <p className="text-zinc-600 mb-4 text-sm">{groupError?.message || "Group not found in database."}</p>
                    <pre className="text-xs text-left bg-zinc-100 p-3 rounded mb-4 overflow-auto border border-zinc-200">
                        {JSON.stringify(groupError, null, 2)}
                    </pre>
                    <Link href="/dashboard" className="text-sm font-medium hover:underline">
                        &larr; Return to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    // Fetch trips for this group
    const { data: trips } = await supabase
        .from("trips")
        .select("*")
        .eq("group_id", group.id)
        .order("created_at", { ascending: false })

    // Fetch members of this group
    const { data: members } = await supabase
        .from("group_members")
        .select(`
      user_id,
      role,
      profiles:user_id (name, email)
    `)
        .eq("group_id", group.id)

    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 pb-20">
            {/* Navigation */}
            <nav className="border-b border-zinc-200 bg-white sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
                    <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-2">
                        &larr; <span className="hidden sm:inline">Back to Dashboard</span><span className="sm:hidden">Back</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-sm border border-zinc-200 px-3 py-1.5 rounded-full font-medium truncate max-w-[150px] sm:max-w-none">
                            {user.email}
                        </span>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-6 md:gap-8">

                {/* Header */}
                <header>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{group.name}</h1>
                            {group.description && <p className="text-base md:text-lg text-zinc-500 mt-2 max-w-2xl">{group.description}</p>}
                        </div>
                        <div className="w-full sm:w-auto self-stretch sm:self-auto flex items-center">
                            <GroupPageClientButtons groupId={group.id} />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - Trips */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Trips in {group.name}</h2>
                            <div className="w-full sm:w-auto">
                                <GroupPageClientButtons groupId={group.id} />
                            </div>
                        </div>

                        {!trips || trips.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center">
                                <h3 className="text-lg font-bold mb-2">No trips planned yet</h3>
                                <p className="text-zinc-500 mb-6">Start your next adventure by creating a trip for this group.</p>
                                <GroupPageEmptyStateButton groupId={group.id} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {trips.map(trip => (
                                    <Link href={`/trips/${trip.id}`} key={trip.id} className="block group">
                                        <div className="bg-white border border-zinc-200 rounded-xl p-6 group-hover:border-zinc-400 group-hover:shadow-sm transition-all flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-xl mb-1">{trip.title}</h3>
                                                <p className="text-zinc-500 text-sm">
                                                    {trip.destination || "Destination TBD"} • {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : "Dates TBD"}
                                                </p>
                                            </div>
                                            <div className="text-zinc-400 group-hover:text-zinc-900 transition-colors">
                                                &rarr;
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Members */}
                    <div className="flex flex-col gap-6">
                        <h2 className="text-2xl font-bold tracking-tight">Members</h2>
                        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
                            <ul className="flex flex-col gap-4">
                                {members?.map(member => {
                                    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
                                    // Handle potential nulls or incorrect types safely
                                    const name = profile && typeof profile === 'object' && 'name' in profile ? profile.name : "Unknown User";
                                    const email = profile && typeof profile === 'object' && 'email' in profile ? profile.email : "";

                                    return (
                                        <li key={member.user_id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 border border-zinc-200">
                                                    {String(name).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium leading-none mb-1">{String(name)}</p>
                                                    <p className="text-xs text-zinc-500 leading-none">{String(email)}</p>
                                                </div>
                                            </div>
                                            {member.role === 'admin' && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                                                    Admin
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
