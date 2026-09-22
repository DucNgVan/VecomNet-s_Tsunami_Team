"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
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

export const CharmCanvas3D: React.FC<CharmCanvas3DProps> = ({
  modelUrl = "/assets/models/caurongcharm.glb",
  color = "#38bdf8",
  glowColor = "rgba(56, 189, 248, 0.6)",
  className = "",
  isInteractive = true,
  autoRotateSpeed = 0.012,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedCharmGltfScene);

  useEffect(() => {
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

    // 3. Studio Ocean Jewel Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(new THREE.Color(color), 3.0);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    const underGlow = new THREE.PointLight(new THREE.Color(color), 3.0, 8);
    underGlow.position.set(0, -2, 1.5);
    scene.add(underGlow);

    // 4. Root Charm Object
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Helper: Mount and setup cloned charm
    const mountCharmScene = (baseScene: THREE.Group) => {
      rootGroup.clear();

      const instance = baseScene.clone(true);

      const box = new THREE.Box3().setFromObject(instance);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      instance.position.x = -center.x;
      instance.position.y = -center.y;
      instance.position.z = -center.z;

      const charmWrapper = new THREE.Group();
      charmWrapper.add(instance);

      // Rotate 90 degrees if length is along Z
      if (size.z > size.x) {
        charmWrapper.rotation.y = Math.PI / 2;
      }

      // Scale to fit viewport comfortably
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetDim = 1.9;
      const scale = maxDim > 0 ? targetDim / maxDim : 1;
      charmWrapper.scale.setScalar(scale);

      // Apply subtle jewel color accent to cloned materials
      charmWrapper.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
            mat.roughness = Math.max(0.2, mat.roughness ?? 0.35);
            mat.metalness = Math.min(0.9, (mat.metalness ?? 0.5) + 0.1);
            mat.emissive = new THREE.Color(color);
            mat.emissiveIntensity = 0.25;
            mesh.material = mat;
          }
        }
      });

      rootGroup.add(charmWrapper);

      // Add delicate metallic top ring
      const ringGeo = new THREE.TorusGeometry(0.18, 0.035, 12, 24);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        metalness: 0.95,
        roughness: 0.1,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 0.95, 0);
      rootGroup.add(ring);

      if (isSubscribed) {
        setIsLoading(false);
      }
    };

    // 5. Load or reuse cached GLTF
    if (cachedCharmGltfScene) {
      mountCharmScene(cachedCharmGltfScene);
    } else if (isCharmLoading) {
      charmLoadCallbacks.push((scene) => {
        if (isSubscribed) mountCharmScene(scene);
      });
    } else {
      isCharmLoading = true;
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          cachedCharmGltfScene = gltf.scene;
          isCharmLoading = false;
          mountCharmScene(gltf.scene);
          charmLoadCallbacks.forEach((cb) => cb(gltf.scene));
          charmLoadCallbacks.length = 0;
        },
        undefined,
        (err) => {
          console.warn("Failed to load charm model:", err);
          isCharmLoading = false;
          if (isSubscribed) setIsLoading(false);
        }
      );
    }

    // 6. Interactive Dragging (Mouse & Touch)
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      if (!isInteractive) return;
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !isInteractive) return;
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
      if (!isInteractive || e.touches.length === 0) return;
      isDragging = true;
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || !isInteractive || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - prevMouse.x;
      const dy = e.touches[0].clientY - prevMouse.y;

      rootGroup.rotation.y += dx * 0.012;
      rootGroup.rotation.x = Math.max(-0.6, Math.min(0.6, rootGroup.rotation.x + dy * 0.01));

      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    dom.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onMouseUp);

    // 7. Render Loop
    let animId: number;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const t = clock.getElapsedTime();

      // Gentle auto-rotation and floating when not dragging
      if (!isDragging) {
        rootGroup.rotation.y += autoRotateSpeed;
        rootGroup.position.y = Math.sin(t * 1.8) * 0.05;
      }

      renderer.render(scene, camera);
    };
    renderLoop();

    return () => {
      isSubscribed = false;
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
      cancelAnimationFrame(animId);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelUrl, color, isInteractive, autoRotateSpeed]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden ${className}`}>
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/60 backdrop-blur-xs pointer-events-none">
          <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
        </div>
      )}

      {/* Discreet 3D Indicator */}
      {isInteractive && !isLoading && (
        <div className="absolute bottom-2 right-2 pointer-events-none px-2 py-0.5 rounded-full bg-slate-900/60 backdrop-blur-md text-[10px] text-white/90 flex items-center gap-1">
          <RotateCw className="w-2.5 h-2.5 text-sky-400" />
          <span>3D 360°</span>
        </div>
      )}
    </div>
  );
};
