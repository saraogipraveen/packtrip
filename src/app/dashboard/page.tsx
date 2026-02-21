import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardHeaderButtons, CreateGroupEmptyStateButton } from "@/components/DashboardClientButtons";
import Link from "next/link";

export default async function Dashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch groups for the authenticated user
    const { data: groups, error } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 p-4 md:p-8 pb-24">
            <div className="max-w-5xl mx-auto flex flex-col gap-6 md:gap-8">
                <header className="flex items-center justify-between pb-4 border-b border-zinc-200">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-zinc-500 mt-1 text-sm md:text-base">Welcome back, {user.user_metadata?.full_name || user.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm border border-zinc-200 bg-white px-3 py-1.5 rounded-full font-medium hidden sm:inline-block">
                            {user.email}
                        </span>
                        <form action="/auth/signout" method="post">
                            <button className="text-sm font-medium hover:text-red-600 transition-colors">
                                Sign out
                            </button>
                        </form>
                    </div>
                </header>

                <section className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <h2 className="text-xl font-bold">Your Groups</h2>
                        <DashboardHeaderButtons />
                    </div>

                    {!groups || groups.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl">
                            <p className="text-zinc-500 mb-4">You aren't in any travel groups yet.</p>
                            <CreateGroupEmptyStateButton />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groups.map((group) => (
                                <Link href={`/groups/${group.id}`} key={group.id} className="block group">
                                    <div className="border border-zinc-200 rounded-xl p-5 group-hover:border-zinc-400 group-hover:shadow-sm cursor-pointer transition-all h-full bg-white">
                                        <h3 className="font-semibold text-lg">{group.name}</h3>
                                        {group.description && <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{group.description}</p>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
