export async function copyAndAutoClear(text: string, milliseconds = 15000): Promise<void> {
  await navigator.clipboard.writeText(text);
  window.setTimeout(() => {
    void (async () => {
      try {
        await navigator.clipboard.writeText("");
      } catch {
        // ignore
      }
    })();
  }, Math.max(0, milliseconds));
}


