"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BagBase, BagMeshColor, PlacedCharm } from "@/types";
import { Loader2 } from "lucide-react";

export interface BagCanvas3DHandle {
  captureSnapshot: () => string | null;
  resetView: () => void;
}

interface BagCanvas3DProps {
  bagBase: BagBase;
  selectedColor: BagMeshColor;
  placedCharms?: PlacedCharm[];
  className?: string;
  isInteractive?: boolean;
  modelUrl?: string;
}

export const BagCanvas3D = forwardRef<BagCanvas3DHandle, BagCanvas3DProps>(
  (
    {
      bagBase,
      selectedColor,
      className = "",
      isInteractive = true,
      modelUrl = "/assets/models/tuixach.glb",
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const bagGroupRef = useRef<THREE.Group | null>(null);
    const modelContainerRef = useRef<THREE.Group | null>(null);
    const underGlowRef = useRef<THREE.PointLight | null>(null);

    const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
    const [isGlbActive, setIsGlbActive] = useState<boolean>(false);

    // Expose imperative methods to parent
    useImperativeHandle(ref, () => ({
      captureSnapshot: () => {
        if (!rendererRef.current || !sceneRef.current) return null;
        return rendererRef.current.domElement.toDataURL("image/png");
      },
      resetView: () => {
        if (bagGroupRef.current) {
          bagGroupRef.current.rotation.set(0, 0, 0);
        }
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      let isSubscribed = true;
      const width = container.clientWidth || 500;
      const height = container.clientHeight || 500;

      // 1. Scene & Camera setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0.2, 7.2);

      // 2. High-Performance WebGL Renderer with Alpha & ACES Tone Mapping
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.68;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;
      container.appendChild(renderer.domElement);

      // 3. Studio Lighting Rig
      const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
      scene.add(ambientLight);

      // Primary Key Sunbeam
      const sunLight = new THREE.DirectionalLight(0xffffff, 3.8);
      sunLight.position.set(4, 8, 6);
      sunLight.castShadow = true;
      scene.add(sunLight);

      // Soft Skylight Fill
      const skyLight = new THREE.DirectionalLight(0x7dd3fc, 2.0);
      skyLight.position.set(-4, -2, 4);
      scene.add(skyLight);

      // Rim Light for edge definition
      const rimLight = new THREE.DirectionalLight(0xffffff, 2.4);
      rimLight.position.set(0, 5, -6);
      scene.add(rimLight);

      // Dynamic Under-Glow matching current ocean color
      const underGlow = new THREE.PointLight(
        new THREE.Color(selectedColor.glowHex || "#38bdf8"),
        3.5,
        10
      );
      underGlow.position.set(0, -2.4, 1.2);
      scene.add(underGlow);
      underGlowRef.current = underGlow;

      // 4. Root Groups
      const bagRoot = new THREE.Group();
      bagGroupRef.current = bagRoot;
      scene.add(bagRoot);

      const modelContainer = new THREE.Group();
      modelContainerRef.current = modelContainer;
      bagRoot.add(modelContainer);

      // Helper: Build procedural fallback mesh for bag
      const buildProceduralFallback = () => {
        modelContainer.clear();

        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.fillStyle = selectedColor.hex;
          ctx.fillRect(0, 0, 512, 512);
          ctx.strokeStyle = selectedColor.accentHex;
          ctx.lineWidth = 3;
          const step = 32;
          for (let i = -512; i < 1024; i += step) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 512, 512);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(i, 512);
            ctx.lineTo(i + 512, 0);
            ctx.stroke();
          }
        }
        const netTex = new THREE.CanvasTexture(c);
        netTex.wrapS = THREE.RepeatWrapping;
        netTex.wrapT = THREE.RepeatWrapping;
        netTex.repeat.set(4, 3);

        const bodyGeo = new THREE.BoxGeometry(2.7, 3.2, 1.4, 24, 24, 24);
        const bodyMat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(selectedColor.hex),
          map: netTex,
          roughness: 0.25,
          metalness: 0.1,
          transmission: 0.35,
          thickness: 0.6,
          ior: 1.45,
          clearcoat: 0.8,
          side: THREE.DoubleSide,
        });
        const fallbackMesh = new THREE.Mesh(bodyGeo, bodyMat);
        modelContainer.add(fallbackMesh);

        // Handles
        const handleCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.9, 1.5, 0.4),
          new THREE.Vector3(-0.8, 2.7, 0.4),
          new THREE.Vector3(0, 3.1, 0.4),
          new THREE.Vector3(0.8, 2.7, 0.4),
          new THREE.Vector3(0.9, 1.5, 0.4),
        ]);
        const handleMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#0c2340"),
          roughness: 0.3,
          metalness: 0.6,
        });
        const h1 = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 32, 0.08, 12, false), handleMat);
        modelContainer.add(h1);
        const h2 = h1.clone();
        h2.position.z = -0.8;
        modelContainer.add(h2);
      };

      // 5. Asynchronously Load the Uploaded Bag Model (tuixach.glb)
      // Note: As requested, the 3D bag serves as the pure sample 3D bag without charms attached.
      setIsLoadingModel(true);

      if (modelUrl) {
        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => {
            if (!isSubscribed) return;

            modelContainer.clear();
            const loadedScene = gltf.scene;

            // Compute exact bounding box and dimensions
            const box = new THREE.Box3().setFromObject(loadedScene);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Center model at origin
            loadedScene.position.x = -center.x;
            loadedScene.position.y = -center.y;
            loadedScene.position.z = -center.z;

            const glbWrapper = new THREE.Group();
            glbWrapper.add(loadedScene);

            // Auto-scale to fit canvas viewport nicely
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 3.5;
            const scale = maxDim > 0 ? targetSize / maxDim : 1;
            glbWrapper.scale.setScalar(scale);

            // Rotate 90 degrees if depth is larger than width so front faces camera
            if (size.z > size.x) {
              glbWrapper.rotation.y = Math.PI / 2;
            }

            // Material enhancements
            loadedScene.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh;
                m.castShadow = true;
                m.receiveShadow = true;
                if (m.material) {
                  const mat = m.material as THREE.MeshStandardMaterial;
                  mat.roughness = Math.max(0.25, mat.roughness ?? 0.4);
                  mat.envMapIntensity = 1.4;
                }
              }
            });

            modelContainer.add(glbWrapper);
            setIsGlbActive(true);
            setIsLoadingModel(false);
          },
          undefined,
          (err) => {
            console.warn("Bag GLTF Load fallback:", err);
            if (!isSubscribed) return;
            buildProceduralFallback();
            setIsGlbActive(false);
            setIsLoadingModel(false);
          }
        );
      } else {
        buildProceduralFallback();
        setIsLoadingModel(false);
      }

      // 6. Interactive Orbit & Drag Controls
      let isDragging = false;
      let prevMouseX = 0;
      let prevMouseY = 0;
      let targetRotY = 0;
      let targetRotX = 0;

      const onMouseDown = (e: MouseEvent) => {
        if (!isInteractive) return;
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isInteractive || !isDragging) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        targetRotY += deltaX * 0.008;
        targetRotX = Math.max(-0.45, Math.min(0.45, targetRotX + deltaY * 0.005));
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      // Touch interactions for mobile
      const onTouchStart = (e: TouchEvent) => {
        if (!isInteractive || e.touches.length === 0) return;
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!isInteractive || !isDragging || e.touches.length === 0) return;
        const deltaX = e.touches[0].clientX - prevMouseX;
        const deltaY = e.touches[0].clientY - prevMouseY;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;

        targetRotY += deltaX * 0.01;
        targetRotX = Math.max(-0.45, Math.min(0.45, targetRotX + deltaY * 0.007));
      };

      const dom = renderer.domElement;
      dom.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);

      dom.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onMouseUp);

      // Handle Resize
      const handleResize = () => {
        if (!container) return;
        const newW = container.clientWidth || 500;
        const newH = container.clientHeight || 500;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };
      window.addEventListener("resize", handleResize);

      // 7. Animation Loop with Gentle Drift and Slerp Dampening
      let animId: number;
      let clock = new THREE.Clock();

      const animate = () => {
        animId = requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        if (bagRoot) {
          if (!isDragging) {
            // Gentle ambient breathing rotation
            targetRotY += 0.0018;
          }

          // Smooth interpolation towards target rotation
          bagRoot.rotation.y += (targetRotY - bagRoot.rotation.y) * 0.08;
          bagRoot.rotation.x += (targetRotX - bagRoot.rotation.x) * 0.08;

          // Subtle floating levitation
          bagRoot.position.y = Math.sin(elapsedTime * 1.5) * 0.06;
        }

        renderer.render(scene, camera);
      };

      animate();

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
    }, [bagBase, modelUrl, isInteractive]);

    // Update dynamic under-glow color when selectedColor changes
    useEffect(() => {
      if (underGlowRef.current) {
        underGlowRef.current.color.set(selectedColor.glowHex || "#38bdf8");
      }
    }, [selectedColor]);

    return (
      <div className={`relative w-full h-full min-h-[420px] select-none ${className}`}>
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Loading Spinner */}
        {isLoadingModel && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
            <Loader2 className="w-7 h-7 text-sky-600 animate-spin mb-2" />
            <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
              Đang Tải Túi Mẫu 3D...
            </span>
          </div>
        )}

        {/* Floating 3D Badge & Status */}
        {isInteractive && !isLoadingModel && (
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center pointer-events-none px-4">
            <div className="px-4 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/20 text-white text-xs flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-[11px]">
                {isGlbActive ? "Túi Mẫu 3D Tiêu Chuẩn" : "Túi 3D Mẫu"} • Xoay 360°
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

BagCanvas3D.displayName = "BagCanvas3D";
