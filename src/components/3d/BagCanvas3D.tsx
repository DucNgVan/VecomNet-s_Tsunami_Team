"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { createConfiguredGLTFLoader } from "@/lib/gltfLoader";
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

// Global cache for parsed bag 3D GLTF models
const bagGltfModelCache = new Map<string, THREE.Group>();

export const BagCanvas3D = forwardRef<BagCanvas3DHandle, BagCanvas3DProps>(
  (
    {
      bagBase,
      selectedColor,
      placedCharms,
      className = "",
      isInteractive = true,
      modelUrl,
    },
    ref
  ) => {
    const activeModelUrl =
      modelUrl ||
      selectedColor?.model3dUrl ||
      bagBase?.model3dUrl ||
      "/assets/models/tuixach-xanh-la.glb";

    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const bagGroupRef = useRef<THREE.Group | null>(null);
    const modelContainerRef = useRef<THREE.Group | null>(null);
    const charmsContainerRef = useRef<THREE.Group | null>(null);
    const underGlowRef = useRef<THREE.PointLight | null>(null);

    const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
    const [isGlbActive, setIsGlbActive] = useState<boolean>(false);
    const [hasWebGlError, setHasWebGlError] = useState<boolean>(false);

    // Rotation state refs to allow imperative reset and smooth dampening
    const targetRotYRef = useRef<number>(0);
    const targetRotXRef = useRef<number>(0);

    // Expose imperative methods to parent
    useImperativeHandle(ref, () => ({
      captureSnapshot: () => {
        if (!rendererRef.current || !sceneRef.current) return null;
        try {
          return rendererRef.current.domElement.toDataURL("image/png");
        } catch {
          return null;
        }
      },
      resetView: () => {
        targetRotYRef.current = 0;
        targetRotXRef.current = 0;
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

      // Check WebGL availability safely
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        });
      } catch (err) {
        console.warn("WebGL not supported or failed to initialize:", err);
        setHasWebGlError(true);
        setIsLoadingModel(false);
        return;
      }

      // 1. Scene & Camera setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0.2, 7.2);

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;
      container.appendChild(renderer.domElement);

      // 3. Studio Lighting Rig - True-to-life studio lighting (prevents overexposure/washing out)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      // Primary Key Daylight
      const sunLight = new THREE.DirectionalLight(0xfffdf7, 1.35);
      sunLight.position.set(3.5, 6.5, 5);
      sunLight.castShadow = true;
      scene.add(sunLight);

      // Soft Daylight Fill
      const skyLight = new THREE.DirectionalLight(0xf8fafc, 0.6);
      skyLight.position.set(-3.5, 2, 3.5);
      scene.add(skyLight);

      // Subtle Rim Light for outline separation
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.45);
      rimLight.position.set(0, 4.5, -5);
      scene.add(rimLight);

      // Soft Under-Glow (gentle accent, not blinding)
      const underGlow = new THREE.PointLight(
        new THREE.Color(selectedColor.glowHex || "#38bdf8"),
        0.5,
        7
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

      const charmsContainer = new THREE.Group();
      charmsContainerRef.current = charmsContainer;
      bagRoot.add(charmsContainer);

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

      // 5. Asynchronously Load the Uploaded Bag Model
      setIsLoadingModel(true);

      if (bagGltfModelCache.has(activeModelUrl)) {
        modelContainer.clear();
        const cachedGroup = bagGltfModelCache.get(activeModelUrl)!.clone(true);
        modelContainer.add(cachedGroup);
        setIsGlbActive(true);
        setIsLoadingModel(false);
      } else if (activeModelUrl) {
        const loader = createConfiguredGLTFLoader();
        loader.load(
          activeModelUrl,
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

            // Rotate -90 degrees around Y axis so the front face faces directly towards camera (+Z) if needed
            if (size.z > size.x) {
              glbWrapper.rotation.y = -Math.PI / 2;
            }

            // Material enhancements: preserve authored PBR textures and matte fabric surface
            loadedScene.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh;
                m.castShadow = true;
                m.receiveShadow = true;
                if (m.material) {
                  const mat = m.material as THREE.MeshStandardMaterial;
                  mat.side = THREE.DoubleSide;
                  // Respect authored fabric roughness - avoid overriding to artificial glossy shine
                  mat.roughness = 1.0;
                  mat.metalness = 0.0;
                  mat.envMapIntensity = 0.6;
                }
              }
            });

            bagGltfModelCache.set(activeModelUrl, glbWrapper);
            modelContainer.add(glbWrapper.clone(true));
            setIsGlbActive(true);
            setIsLoadingModel(false);
          },
          undefined,
          (err) => {
            console.warn("Bag GLTF Load fallback:", err);
            if (!isSubscribed) return;

            // Nếu modelUrl tải thất bại (ví dụ đường dẫn 404), tự động chuyển sang mô hình 3D chuẩn có sẵn trong /assets/models/
            const colorName = (selectedColor?.name || "").toLowerCase();
            const defaultModel = colorName.includes("dương")
              ? "/assets/models/tuixach-xanh-duong.glb"
              : colorName.includes("hồng")
              ? "/assets/models/tuixach-hong.glb"
              : colorName.includes("tía") || colorName.includes("đỏ")
              ? "/assets/models/tuixach-do-tia.glb"
              : colorName.includes("đen")
              ? "/assets/models/tuixach-den.glb"
              : "/assets/models/tuixach-xanh-la.glb";

            if (activeModelUrl !== defaultModel) {
              console.log("[BagCanvas3D] Đang tải mô hình 3D chuẩn thay thế:", defaultModel);
              loader.load(
                defaultModel,
                (fallbackGltf) => {
                  if (!isSubscribed) return;
                  modelContainer.clear();
                  const sceneObj = fallbackGltf.scene;
                  const box = new THREE.Box3().setFromObject(sceneObj);
                  const center = box.getCenter(new THREE.Vector3());
                  const size = box.getSize(new THREE.Vector3());
                  sceneObj.position.x = -center.x;
                  sceneObj.position.y = -center.y;
                  sceneObj.position.z = -center.z;
                  const wrapper = new THREE.Group();
                  wrapper.add(sceneObj);
                  const maxDim = Math.max(size.x, size.y, size.z);
                  const scale = maxDim > 0 ? 3.5 / maxDim : 1;
                  wrapper.scale.setScalar(scale);
                  if (size.z > size.x) wrapper.rotation.y = -Math.PI / 2;
                  modelContainer.add(wrapper);
                  setIsGlbActive(true);
                  setIsLoadingModel(false);
                },
                undefined,
                () => {
                  buildProceduralFallback();
                  setIsGlbActive(false);
                  setIsLoadingModel(false);
                }
              );
              return;
            }

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

        targetRotYRef.current += deltaX * 0.008;
        targetRotXRef.current = Math.max(-0.45, Math.min(0.45, targetRotXRef.current + deltaY * 0.005));
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      // Double-click to snap back to direct front view
      const onDoubleClick = () => {
        targetRotYRef.current = 0;
        targetRotXRef.current = 0;
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

        targetRotYRef.current += deltaX * 0.01;
        targetRotXRef.current = Math.max(-0.45, Math.min(0.45, targetRotXRef.current + deltaY * 0.007));
      };

      const dom = renderer.domElement;
      dom.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      dom.addEventListener("dblclick", onDoubleClick);

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

      // 7. Animation Loop with Front-Facing Ambient Breathing (No infinite spinning)
      let animId: number;
      let clock = new THREE.Clock();

      const animate = () => {
        animId = requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        if (bagRoot) {
          // Subtle ambient breathing sway around front view (keeps front face facing user)
          const ambientSwayY = isDragging ? 0 : Math.sin(elapsedTime * 0.8) * 0.04;
          const ambientSwayX = isDragging ? 0 : Math.cos(elapsedTime * 0.6) * 0.02;

          // Smooth interpolation towards target rotation + ambient sway
          bagRoot.rotation.y += (targetRotYRef.current + ambientSwayY - bagRoot.rotation.y) * 0.08;
          bagRoot.rotation.x += (targetRotXRef.current + ambientSwayX - bagRoot.rotation.x) * 0.08;

          // Subtle floating levitation
          bagRoot.position.y = Math.sin(elapsedTime * 1.5) * 0.05;
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        isSubscribed = false;
        dom.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        dom.removeEventListener("dblclick", onDoubleClick);
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
    }, [bagBase, activeModelUrl, isInteractive]);

    // Update dynamic under-glow color when selectedColor changes
    useEffect(() => {
      if (underGlowRef.current) {
        underGlowRef.current.color.set(selectedColor.glowHex || "#38bdf8");
      }
    }, [selectedColor]);

    // Dynamic 3D Charms Placement on Bag (Supports 3D models GLB, Custom AI Charms, and 2D Image Charms)
    useEffect(() => {
      const container = charmsContainerRef.current;
      if (!container) return;
      container.clear();

      if (!placedCharms || placedCharms.length === 0) return;

      let isCurrent = true;
      const gltfLoader = createConfiguredGLTFLoader();
      const textureLoader = new THREE.TextureLoader();

      // Shared luxury brass/gold hardware material for frames, eyelets and clips
      const goldHardwareMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xd4af37), // Polished brass / artisan gold
        metalness: 0.88,
        roughness: 0.22,
        envMapIntensity: 1.2,
      });

      // Helper to render high-fidelity physical 3D die-cut keychain (No outer frame/coin, contoured to subject)
      const renderPendantCharm = (
        placed: PlacedCharm,
        parentGroup: THREE.Group
      ) => {
        const charmImg = placed.charm.image;
        const charmColor = placed.charm.color || "#B85D43";
        const charmSize = 0.55;

        const pendant = new THREE.Group();
        pendant.renderOrder = 10;

        // 1. Hanging Clasp Hardware (hooks onto tote bag mesh at top of charm)
        // Top eyelet loop on the head of the die-cut character
        const eyeletGeo = new THREE.TorusGeometry(0.032, 0.007, 14, 28);
        const eyeletMesh = new THREE.Mesh(eyeletGeo, goldHardwareMat);
        eyeletMesh.position.set(0, charmSize * 0.44, 0.006);
        eyeletMesh.castShadow = true;
        eyeletMesh.renderOrder = 10;
        pendant.add(eyeletMesh);

        // Suspension link / clip hook hooking onto bag net
        const clipGeo = new THREE.TorusGeometry(0.024, 0.006, 14, 24);
        const clipMesh = new THREE.Mesh(clipGeo, goldHardwareMat);
        clipMesh.position.set(0, charmSize * 0.44 + 0.034, 0);
        clipMesh.rotation.y = Math.PI / 2;
        clipMesh.castShadow = true;
        clipMesh.renderOrder = 10;
        pendant.add(clipMesh);

        // 2. Pure DIE-CUT Charm (Contoured along subject, NO circular frame/coin)
        const planeGeo = new THREE.PlaneGeometry(charmSize, charmSize);

        if (charmImg) {
          const frontMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.12,
            metalness: 0.05,
            clearcoat: 1.0,
            clearcoatRoughness: 0.08,
            transparent: true,
            alphaTest: 0.08, // Cut out all transparent pixels outside the character's contour
            side: THREE.DoubleSide,
            depthWrite: true,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
          });

          textureLoader.load(
            charmImg,
            (tex) => {
              if (!isCurrent) return;
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.generateMipmaps = true;
              tex.minFilter = THREE.LinearMipmapLinearFilter;
              frontMaterial.map = tex;
              frontMaterial.needsUpdate = true;
            },
            undefined,
            () => {
              frontMaterial.color.set(charmColor);
            }
          );

          // Front layer
          const frontMesh = new THREE.Mesh(planeGeo, frontMaterial);
          frontMesh.position.z = 0.006;
          frontMesh.castShadow = true;
          frontMesh.receiveShadow = true;
          frontMesh.renderOrder = 10;
          pendant.add(frontMesh);

          // Back layer (gives 3mm acrylic thickness feel in 3D without any outer frame)
          const backMesh = new THREE.Mesh(planeGeo, frontMaterial);
          backMesh.position.z = -0.006;
          backMesh.castShadow = true;
          backMesh.renderOrder = 10;
          pendant.add(backMesh);
        } else {
          // Fallback procedural charm
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = charmColor;
            ctx.beginPath();
            ctx.roundRect(32, 32, 192, 192, 40);
            ctx.fill();

            ctx.fillStyle = "#FAF7F2";
            ctx.font = "bold 96px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(placed.charm.symbol || "★", 128, 128);
          }
          const canvasTex = new THREE.CanvasTexture(canvas);
          canvasTex.colorSpace = THREE.SRGBColorSpace;

          const fallbackMat = new THREE.MeshPhysicalMaterial({
            map: canvasTex,
            roughness: 0.15,
            metalness: 0.1,
            clearcoat: 1.0,
            transparent: true,
            alphaTest: 0.05,
            side: THREE.DoubleSide,
            depthWrite: true,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
          });
          const fallbackMesh = new THREE.Mesh(planeGeo, fallbackMat);
          fallbackMesh.castShadow = true;
          fallbackMesh.renderOrder = 10;
          pendant.add(fallbackMesh);
        }

        parentGroup.add(pendant);
      };

      // Helper to compute exact surface position and drape orientation on the bag via Raycasting
      const computeBagSurfacePlacement = (placed: PlacedCharm) => {
        // Map 2D percentage coordinates to 3D surface space on tote bag
        const posX = ((placed.x - 50) / 50) * 1.15;
        const posY = -((placed.y - 50) / 50) * 1.25 - 0.15;

        let posZ = 0.52;
        let drapeAngle = 0;
        let hasHit = false;

        const bagRoot = bagGroupRef.current;
        const modelGroup = modelContainerRef.current;

        if (bagRoot && modelGroup && modelGroup.children.length > 0) {
          // Save current bag rotation and reset to neutral identity to align raycasting
          const curRotX = bagRoot.rotation.x;
          const curRotY = bagRoot.rotation.y;
          const curRotZ = bagRoot.rotation.z;

          bagRoot.rotation.set(0, 0, 0);
          bagRoot.updateMatrixWorld(true);

          const raycaster = new THREE.Raycaster();
          raycaster.set(new THREE.Vector3(posX, posY, 5.0), new THREE.Vector3(0, 0, -1));
          const hits = raycaster.intersectObjects(modelGroup.children, true);

          if (hits.length > 0) {
            // Find front-facing surface intersection (facing towards +Z)
            const frontHit = hits.find((h) => h.face && h.face.normal.z > -0.1) || hits[0];
            // Safe 4.5cm protrusion right in front of the bag mesh surface
            posZ = frontHit.point.z + 0.045;
            hasHit = true;

            // Conform subtly to surface slope without ever pitching inward
            if (frontHit.face?.normal) {
              drapeAngle = Math.max(-0.01, Math.min(0.08, -frontHit.face.normal.y * 0.18));
            }
          }

          // Restore bag rotation
          bagRoot.rotation.set(curRotX, curRotY, curRotZ);
          bagRoot.updateMatrixWorld(true);
        }

        // Geometric fallback if ray misses (e.g. model still initializing or placed near extreme edge)
        if (!hasHit) {
          const normY = (placed.y - 50) / 50; // -1 at top, +1 at bottom
          // Tote bottom naturally bulges out to Z ~ 0.55
          const estZ = 0.46 + normY * 0.09;
          posZ = Math.max(0.44, Math.min(0.60, estZ)) + 0.045;
        }

        return { posX, posY, posZ, drapeAngle };
      };

      placedCharms.forEach((placed, idx) => {
        const { posX, posY, posZ, drapeAngle } = computeBagSurfacePlacement(placed);

        const charmGroup = new THREE.Group();
        charmGroup.position.set(posX, posY, posZ);
        charmGroup.rotation.z =
          (placed.rotation || 0) * (Math.PI / 180) +
          (idx % 2 === 0 ? 1 : -1) * 0.04;
        charmGroup.rotation.x = drapeAngle;
        charmGroup.renderOrder = 10;

        container.add(charmGroup);

        // Case 1: 3D GLTF Model available
        if (placed.charm.model3dUrl) {
          gltfLoader.load(
            placed.charm.model3dUrl,
            (gltf) => {
              if (!isCurrent) return;
              const charmInstance = gltf.scene.clone(true);
              const box = new THREE.Box3().setFromObject(charmInstance);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());

              charmInstance.position.x = -center.x;
              charmInstance.position.y = -center.y;
              charmInstance.position.z = -center.z;

              // Orient charm upright
              charmInstance.rotation.x = Math.PI;

              const wrapper = new THREE.Group();
              wrapper.add(charmInstance);

              const maxDim = Math.max(size.x, size.y, size.z);
              const targetDim = 0.55;
              const scale = maxDim > 0 ? targetDim / maxDim : 1;
              wrapper.scale.setScalar(scale);

              charmInstance.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  const m = child as THREE.Mesh;
                  m.castShadow = true;
                  m.renderOrder = 10;
                  if (m.material) {
                    const origMat = m.material as THREE.MeshStandardMaterial;
                    const clonedMat = origMat.clone();
                    if (placed.charm.color) {
                      try {
                        clonedMat.color = new THREE.Color(placed.charm.color);
                        clonedMat.metalness = 0.8;
                        clonedMat.roughness = 0.25;
                      } catch {}
                    }
                    m.material = clonedMat;
                  }
                }
              });

              charmGroup.add(wrapper);
            },
            undefined,
            (err) => {
              console.warn("Failed to load 3D GLTF charm, fallback to 3D pendant:", err);
              renderPendantCharm(placed, charmGroup);
            }
          );
        } else {
          // Case 2 & 3: Custom Charm with Image or Procedural Pendant
          renderPendantCharm(placed, charmGroup);
        }
      });

      return () => {
        isCurrent = false;
      };
    }, [placedCharms, isGlbActive]);

    return (
      <div className={`relative w-full h-full min-h-[420px] select-none ${className}`}>
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* WebGL Fallback Message */}
        {hasWebGlError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-[#FAF7F2]/90 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <span className="text-xl">🎨</span>
            </div>
            <p className="text-sm font-semibold text-[#2D231E]">
              Chế độ phối 2D tiêu chuẩn đang kích hoạt
            </p>
            <p className="text-xs text-[#7A6F68] mt-1 max-w-xs">
              Trình duyệt của bạn đang dùng bản vẽ 2D trực quan. Bạn vẫn có thể chọn charm, kéo vị trí và gửi yêu cầu thiết kế bình thường.
            </p>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoadingModel && !hasWebGlError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
            <Loader2 className="w-7 h-7 text-[#B85D43] animate-spin mb-2" />
            <span className="text-xs font-bold text-[#5E4D43] uppercase tracking-wider">
              Đang Nạp Mô Hình 3D...
            </span>
          </div>
        )}


      </div>
    );
  }
);

BagCanvas3D.displayName = "BagCanvas3D";
