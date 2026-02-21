"use client"

import { useState } from "react"
import { CreateGroupModal } from "@/components/CreateGroupModal"

export function DashboardHeaderButtons() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition shadow-sm hover:shadow active:scale-95"
            >
                + New Group
            </button>

            <CreateGroupModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    )
}

export function CreateGroupEmptyStateButton() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="text-zinc-900 font-semibold underline decoration-2 decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900 transition-colors"
            >
                Create one now
            </button>

            <CreateGroupModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    )
}
