"use client"

import { useState } from "react"
import { addItineraryItem } from "@/app/actions/itinerary"

export function AddItineraryModal({
    isOpen,
    onClose,
    tripId,
    startDate,
    endDate
}: {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
    startDate: string | null;
    endDate: string | null;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        setError(null)
        formData.append("tripId", tripId)

        const result = await addItineraryItem(formData)

        if (result?.error) {
            setError(result.error)
            setIsSubmitting(false)
        } else {
            setIsSubmitting(false)
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 sticky top-0 z-10 shrink-0">
                    <h2 className="text-xl font-bold">Add to Itinerary</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
                        aria-label="Close modal"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form action={handleSubmit} id="itinerary-form" className="flex flex-col gap-5">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1">
                                Activity Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                placeholder="e.g. Flight to Paris, Louvre Tour"
                                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="dayDate" className="block text-sm font-medium text-zinc-700 mb-1">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    id="dayDate"
                                    name="dayDate"
                                    required
                                    min={startDate || undefined}
                                    max={endDate || undefined}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label htmlFor="startTime" className="block text-sm font-medium text-zinc-700 mb-1">
                                    Time <span className="text-zinc-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="time"
                                    id="startTime"
                                    name="startTime"
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-zinc-700 mb-1">
                                Location <span className="text-zinc-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                placeholder="e.g. Terminal 5, 123 Main St"
                                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
                                Description / Notes
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                placeholder="Confirmation numbers, meeting spot, etc."
                                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-none"
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-zinc-100 flex gap-3 justify-end bg-zinc-50/50 sticky bottom-0 z-10 shrink-0">
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
                        form="itinerary-form"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Saving...
                            </>
                        ) : (
                            "Add to Itinerary"
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
