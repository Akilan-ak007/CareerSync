/**
 * Utility to convert Google Drive shareable links into direct displayable image URLs.
 * Uses Google's direct CDN endpoint (https://lh3.googleusercontent.com/d/FILE_ID)
 * which returns HTTP 200 OK with access-control-allow-origin: *
 */
export function getGoogleDriveImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  const cleanUrl = url.trim();
  if (!cleanUrl) return null;

  // Extract Google Drive File ID from any share URL format
  const driveRegex = /(?:file\/d\/|id=|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]{15,})/;
  const match = cleanUrl.match(driveRegex);

  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }

  // If raw Google Drive ID string was passed directly
  if (/^[a-zA-Z0-9_-]{25,}$/.test(cleanUrl)) {
    return `https://lh3.googleusercontent.com/d/${cleanUrl}`;
  }

  return cleanUrl;
}
