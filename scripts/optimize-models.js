/**
 * Script tự động nén tối ưu toàn bộ các mô hình 3D (.glb) trong public/assets/models bằng Google Draco
 * Cách chạy: npm run optimize-models
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const modelsDir = path.join(process.cwd(), "public", "assets", "models");

if (!fs.existsSync(modelsDir)) {
  console.log("Không tìm thấy thư mục:", modelsDir);
  process.exit(0);
}

const glbFiles = fs.readdirSync(modelsDir).filter((f) => f.endsWith(".glb"));
console.log(`Bắt đầu tối ưu hóa ${glbFiles.length} file mô hình 3D...`);

for (const file of glbFiles) {
  const filePath = path.join(modelsDir, file);
  const tempOut = path.join("/tmp", "draco_" + file);
  const originalSizeMb = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);

  try {
    console.log(`Đang nén ${file} (${originalSizeMb} MB)...`);
    execSync(`npx -y @gltf-transform/cli draco "${filePath}" "${tempOut}"`, { stdio: "pipe" });
    const newSizeMb = (fs.statSync(tempOut).size / (1024 * 1024)).toFixed(2);
    fs.copyFileSync(tempOut, filePath);
    fs.unlinkSync(tempOut);
    console.log(`✓ Đã nén ${file}: ${originalSizeMb} MB -> ${newSizeMb} MB`);
  } catch (err) {
    console.warn(`Lưu ý: Không thể nén file ${file} (có thể đã được nén trước đó):`, err.message);
    if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
  }
}

console.log("Hoàn tất tối ưu hóa toàn bộ mô hình 3D!");
