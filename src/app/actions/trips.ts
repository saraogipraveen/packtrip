"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createTrip(formData: FormData) {
    const groupId = formData.get("groupId") as string
    const title = formData.get("title") as string
    const destination = formData.get("destination") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string

    if (!title) {
        return { error: "Title is required" }
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Ensure the user has a profile in the public.profiles table (Fixes FK constraint if trigger didn't fire)
    await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email
    })

    // Insert trip
    const { data, error } = await supabase
        .from("trips")
        .insert([{
            title,
            destination: destination || null,
            start_date: startDate || null,
            end_date: endDate || null,
            group_id: groupId || null,
            created_by: user.id
        }])
        .select()
        .single()

    if (error) {
        console.error("Error creating trip:", error)
        return { error: "Failed to create trip" }
    }

    if (groupId) {
        revalidatePath(`/groups/${groupId}`)
    }

    redirect(`/trips/${data.id}`)
}
