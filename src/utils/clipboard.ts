/**
 * Cross-platform clipboard helper.
 * On Web / Browsers: uses navigator.clipboard.
 * On Native Mobile (iOS / Android): dynamically uses expo-clipboard.
 * Isolated from build/test runner environments without direct react-native imports.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Browser & Web environment
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Continue to native fallback
    }
  }

  // 2. Native mobile platforms (iOS / Android)
  try {
    const Clipboard = await import('expo-clipboard');
    if (Clipboard && typeof Clipboard.setStringAsync === 'function') {
      await Clipboard.setStringAsync(text);
      return true;
    }
  } catch {
    // Graceful fallback
  }

  return false;
}
