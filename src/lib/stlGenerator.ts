import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

export interface STLGenerationOptions {
  depthMm?: number; // Độ dày thân charm (mặc định 3.0mm)
  embossMm?: number; // Độ dày lớp hoa văn nổi (mặc định 1.2mm)
  pinDiameterMm?: number; // Đường kính chân chốt ngàm lưới (mặc định 4.5mm)
  pinHeightMm?: number; // Chiều dài chân chốt ngàm lưới (mặc định 4.0mm)
  addBackPin?: boolean; // Tự động gắn chân chốt ở mặt sau (mặc định true)
}

export interface GeneratedCharm3D {
  stlString: string;
  blob: Blob;
  downloadUrl: string;
  group: THREE.Group;
}

/**
 * Chuyển đổi mã SVG 2D từ Gemini AI thành mô hình 3D hoàn chỉnh kèm chân chốt ngàm cài mắt lưới túi
 * và xuất ra file chuẩn in 3D (.STL)
 */
export function generateCharmSTLFromSVG(
  svgCode: string,
  options: STLGenerationOptions = {}
): GeneratedCharm3D {
  const depthMm = options.depthMm || 3.0;
  const pinDiameterMm = options.pinDiameterMm || 4.5;
  const pinHeightMm = options.pinHeightMm || 4.0;
  const addBackPin = options.addBackPin !== false;

  // 1. Phân tích SVG
  const loader = new SVGLoader();
  const svgData = loader.parse(svgCode);

  const group = new THREE.Group();
  group.name = "NetBagCustomCharm";

  // 2. Đùn khối 3D từng đường path SVG
  svgData.paths.forEach((path) => {
    const shapes = SVGLoader.createShapes(path);
    shapes.forEach((shape) => {
      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: depthMm,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.35,
        bevelThickness: 0.35,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.center(); // Căn giữa tâm để khớp với chân chốt

      const material = new THREE.MeshStandardMaterial({
        color: path.color ? path.color : new THREE.Color("#234B3E"),
        roughness: 0.4,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
    });
  });

  // 3. Tự động thêm ngàm chốt cài mắt lưới túi Nét (Snap-mount Pin) ở mặt sau
  if (addBackPin) {
    const pinRadius = pinDiameterMm / 2; // 2.25mm
    const pinGeo = new THREE.CylinderGeometry(
      pinRadius,
      pinRadius,
      pinHeightMm,
      20
    );

    // Gờ giữ khóa ngàm (Snap Lip) ở đỉnh chân chốt để không bị tuột khỏi mắt lưới
    const lipGeo = new THREE.CylinderGeometry(
      pinRadius * 1.25, // 2.8mm
      pinRadius,
      0.8,
      20
    );

    const pinMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
    });

    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    // Xoay 90 độ để cắm vuông góc ra sau mặt phẳng charm
    pinMesh.rotation.x = Math.PI / 2;
    pinMesh.position.set(0, 0, -(depthMm / 2 + pinHeightMm / 2));
    pinMesh.name = "SnapMountGridPin";

    const lipMesh = new THREE.Mesh(lipGeo, pinMat);
    lipMesh.rotation.x = Math.PI / 2;
    lipMesh.position.set(0, 0, -(depthMm / 2 + pinHeightMm - 0.4));
    lipMesh.name = "SnapMountLip";

    group.add(pinMesh);
    group.add(lipMesh);
  }

  // 4. Xuất ra định dạng in 3D STL
  const exporter = new STLExporter();
  const stlString = exporter.parse(group);
  const blob = new Blob([stlString], { type: "model/stl" });
  const downloadUrl = URL.createObjectURL(blob);

  return {
    stlString,
    blob,
    downloadUrl,
    group,
  };
}

/**
 * Tải file .STL về máy người dùng hoặc Admin
 */
export function triggerSTLDownload(
  stlString: string,
  fileName: string = "net-bag-charm.stl"
) {
  const blob = new Blob([stlString], { type: "model/stl" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName.endsWith(".stl") ? fileName : `${fileName}.stl`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}
