"use client"

import { useState } from "react"
import { UploadDocumentModal } from "@/components/UploadDocumentModal"

export function UploadDocumentButton({ tripId }: { tripId: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-zinc-900 border border-zinc-200 px-5 py-3 md:py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-50 transition shadow-sm w-full sm:w-auto text-center justify-center flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                Upload Doc
            </button>

            <UploadDocumentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                tripId={tripId}
            />
        </>
    )
}
