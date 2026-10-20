/** Native anchors, fetch and History API calls need Next's build-time prefix. */
export function sitePath(
  path: string,
  basePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? "",
) {
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new Error("Use a site-relative path beginning with one slash");
  if (
    !basePath ||
    path === basePath ||
    path.startsWith(`${basePath}/`) ||
    path.startsWith(`${basePath}?`)
  )
    return path;
  return `${basePath}${path}`;
}
export const AUTHOR_HOME = "https://www.jasonwillems.com/";
export const AUTHOR_BLOG = "https://www.jasonwillems.com/blog/";
