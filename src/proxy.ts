import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { isAppLocale, routing } from "./i18n/routing";
import { SESSION_COOKIE_NAME } from "./shared/config/auth";

const handleI18nRouting = createMiddleware(routing);

const PUBLIC_PATHNAMES = new Set([
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

function getLocalizedPathname(pathname: string) {
  const [, localeCandidate, ...segments] = pathname.split("/");

  if (!isAppLocale(localeCandidate)) {
    return null;
  }

  const pathnameWithoutLocale = `/${segments.join("/")}`;
  const normalizedPathname =
    pathnameWithoutLocale.replace(/\/+$/, "") || "/";

  return {
    locale: localeCandidate,
    pathname: normalizedPathname,
  };
}

export default function proxy(request: NextRequest) {
  const localizedPathname = getLocalizedPathname(
    request.nextUrl.pathname,
  );

  if (!localizedPathname) {
    return handleI18nRouting(request);
  }

  const isPublicPathname = PUBLIC_PATHNAMES.has(
    localizedPathname.pathname,
  );

  if (
    !isPublicPathname &&
    !request.cookies.has(SESSION_COOKIE_NAME)
  ) {
    const signInUrl = request.nextUrl.clone();

    signInUrl.pathname = `/${localizedPathname.locale}/sign-in`;
    signInUrl.search = "";

    return NextResponse.redirect(signInUrl);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
