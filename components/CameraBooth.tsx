import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VisionService } from '../services/visionService';
import { BackgroundType, FilterType, SegmentationResult } from '../types';
import { Camera, RefreshCw, Upload, Video, Repeat, Loader, ArrowRight, ArrowLeft, ToggleLeft, ToggleRight, Info, CheckCircle, Clock, ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react';
import { Button } from './Button';
import { BACKGROUND_OPTIONS, COUNTDOWN_SECONDS } from '../constants';

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
    bgColor: '#a5d6d9', // Teal-ish
    borderColor: '#ffffff',
    textColor: '#1a5c68',
    mask: 'rect',
    icon: '🌊'
  },
  {
    id: 'pinky',
    name: 'Soft Pink',
    bgColor: '#ffe4e9', // Light Pink
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
    bgColor: '#ffc0cb', // Pink
    borderColor: '#ff69b4', 
    textColor: '#db7093', 
    icon: '🐷',
    mask: 'heart'
  },
  { 
    id: 'vintage', 
    name: 'Vintage', 
    bgColor: '#fdf5e6', // Old Lace
    borderColor: '#deb887', // Burlywood
    textColor: '#8b4513', // Saddle Brown
    decoration: '✨',
    icon: '✨',
    mask: 'rect'
  },
  {
      id: 'film',
      name: 'Film Strip',
      bgColor: '#000000',
      borderColor: '#333333',
      textColor: '#ff4500', // Orange Red (Date stamp look)
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
  
  // Strip Mode State
  const [capturedShots, setCapturedShots] = useState<string[]>([]);
  const [isShootingSequence, setIsShootingSequence] = useState(false);
  
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isGrayscale, setIsGrayscale] = useState(false);
  
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [timerDuration, setTimerDuration] = useState(3);
  
  // Refs for animation loop to access latest state without re-binding
  const isGrayscaleRef = useRef(isGrayscale);
  
  useEffect(() => {
    isGrayscaleRef.current = isGrayscale;
  }, [isGrayscale]);

  // Initialize Camera
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

        const renderLoop = () => {
            if (!active) return;
            drawFrame();
            requestRef.current = requestAnimationFrame(renderLoop);
        };
        renderLoop();

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

  const drawFrame = useCallback(() => {
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

      // Use ref for grayscale to avoid stale closure in render loop
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
          // Small pause between shots
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const imgUrl = event.target?.result as string;
          // When uploading, we simulate 4 shots of the same image for the strip
          shotsRef.current = [imgUrl, imgUrl, imgUrl, imgUrl];
          setCapturedShots(shotsRef.current);
          await generateStripImage();
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset
  };

  // Helper to draw a heart path
  const drawHeartPath = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.beginPath();
    const topCurveHeight = height * 0.3;
    ctx.moveTo(x + width / 2, y + topCurveHeight);
    // top left curve
    ctx.bezierCurveTo(
      x + width / 2, y, 
      x, y, 
      x, y + topCurveHeight
    );
    // bottom left curve
    ctx.bezierCurveTo(
      x, y + (height + topCurveHeight) / 2, 
      x + width / 2, y + (height + topCurveHeight) / 2, 
      x + width / 2, y + height
    );
    // bottom right curve
    ctx.bezierCurveTo(
      x + width / 2, y + (height + topCurveHeight) / 2, 
      x + width, y + (height + topCurveHeight) / 2, 
      x + width, y + topCurveHeight
    );
    // top right curve
    ctx.bezierCurveTo(
      x + width, y, 
      x + width / 2, y, 
      x + width / 2, y + topCurveHeight
    );
    ctx.closePath();
  };

  const generateStripImage = async () => {
      setIsProcessing(true);
      const shots = shotsRef.current;
      const currentFrame = FRAME_STYLES[selectedFrameIndex];
      
      const STRIP_WIDTH = 400;
      const PADDING = 20;
      const PHOTO_WIDTH = STRIP_WIDTH - (PADDING * 2);
      const PHOTO_HEIGHT = PHOTO_WIDTH * 0.75; // 4:3
      const FOOTER_HEIGHT = 100;
      
      const totalHeight = PADDING + (4 * (PHOTO_HEIGHT + PADDING)) + FOOTER_HEIGHT;
      
      const canvas = document.createElement('canvas');
      canvas.width = STRIP_WIDTH;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw Background
      ctx.fillStyle = currentFrame.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Photos
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
          
          // Draw image
          ctx.drawImage(img, sx, sy, sw, sh, PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT);
          ctx.restore();
          
          // Draw Borders
          if (currentFrame.id === 'classic-white') {
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 1;
            ctx.strokeRect(PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT);
          }
          
          // Draw Heart Outline for Cute Hearts
          if (currentFrame.mask === 'heart') {
             ctx.save();
             ctx.strokeStyle = '#fff';
             ctx.lineWidth = 4;
             drawHeartPath(ctx, PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT);
             ctx.stroke();
             ctx.restore();
          }

          // Decorations
          if (currentFrame.decoration) {
              ctx.font = "24px serif";
              ctx.fillStyle = currentFrame.textColor;
              if (currentFrame.id === 'vintage') {
                   ctx.fillText("✨", PADDING - 10, y + 20);
              } else if (currentFrame.id === 'film') {
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(5, y + 10, 10, 15);
                  ctx.fillRect(STRIP_WIDTH - 15, y + 10, 10, 15);
                  ctx.fillRect(5, y + PHOTO_HEIGHT - 25, 10, 15);
                  ctx.fillRect(STRIP_WIDTH - 15, y + PHOTO_HEIGHT - 25, 10, 15);
              }
          }
      }

      // --- CUSTOM DECORATIONS LAYER ---
      ctx.save();
      
      // 1. Red Ribbon Style
      if (currentFrame.id === 'red-ribbon') {
          // Curtains (simulated with transparency)
          ctx.fillStyle = 'rgba(200, 0, 0, 0.4)';
          
          // Top Left Curtain
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(140, 0);
          ctx.quadraticCurveTo(40, 40, 0, 140);
          ctx.fill();
          
          // Bottom Right Curtain
          const lastPhotoY = PADDING + 3 * (PHOTO_HEIGHT + PADDING);
          const lastPhotoBottom = lastPhotoY + PHOTO_HEIGHT;
          ctx.beginPath();
          ctx.moveTo(STRIP_WIDTH, lastPhotoBottom);
          ctx.lineTo(STRIP_WIDTH - 140, lastPhotoBottom);
          ctx.quadraticCurveTo(STRIP_WIDTH - 40, lastPhotoBottom - 40, STRIP_WIDTH, lastPhotoBottom - 140);
          ctx.fill();

          // Bows
          ctx.font = "48px serif";
          // Bow 1: Left, between photo 1 & 2
          const y1 = PADDING + PHOTO_HEIGHT + (PADDING/2); 
          ctx.fillText("🎀", -10, y1 + 15); 
          
          // Bow 2: Right, between photo 2 & 3
          const y2 = PADDING + 2*PHOTO_HEIGHT + PADDING + (PADDING/2);
          ctx.fillText("🎀", STRIP_WIDTH - 40, y2 + 15);
      }
      
      // 2. Doodles Style
      if (currentFrame.id === 'doodles') {
           ctx.font = "32px serif";
           
           // Top Right Stars
           ctx.fillText("✨", STRIP_WIDTH - 40, 40);
           ctx.font = "24px serif";
           ctx.fillText("⭐", STRIP_WIDTH - 25, 20);
           
           // Swirl Left (1-2 gap)
           const y1 = PADDING + PHOTO_HEIGHT + (PADDING/2);
           ctx.font = "32px serif";
           ctx.fillText("➰", 5, y1 + 10);
           
           // Sun Right (2-3 gap)
           const y2 = PADDING + 2*PHOTO_HEIGHT + PADDING + (PADDING/2);
           ctx.fillText("☀️", STRIP_WIDTH - 45, y2 + 10);
           
           // Sparkle Left (3-4 gap)
           const y3 = PADDING + 3*PHOTO_HEIGHT + 2*PADDING + (PADDING/2);
           ctx.fillText("✨", 5, y3 + 10);
           
           // Swirl Bottom Right
           ctx.fillText("➰", STRIP_WIDTH - 45, totalHeight - FOOTER_HEIGHT - 10);
      }
      
      // 3. Love Hearts Style
      if (currentFrame.id === 'cute-hearts') {
          // Top Left Star
           ctx.font = "32px serif";
           ctx.fillText("⭐", 10, 40);
           
           // Pig Left (1-2 gap)
           const y1 = PADDING + PHOTO_HEIGHT + (PADDING/2);
           ctx.fillText("🐷", 5, y1 + 10);
           
           // Kiss Right (1-2 gap)
           ctx.fillText("💋", STRIP_WIDTH - 45, y1 + 10);
           
           // Bow Left (2-3 gap)
           const y2 = PADDING + 2*PHOTO_HEIGHT + PADDING + (PADDING/2);
           ctx.fillText("🎀", 5, y2 + 10);
           
           // Flower Left (3-4 gap)
           const y3 = PADDING + 3*PHOTO_HEIGHT + 2*PADDING + (PADDING/2);
           ctx.fillText("🌸", 5, y3 + 10);
           
           // Silhouette Bottom Left (using Princess/Girl emoji)
           const lastPhotoY = PADDING + 3 * (PHOTO_HEIGHT + PADDING);
           ctx.font = "40px serif";
           ctx.fillText("👸", 10, lastPhotoY + PHOTO_HEIGHT - 10);
      }

      // 4. Blue Style
      if (currentFrame.id === 'blue') {
           // Waves
           ctx.fillStyle = 'rgba(138, 180, 248, 0.5)'; // Light blue wave

           // Top Right Wave
           ctx.beginPath();
           ctx.moveTo(STRIP_WIDTH, 0);
           ctx.lineTo(STRIP_WIDTH - 150, 0);
           ctx.bezierCurveTo(STRIP_WIDTH - 100, 100, STRIP_WIDTH - 50, 150, STRIP_WIDTH, 250);
           ctx.fill();

           // Bottom Left Wave
           ctx.fillStyle = 'rgba(138, 180, 248, 0.5)';
           ctx.beginPath();
           ctx.moveTo(0, totalHeight);
           ctx.lineTo(0, totalHeight - 200);
           ctx.bezierCurveTo(50, totalHeight - 150, 150, totalHeight - 50, 200, totalHeight);
           ctx.fill();

           ctx.font = "40px serif";
           // Seahorse Top Left
           ctx.fillText("\u{1F98C}", 10, 50); // Seahorse
           
           // Shell Right (1-2 gap)
           const y1 = PADDING + PHOTO_HEIGHT + (PADDING/2);
           ctx.fillText("🐚", STRIP_WIDTH - 50, y1);

           // Coral Left (2-3 gap)
           const y2 = PADDING + 2*PHOTO_HEIGHT + PADDING + (PADDING/2);
           ctx.fillText("🪸", 10, y2);

           // Whale Bottom Right
           ctx.font = "50px serif";
           ctx.fillText("🐋", STRIP_WIDTH - 60, totalHeight - 30);
           
           // Ray/Fish Bottom Left
           ctx.fillText("🐠", 10, totalHeight - 40);
      }

      // 5. Pinky Style
      if (currentFrame.id === 'pinky') {
           ctx.font = "48px serif";
           
           // Flower Top Right
           ctx.fillText("🌺", STRIP_WIDTH - 60, 50);

           // Bow Left (1-2 gap)
           const y1 = PADDING + PHOTO_HEIGHT + (PADDING/2);
           ctx.fillText("🎀", -10, y1 + 10);
           
           // Bow Right (2-3 gap)
           const y2 = PADDING + 2*PHOTO_HEIGHT + PADDING + (PADDING/2);
           ctx.fillText("🎀", STRIP_WIDTH - 50, y2 + 10);
           
           // Bear Right (3-4 gap)
           const y3 = PADDING + 3*PHOTO_HEIGHT + 2*PADDING + (PADDING/2);
           ctx.fillText("🧸", STRIP_WIDTH - 50, y3 + 10);

           // Bear Bottom Left
           const lastPhotoBottom = PADDING + 4 * (PHOTO_HEIGHT + PADDING) - PADDING; // Bottom of last photo roughly
           ctx.fillText("🧸", 10, lastPhotoBottom + 40);

           // Bow Bottom Center
           ctx.fillText("🎀", STRIP_WIDTH/2 - 20, totalHeight - 20);
      }

      ctx.restore();

      // Draw Footer
      ctx.fillStyle = currentFrame.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const date = new Date().toLocaleDateString();
      const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      if (currentFrame.id === 'cute-hearts') {
          ctx.font = '60px serif';
          ctx.fillText("♡", STRIP_WIDTH / 2, totalHeight - (FOOTER_HEIGHT / 2) - 10);
          
          ctx.font = '24px "Titan One", cursive';
          ctx.fillText(`Snapbooth`, STRIP_WIDTH / 2, totalHeight - (FOOTER_HEIGHT / 2) + 25);
      } else if (currentFrame.id === 'film') {
          ctx.font = 'bold 24px monospace';
          ctx.fillStyle = '#ff4500';
          ctx.fillText(`${date} ${time}`, STRIP_WIDTH / 2, totalHeight - (FOOTER_HEIGHT / 2));
      } else {
          ctx.font = '24px "Titan One", cursive';
          ctx.fillText(`Snapbooth`, STRIP_WIDTH / 2, totalHeight - (FOOTER_HEIGHT / 1.5));
          ctx.font = '16px "Crimson Text", serif';
          ctx.fillStyle = currentFrame.id === 'classic-white' ? '#666' : (currentFrame.id === 'vintage' ? '#8b4513' : '#999');
          ctx.fillText(`${date} • ${time}`, STRIP_WIDTH / 2, totalHeight - (FOOTER_HEIGHT / 3.5));
      }

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
          <button 
            onClick={onCancel}
            className="sketch-border bg-white px-6 py-3 animate-wiggle hover:scale-105 transition-transform active:scale-95 text-left"
          >
             <h1 className="text-3xl font-bold tracking-widest uppercase bubbly-text">SNAPBOOTH</h1>
          </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center max-w-6xl mx-auto w-full">
          
          {/* Left Column */}
          <div className="hidden md:flex flex-col items-center justify-center gap-4 w-24 opacity-80">
              <span className="bubbly-text-sm text-xl -rotate-12">eye level</span>
              <ArrowRight className="w-12 h-12 stroke-[3]" />
          </div>

          {/* Center: Booth */}
          <div className="relative sketch-border bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 animate-wiggle">
              
              <div className="relative w-[300px] h-[500px] bg-gray-100 sketch-border overflow-hidden flex flex-col items-center border-b-8 border-b-gray-300">
                  
                  <div className="flex-1 w-full relative overflow-hidden bg-black group">
                      <video ref={videoRef} className="hidden" playsInline muted autoPlay />
                      <canvas ref={canvasRef} className="w-full h-full object-cover" />
                      
                      {/* Live Strip Preview Sidebar */}
                      {isShootingSequence && (
                         <div className="absolute right-2 top-2 bottom-2 w-16 flex flex-col gap-1 z-20">
                             {[0,1,2,3].map(i => (
                                 <div key={i} className="flex-1 border border-white/50 bg-black/50 overflow-hidden relative">
                                     {capturedShots[i] && <img src={capturedShots[i]} className="w-full h-full object-cover" />}
                                 </div>
                             ))}
                         </div>
                      )}

                      {/* Timer Overlay */}
                      {countdown !== null && countdown > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                              <span className="text-[8rem] leading-none bubbly-text animate-pulse">
                                  {countdown}
                              </span>
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
                             <button 
                                 onClick={handleStartButton}
                                 className="bg-white px-6 py-3 sketch-border hover:bg-yellow-50 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 group w-full"
                            >
                                 <span className="bubbly-text-sm text-lg group-hover:underline text-black" style={{ color: '#1a1a1a', textShadow: 'none', WebkitTextStroke: '0px' }}>take photo</span>
                                 <Camera className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gray-300 px-6 py-3 sketch-border hover:bg-gray-200 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 group w-full"
                             >
                                 <span className="bubbly-text-sm text-lg group-hover:underline text-black" style={{ color: '#1a1a1a', textShadow: 'none', WebkitTextStroke: '0px' }}>upload photo</span>
                                 <Upload className="w-4 h-4" />
                             </button>
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                          </div>
                      </div>
                  )}

              </div>
              
              <div className="w-full flex items-center justify-between px-4">
                  <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isGrayscale ? 'opacity-50' : 'underline'}`}>color</span>
                          <button onClick={() => setIsGrayscale(!isGrayscale)} className="transition-transform active:scale-95">
                              {isGrayscale ? 
                                <ToggleRight className="w-8 h-8 fill-black stroke-black text-white" /> : 
                                <ToggleLeft className="w-8 h-8 stroke-black" />
                              }
                          </button>
                          <span className={`text-xs font-bold ${!isGrayscale ? 'opacity-50' : 'underline'}`}>b&w</span>
                      </div>
                  </div>

                  <div className="w-16 h-16 rounded-full sketch-border bg-white flex flex-col items-center justify-center -rotate-12 shadow-sm animate-wiggle">
                      <span className="font-bold text-lg leading-none">$0</span>
                      <span className="text-xs font-bold">=</span>
                      <span className="text-xs font-bold leading-none">4pics</span>
                  </div>
              </div>
          </div>
          
          {/* Right Column */}
          <div className="hidden md:flex flex-col items-center justify-center h-full gap-4 pl-8">
               <div className="sketch-border bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 w-32 animate-wiggle">
                   
                   <div className="w-full flex flex-col gap-2">
                       <div className="flex items-center gap-1 justify-center border-b-2 border-black pb-1 mb-1">
                           <Clock className="w-4 h-4" />
                           <span className="font-bold text-xs font-['Titan_One'] tracking-wide">TIMER</span>
                       </div>
                       {[3, 5, 10].map(time => (
                           <button
                                key={time}
                                onClick={() => setTimerDuration(time)}
                                className={`w-full py-1 text-sm font-bold border-2 border-black transition-all ${timerDuration === time ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
                                style={{ fontFamily: 'Titan One, cursive' }}
                           >
                               {time}s
                           </button>
                       ))}
                   </div>

                   <div className="w-full h-0.5 bg-black/10"></div>

                   <button 
                        onClick={handleStartButton}
                        disabled={isShootingSequence || isProcessing}
                        className="w-full aspect-square bg-red-500 border-2 border-black rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:grayscale"
                   >
                       <span className="bubbly-text-sm text-2xl text-white">START</span>
                   </button>

               </div>
               <span className="bubbly-text-sm text-xl rotate-6">ready?</span>
          </div>

      </div>

      {/* Frame Selector Section in a Box */}
      <div className="mt-8 mb-8 max-w-lg mx-auto w-full z-10">
          <div className="sketch-border bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4">
              
              <div className="w-full border-b-2 border-dashed border-gray-300 pb-2 text-center">
                   <h3 className="font-bold text-xl font-['Titan_One'] tracking-wide uppercase flex items-center justify-center gap-2">
                       <Star className="w-5 h-5 fill-black stroke-black" />
                       Pick Your Frame
                       <Star className="w-5 h-5 fill-black stroke-black" />
                   </h3>
              </div>

              <div className="flex items-center justify-center gap-6 w-full">
                 <button 
                     onClick={prevFrame}
                     className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full border-2 border-black shadow-sm hover:scale-110 active:scale-95 transition-transform"
                 >
                     <ChevronLeft className="w-6 h-6" />
                 </button>

                 {/* Frame Preview Card */}
                 <div className="relative group perspective">
                     <div className="w-32 h-48 bg-white border-2 border-black p-2 shadow-md transition-transform duration-300">
                         <div 
                            className="w-full h-full flex flex-col items-center gap-1 p-1 border transition-colors duration-300"
                            style={{ backgroundColor: currentFrame.bgColor, borderColor: currentFrame.borderColor }}
                         >
                             {/* Mini Strip Preview */}
                             {[1,2,3,4].map(i => (
                                 <div key={i} className={`w-full flex-1 bg-gray-800/20 relative overflow-hidden ${currentFrame.mask === 'heart' ? 'rounded-[50%] clip-heart scale-90' : ''}`}>
                                 </div>
                             ))}
                             <div className="h-3 w-full flex items-center justify-center mt-1">
                                 <div className="w-16 h-1 bg-gray-300 rounded-full"></div>
                             </div>
                         </div>
                     </div>
                     <div className="text-center mt-2">
                         <span className="font-bold font-['Crimson_Text'] text-sm">{currentFrame.name}</span>
                     </div>
                 </div>

                 <button 
                     onClick={nextFrame}
                     className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full border-2 border-black shadow-sm hover:scale-110 active:scale-95 transition-transform"
                 >
                     <ChevronRight className="w-6 h-6" />
                 </button>
              </div>

          </div>
      </div>
      
    </div>
  );
};