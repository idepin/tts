@echo off
echo Checking Supabase Environment Variables...
echo.

if defined NEXT_PUBLIC_SUPABASE_URL (
    echo ✅ NEXT_PUBLIC_SUPABASE_URL is set: %NEXT_PUBLIC_SUPABASE_URL%
) else (
    echo ❌ NEXT_PUBLIC_SUPABASE_URL is NOT set
)

if defined NEXT_PUBLIC_SUPABASE_ANON_KEY (
    echo ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set (length: %NEXT_PUBLIC_SUPABASE_ANON_KEY:~0,20%...)
) else (
    echo ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is NOT set
)

echo.
echo If any variables are missing, check your .env.local file
echo.
pause
