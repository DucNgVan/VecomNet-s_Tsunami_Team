"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const OceanCanvas3D: React.FC<{ interactive?: boolean; className?: string }> = ({
  interactive = true,
  className = "",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Mobile & low-power detection
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 || ("ontouchstart" in window && window.innerWidth < 1024));

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 25;

    // Mobile: disable heavy antialiasing and cap pixelRatio to 1.0 to eliminate GPU fillrate lag
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile,
      powerPreference: "high-performance",
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.75));
    mount.appendChild(renderer.domElement);

    // 1. Floating Bioluminescent Ocean Particles (Plankton / Light Orbs)
    const particleCount = isMobile ? 45 : 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    const baseColor1 = new THREE.Color("#0284c7");
    const baseColor2 = new THREE.Color("#0d9488");
    const baseColor3 = new THREE.Color("#2563eb");

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      const mixedColor = baseColor1.clone().lerp(
        Math.random() > 0.5 ? baseColor2 : baseColor3,
        Math.random()
      );
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;

      scales[i] = Math.random() * 1.5 + 0.6;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Custom circular soft particle texture
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(2, 132, 199, 0.45)");
      gradient.addColorStop(0.5, "rgba(13, 148, 136, 0.2)");
      gradient.addColorStop(0.9, "rgba(56, 189, 248, 0.05)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: isMobile ? 1.4 : 1.1,
      map: texture,
      transparent: true,
      blending: THREE.NormalBlending,
      vertexColors: true,
      depthWrite: false,
      opacity: 0.7,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // 2. Architectural Ghost Net Spiral Curve
    const curvePoints: THREE.Vector3[] = [];
    const numPoints = isMobile ? 50 : 120;
    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      const angle = t * Math.PI * 4;
      const radius = 10 * Math.sin(t * Math.PI);
      const x = Math.cos(angle) * radius;
      const y = (t - 0.5) * 22;
      const z = Math.sin(angle) * radius * 0.7;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      isMobile ? 40 : 90,
      0.25,
      isMobile ? 6 : 8,
      false
    );
    const tubeMaterial = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: isMobile ? 0.09 : 0.12,
      blending: THREE.NormalBlending,
    });
    const netVortex = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(netVortex);

    // Mouse Parallax & Mobile Gyro Drift
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || isMobile) return;
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop with Visibility Check
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let isTabVisible = !document.hidden;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible && !animationFrameId) {
        animate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const animate = () => {
      if (!isTabVisible) {
        animationFrameId = 0;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Mobile organic sway or Desktop mouse follow
      if (isMobile || !interactive) {
        targetX = Math.sin(elapsedTime * 0.3) * 1.5;
        targetY = Math.cos(elapsedTime * 0.25) * 1.2;
      } else {
        targetX += (mouseX * 4 - targetX) * 0.05;
        targetY += (mouseY * 4 - targetY) * 0.05;
      }

      camera.position.x = targetX;
      camera.position.y = -targetY;
      camera.lookAt(scene.position);

      // Rotate net vortex
      netVortex.rotation.y = elapsedTime * (isMobile ? 0.08 : 0.12);
      netVortex.rotation.z = Math.sin(elapsedTime * 0.2) * 0.15;

      // Float particles upwards like underwater marine snow
      const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = positionAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] += 0.04;
        if (posArray[i * 3 + 1] > 25) {
          posArray[i * 3 + 1] = -25;
        }
        posArray[i * 3] += Math.sin(elapsedTime + i) * 0.015;
      }
      positionAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      tubeGeometry.dispose();
      particleMaterial.dispose();
      tubeMaterial.dispose();
      texture.dispose();
    };
  }, [interactive]);

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
      style={{ overflow: "hidden" }}
    />
  );
};
