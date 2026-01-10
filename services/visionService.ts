import { MediaPipeWindow, SegmentationModule } from '../types';

export class VisionService {
  private static instance: VisionService;
  private segmentation: SegmentationModule | null = null;
  private isInitializing: boolean = false;

  private constructor() {}

  public static getInstance(): VisionService {
    if (!VisionService.instance) {
      VisionService.instance = new VisionService();
    }
    return VisionService.instance;
  }

  public async initialize(): Promise<SegmentationModule> {
    if (this.segmentation) return this.segmentation;
    if (this.isInitializing) {
      // Wait for existing initialization
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (this.segmentation) {
            clearInterval(check);
            resolve(this.segmentation);
          }
        }, 100);
      });
    }

    this.isInitializing = true;
    
    // Dynamically access the global window object where the script injected the class
    const mpWindow = window as unknown as MediaPipeWindow;
    
    if (!mpWindow.SelfieSegmentation) {
      throw new Error("MediaPipe SelfieSegmentation script not loaded.");
    }

    const segmentation = new mpWindow.SelfieSegmentation({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      },
    });

    segmentation.setOptions({
      modelSelection: 1, // 0: General, 1: Landscape (lighter/faster for web)
      selfiemode: false, // We handle mirroring manually in canvas usually, but MP can do it too
    });

    await segmentation.initialize(); // Wait for WASM load
    
    this.segmentation = segmentation;
    this.isInitializing = false;
    return this.segmentation;
  }

  public getSegmentation(): SegmentationModule | null {
    return this.segmentation;
  }
}
