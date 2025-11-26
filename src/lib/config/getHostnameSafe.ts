export function getHostnameSafe(): string {
  try {
    if (typeof window === "undefined") return "";
    return window.location?.hostname ?? "";
  } catch {
    return "";
  }
}
