import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Onboarding() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Check if profile exists and has a name
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profile?.name) {
        redirect("/dashboard");
    }

    const handleCompleteProfile = async (formData: FormData) => {
        "use server";
        const name = formData.get("name") as string;

        if (!name) return;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            await supabase
                .from("profiles")
                .update({ name })
                .eq("id", user.id);

            redirect("/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
                <h1 className="text-3xl font-black tracking-tight mb-2 text-center">Welcome!</h1>
                <p className="text-zinc-500 mb-8 text-center">
                    Let's finish setting up your profile before we start planning trips.
                </p>

                <form action={handleCompleteProfile} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            placeholder="e.g. Jane Doe"
                            defaultValue={user.user_metadata?.full_name || ""}
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors py-3 px-4 rounded-xl font-medium mt-4"
                    >
                        Go to Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
}
