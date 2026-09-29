/**
 * Ephemeral clipboard utility for sensitive secrets and API keys.
 * Automatically clears the system clipboard after a designated timeout
 * (default 30 seconds) to prevent credential residue in clipboard history.
 */

let activeClearTimer: number | null = null;
let lastCopiedSecret: string | null = null;

export async function copySecretWithAutoClear(
  secret: string,
  timeoutMs = 30000,
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(secret);
    lastCopiedSecret = secret;
    // Reset any pending purge timer
    if (activeClearTimer !== null) {
      window.clearTimeout(activeClearTimer);
      activeClearTimer = null;
    }

    activeClearTimer = window.setTimeout(async () => {
      try {
        const currentContent = await navigator.clipboard
          .readText()
          .catch(() => null);
        if (currentContent === null || currentContent === lastCopiedSecret) {
          await navigator.clipboard.writeText("");
        }
      } catch {
        // Ignore background clipboard permission restrictions
      } finally {
        activeClearTimer = null;
        lastCopiedSecret = null;
      }
    }, timeoutMs);

    return true;
  } catch (error) {
    console.error("Failed to copy secret to clipboard:", error);
    return false;
  }
}
