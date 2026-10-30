export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitFor(
  condition: () => boolean,
  { timeout = 5000, interval = 50 }: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (condition()) {
      return;
    }
    await sleep(interval);
  }
  throw new Error("condition not met within timeout");
}
