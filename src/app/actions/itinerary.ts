"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addItineraryItem(formData: FormData) {
    const tripId = formData.get("tripId") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const location = formData.get("location") as string
    const dayDate = formData.get("dayDate") as string
    const startTime = formData.get("startTime") as string

    if (!tripId || !title || !dayDate) {
        return { error: "Missing required fields" }
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { error } = await supabase
        .from("itinerary_items")
        .insert([{
            trip_id: tripId,
            title,
            description: description || null,
            location: location || null,
            day_date: dayDate,
            start_time: startTime || null,
            created_by: user.id
        }])

    if (error) {
        console.error("Error adding itinerary item:", error)
        return { error: "Failed to add itinerary item" }
    }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}
