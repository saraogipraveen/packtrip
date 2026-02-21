"use client"

import { useState } from "react"
import { settleUp } from "@/app/actions/settle"

export function SettleUpButton({
    tripId,
    settledUserId,
    amount
}: {
    tripId: string;
    settledUserId: string;
    amount: number;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSettle() {
        setIsSubmitting(true)

        const formData = new FormData()
        formData.append("tripId", tripId)
        formData.append("settledUserId", settledUserId)

        await settleUp(formData)

        // Server action will revalidate the page, removing the button if successful
        setIsSubmitting(false)
    }

    return (
        <button
            onClick={handleSettle}
            disabled={isSubmitting}
            className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
            {isSubmitting ? "Processing..." : `Settle $${amount.toFixed(2)}`}
        </button>
    )
}
