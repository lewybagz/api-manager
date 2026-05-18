/** Paths that do not require authentication (must stay in sync with auth redirect logic). */
export function isPublicRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/pw/login" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/pro")
  );
}
