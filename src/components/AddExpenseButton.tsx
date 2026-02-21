"use client"

import { useState } from "react"
import { AddExpenseModal } from "@/components/AddExpenseModal"

export function AddExpenseButton({
    tripId,
    members
}: {
    tripId: string;
    members: { id: string, name: string }[];
}) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-white/10 text-white px-5 py-3 md:py-2.5 rounded-xl text-sm font-bold hover:bg-white/20 transition flex items-center justify-center"
            >
                Add Expense
            </button>

            <AddExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                tripId={tripId}
                tripMembers={members}
            />
        </>
    )
}
