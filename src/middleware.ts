import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    // Skip middleware for development bypass
    if (req.nextUrl.pathname.startsWith('/auth/test')) {
        return NextResponse.next()
    }

    let response = NextResponse.next({
        request: {
            headers: req.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    req.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: any) {
                    req.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // Check if user is authenticated
    const {
        data: { session },
    } = await supabase.auth.getSession()

    console.log('Middleware check:', {
        path: req.nextUrl.pathname,
        hasSession: !!session,
        userEmail: session?.user?.email
    });

    // If accessing gameplay without authentication, redirect to login
    if (req.nextUrl.pathname.startsWith('/gameplay') && !session) {
        console.log('Redirecting to auth: no session for gameplay');
        return NextResponse.redirect(new URL('/auth', req.url))
    }

    // If authenticated and trying to access auth page, redirect to gameplay
    if (req.nextUrl.pathname.startsWith('/auth') && session) {
        console.log('Redirecting to gameplay: has session on auth page');
        return NextResponse.redirect(new URL('/gameplay', req.url))
    }

    return response
}

export const config = {
    matcher: []  // Disable middleware temporarily to test
}
