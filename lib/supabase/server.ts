import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Manually get all cookies
          const allCookies = [];
          // We need to get specific Supabase cookies
          const sbAccessToken = cookieStore.get('sb-access-token');
          const sbRefreshToken = cookieStore.get('sb-refresh-token');
          const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0];
          const sbProjectToken = projectRef ? cookieStore.get(`sb-${projectRef}-auth-token`) : null;

          if (sbAccessToken) allCookies.push({ name: sbAccessToken.name, value: sbAccessToken.value });
          if (sbRefreshToken) allCookies.push({ name: sbRefreshToken.name, value: sbRefreshToken.value });
          if (sbProjectToken) allCookies.push({ name: sbProjectToken.name, value: sbProjectToken.value });

          return allCookies;
        },
        setAll() {
          // Cannot modify cookies in server components
          // Cookies are only set in API routes
        },
      },
    }
  );
}
