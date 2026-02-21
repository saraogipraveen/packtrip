"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function settleUp(formData: FormData) {
    const tripId = formData.get("tripId") as string
    const settledUserId = formData.get("settledUserId") as string // The person whose debts are being marked paid

    if (!tripId || !settledUserId) {
        return { error: "Missing information." }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not logged in." }

    // We are going to mark all expense splits for this user on this trip as settled.
    // We need to find all expenses in this trip, and update the splits.

    // First, get all expense IDs for this trip
    const { data: expenses } = await supabase
        .from("expenses")
        .select("id")
        .eq("trip_id", tripId)

    if (!expenses || expenses.length === 0) {
        return { success: true }
    }

    const expenseIds = expenses.map(e => e.id)

    // Now update the splits where expense_id IN (expenseIds) AND user_id = settledUserId
    const { error } = await supabase
        .from("expense_splits")
        .update({ is_settled: true })
        .in("expense_id", expenseIds)
        .eq("user_id", settledUserId)

    if (error) {
        console.error("Error settling up:", error)
        return { error: "Failed to settle up. Please try again." }
    }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}
