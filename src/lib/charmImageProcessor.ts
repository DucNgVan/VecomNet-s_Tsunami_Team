/**
 * Charm Image Processor
 * Utility to process 2D/3D generated keychain charm images:
 * - Smart multi-stage Flood-fill BFS background removal (transparent PNG cutout)
 * - Safe protection for inner subject pixels
 * - Anti-aliasing edge defringing (cleans white halos)
 * - CORS-safe via Blob URL conversion
 */

export async function removeWhiteBackground(
  imageUrl: string,
  threshold: number = 220
): Promise<string> {
  if (
    typeof window === "undefined" ||
    !imageUrl ||
    imageUrl.startsWith("data:image/svg") ||
    imageUrl.includes(".svg")
  ) {
    return Promise.resolve(imageUrl);
  }

  // Chuyển đổi remote HTTP URL thành Blob URL để chống lỗi CORS Tainted Canvas
  let safeSrc = imageUrl;
  let objectUrlToRevoke: string | null = null;
  if (!imageUrl.startsWith("data:") && !imageUrl.startsWith("blob:")) {
    try {
      const res = await fetch(imageUrl, { mode: "cors" });
      if (res.ok) {
        const blob = await res.blob();
        objectUrlToRevoke = URL.createObjectURL(blob);
        safeSrc = objectUrlToRevoke;
      }
    } catch (fetchErr) {
      // Tiếp tục dùng URL gốc nếu fetch thất bại
      console.warn("[removeWhiteBackground CORS fetch notice]:", fetchErr);
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    const cleanup = () => {
      if (objectUrlToRevoke) {
        try {
          URL.revokeObjectURL(objectUrlToRevoke);
        } catch {
          // ignore
        }
      }
    };

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const width = img.width;
        const height = img.height;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          cleanup();
          resolve(imageUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Lấy mẫu nhiều điểm xung quanh viền ngoài để tìm chính xác màu nền
        const samplePoints = [
          0,
          Math.floor(width / 4),
          Math.floor(width / 2),
          Math.floor((3 * width) / 4),
          width - 1,
          (height - 1) * width,
          (height - 1) * width + Math.floor(width / 4),
          (height - 1) * width + Math.floor(width / 2),
          (height - 1) * width + Math.floor((3 * width) / 4),
          height * width - 1,
          Math.floor(height / 2) * width,
          Math.floor(height / 2) * width + width - 1,
        ];

        let cornerR = 0;
        let cornerG = 0;
        let cornerB = 0;
        let count = 0;

        for (const p of samplePoints) {
          if (p >= 0 && p < width * height) {
            cornerR += data[p * 4];
            cornerG += data[p * 4 + 1];
            cornerB += data[p * 4 + 2];
            count++;
          }
        }

        cornerR = count > 0 ? Math.round(cornerR / count) : 255;
        cornerG = count > 0 ? Math.round(cornerG / count) : 255;
        cornerB = count > 0 ? Math.round(cornerB / count) : 255;

        function isBg(idx: number): boolean {
          const r = data[idx * 4];
          const g = data[idx * 4 + 1];
          const b = data[idx * 4 + 2];

          // 1. Trắng sáng tuyệt đối (white / off-white)
          if (r >= threshold && g >= threshold && b >= threshold) return true;

          // 2. Độ sai khác màu (Color Distance) so với màu nền biên mẫu
          const dist = Math.sqrt(
            Math.pow(r - cornerR, 2) +
            Math.pow(g - cornerG, 2) +
            Math.pow(b - cornerB, 2)
          );
          if (dist < 65) return true;

          // 3. Nền xám/be trung tính có độ sáng tương đồng với nền biên
          const isNeutral = Math.abs(r - g) < 25 && Math.abs(g - b) < 25;
          const cornerBright = (cornerR + cornerG + cornerB) / 3;
          const pixelBright = (r + g + b) / 3;
          if (isNeutral && pixelBright >= 90 && Math.abs(pixelBright - cornerBright) < 45) {
            return true;
          }

          return false;
        }

        const visited = new Uint8Array(width * height);
        const queue: number[] = [];

        // Hàng trên cùng & hàng dưới cùng
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

        // Cột bên trái & cột bên phải
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

        // BFS loang toàn bộ nền bên ngoài thành trong suốt (alpha = 0)
        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          data[curr * 4 + 3] = 0; // Alpha = 0

          const cx = curr % width;
          const cy = Math.floor(curr / width);

          // 4 lân cận (trên, dưới, trái, phải)
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

        // Khử viền trắng / lem màu (Anti-aliasing defringe)
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            if (data[idx * 4 + 3] > 0) {
              // Nếu là điểm ảnh sát cạnh điểm trong suốt
              const hasTransNeighbor =
                data[(idx - 1) * 4 + 3] === 0 ||
                data[(idx + 1) * 4 + 3] === 0 ||
                data[(idx - width) * 4 + 3] === 0 ||
                data[(idx + width) * 4 + 3] === 0;

              if (hasTransNeighbor) {
                const r = data[idx * 4];
                const g = data[idx * 4 + 1];
                const b = data[idx * 4 + 2];
                // Nếu điểm viền quá sáng (viền trắng sót lại do nén ảnh)
                if (r > 200 && g > 200 && b > 200) {
                  data[idx * 4 + 3] = 0;
                } else if (r > 170 && g > 170 && b > 170) {
                  data[idx * 4 + 3] = Math.round(data[idx * 4 + 3] * 0.4);
                }
              }
            }
          }
        }

        // Loại bỏ triệt để các watermark/logo chữ ở rìa góc đáy ảnh (nằm ngoài phạm vi charm trung tâm)
        const cornerWatermarkLimitY = height - Math.floor(height * 0.08); // 8% đáy ảnh
        const cornerWatermarkLimitX = Math.floor(width * 0.35); // 35% góc dưới trái/phải
        for (let y = cornerWatermarkLimitY; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (x < cornerWatermarkLimitX || x > width - cornerWatermarkLimitX) {
              const idx = y * width + x;
              data[idx * 4 + 3] = 0; // Đặt hoàn toàn trong suốt
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentDataUrl = canvas.toDataURL("image/png");
        cleanup();
        resolve(transparentDataUrl);
      } catch (err) {
        console.warn("[removeWhiteBackground Error]:", err);
        cleanup();
        resolve(imageUrl);
      }
    };

    img.onerror = () => {
      cleanup();
      resolve(imageUrl);
    };

    img.src = safeSrc;
  });
}
