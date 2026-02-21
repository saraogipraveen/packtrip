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

    // Insert group (the database trigger will automatically add them as admin to group_members)
    const { data, error } = await supabase
        .from("groups")
        .insert([{ name, description, created_by: user.id }])
        .select()
        .single()

    if (error) {
        console.error("Error creating group:", error)
        return { error: "Failed to create group" }
    }

    revalidatePath("/dashboard")
    redirect(`/groups/${data.id}`)
}
