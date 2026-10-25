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

        // Lấy mẫu 6 điểm biên/góc để nhận diện chính xác màu nền thực tế (trắng, xám nhạt, be, kem...)
        const sampleCorners = [
          0,
          width - 1,
          (height - 1) * width,
          height * width - 1,
          Math.floor(width / 2),
          (height - 1) * width + Math.floor(width / 2),
        ];
        let cornerR = 0,
          cornerG = 0,
          cornerB = 0;
        for (const c of sampleCorners) {
          cornerR += data[c * 4];
          cornerG += data[c * 4 + 1];
          cornerB += data[c * 4 + 2];
        }
        cornerR = Math.round(cornerR / sampleCorners.length);
        cornerG = Math.round(cornerG / sampleCorners.length);
        cornerB = Math.round(cornerB / sampleCorners.length);

        function isBg(idx: number): boolean {
          const r = data[idx * 4];
          const g = data[idx * 4 + 1];
          const b = data[idx * 4 + 2];

          // 1. Trắng hoặc sáng tuyệt đối (white / off-white)
          if (r >= 220 && g >= 220 && b >= 220) return true;

          // 2. Trùng với tone màu nền phát hiện từ các góc ảnh (dung sai 60)
          const diff =
            Math.abs(r - cornerR) + Math.abs(g - cornerG) + Math.abs(b - cornerB);
          if (diff < 60) return true;

          // 3. Nền xám/be trung tính có độ sáng tương đồng với nền biên
          const isNeutral = Math.abs(r - g) < 20 && Math.abs(g - b) < 20;
          const cornerBright = (cornerR + cornerG + cornerB) / 3;
          const pixelBright = (r + g + b) / 3;
          if (
            isNeutral &&
            pixelBright >= 140 &&
            Math.abs(pixelBright - cornerBright) < 35
          ) {
            return true;
          }

          return false;
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
