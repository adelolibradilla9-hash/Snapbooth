
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VisionService } from '../services/visionService.ts';
import { BackgroundType, FilterType, SegmentationResult } from '../types.ts';
import { Camera, RefreshCw, Upload, Video, Repeat, Loader, ArrowRight, ArrowLeft, ToggleLeft, ToggleRight, Info, CheckCircle, Clock, ChevronLeft, ChevronRight, Heart, Star, Scissors } from 'lucide-react';
import { Button } from './Button.tsx';
import { BACKGROUND_OPTIONS, COUNTDOWN_SECONDS } from '../constants.ts';

interface CameraBoothProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

const FRAME_STYLES = [
  { 
    id: 'classic-white', 
    name: 'Plain White', 
    bgColor: '#ffffff', 
    borderColor: '#e5e5e5', 
    textColor: '#1a1a1a', 
    icon: '⬜',
    mask: 'rect'
  },
  { 
    id: 'classic-black', 
    name: 'Plain Black', 
    bgColor: '#1a1a1a', 
    borderColor: '#333333', 
    textColor: '#ffffff',
    icon: '⬛',
    mask: 'rect'
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    bgColor: '#a5d6d9',
    borderColor: '#ffffff',
    textColor: '#1a5c68',
    mask: 'rect',
    icon: '🌊'
  },
  {
    id: 'coquette',
    name: 'Coquette Ribbon',
    bgColor: '#fff0f3',
    borderColor: '#ffccd5',
    textColor: '#c9184a',
    mask: 'rect',
    icon: '🎀'
  },
  { 
    id: 'cute-hearts', 
    name: 'Heart Frame', 
    bgColor: '#ffc0cb',
    borderColor: '#ff69b4', 
    textColor: '#db7093', 
    icon: '🩷',
    mask: 'heart'
  },
  { 
    id: 'vintage', 
    name: 'Vintage ✨', 
    bgColor: '#fdf5e6',
    borderColor: '#deb887',
    textColor: '#8b4513',
    icon: '✨',
    mask: 'rect'
  },
  {
      id: 'film',
      name: 'Film Strip',
      bgColor: '#050505',
      borderColor: '#333333',
      textColor: '#ff4500',
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

        const renderLoop = (time: number) => {
            if (!active) return;
            drawFrame(time);
            requestRef.current = requestAnimationFrame(renderLoop);
        };
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

      // 1. Draw Background
      ctx.fillStyle = currentFrame.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Photos
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
          
          // Borders
          if (currentFrame.id === 'classic-white') {
            ctx.strokeStyle = '#eeeeee';
            ctx.lineWidth = 1;
            ctx.strokeRect(PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT);
          } else if (currentFrame.id === 'classic-black') {
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1;
            ctx.strokeRect(PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT);
          }
          
          if (currentFrame.mask === 'heart') {
             ctx.save();
             ctx.strokeStyle = '#ffffff';
             ctx.lineWidth = 4;
             drawHeartPath(ctx, PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT);
             ctx.stroke();
             ctx.restore();
          }
      }

      // 3. Decorations
      ctx.save();
      if (currentFrame.id === 'ocean-blue') {
          ctx.fillStyle = 'rgba(138, 180, 248, 0.3)';
          // Waves Top
          ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(100, 50, 250, 0); ctx.fill();
          // Waves Bottom
          ctx.beginPath(); ctx.moveTo(STRIP_WIDTH, totalHeight); ctx.quadraticCurveTo(STRIP_WIDTH - 100, totalHeight - 50, STRIP_WIDTH - 250, totalHeight); ctx.fill();
          
          ctx.font = '40px serif';
          ctx.fillText("🐚", STRIP_WIDTH - 50, 80);
          ctx.fillText("🐠", 20, totalHeight - 140);
          ctx.fillText("🌊", STRIP_WIDTH/2 - 20, totalHeight - 40);
      } else if (currentFrame.id === 'coquette') {
          ctx.font = '48px serif';
          // Bows between photos
          for (let i = 0; i < 3; i++) {
              const y = PADDING + PHOTO_HEIGHT + (i * (PHOTO_HEIGHT + PADDING)) + (PADDING / 2);
              ctx.fillText("🎀", i % 2 === 0 ? 0 : STRIP_WIDTH - 45, y + 15);
          }
          // Hearts
          ctx.font = '24px serif';
          ctx.fillText("🩷", 30, 40);
          ctx.fillText("🩷", STRIP_WIDTH - 50, totalHeight - 120);
      } else if (currentFrame.id === 'cute-hearts') {
          ctx.font = '32px serif';
          ctx.fillText("✨", 20, 40);
          ctx.fillText("🫧", STRIP_WIDTH - 40, totalHeight - 130);
          ctx.fillText("🩷", STRIP_WIDTH/2 - 10, totalHeight - 40);
      } else if (currentFrame.id === 'vintage') {
          ctx.font = '32px serif';
          ctx.fillText("✨", 15, 35);
          ctx.fillText("✨", STRIP_WIDTH - 45, totalHeight - 125);
      } else if (currentFrame.id === 'film') {
          ctx.fillStyle = '#ffffff';
          // Sprocket holes
          for (let i = 0; i < 4; i++) {
             const y = PADDING + (i * (PHOTO_HEIGHT + PADDING));
             ctx.fillRect(5, y + 10, 10, 15);
             ctx.fillRect(STRIP_WIDTH - 15, y + 10, 10, 15);
             ctx.fillRect(5, y + PHOTO_HEIGHT - 25, 10, 15);
             ctx.fillRect(STRIP_WIDTH - 15, y + PHOTO_HEIGHT - 25, 10, 15);
          }
      }
      ctx.restore();

      // 4. Footer
      ctx.fillStyle = currentFrame.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const date = new Date().toLocaleDateString();
      const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      ctx.font = '24px "Titan One", cursive';
      ctx.fillText(`Snapbooth`, STRIP_WIDTH / 2, totalHeight - (FOOTER_HEIGHT / 1.5));
      ctx.font = '16px "Crimson Text", serif';
      ctx.fillStyle = currentFrame.id === 'classic-white' ? '#666' : '#999';
      if (currentFrame.id === 'film') ctx.fillStyle = '#ff4500';
      if (currentFrame.id === 'vintage') ctx.fillStyle = '#8b4513';
      if (currentFrame.id === 'coquette') ctx.fillStyle = '#c9184a';
      
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
    <div className="flex flex-col h-full w-full bg-[#f5f5f5] text-[#1a1a1a] p-4 md:p-8 font-serif overflow-y-auto">
      <div className="flex justify-between items-center mb-6 max-w-6xl mx-auto w-full">
          <button onClick={onCancel} className="sketch-border bg-white px-6 py-3 animate-wiggle hover:scale-105 transition-transform active:scale-95 text-left">
             <h1 className="text-3xl font-bold tracking-widest uppercase bubbly-text">SNAPBOOTH</h1>
          </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start gap-8 max-w-6xl mx-auto w-full pb-12">
          
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
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
                                     <span className="bubbly-text-sm text-lg text-black" style={{ color: '#1a1a1a', textShadow: 'none', WebkitTextStroke: '0px' }}>take photo</span><Camera className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => fileInputRef.current?.click()} className="bg-gray-300 px-6 py-3 sketch-border hover:bg-gray-200 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 group w-full">
                                     <span className="bubbly-text-sm text-lg text-black" style={{ color: '#1a1a1a', textShadow: 'none', WebkitTextStroke: '0px' }}>upload photo</span><Upload className="w-4 h-4" />
                                 </button>
                                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                              </div>
                          </div>
                      )}
                  </div>
                  
                  <div className="w-full flex items-center justify-between px-4 py-2 bg-white">
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
                          <span className="text-xs font-bold leading-none">4pics</span>
                      </div>
                  </div>
              </div>

              {/* Settings Sidebar for Desktop */}
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

          {/* Frame Selector Section */}
          <div className="w-full max-w-xl">
              <div className="sketch-border bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 animate-wiggle-fast">
                  <div className="w-full border-b-2 border-dashed border-gray-300 pb-2 text-center">
                       <h3 className="font-bold text-xl font-['Titan_One'] tracking-wide uppercase flex items-center justify-center gap-2">
                           <Star className="w-5 h-5 fill-black stroke-black" />
                           Pick Your Frame
                           <Star className="w-5 h-5 fill-black stroke-black" />
                       </h3>
                  </div>

                  <div className="flex items-center justify-center gap-6 w-full">
                     <button onClick={prevFrame} className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full border-2 border-black shadow-sm hover:scale-110 active:scale-95 transition-transform">
                         <ChevronLeft className="w-6 h-6" />
                     </button>

                     <div className="relative group text-center">
                         <div className="w-24 h-36 bg-white border-2 border-black p-1 shadow-md transition-transform duration-300 group-hover:scale-105">
                             <div 
                                className="w-full h-full flex flex-col items-center gap-1 p-0.5 border"
                                style={{ backgroundColor: currentFrame.bgColor, borderColor: currentFrame.borderColor }}
                             >
                                 {[1,2,3,4].map(i => (
                                     <div key={i} className={`w-full flex-1 bg-gray-300/30 relative overflow-hidden ${currentFrame.mask === 'heart' ? 'rounded-full scale-90' : ''}`}></div>
                                 ))}
                                 <div className="h-2 w-full flex items-center justify-center mt-1">
                                     <div className="w-8 h-0.5 bg-gray-400 rounded-full"></div>
                                 </div>
                             </div>
                         </div>
                         <div className="mt-2">
                             <span className="font-bold font-['Crimson_Text'] text-base">{currentFrame.name}</span>
                         </div>
                     </div>

                     <button onClick={nextFrame} className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full border-2 border-black shadow-sm hover:scale-110 active:scale-95 transition-transform">
                         <ChevronRight className="w-6 h-6" />
                     </button>
                  </div>
              </div>
          </div>

          {/* Mobile Timer controls */}
          <div className="md:hidden flex gap-4">
              {[3, 5, 10].map(time => (
                  <button
                      key={time}
                      onClick={() => setTimerDuration(time)}
                      className={`px-4 py-2 text-sm font-bold border-2 border-black rounded-lg transition-all ${timerDuration === time ? 'bg-black text-white' : 'bg-white'}`}
                      style={{ fontFamily: 'Titan One, cursive' }}
                  >
                      {time}s
                  </button>
              ))}
          </div>

      </div>
    </div>
  );
};
