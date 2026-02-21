"use client"

import { useState } from "react"
import { addExpense } from "@/app/actions/expenses"

export function AddExpenseModal({
    isOpen,
    onClose,
    tripId,
    tripMembers
}: {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
    tripMembers: { id: string, name: string }[];
}) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // By default, select all trip members for the split
    const [selectedUsers, setSelectedUsers] = useState<string[]>(tripMembers.map(m => m.id))

    if (!isOpen) return null

    const toggleUser = (id: string) => {
        setSelectedUsers(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        )
    }

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        setError(null)

        if (selectedUsers.length === 0) {
            setError("You must select at least one person for the split.")
            setIsSubmitting(false)
            return
        }

        // Append the selected users as a comma separated string
        formData.append("involvedUsers", selectedUsers.join(","))

        // Server Action
        const result = await addExpense(formData)

        if (result?.error) {
            setError(result.error)
            setIsSubmitting(false)
        } else {
            onClose()
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <h2 className="text-xl font-bold">Add Expense</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <form action={handleSubmit} className="p-6 flex flex-col gap-4">
                    <input type="hidden" name="tripId" value={tripId} />

                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1">
                            What was this for? <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            required
                            placeholder="e.g. Dinner at Luiggi's"
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="w-24">
                            <label htmlFor="currency" className="block text-sm font-medium text-zinc-700 mb-1">
                                Currency
                            </label>
                            <select name="currency" id="currency" className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white">
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="amount" className="block text-sm font-medium text-zinc-700 mb-1">
                                Amount <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-zinc-500">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    id="amount"
                                    name="amount"
                                    required
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">
                            Split Equally Between:
                        </label>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto p-1">
                            {tripMembers.map(member => (
                                <label key={member.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-zinc-50 rounded-lg transition-colors border border-transparent hover:border-zinc-200">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(member.id)}
                                        onChange={() => toggleUser(member.id)}
                                        className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                                    />
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-zinc-200 flex flex-shrink-0 items-center justify-center text-[10px] font-bold">
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium">{member.name}</span>
                                    </div>
                                </label>
                            ))}
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
                            {isSubmitting ? "Saving..." : "Save Expense"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
