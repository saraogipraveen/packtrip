"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addExpense(formData: FormData) {
    const tripId = formData.get("tripId") as string
    const description = formData.get("description") as string
    const amountStr = formData.get("amount") as string
    const currency = formData.get("currency") as string || "USD"

    // This is a comma-separated list of user IDs involved in the split
    const involvedUsersStr = formData.get("involvedUsers") as string

    if (!description || !amountStr || !involvedUsersStr) {
        return { error: "Missing required fields." }
    }

    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
        return { error: "Invalid amount." }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not logged in." }

    const involvedUsers = involvedUsersStr.split(",").filter(id => id.trim() !== "")
    if (involvedUsers.length === 0) {
        return { error: "Must select at least one person to split with." }
    }

    // 1. Create the main expense row
    const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert([{
            trip_id: tripId,
            paid_by: user.id,
            amount,
            currency,
            description,
            expense_date: new Date().toISOString().split('T')[0] // today's date
        }])
        .select()
        .single()

    if (expenseError || !expense) {
        console.error("Expense creation failed:", expenseError)
        return { error: "Failed to log expense." }
    }

    // 2. Create the splits (Equally divided for MVP)
    const splitAmount = amount / involvedUsers.length

    const splitsToInsert = involvedUsers.map(splitUserId => ({
        expense_id: expense.id,
        user_id: splitUserId,
        amount_owed: splitAmount,
        is_settled: splitUserId === user.id // The payer automatically settles their own share
    }))

    const { error: splitError } = await supabase
        .from("expense_splits")
        .insert(splitsToInsert)

    if (splitError) {
        console.error("Split creation failed:", splitError)
        // We should ideally rollback the expense insert here, but omitting for MVP simplicity
        return { error: "Failed to divide expense." }
    }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}
