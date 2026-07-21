const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const FETCH_TIMEOUT_MS = 15000;
const MAX_BODY_SIZE = 5 * 1024 * 1024;

// roomCode → (hash → imageBuffer)
const imageCache = new Map<string, Map<string, Buffer>>();
// roomCode → generation counter (incremented on clearRoom to invalidate in-flight fetches)
const roomGenerations = new Map<string, number>();

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchAndCache(
  roomCode: string,
  hash: string,
  pollinationsUrl: string
): Promise<boolean> {
  const generation = roomGenerations.get(roomCode) ?? 0;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[imageProxy] Fetching room=${roomCode} hash=${hash} attempt=${attempt}/${MAX_RETRIES}`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(pollinationsUrl, { signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        console.warn(`[imageProxy] HTTP ${response.status} for hash=${hash}`);
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('image')) {
        console.warn(`[imageProxy] Non-image Content-Type '${contentType}' for hash=${hash}`);
        response.body?.cancel();
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      if (contentLength > MAX_BODY_SIZE) {
        console.warn(`[imageProxy] Response too large: ${contentLength} bytes for hash=${hash}`);
        response.body?.cancel();
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > MAX_BODY_SIZE) {
        console.warn(`[imageProxy] Body exceeded size limit: ${buffer.length} bytes for hash=${hash}`);
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      // Only cache if generation hasn't advanced (room wasn't cleared)
      if ((roomGenerations.get(roomCode) ?? 0) !== generation) {
        console.log(`[imageProxy] Skipping stale cache for room=${roomCode} hash=${hash} (generation changed)`);
        return false;
      }

      if (!imageCache.has(roomCode)) {
        imageCache.set(roomCode, new Map());
      }
      imageCache.get(roomCode)!.set(hash, buffer);

      console.log(`[imageProxy] OK room=${roomCode} hash=${hash} size=${buffer.length}`);
      return true;
    } catch (err) {
      console.warn(`[imageProxy] Error room=${roomCode} hash=${hash} attempt=${attempt}:`, (err as Error).message);
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  console.error(`[imageProxy] FAILED room=${roomCode} hash=${hash} after ${MAX_RETRIES} attempts`);
  return false;
}

export function getImage(roomCode: string, hash: string): Buffer | null {
  return imageCache.get(roomCode)?.get(hash) ?? null;
}

export function clearRoom(roomCode: string): void {
  const gen = (roomGenerations.get(roomCode) || 0) + 1;
  roomGenerations.set(roomCode, gen);
  const deleted = imageCache.get(roomCode)?.size ?? 0;
  imageCache.delete(roomCode);
  console.log(`[imageProxy] Cleared room=${roomCode} (${deleted} images freed, gen=${gen})`);
}
