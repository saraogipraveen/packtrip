import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    let next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {
            // Check if profile exists and if they need onboarding
            const { data: profile } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", data.user.id)
                .single()

            if (!profile?.name) {
                next = '/onboarding'
            }

            // Default to the provided site URL, falling back to localhost or the dynamic origin
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
                ? process.env.NEXT_PUBLIC_SITE_URL
                : `${origin}`

            return NextResponse.redirect(`${baseUrl}${next}`)
        }
    }

    // return the user to an error page with instructions
    const fallbackUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
    return NextResponse.redirect(`${fallbackUrl}/login`)
}
