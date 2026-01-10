export interface SegmentationResult {
  segmentationMask: ImageBitmap;
  image: ImageBitmap;
}

export type SegmentationModule = {
  setOptions: (options: { modelSelection: number; selfiemode?: boolean }) => void;
  onResults: (callback: (results: SegmentationResult) => void) => void;
  send: (inputs: { image: HTMLVideoElement | HTMLCanvasElement }) => Promise<void>;
  close: () => Promise<void>;
  initialize: () => Promise<void>;
};

export interface MediaPipeWindow extends Window {
  SelfieSegmentation: new (config: { locateFile: (file: string) => string }) => SegmentationModule;
  Camera: new (video: HTMLVideoElement, config: { onFrame: () => Promise<void>; width: number; height: number }) => { start: () => Promise<void>; stop: () => void };
}

export type FilterType = 'none' | 'grayscale' | 'sepia' | 'contrast' | 'cyberpunk';
export type BackgroundType = 'none' | 'blur' | 'image' | 'color';
export type CaptureMode = 'photo' | 'gif' | 'boomerang' | 'strip';

export interface AppState {
  screen: 'home' | 'booth' | 'review';
  capturedImage: string | null; // Data URL (image/jpeg or video/webm)
  email: string;
}

export interface BoothConfig {
  filter: FilterType;
  backgroundType: BackgroundType;
  backgroundImageUrl: string | null;
  backgroundColor: string;
  overlayUrl: string | null;
  countdown: number;
}