"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Loader2, RotateCw } from "lucide-react";

interface BagCard3DProps {
  modelUrl?: string;
  color?: string;
  glowColor?: string;
  className?: string;
  isInteractive?: boolean;
  autoRotateSpeed?: number;
}

// Global cached GLTF scenes keyed by modelUrl
const cachedBagGltfMap = new Map<string, THREE.Group>();
const bagLoadingUrls = new Set<string>();
const bagLoadCallbacksMap = new Map<string, ((scene: THREE.Group) => void)[]>();

// Global snapshot cache to eliminate duplicate WebGL contexts completely
const bagSnapshotCache = new Map<string, string>();

function parseThreeColor(val?: string, fallback = "#0c2340"): THREE.Color {
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

export const BagCard3D: React.FC<BagCard3DProps> = ({
  modelUrl = "/assets/models/tuixach.glb",
  color = "#0c2340",
  glowColor = "#38bdf8",
  className = "",
  isInteractive = true,
  autoRotateSpeed = 0.008,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cacheKey = `${modelUrl}_${color}_${glowColor}`;
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(
    bagSnapshotCache.get(cacheKey) || null
  );
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(
    !bagSnapshotCache.has(cacheKey) && !cachedBagGltfMap.has(modelUrl)
  );

  useEffect(() => {
    // Nếu chế độ tĩnh (isInteractive = false) và đã có ảnh snapshot -> không cần tạo WebGL context
    if (!isInteractive && bagSnapshotCache.has(cacheKey)) {
      setSnapshotUrl(bagSnapshotCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let isSubscribed = true;
    const width = container.clientWidth || 280;
    const height = container.clientHeight || 240;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.15, 6.2);

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
      console.warn("[BagCard3D] Không thể khởi tạo WebGL, chuyển sang giao diện dự phòng:", e);
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
      console.warn("[BagCard3D] WebGL Context Lost được xử lý an toàn.");
      setHasWebGLError(true);
    };
    dom.addEventListener("webglcontextlost", handleContextLost, false);

    container.appendChild(dom);

    // 3. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.6);
    keyLight.position.set(3, 6, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 1.8);
    fillLight.position.set(-3, -1, 3);
    scene.add(fillLight);

    const underGlow = new THREE.PointLight(parseThreeColor(glowColor || color, "#38bdf8"), 3.0, 9);
    underGlow.position.set(0, -2.5, 1.5);
    scene.add(underGlow);

    // 4. Root Bag Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    let animId: number | null = null;
    let isDragging = false;
    let prevX = 0;
    let targetRotY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevX;
      prevX = e.clientX;
      targetRotY += deltaX * 0.012;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      isDragging = true;
      prevX = e.touches[0].clientX;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - prevX;
      prevX = e.touches[0].clientX;
      targetRotY += deltaX * 0.015;
    };

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 280;
      const h = container.clientHeight || 240;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 5. Interactive render loop Setup (ALWAYS declared & ready BEFORE loading/mounting model)
    const startInteractiveLoop = () => {
      if (animId !== null) return;
      dom.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);

      dom.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onMouseUp);

      const animate = () => {
        animId = requestAnimationFrame(animate);
        if (rootGroup) {
          if (!isDragging) {
            targetRotY += autoRotateSpeed;
          }
          rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.08;
        }
        renderer.render(scene, camera);
      };
      animate();
    };

    // Helper: Mount and auto-fit cloned bag model
    const mountBagScene = (baseScene: THREE.Group) => {
      if (!isSubscribed) return;
      rootGroup.clear();

      const instance = baseScene.clone(true);
      const box = new THREE.Box3().setFromObject(instance);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      instance.position.x = -center.x;
      instance.position.y = -center.y;
      instance.position.z = -center.z;

      const bagWrapper = new THREE.Group();
      bagWrapper.add(instance);

      if (size.z > size.x) {
        bagWrapper.rotation.y = Math.PI / 2;
      }

      const maxDim = Math.max(size.x, size.y, size.z);
      const targetDim = 3.6;
      const scale = maxDim > 0 ? targetDim / maxDim : 1;
      bagWrapper.scale.setScalar(scale);

      instance.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          if (m.material) {
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.roughness = Math.max(0.25, mat.roughness ?? 0.4);
            mat.envMapIntensity = 1.3;
          }
        }
      });

      rootGroup.add(bagWrapper);
      setIsLoading(false);

      if (!isInteractive) {
        renderer.render(scene, camera);
        try {
          const shot = dom.toDataURL("image/webp", 0.92);
          bagSnapshotCache.set(cacheKey, shot);
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

      startInteractiveLoop();
    };

    // 6. Load or Reuse Cached GLTF Model by modelUrl
    if (cachedBagGltfMap.has(modelUrl)) {
      mountBagScene(cachedBagGltfMap.get(modelUrl)!);
    } else if (bagLoadingUrls.has(modelUrl)) {
      const cbs = bagLoadCallbacksMap.get(modelUrl) || [];
      cbs.push((scene) => {
        if (isSubscribed) mountBagScene(scene);
      });
      bagLoadCallbacksMap.set(modelUrl, cbs);
    } else {
      bagLoadingUrls.add(modelUrl);
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          cachedBagGltfMap.set(modelUrl, gltf.scene);
          bagLoadingUrls.delete(modelUrl);
          if (isSubscribed) mountBagScene(gltf.scene);
          const cbs = bagLoadCallbacksMap.get(modelUrl) || [];
          cbs.forEach((cb) => cb(gltf.scene));
          bagLoadCallbacksMap.delete(modelUrl);
        },
        undefined,
        (err) => {
          console.warn("Error loading Bag 3D model:", err);
          bagLoadingUrls.delete(modelUrl);
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
      window.removeEventListener("resize", handleResize);
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
    <div className={`relative w-full h-full min-h-[190px] select-none ${className}`}>
      {/* 1. Nếu có ảnh Snapshot (chế độ không tương tác) -> hiển thị ảnh tĩnh mượt mà, 0 tốn WebGL */}
      {!isInteractive && snapshotUrl ? (
        <img
          src={snapshotUrl}
          alt="3D Bag Model"
          className="w-full h-full object-contain pointer-events-none drop-shadow-md animate-fadeIn"
        />
      ) : hasWebGLError ? (
        /* 2. Giao diện Vector bảo vệ khi WebGL bị mất context */
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-2xl opacity-20 blur-xl animate-pulse"
              style={{ backgroundColor: color }}
            />
            <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-md">
              <path
                d="M32 38 C32 18, 68 18, 68 38"
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M20 38 L25 88 C25 91, 75 91, 75 88 L80 38 Z"
                fill={color}
                opacity="0.85"
              />
              <path
                d="M28 48 L72 48 M26 58 L74 58 M25 68 L75 68 M25 78 L75 78"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
                strokeDasharray="2,2"
              />
            </svg>
          </div>
          <span className="text-[10px] font-bold text-slate-500 mt-2">Mẫu Túi NÉT Tái Sinh</span>
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
          <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
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
            <span>3D Xoay 360°</span>
          </span>
        </div>
      )}
    </div>
  );
};
