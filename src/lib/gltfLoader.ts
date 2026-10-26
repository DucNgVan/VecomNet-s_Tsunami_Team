import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

let sharedDracoLoader: DRACOLoader | null = null;

export function getSharedDracoLoader(): DRACOLoader {
  if (!sharedDracoLoader) {
    sharedDracoLoader = new DRACOLoader();
    if (typeof window !== "undefined") {
      // Ưu tiên decoder WASM local trong public/draco/gltf/
      sharedDracoLoader.setDecoderPath("/draco/gltf/");
      sharedDracoLoader.setDecoderConfig({ type: "wasm" });
      sharedDracoLoader.preload();
    }
  }
  return sharedDracoLoader;
}

export function createConfiguredGLTFLoader(): GLTFLoader {
  const loader = new GLTFLoader();
  if (typeof window !== "undefined") {
    try {
      const draco = getSharedDracoLoader();
      loader.setDRACOLoader(draco);
    } catch (e) {
      console.warn("[GLTFLoader] Không thể khởi tạo DRACOLoader:", e);
    }
  }
  return loader;
}
