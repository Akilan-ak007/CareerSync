/**
 * Utility to convert Google Drive shareable links into direct displayable image URLs.
 */
export function getGoogleDriveImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;

  // Match Google Drive File IDs from share links or preview URLs
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|uc\?id=|open\?id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/;
  const match = cleanUrl.match(driveRegex);

  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }

  return cleanUrl;
}
