"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createGroup(formData: FormData) {
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    if (!name) {
        return { error: "Name is required" }
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect("/login")
    }

    // Ensure the user has a profile in the public.profiles table (Fixes FK constraint if trigger didn't fire)
    await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email
    })

    // Insert group (the database trigger will automatically add them as admin to group_members)
    const { data, error } = await supabase
        .from("groups")
        .insert([{ name, description, created_by: user.id }])
        .select()
        .single()

    if (error) {
        console.error("====== SUPABASE INSERTION ERROR ======");
        console.error(JSON.stringify(error, null, 2));
        console.error("======================================");
        return { error: `Failed to create group: ${error.message} (Code: ${error.code})` }
    }

    revalidatePath("/dashboard")
    redirect(`/groups/${data.id}`)
}
