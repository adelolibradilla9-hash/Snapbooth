
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VisionService } from '../services/visionService.ts';
import { BackgroundType, FilterType, SegmentationResult } from '../types.ts';
import { Camera, RefreshCw, Upload, Video, Repeat, Loader, ArrowRight, ArrowLeft, ToggleLeft, ToggleRight, Info, CheckCircle, Clock, ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react';
import { Button } from './Button.tsx';
import { BACKGROUND_OPTIONS, COUNTDOWN_SECONDS } from '../constants.ts';

interface CameraBoothProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

const FRAME_STYLES = [
  { 
    id: 'classic-white', 
    name: 'Classic White', 
    bgColor: '#ffffff', 
    borderColor: '#e5e5e5', 
    textColor: '#1a1a1a', 
    icon: '⬜',
    mask: 'rect'
  },
  { 
    id: 'classic-black', 
    name: 'Classic Black', 
    bgColor: '#1a1a1a', 
    borderColor: '#333333', 
    textColor: '#ffffff',
    icon: '⬛',
    mask: 'rect'
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    bgColor: '#a5d6d9',
    borderColor: '#ffffff',
    textColor: '#1a5c68',
    mask: 'rect',
    icon: '🌊'
  },
  {
    id: 'pinky',
    name: 'Soft Pink',
    bgColor: '#ffe4e9',
    borderColor: '#ff69b4',
    textColor: '#d147a3',
    mask: 'rect',
    icon: '🌸'
  },
  {
    id: 'red-ribbon',
    name: 'Red Ribbon',
    bgColor: '#050505', 
    borderColor: '#333', 
    textColor: '#ffffff',
    mask: 'rect',
    icon: '🎀'
  },
  {
    id: 'doodles',
    name: 'Doodles',
    bgColor: '#000000',
    borderColor: '#333',
    textColor: '#ffffff',
    mask: 'rect',
    icon: '✏️'
  },
  { 
    id: 'cute-hearts', 
    name: 'Love Hearts', 
    bgColor: '#ffc0cb',
    borderColor: '#ff69b4', 
    textColor: '#db7093', 
    icon: '🐷',
    mask: 'heart'
  },
  { 
    id: 'vintage', 
    name: 'Vintage', 
    bgColor: '#fdf5e6',
    borderColor: '#deb887',
    textColor: '#8b4513',
    decoration: '✨',
    icon: '✨',
    mask: 'rect'
  },
  {
      id: 'film',
      name: 'Film Strip',
      bgColor: '#000000',
      borderColor: '#333333',
      textColor: '#ff4500',
      decoration: '🎞️',
      icon: '🎞️',
      mask: 'rect'
  }
];

export const CameraBooth: React.FC<CameraBoothProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<number>();
  
  const [capturedShots, setCapturedShots] = useState<string[]>([]);
  const [isShootingSequence, setIsShootingSequence] = useState(false);
  
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isGrayscale, setIsGrayscale] = useState(false);
  
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [timerDuration, setTimerDuration] = useState(3);
  
  const isGrayscaleRef = useRef(isGrayscale);
  
  useEffect(() => {
    isGrayscaleRef.current = isGrayscale;
  }, [isGrayscale]);

  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          await new Promise<void>((resolve) => {
             if(videoRef.current) videoRef.current.onloadedmetadata = () => resolve();
          });
          videoRef.current.play();
        }
        
        setIsLoadingAI(false);

        // Fix: Added timestamp argument to renderLoop to match requestAnimationFrame signature
        // and passed it to drawFrame to resolve potential argument mismatch errors.
        const renderLoop = (time: number) => {
            if (!active) return;
            drawFrame(time);
            requestRef.current = requestAnimationFrame(renderLoop);
        };
        // Fix: Start the loop with requestAnimationFrame to ensure the first call has a valid timestamp.
        requestRef.current = requestAnimationFrame(renderLoop);

      } catch (err) {
        console.error("Camera Init Error:", err);
        setIsLoadingAI(false);
      }
    };

    startCamera();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []); 

  // Fix: Updated drawFrame to accept an optional timestamp argument to satisfy strict type checking
  // when called from requestAnimationFrame-driven loops.
  const drawFrame = useCallback((_time?: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
      }

      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      if (isGrayscaleRef.current) {
          ctx.filter = 'grayscale(100%) contrast(1.1)';
      } else {
          ctx.filter = 'none';
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
  }, []);

  const shotsRef = useRef<string[]>([]);
  
  const handleStartButton = async () => {
      if (isShootingSequence) return;
      setIsShootingSequence(true);
      shotsRef.current = [];
      setCapturedShots([]);

      for (let i = 0; i < 4; i++) {
          await runCountdownAndCapture();
          await new Promise(r => setTimeout(r, 1000));
      }

      await generateStripImage();
      setIsShootingSequence(false);
  };

  const runCountdownAndCapture = (): Promise<void> => {
      return new Promise((resolve) => {
          let count = timerDuration;
          setCountdown(count);
          
          const timer = setInterval(() => {
              count--;
              if (count < 0) {
                  clearInterval(timer);
                  setCountdown(null);
                  resolve();
              } else if (count === 0) {
                   setCountdown(0);
                   captureSingleShot();
              } else {
                  setCountdown(count);
              }
          }, 1000);
      });
  };

  const captureSingleShot = () => {
      if (!canvasRef.current) return;
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      shotsRef.current.push(dataUrl);
      setCapturedShots([...shotsRef.current]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const filesToProcess = Array.from(files).slice(0, 4) as File[];

      try {
          const loadedImages = await Promise.all(
              filesToProcess.map(file => {
                  return new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                          resolve(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                  });
              })
          );

          let finalShots = [...loadedImages];
          if (finalShots.length > 0) {
              while (finalShots.length < 4) {
                  finalShots = [...finalShots, ...loadedImages];
              }
              finalShots = finalShots.slice(0, 4);
              
              shotsRef.current = finalShots;
              setCapturedShots(finalShots);
              await generateStripImage();
          }
      } catch (error) {
          console.error("Error reading uploaded files:", error);
      }
      
      e.target.value = ''; 
  };

  const drawHeartPath = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.beginPath();
    const topCurveHeight = height * 0.3;
    ctx.moveTo(x + width / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x + width / 2, y, x, y, x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y + (height + topCurveHeight) / 2, x + width / 2, y + (height + topCurveHeight) / 2, x + width / 2, y + height);
    ctx.bezierCurveTo(x + width / 2, y + (height + topCurveHeight) / 2, x + width, y + (height + topCurveHeight) / 2, x + width, y + topCurveHeight);
    ctx.bezierCurveTo(x + width, y, x + width / 2, y, x + width / 2, y + topCurveHeight);
    ctx.closePath();
  };

  const generateStripImage = async () => {
      setIsProcessing(true);
      const shots = shotsRef.current;
      const currentFrame = FRAME_STYLES[selectedFrameIndex];
      
      const STRIP_WIDTH = 400;
      const PADDING = 20;
      const PHOTO_WIDTH = STRIP_WIDTH - (PADDING * 2);
      const PHOTO_HEIGHT = PHOTO_WIDTH * 0.75; 
      const FOOTER_HEIGHT = 100;
      
      const totalHeight = PADDING + (4 * (PHOTO_HEIGHT + PADDING)) + FOOTER_HEIGHT;
      
      const canvas = document.createElement('canvas');
      canvas.width = STRIP_WIDTH;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = currentFrame.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < shots.length; i++) {
          const img = new Image();
          img.src = shots[i];
          await new Promise(r => { img.onload = r; });
          
          const y = PADDING + (i * (PHOTO_HEIGHT + PADDING));
          const srcRatio = img.width / img.height;
          const targetRatio = PHOTO_WIDTH / PHOTO_HEIGHT;
          
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          
          if (srcRatio > targetRatio) {
              sw = img.height * targetRatio;
              sx = (img.width - sw) / 2;
          } else {
              sh = img.width / targetRatio;
              sy = (img.height - sh) / 2;
          }

          ctx.save();
          if (currentFrame.mask === 'heart') {
             drawHeartPath(ctx, PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT);
             ctx.clip();
          }
          
          ctx.drawImage(img, sx, sy, sw, sh, PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT);
          ctx.restore();
          
          if (currentFrame.id === 'classic-white') {
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 1;
            ctx.strokeRect(PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT);
          }
          
          if (currentFrame.mask === 'heart') {
             ctx.save();
             ctx.strokeStyle = '#fff';
             ctx.lineWidth = 4;
             drawHeartPath(ctx, PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT);
             ctx.stroke();
             ctx.restore();
          }
      }

      ctx.fillStyle = currentFrame.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const date = new Date().toLocaleDateString();
      const time = new Date().toLocaleDateString([], {hour: '2-digit', minute:'2-digit'});
      
      ctx.font = '24px "Titan One", cursive';
      ctx.fillText(`Snapbooth`, STRIP_WIDTH / 2, totalHeight - (FOOTER_HEIGHT / 1.5));
      ctx.font = '16px "Crimson Text", serif';
      ctx.fillStyle = currentFrame.id === 'classic-white' ? '#666' : '#999';
      ctx.fillText(`${date} • ${time}`, STRIP_WIDTH / 2, totalHeight - (FOOTER_HEIGHT / 3.5));

      onCapture(canvas.toDataURL('image/jpeg', 0.95));
      setIsProcessing(false);
  };

  const nextFrame = () => {
    setSelectedFrameIndex((prev) => (prev + 1) % FRAME_STYLES.length);
  };

  const prevFrame = () => {
    setSelectedFrameIndex((prev) => (prev - 1 + FRAME_STYLES.length) % FRAME_STYLES.length);
  };

  const currentFrame = FRAME_STYLES[selectedFrameIndex];

  return (
    <div className="flex flex-col h-full w-full bg-[#f5f5f5] text-[#1a1a1a] p-4 md:p-8 font-serif">
      <div className="flex justify-between items-center mb-6">
          <button onClick={onCancel} className="sketch-border bg-white px-6 py-3 animate-wiggle hover:scale-105 transition-transform active:scale-95 text-left">
             <h1 className="text-3xl font-bold tracking-widest uppercase bubbly-text">SNAPBOOTH</h1>
          </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center max-w-6xl mx-auto w-full">
          <div className="relative sketch-border bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 animate-wiggle">
              <div className="relative w-[300px] h-[500px] bg-gray-100 sketch-border overflow-hidden flex flex-col items-center border-b-8 border-b-gray-300">
                  <div className="flex-1 w-full relative overflow-hidden bg-black group">
                      <video ref={videoRef} className="hidden" playsInline muted autoPlay />
                      <canvas ref={canvasRef} className="w-full h-full object-cover" />
                      {countdown !== null && countdown > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                              <span className="text-[8rem] leading-none bubbly-text animate-pulse">{countdown}</span>
                          </div>
                      )}
                      {isProcessing && (
                          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-20">
                              <Loader className="w-10 h-10 animate-spin text-black mb-2" />
                              <span className="font-bold">Printing...</span>
                          </div>
                      )}
                  </div>
                  {!isShootingSequence && !isProcessing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
                          <div className="pointer-events-auto flex flex-col gap-3 w-48">
                             <button onClick={handleStartButton} className="bg-white px-6 py-3 sketch-border hover:bg-yellow-50 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 group w-full">
                                 <span className="bubbly-text-sm text-lg text-black">take photo</span><Camera className="w-4 h-4" />
                             </button>
                             <button onClick={() => fileInputRef.current?.click()} className="bg-gray-300 px-6 py-3 sketch-border hover:bg-gray-200 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 group w-full">
                                 <span className="bubbly-text-sm text-lg text-black">upload photo</span><Upload className="w-4 h-4" />
                             </button>
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};
