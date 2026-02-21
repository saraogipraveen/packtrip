"use client"

import { useState } from "react"
import { CreateTripModal } from "@/components/CreateTripModal"

export function GroupPageClientButtons({ groupId }: { groupId: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition"
            >
                + Plan Trip
            </button>

            <CreateTripModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                groupId={groupId}
            />
        </>
    )
}

export function GroupPageEmptyStateButton({ groupId }: { groupId: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-800 transition shadow-sm"
            >
                Plan the first Trip
            </button>

            <CreateTripModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                groupId={groupId}
            />
        </>
    )
}
