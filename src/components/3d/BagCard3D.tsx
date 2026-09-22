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

// Global cached GLTF scene to ensure tuixach.glb is downloaded only once
let cachedBagGltfScene: THREE.Group | null = null;
let isBagLoading = false;
const bagLoadCallbacks: ((scene: THREE.Group) => void)[] = [];

export const BagCard3D: React.FC<BagCard3DProps> = ({
  modelUrl = "/assets/models/tuixach.glb",
  color = "#0c2340",
  glowColor = "#38bdf8",
  className = "",
  isInteractive = true,
  autoRotateSpeed = 0.008,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedBagGltfScene);

  useEffect(() => {
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
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.6);
    keyLight.position.set(3, 6, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 1.8);
    fillLight.position.set(-3, -1, 3);
    scene.add(fillLight);

    // Dynamic Underglow matching bag color
    const underGlow = new THREE.PointLight(new THREE.Color(glowColor || color), 3.0, 9);
    underGlow.position.set(0, -2.5, 1.5);
    scene.add(underGlow);

    // 4. Root Bag Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Helper: Mount and auto-fit cloned bag model
    const mountBagScene = (baseScene: THREE.Group) => {
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

      // Rotate 90 degrees if depth is larger than width so front faces camera
      if (size.z > size.x) {
        bagWrapper.rotation.y = Math.PI / 2;
      }

      // Auto-scale to comfortably fit the card stage
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetDim = 3.6;
      const scale = maxDim > 0 ? targetDim / maxDim : 1;
      bagWrapper.scale.setScalar(scale);

      // Materials
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
    };

    // 5. Load or Reuse Cached GLTF Model (tuixach.glb)
    if (cachedBagGltfScene) {
      mountBagScene(cachedBagGltfScene);
    } else if (isBagLoading) {
      bagLoadCallbacks.push((scene) => {
        if (isSubscribed) mountBagScene(scene);
      });
    } else {
      isBagLoading = true;
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          cachedBagGltfScene = gltf.scene;
          isBagLoading = false;
          if (isSubscribed) mountBagScene(gltf.scene);
          bagLoadCallbacks.forEach((cb) => cb(gltf.scene));
          bagLoadCallbacks.length = 0;
        },
        undefined,
        (err) => {
          console.warn("Error loading Bag 3D card model:", err);
          isBagLoading = false;
          setIsLoading(false);
        }
      );
    }

    // 6. Interactive Orbit & Drag Rotation
    let isDragging = false;
    let prevX = 0;
    let targetRotY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (!isInteractive) return;
      isDragging = true;
      prevX = e.clientX;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isInteractive || !isDragging) return;
      const deltaX = e.clientX - prevX;
      prevX = e.clientX;
      targetRotY += deltaX * 0.012;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!isInteractive || e.touches.length === 0) return;
      isDragging = true;
      prevX = e.touches[0].clientX;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isInteractive || !isDragging || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - prevX;
      prevX = e.touches[0].clientX;
      targetRotY += deltaX * 0.015;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    dom.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onMouseUp);

    // 7. Animation Loop with smooth dampening
    let animId: number;
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

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 280;
      const h = container.clientHeight || 240;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      isSubscribed = false;
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelUrl, color, glowColor, isInteractive, autoRotateSpeed]);

  return (
    <div className={`relative w-full h-full min-h-[190px] select-none ${className}`}>
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/60 backdrop-blur-xs pointer-events-none">
          <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
        </div>
      )}

      {/* Interactive 3D Badge */}
      {isInteractive && !isLoading && (
        <div className="absolute top-2 left-2 pointer-events-none z-10">
          <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 text-[9px] font-bold text-sky-800 shadow-xs flex items-center gap-1">
            <RotateCw className="w-2.5 h-2.5 text-sky-600 animate-spin" style={{ animationDuration: "6s" }} />
            <span>3D Xoay 360°</span>
          </span>
        </div>
      )}
    </div>
  );
};
