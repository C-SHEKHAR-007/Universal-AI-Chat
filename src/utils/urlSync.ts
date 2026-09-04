/**
 * URL Hash Sync — lightweight web-only utility.
 *
 * Persists the active conversation ID in the browser URL hash so that:
 *   • Refreshing the page restores the exact chat with all messages
 *   • Browser back/forward navigation switches between conversations
 *   • Sharing a URL gives someone the direct link to a conversation
 *
 * Format: http://localhost:8081/#/chat/conv_1234567890_abcde
 *
 * On native (React Native), all functions are safe no-ops.
 */

// Check if running in React Native (mobile) vs Web browser
const isReactNative =
  typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative';

const isWeb =
  !isReactNative &&
  typeof window !== 'undefined' &&
  typeof window.addEventListener === 'function' &&
  typeof window.removeEventListener === 'function' &&
  typeof window.location !== 'undefined' &&
  typeof window.history !== 'undefined';

/**
 * Extracts the conversation ID from the current URL hash.
 * Returns null if no conversation is encoded in the URL.
 */
export function getConversationIdFromUrl(): string | null {
  if (!isWeb || !window?.location) return null;
  const hash = window.location.hash; // e.g. "#/chat/conv_123_abc"
  if (!hash) return null;

  const match = hash.match(/^#\/chat\/(.+)$/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Pushes the conversation ID into the URL hash without triggering a page reload.
 * If id is null, clears the hash back to the root.
 */
export function pushConversationToUrl(id: string | null): void {
  if (!isWeb || !window?.history?.pushState) return;

  const currentId = getConversationIdFromUrl();
  if (currentId === id) return; // Already at this URL — skip to avoid duplicate history entries

  if (id) {
    window.history.pushState(null, '', `#/chat/${encodeURIComponent(id)}`);
  } else {
    // Clear hash — go back to root
    window.history.pushState(null, '', window.location.pathname);
  }
}

/**
 * Replaces the current URL hash without adding a new history entry.
 * Use for initial page load or when we don't want back-button to undo.
 */
export function replaceConversationInUrl(id: string | null): void {
  if (!isWeb || !window?.history?.replaceState) return;

  if (id) {
    window.history.replaceState(null, '', `#/chat/${encodeURIComponent(id)}`);
  } else {
    window.history.replaceState(null, '', window.location.pathname);
  }
}

/**
 * Listens for browser back/forward navigation (hashchange event).
 * Returns an unsubscribe function.
 */
export function onUrlConversationChange(
  callback: (conversationId: string | null) => void
): () => void {
  if (!isWeb || typeof window.addEventListener !== 'function') return () => {};

  const handler = () => {
    const id = getConversationIdFromUrl();
    callback(id);
  };

  window.addEventListener('hashchange', handler);
  return () => {
    if (typeof window.removeEventListener === 'function') {
      window.removeEventListener('hashchange', handler);
    }
  };
}

