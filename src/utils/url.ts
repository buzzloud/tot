export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function getDomainLabel(url: string): string {
  const hostname = getHostname(url);
  return hostname.replace(/^www\./i, "");
}
