export function href(path: string) {
  const profileOrigin = process.env.NEXT_PUBLIC_PROFILE_ORIGIN; // e.g. https://profile.olympay.com.vn
  if (!path.startsWith("/")) path = `/${path}`;

  if (path === "/profile" || path.startsWith("/profile/")) {
    if (!profileOrigin) {
      return path;
    }
    return `${profileOrigin}${path}`;
  }

  return path;
}
