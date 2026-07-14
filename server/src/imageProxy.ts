const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const FETCH_TIMEOUT_MS = 15000;

// roomCode → (hash → imageBuffer)
const imageCache = new Map<string, Map<string, Buffer>>();

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAndCache(
  roomCode: string,
  hash: string,
  pollinationsUrl: string
): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[imageProxy] Fetching room=${roomCode} hash=${hash} attempt=${attempt}/${MAX_RETRIES}`);
      const response = await fetchWithTimeout(pollinationsUrl, FETCH_TIMEOUT_MS);

      if (!response.ok) {
        console.log(`[imageProxy] HTTP ${response.status} for hash=${hash}`);
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!imageCache.has(roomCode)) {
        imageCache.set(roomCode, new Map());
      }
      imageCache.get(roomCode)!.set(hash, buffer);

      console.log(`[imageProxy] OK room=${roomCode} hash=${hash} size=${buffer.length}`);
      return true;
    } catch (err) {
      console.log(`[imageProxy] Error room=${roomCode} hash=${hash} attempt=${attempt}:`, (err as Error).message);
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  console.log(`[imageProxy] FAILED room=${roomCode} hash=${hash} after ${MAX_RETRIES} attempts`);
  return false;
}

export function getImage(roomCode: string, hash: string): Buffer | null {
  return imageCache.get(roomCode)?.get(hash) ?? null;
}

export function clearRoom(roomCode: string): void {
  const deleted = imageCache.get(roomCode)?.size ?? 0;
  imageCache.delete(roomCode);
  console.log(`[imageProxy] Cleared room=${roomCode} (${deleted} images freed)`);
}
