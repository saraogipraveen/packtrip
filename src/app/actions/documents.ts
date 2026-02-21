"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function saveDocumentRecord(formData: FormData) {
    const tripId = formData.get("tripId") as string;
    const name = formData.get("name") as string;
    const fileType = formData.get("fileType") as string;
    const fileUrl = formData.get("fileUrl") as string;

    if (!tripId || !name || !fileType || !fileUrl) {
        return { error: "Missing required fields for document record." };
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
        .from('documents')
        .insert([{
            trip_id: tripId,
            name: name,
            file_type: fileType,
            file_url: fileUrl,
            uploaded_by: user.id
        }]);

    if (error) {
        console.error("Failed to save document record:", error);
        return { error: `Database Error: ${error.message}` };
    }

    revalidatePath(`/trips/${tripId}`);
    return { success: true };
}
