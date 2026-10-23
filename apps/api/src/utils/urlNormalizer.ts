/**
 * Normalizes repository URLs for consistent uniqueness checking.
 *
 * Rules:
 * - Trims leading and trailing whitespace.
 * - Enforces http / https protocol.
 * - Lowercases hostname.
 * - Removes trailing slash and '.git' suffixes.
 * - Lowercases repository path (e.g., github.com/User/Repo -> github.com/user/repo).
 *
 * Examples:
 *   https://github.com/AlexMercer/Task-Scheduler.git/ -> https://github.com/alexmercer/task-scheduler
 *   https://github.com/AlexMercer/Task-Scheduler -> https://github.com/alexmercer/task-scheduler
 */
export function normalizeRepoUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();

  try {
    const parsed = new URL(trimmed);

    // Only allow http or https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid URL protocol. Must be HTTP or HTTPS.');
    }

    const hostname = parsed.hostname.toLowerCase();
    let pathname = parsed.pathname.trim().toLowerCase();

    // Strip trailing slashes
    while (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Strip .git suffix if present
    if (pathname.endsWith('.git')) {
      pathname = pathname.slice(0, -4);
    }

    // Reconstruct normalized URL
    return `${parsed.protocol}//${hostname}${pathname}`;
  } catch {
    // If standard URL parsing fails, perform fallback cleanup
    let clean = trimmed.toLowerCase();
    if (clean.endsWith('/')) clean = clean.slice(0, -1);
    if (clean.endsWith('.git')) clean = clean.slice(0, -4);
    return clean;
  }
}
