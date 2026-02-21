"use client"

import { useState } from "react"
import { AddItineraryModal } from "@/components/AddItineraryModal"

export function AddItineraryButton({
    tripId,
    startDate,
    endDate
}: {
    tripId: string;
    startDate: string | null;
    endDate: string | null;
}) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-zinc-900 px-5 py-3 md:py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-100 transition shadow-sm w-full sm:w-auto text-center justify-center flex"
            >
                Add Itinerary
            </button>

            <AddItineraryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                tripId={tripId}
                startDate={startDate}
                endDate={endDate}
            />
        </>
    )
}
