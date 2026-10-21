/**
 * Charm Image Processor
 * Utility to process 3D generated keychain charm images:
 * - Flood-fill BFS background removal (makes pure white/solid background transparent)
 * - Safe protection for inner white pixels (eyes, white clothes, teeth)
 */

export function removeWhiteBackground(
  imageUrl: string,
  threshold: number = 235
): Promise<string> {
  if (
    typeof window === "undefined" ||
    !imageUrl ||
    imageUrl.startsWith("data:image/svg") ||
    imageUrl.includes(".svg")
  ) {
    return Promise.resolve(imageUrl);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const width = img.width;
        const height = img.height;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // BFS Flood-fill from borders to clear only outer background
        const visited = new Uint8Array(width * height);
        const queue: number[] = [];

        function isBg(idx: number): boolean {
          const r = data[idx * 4];
          const g = data[idx * 4 + 1];
          const b = data[idx * 4 + 2];
          return r >= threshold && g >= threshold && b >= threshold;
        }

        // Top & bottom rows
        for (let x = 0; x < width; x++) {
          const top = x;
          const bot = (height - 1) * width + x;
          if (isBg(top) && !visited[top]) {
            visited[top] = 1;
            queue.push(top);
          }
          if (isBg(bot) && !visited[bot]) {
            visited[bot] = 1;
            queue.push(bot);
          }
        }

        // Left & right columns
        for (let y = 0; y < height; y++) {
          const left = y * width;
          const right = y * width + (width - 1);
          if (isBg(left) && !visited[left]) {
            visited[left] = 1;
            queue.push(left);
          }
          if (isBg(right) && !visited[right]) {
            visited[right] = 1;
            queue.push(right);
          }
        }

        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          data[curr * 4 + 3] = 0; // Set alpha to transparent

          const cx = curr % width;
          const cy = Math.floor(curr / width);

          // 4 neighbors (up, down, left, right)
          if (cx > 0) {
            const n = curr - 1;
            if (!visited[n] && isBg(n)) {
              visited[n] = 1;
              queue.push(n);
            }
          }
          if (cx < width - 1) {
            const n = curr + 1;
            if (!visited[n] && isBg(n)) {
              visited[n] = 1;
              queue.push(n);
            }
          }
          if (cy > 0) {
            const n = curr - width;
            if (!visited[n] && isBg(n)) {
              visited[n] = 1;
              queue.push(n);
            }
          }
          if (cy < height - 1) {
            const n = curr + width;
            if (!visited[n] && isBg(n)) {
              visited[n] = 1;
              queue.push(n);
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentDataUrl = canvas.toDataURL("image/png");
        resolve(transparentDataUrl);
      } catch (err) {
        console.warn("[removeWhiteBackground Error]:", err);
        resolve(imageUrl);
      }
    };

    img.onerror = () => {
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}
