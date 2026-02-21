"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { saveDocumentRecord } from "@/app/actions/documents"

export function UploadDocumentModal({
    isOpen,
    onClose,
    tripId
}: {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabaseClient = createClient()

    if (!isOpen) return null

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setError("File size must be less than 10MB.")
                setSelectedFile(null)
                return
            }
            setSelectedFile(file)
            setError(null)
        }
    }

    async function handleSubmit(formData: FormData) {
        if (!selectedFile) {
            setError("Please select a file to upload.")
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            // 1. Upload to Supabase Storage
            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
            const filePath = `${tripId}/${fileName}`

            const { error: uploadError, data } = await supabaseClient.storage
                .from('trip_documents')
                .upload(filePath, selectedFile, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                console.error("Storage upload error:", uploadError)
                throw new Error(uploadError.message || "Failed to upload file to storage bucket.")
            }

            // Get the public URL
            const { data: { publicUrl } } = supabaseClient.storage
                .from('trip_documents')
                .getPublicUrl(filePath)

            // 2. Save the Postgres Record
            formData.append("tripId", tripId)
            formData.append("fileUrl", publicUrl)

            const result = await saveDocumentRecord(formData)

            if (result?.error) {
                throw new Error(result.error)
            }

            // Success
            setIsSubmitting(false)
            setSelectedFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
            onClose()

        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during upload.")
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <h2 className="text-xl font-bold">Upload Document</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors p-1" aria-label="Close modal">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                    <form action={handleSubmit} id="document-form" className="flex flex-col gap-5">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 pb-1">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="file" className="block text-sm font-medium text-zinc-700 mb-2">
                                Select File (PDF, Image) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                id="file"
                                accept="image/*,application/pdf"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-900 hover:file:bg-zinc-200 transition-colors cursor-pointer border border-zinc-200 rounded-xl p-2"
                            />
                            {selectedFile && <p className="text-xs text-green-600 mt-2 ml-1 font-medium">Ready to upload: {selectedFile.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="name" className="pointer-events-none block text-sm font-medium text-zinc-700 mb-1">
                                Document Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                placeholder="e.g. Delta Boarding Pass, Hilton Booking"
                                className="pointer-events-auto relative z-10 w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="fileType" className="pointer-events-none block text-sm font-medium text-zinc-700 mb-1">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="fileType"
                                name="fileType"
                                required
                                defaultValue="other"
                                className="pointer-events-auto relative z-10 w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all appearance-none bg-white"
                            >
                                <option value="flight">Flight</option>
                                <option value="hotel">Hotel / Lodging</option>
                                <option value="passport">Passport / ID</option>
                                <option value="booking">Tour / Event Booking</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-zinc-100 flex gap-3 justify-end bg-zinc-50/50">
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
                        form="document-form"
                        disabled={isSubmitting || !selectedFile}
                        className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Uploading...
                            </>
                        ) : (
                            "Upload File"
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
