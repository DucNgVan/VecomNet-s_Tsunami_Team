"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createConfiguredGLTFLoader } from "@/lib/gltfLoader";
import { Loader2, RotateCw } from "lucide-react";

interface CharmCanvas3DProps {
  modelUrl?: string;
  color?: string;
  glowColor?: string;
  className?: string;
  isInteractive?: boolean;
  autoRotateSpeed?: number;
}

// Global cached GLTF scene to eliminate redundant network downloads
let cachedCharmGltfScene: THREE.Group | null = null;
let isCharmLoading = false;
const charmLoadCallbacks: ((scene: THREE.Group) => void)[] = [];

// Snapshot cache for charm cards to eliminate excessive WebGL contexts
const charmSnapshotCache = new Map<string, string>();

function parseThreeColor(val?: string, fallback = "#38bdf8"): THREE.Color {
  if (!val) return new THREE.Color(fallback);
  try {
    if (val.startsWith("rgba(")) {
      const match = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return new THREE.Color(`rgb(${match[1]}, ${match[2]}, ${match[3]})`);
      }
    }
    return new THREE.Color(val);
  } catch {
    return new THREE.Color(fallback);
  }
}

export const CharmCanvas3D: React.FC<CharmCanvas3DProps> = ({
  modelUrl = "/assets/models/caurongcharm.glb",
  color = "#38bdf8",
  glowColor = "rgba(56, 189, 248, 0.6)",
  className = "",
  isInteractive = true,
  autoRotateSpeed = 0.012,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cacheKey = `${modelUrl}_${color}_${glowColor}`;
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(
    charmSnapshotCache.get(cacheKey) || null
  );
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(
    !charmSnapshotCache.has(cacheKey) && !cachedCharmGltfScene
  );

  useEffect(() => {
    // Nếu chế độ tĩnh (isInteractive = false) và đã có snapshot -> không tạo WebGL context
    if (!isInteractive && charmSnapshotCache.has(cacheKey)) {
      setSnapshotUrl(charmSnapshotCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let isSubscribed = true;
    const width = container.clientWidth || 180;
    const height = container.clientHeight || 180;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.2, 3.2);

    // 2. High-Performance WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      });
    } catch (e) {
      console.warn("[CharmCanvas3D] WebGL không khả dụng, dùng giao diện dự phòng:", e);
      setHasWebGLError(true);
      setIsLoading(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;

    const dom = renderer.domElement;
    dom.style.width = "100%";
    dom.style.height = "100%";
    dom.style.display = "block";

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn("[CharmCanvas3D] WebGL context loss được chặn an toàn.");
      setHasWebGLError(true);
    };
    dom.addEventListener("webglcontextlost", handleContextLost, false);

    container.appendChild(dom);

    // 3. Studio Ocean Jewel Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(parseThreeColor(color, "#38bdf8"), 3.0);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    const pointLight = new THREE.PointLight(parseThreeColor(glowColor, "#38bdf8"), 2.5, 6);
    pointLight.position.set(0, -1, 1);
    scene.add(pointLight);

    // 4. Root Charm Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    let animId: number | null = null;
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rootGroup.rotation.y += dx * 0.012;
      rootGroup.rotation.x = Math.max(-0.6, Math.min(0.6, rootGroup.rotation.x + dy * 0.01));
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      isDragging = true;
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - prevMouse.x;
      const dy = e.touches[0].clientY - prevMouse.y;
      rootGroup.rotation.y += dx * 0.012;
      rootGroup.rotation.x = Math.max(-0.6, Math.min(0.6, rootGroup.rotation.x + dy * 0.01));
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    // 5. Setup interaction handlers & render loop BEFORE loading/mounting model
    const clock = new THREE.Clock();
    const startRenderLoop = () => {
      if (animId !== null) return;
      dom.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);

      dom.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onMouseUp);

      const renderLoop = () => {
        animId = requestAnimationFrame(renderLoop);
        const t = clock.getElapsedTime();
        if (!isDragging && rootGroup) {
          rootGroup.rotation.y += autoRotateSpeed;
          rootGroup.position.y = Math.sin(t * 1.8) * 0.05;
        }
        renderer.render(scene, camera);
      };
      renderLoop();
    };

    // Helper: Mount and auto-fit cloned charm model
    const mountCharmScene = (baseScene: THREE.Group) => {
      if (!isSubscribed) return;
      rootGroup.clear();

      const instance = baseScene.clone(true);
      const box = new THREE.Box3().setFromObject(instance);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      instance.position.x = -center.x;
      instance.position.y = -center.y;
      instance.position.z = -center.z;

      // Orient charm upright
      instance.rotation.x = Math.PI;

      const charmWrapper = new THREE.Group();
      charmWrapper.add(instance);

      const maxDim = Math.max(size.x, size.y, size.z);
      const targetDim = 1.9;
      const scale = maxDim > 0 ? targetDim / maxDim : 1;
      charmWrapper.scale.setScalar(scale);

      instance.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          if (m.material) {
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.roughness = 0.2;
            mat.metalness = 0.85;
            mat.envMapIntensity = 1.8;
          }
        }
      });

      rootGroup.add(charmWrapper);
      setIsLoading(false);

      // Nếu không tương tác -> render 1 frame lấy snapshot và hủy context an toàn
      if (!isInteractive) {
        renderer.render(scene, camera);
        try {
          const shot = dom.toDataURL("image/webp", 0.92);
          charmSnapshotCache.set(cacheKey, shot);
          setSnapshotUrl(shot);
        } catch {}

        setTimeout(() => {
          if (!isSubscribed) return;
          try {
            dom.removeEventListener("webglcontextlost", handleContextLost);
            if (dom.parentNode === container) {
              container.removeChild(dom);
            }
            renderer.dispose();
          } catch {}
        }, 50);
        return;
      }

      // Khởi động vòng lặp tương tác an toàn
      startRenderLoop();
    };

    // 6. Load or Reuse Cached GLTF Scene
    if (cachedCharmGltfScene) {
      mountCharmScene(cachedCharmGltfScene);
    } else if (isCharmLoading) {
      charmLoadCallbacks.push((scene) => {
        if (isSubscribed) mountCharmScene(scene);
      });
    } else {
      isCharmLoading = true;
      const loader = createConfiguredGLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          cachedCharmGltfScene = gltf.scene;
          isCharmLoading = false;
          if (isSubscribed) mountCharmScene(gltf.scene);
          charmLoadCallbacks.forEach((cb) => cb(gltf.scene));
          charmLoadCallbacks.length = 0;
        },
        undefined,
        (err) => {
          console.warn("Error loading charm model:", err);
          isCharmLoading = false;
          if (isSubscribed) {
            setHasWebGLError(true);
            setIsLoading(false);
          }
        }
      );
    }

    return () => {
      isSubscribed = false;
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
      dom.removeEventListener("webglcontextlost", handleContextLost);
      if (animId !== null) cancelAnimationFrame(animId);

      try {
        if (dom.parentNode === container) {
          container.removeChild(dom);
        }
        renderer.dispose();
      } catch {}
    };
  }, [modelUrl, color, glowColor, isInteractive, autoRotateSpeed, cacheKey]);

  return (
    <div className={`relative w-full h-full min-h-[160px] select-none ${className}`}>
      {/* 1. Nếu có ảnh Snapshot (chế độ không tương tác) -> hiển thị ảnh tĩnh mượt mà, 0 tốn WebGL */}
      {!isInteractive && snapshotUrl ? (
        <img
          src={snapshotUrl}
          alt="3D Charm"
          className="w-full h-full object-contain pointer-events-none drop-shadow-md animate-fadeIn"
        />
      ) : hasWebGLError ? (
        /* 2. Giao diện Vector bảo vệ khi WebGL lỗi */
        <div className="w-full h-full flex flex-col items-center justify-center p-3">
          <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-700/60 shadow-lg">
            <div
              className="absolute inset-0 rounded-full opacity-30 blur-md"
              style={{ backgroundColor: color }}
            />
            <span className="text-2xl relative z-10">✨</span>
          </div>
          <span className="text-[9px] font-bold text-slate-500 mt-1">Charm NÉT</span>
        </div>
      ) : (
        /* 3. Vùng chứa Canvas WebGL */
        <div
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        />
      )}

      {/* Loading Spinner */}
      {isLoading && !snapshotUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/60 backdrop-blur-xs pointer-events-none">
          <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
        </div>
      )}

      {/* Interactive 3D Badge */}
      {isInteractive && !isLoading && !hasWebGLError && (
        <div className="absolute top-2 left-2 pointer-events-none z-10">
          <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 text-[9px] font-bold text-sky-800 shadow-xs flex items-center gap-1">
            <RotateCw
              className="w-2.5 h-2.5 text-sky-600 animate-spin"
              style={{ animationDuration: "6s" }}
            />
            <span>3D Xoay</span>
          </span>
        </div>
      )}
    </div>
  );
};
