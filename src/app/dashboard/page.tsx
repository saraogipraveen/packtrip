import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 p-8">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">
                <header className="flex items-center justify-between pb-4 border-b border-zinc-200">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
                        <p className="text-zinc-500 mt-1">Welcome back, {user.user_metadata?.full_name || user.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm border border-zinc-200 bg-white px-3 py-1.5 rounded-full font-medium">
                            {user.email}
                        </span>
                        <form action="/auth/signout" method="post">
                            <button className="text-sm font-medium hover:text-red-600 transition-colors">
                                Sign out
                            </button>
                        </form>
                    </div>
                </header>

                <section className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">Your Groups</h2>
                        <button className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition">
                            + New Group
                        </button>
                    </div>

                    {!groups || groups.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl">
                            <p className="text-zinc-500 mb-4">You aren't in any travel groups yet.</p>
                            <button className="text-zinc-900 font-semibold underline decoration-2 decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900 transition-colors">
                                Create one now
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groups.map((group) => (
                                <div key={group.id} className="border border-zinc-200 rounded-xl p-5 hover:border-zinc-400 cursor-pointer transition-colors">
                                    <h3 className="font-semibold text-lg">{group.name}</h3>
                                    {group.description && <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{group.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
