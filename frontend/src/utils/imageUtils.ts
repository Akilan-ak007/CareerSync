/**
 * Utility to convert Google Drive shareable links into direct displayable image URLs.
 * Uses Google's high-speed thumbnail CDN (https://drive.google.com/thumbnail?id=...&sz=w1000)
 */
export function getGoogleDriveImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  const cleanUrl = url.trim();
  if (!cleanUrl) return null;

  // Extract Google Drive File ID from any share URL format
  const driveRegex = /(?:file\/d\/|id=|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]{15,})/;
  const match = cleanUrl.match(driveRegex);

  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }

  // If raw Google Drive ID string was passed directly
  if (/^[a-zA-Z0-9_-]{25,}$/.test(cleanUrl)) {
    return `https://drive.google.com/thumbnail?id=${cleanUrl}&sz=w1000`;
  }

  return cleanUrl;
}
