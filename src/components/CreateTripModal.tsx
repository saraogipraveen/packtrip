"use client"

import { useState } from "react"
import { createTrip } from "@/app/actions/trips"

export function CreateTripModal({
    isOpen,
    onClose,
    groupId
}: {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        setError(null)

        // Server Action
        const result = await createTrip(formData)

        if (result?.error) {
            setError(result.error)
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <h2 className="text-xl font-bold">Plan a New Trip</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form action={handleSubmit} className="p-6 flex flex-col gap-4">
                    <input type="hidden" name="groupId" value={groupId} />

                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1">
                            Trip Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            placeholder="e.g. Summer in Greece"
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="destination" className="block text-sm font-medium text-zinc-700 mb-1">
                            Destination <span className="text-zinc-400 font-normal">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            id="destination"
                            name="destination"
                            placeholder="e.g. Athens, Santorini"
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-zinc-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex gap-3 justify-end leading-none">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-70 flex items-center gap-2"
                        >
                            {isSubmitting ? "Creating..." : "Plan Trip"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
