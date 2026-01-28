
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Upload, Loader, ChevronLeft, ChevronRight, Plus, X, ToggleLeft, ArrowRight, ZoomIn, ZoomOut } from 'lucide-react';

interface CameraBoothProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

const FRAME_STYLES = [
  { id: 'classic-white', name: 'Plain White', bgColor: '#ffffff', borderColor: '#e5e5e5', textColor: '#1a1a1a', icon: '⬜', mask: 'rect' },
  { id: 'classic-black', name: 'Plain Black', bgColor: '#1a1a1a', borderColor: '#333333', textColor: '#ffffff', icon: '⬛', mask: 'rect' },
  { id: 'ocean-blue', name: 'Ocean Blue', bgColor: '#a5d6d9', borderColor: '#ffffff', textColor: '#1a5c68', mask: 'rect', icon: '🌊' },
  { id: 'coquette', name: 'Coquette Ribbon', bgColor: '#fff0f3', borderColor: '#ffccd5', textColor: '#c9184a', mask: 'rect', icon: '🎀' },
  { id: 'cute-hearts', name: 'Heart Frame', bgColor: '#ffc0cb', borderColor: '#ff69b4', textColor: '#db7093', icon: '🩷', mask: 'heart' },
  { id: 'vintage', name: 'Vintage ✨', bgColor: '#fdf5e6', borderColor: '#deb887', textColor: '#8b4513', icon: '✨', mask: 'rect' },
  { id: 'film', name: 'Film Strip', bgColor: '#050505', borderColor: '#333333', textColor: '#ff4500', icon: '🎞️', mask: 'rect' }
];

export const CameraBooth: React.FC<CameraBoothProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<number>();
  
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [uploadSlots, setUploadSlots] = useState<(string | null)[]>([null, null, null, null]);
  const [capturedShots, setCapturedShots] = useState<string[]>([]);
  const [isShootingSequence, setIsShootingSequence] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [timerDuration, setTimerDuration] = useState(3);

  // Cropping State
  const [cropModal, setCropModal] = useState<{ 
    isOpen: boolean; 
    image: string | null; 
    slotIndex: number | null;
    cropArea: { x: number, y: number, width: number, height: number }
  }>({
    isOpen: false,
    image: null,
    slotIndex: null,
    cropArea: { x: 10, y: 10, width: 80, height: 60 } // Percentage based
  });

  const isGrayscaleRef = useRef(isGrayscale);
  useEffect(() => { isGrayscaleRef.current = isGrayscale; }, [isGrayscale]);

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
        const renderLoop = (time: number) => {
            if (!active) return;
            drawFrame(time);
            requestRef.current = requestAnimationFrame(renderLoop);
        };
        requestRef.current = requestAnimationFrame(renderLoop);
      } catch (err) {
        console.error("Camera Init Error:", err);
      }
    };
    if (mode === 'camera') startCamera();
    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [mode]); 

  const drawFrame = useCallback((_time?: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || mode !== 'camera') return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
      }
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      if (isGrayscaleRef.current) ctx.filter = 'grayscale(100%) contrast(1.1)';
      else ctx.filter = 'none';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
  }, [mode]);

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
                   if (canvasRef.current) {
                      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
                      setCapturedShots(prev => [...prev, dataUrl]);
                   }
              } else setCountdown(count);
          }, 1000);
      });
  };

  const handleStartButton = async () => {
      if (isShootingSequence) return;
      setIsShootingSequence(true);
      setCapturedShots([]);
      for (let i = 0; i < 4; i++) {
          await runCountdownAndCapture();
          await new Promise(r => setTimeout(r, 1000));
      }
      setIsShootingSequence(false);
  };

  useEffect(() => {
    if (capturedShots.length === 4 && !isShootingSequence) {
        generateStripImage(capturedShots);
    }
  }, [capturedShots, isShootingSequence]);

  const handleFileSelect = (slotIndex: number) => {
      setCropModal(prev => ({ ...prev, slotIndex }));
      fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          setCropModal(prev => ({ 
            ...prev, 
            isOpen: true, 
            image: event.target?.result as string,
            cropArea: { x: 10, y: 10, width: 80, height: 60 } 
          }));
      };
      reader.readAsDataURL(file);
      e.target.value = '';
  };

  const finalizeCrop = (croppedDataUrl: string) => {
      if (cropModal.slotIndex !== null) {
          const newSlots = [...uploadSlots];
          newSlots[cropModal.slotIndex] = croppedDataUrl;
          setUploadSlots(newSlots);
      }
      setCropModal({ isOpen: false, image: null, slotIndex: null, cropArea: { x: 0, y: 0, width: 0, height: 0 } });
  };

  const generateFromUploads = () => {
      const finalShots = uploadSlots.map(s => s || '');
      if (finalShots.some(s => s === '')) {
          alert("Please fill all 4 slots first!");
          return;
      }
      generateStripImage(finalShots);
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

  const generateStripImage = async (shots: string[]) => {
      setIsProcessing(true);
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
          if (srcRatio > targetRatio) { sw = img.height * targetRatio; sx = (img.width - sw) / 2; }
          else { sh = img.width / targetRatio; sy = (img.height - sh) / 2; }
          ctx.save();
          if (currentFrame.mask === 'heart') { drawHeartPath(ctx, PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT); ctx.clip(); }
          if (isGrayscale) ctx.filter = 'grayscale(100%) contrast(1.1)';
          ctx.drawImage(img, sx, sy, sw, sh, PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT);
          ctx.restore();
          if (currentFrame.id === 'classic-white') { ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.strokeRect(PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT); }
          else if (currentFrame.id === 'classic-black') { ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.strokeRect(PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT); }
          if (currentFrame.mask === 'heart') { ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; drawHeartPath(ctx, PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT); ctx.stroke(); ctx.restore(); }
      }
      
      ctx.fillStyle = currentFrame.textColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const date = new Date().toLocaleDateString(); const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      ctx.font = '24px "Titan One", cursive'; ctx.fillText(`Snapbooth`, STRIP_WIDTH / 2, totalHeight - (FOOTER_HEIGHT / 1.5));
      ctx.font = '16px "Crimson Text", serif'; ctx.fillStyle = currentFrame.id === 'classic-white' ? '#666' : '#999';
      ctx.fillText(`${date} • ${time}`, STRIP_WIDTH / 2, totalHeight - (FOOTER_HEIGHT / 3.5));

      onCapture(canvas.toDataURL('image/jpeg', 0.95));
      setIsProcessing(false);
  };

  const nextFrame = () => setSelectedFrameIndex((prev) => (prev + 1) % FRAME_STYLES.length);
  const prevFrame = () => setSelectedFrameIndex((prev) => (prev - 1 + FRAME_STYLES.length) % FRAME_STYLES.length);

  return (
    <div className="flex flex-col h-full w-full bg-[#f5f5f5] text-[#1a1a1a] p-4 md:p-8 font-serif overflow-y-auto">
      <div className="flex justify-between items-center mb-6 max-w-6xl mx-auto w-full">
          <button onClick={onCancel} className="sketch-border bg-white px-6 py-3 animate-wiggle hover:scale-105 transition-transform active:scale-95 text-left">
             <h1 className="text-3xl font-bold tracking-widest uppercase bubbly-text">SNAPBOOTH</h1>
          </button>
          <div className="flex gap-2">
              <button onClick={() => setMode('camera')} className={`px-4 py-2 sketch-border transition-all ${mode === 'camera' ? 'bg-black text-white' : 'bg-white'}`}>Live Camera</button>
              <button onClick={() => setMode('upload')} className={`px-4 py-2 sketch-border transition-all ${mode === 'upload' ? 'bg-black text-white' : 'bg-white'}`}>Upload Photo</button>
          </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start gap-8 max-w-6xl mx-auto w-full pb-12">
          
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full relative">
              <div className="hidden md:flex absolute left-[-150px] top-[40%] items-center gap-2 rotate-[-5deg] animate-wiggle-fast opacity-90">
                  <span className="font-['Titan_One'] text-xl leading-none text-black">eye<br/>level</span>
                  <ArrowRight className="w-12 h-12 stroke-[3]" />
              </div>

              <div className="relative sketch-border bg-white p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-6 animate-wiggle min-w-[360px]">
                  {mode === 'camera' ? (
                      <div className="relative w-[300px] h-[450px] bg-gray-100 sketch-border overflow-hidden flex flex-col items-center border-b-8 border-b-gray-300">
                          <div className="flex-1 w-full relative overflow-hidden bg-black group">
                              <video ref={videoRef} className="hidden" playsInline muted autoPlay />
                              <canvas ref={canvasRef} className="w-full h-full object-cover" />
                              {countdown !== null && countdown > 0 && (
                                  <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                                      <span className="text-[8rem] leading-none bubbly-text animate-pulse">{countdown}</span>
                                  </div>
                              )}
                          </div>
                          {!isShootingSequence && !isProcessing && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-auto">
                                 <button onClick={handleStartButton} className="bg-white px-8 py-4 sketch-border hover:bg-yellow-50 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 group">
                                     <span className="bubbly-text-sm text-xl text-black" style={{ color: '#1a1a1a', textShadow: 'none', WebkitTextStroke: '0px' }}>START CAMERA</span>
                                     <Camera className="w-6 h-6" />
                                 </button>
                              </div>
                          )}
                      </div>
                  ) : (
                      <div className="relative w-[320px] h-[450px] bg-white sketch-border p-5 grid grid-cols-2 grid-rows-2 gap-4 border-b-8 border-b-gray-300">
                          {uploadSlots.map((slot, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => handleFileSelect(idx)}
                                className="relative sketch-border border-dashed border-gray-400 bg-white flex flex-col items-center justify-center overflow-hidden group hover:border-black transition-all hover:scale-[1.02]"
                              >
                                  {slot ? (
                                      <img src={slot} className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="flex flex-col items-center gap-1">
                                          <Plus className="w-10 h-10 text-gray-300 group-hover:text-black transition-colors" />
                                          <span className="text-xs font-bold text-gray-400 group-hover:text-black font-['Crimson_Text']">Picture {idx + 1}</span>
                                      </div>
                                  )}
                              </button>
                          ))}
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} />
                      </div>
                  )}
                  
                  <div className="w-full flex items-center justify-center gap-4 py-2 border-t-2 border-black/5 mt-2">
                       <span className={`text-base font-bold font-['Crimson_Text'] ${isGrayscale ? 'opacity-40' : 'underline decoration-2'}`}>b&w</span>
                       <button onClick={() => setIsGrayscale(!isGrayscale)} className="transition-transform active:scale-95">
                           <div className="w-16 h-8 bg-white border-4 border-black rounded-full relative overflow-hidden flex items-center">
                               <div className={`w-6 h-6 bg-black rounded-full absolute transition-all duration-300 ${isGrayscale ? 'left-8' : 'left-1'}`}></div>
                           </div>
                       </button>
                       <span className={`text-base font-bold font-['Crimson_Text'] ${!isGrayscale ? 'opacity-40' : 'underline decoration-2'}`}>color</span>
                  </div>

                  <div className="absolute right-[-80px] bottom-[10%] w-24 h-24 rounded-full sketch-border bg-white flex flex-col items-center justify-center rotate-12 shadow-lg animate-wiggle transition-transform hover:scale-110">
                      <span className="font-['Titan_One'] text-2xl leading-none text-black">$0</span>
                      <div className="w-10 h-0.5 bg-black my-0.5"></div>
                      <span className="text-sm font-bold leading-none text-black font-['Titan_One']">4pics</span>
                  </div>
              </div>

              <div className="hidden md:flex flex-col items-center justify-center gap-4 pl-4">
                   <div className="sketch-border bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 w-32 animate-wiggle">
                       {mode === 'camera' ? (
                           <button onClick={handleStartButton} disabled={isShootingSequence || isProcessing} className="w-full aspect-square bg-red-500 border-4 border-black rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"><span className="bubbly-text-sm text-2xl text-white">START</span></button>
                       ) : (
                           <button onClick={generateFromUploads} disabled={uploadSlots.some(s => !s) || isProcessing} className="w-full aspect-square bg-green-500 border-4 border-black rounded-full flex flex-col items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                               <span className="bubbly-text-sm text-lg text-white leading-tight">PRINT</span>
                               <span className="bubbly-text-sm text-lg text-white leading-tight">STRIP</span>
                           </button>
                       )}
                   </div>
              </div>
          </div>

          <div className="w-full max-w-xl">
              <div className="sketch-border bg-white p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4">
                  <div className="w-full border-b-2 border-dashed border-gray-300 pb-2 text-center"><h3 className="font-bold text-xl font-['Titan_One'] tracking-wide uppercase flex items-center justify-center gap-2">Pick Your Frame</h3></div>
                  <div className="flex items-center justify-center gap-8 w-full">
                     <button onClick={prevFrame} className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full border-4 border-black shadow-sm hover:scale-110 active:scale-95 transition-transform"><ChevronLeft className="w-6 h-6 stroke-[3]" /></button>
                     <div className="relative text-center">
                         <div className="w-24 h-36 bg-white border-4 border-black p-1 shadow-md transition-transform duration-300 hover:scale-105">
                             <div className="w-full h-full flex flex-col items-center gap-1 p-0.5 border" style={{ backgroundColor: FRAME_STYLES[selectedFrameIndex].bgColor, borderColor: FRAME_STYLES[selectedFrameIndex].borderColor }}>
                                 {[1,2,3,4].map(i => ( <div key={i} className={`w-full flex-1 bg-gray-300/30 relative overflow-hidden ${FRAME_STYLES[selectedFrameIndex].mask === 'heart' ? 'rounded-full scale-90' : ''}`}></div> ))}
                                 <div className="h-2 w-full flex items-center justify-center mt-1"><div className="w-8 h-1 bg-gray-400 rounded-full"></div></div>
                             </div>
                         </div>
                         <div className="mt-2"><span className="font-bold font-['Crimson_Text'] text-lg">{FRAME_STYLES[selectedFrameIndex].name}</span></div>
                     </div>
                     <button onClick={nextFrame} className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full border-4 border-black shadow-sm hover:scale-110 active:scale-95 transition-transform"><ChevronRight className="w-6 h-6 stroke-[3]" /></button>
                  </div>
              </div>
          </div>
      </div>

      {/* Enhanced Crop Modal with Resizing Handles & Zoom Slider */}
      {cropModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
              <div className="bg-white sketch-border w-full max-w-lg p-6 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 animate-wiggle">
                  <div className="w-full flex justify-between items-center border-b-4 border-black pb-2">
                      <h2 className="text-2xl font-bold font-['Titan_One'] uppercase tracking-tight">Crop Image</h2>
                      <button onClick={() => setCropModal({ ...cropModal, isOpen: false })} className="hover:scale-110 transition-transform"><X className="w-8 h-8" /></button>
                  </div>
                  
                  <div className="relative w-full bg-gray-100 sketch-border overflow-hidden select-none touch-none" 
                    style={{ height: '400px' }}
                  >
                      <img id="crop-target" src={cropModal.image!} className="w-full h-full object-contain pointer-events-none" />
                      
                      {/* Darkened Overlay */}
                      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }}>
                          {/* Inner cutout - transparent area */}
                          <div className="absolute border-4 border-white border-dashed cursor-move"
                             style={{
                                 left: `${cropModal.cropArea.x}%`,
                                 top: `${cropModal.cropArea.y}%`,
                                 width: `${cropModal.cropArea.width}%`,
                                 height: `${cropModal.cropArea.height}%`,
                                 background: 'transparent',
                                 boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                             }}
                             onMouseDown={(e) => {
                                 const startX = e.clientX;
                                 const startY = e.clientY;
                                 const startAreaX = cropModal.cropArea.x;
                                 const startAreaY = cropModal.cropArea.y;
                                 const container = e.currentTarget.parentElement?.getBoundingClientRect();
                                 if (!container) return;

                                 const onMouseMove = (moveEvent: MouseEvent) => {
                                     const deltaX = ((moveEvent.clientX - startX) / container.width) * 100;
                                     const deltaY = ((moveEvent.clientY - startY) / container.height) * 100;
                                     
                                     setCropModal(prev => ({
                                         ...prev,
                                         cropArea: {
                                             ...prev.cropArea,
                                             x: Math.max(0, Math.min(100 - prev.cropArea.width, startAreaX + deltaX)),
                                             y: Math.max(0, Math.min(100 - prev.cropArea.height, startAreaY + deltaY))
                                         }
                                     }));
                                 };
                                 const onMouseUp = () => {
                                     window.removeEventListener('mousemove', onMouseMove);
                                     window.removeEventListener('mouseup', onMouseUp);
                                 };
                                 window.addEventListener('mousemove', onMouseMove);
                                 window.addEventListener('mouseup', onMouseUp);
                             }}
                          >
                              {/* Corner Handles for Resizing */}
                              {['tl', 'tr', 'bl', 'br'].map(pos => (
                                  <div 
                                    key={pos}
                                    className={`absolute w-6 h-6 bg-white border-2 border-black z-10 cursor-${pos}-resize`}
                                    style={{
                                        top: pos.startsWith('t') ? '-8px' : 'auto',
                                        bottom: pos.startsWith('b') ? '-8px' : 'auto',
                                        left: pos.endsWith('l') ? '-8px' : 'auto',
                                        right: pos.endsWith('r') ? '-8px' : 'auto',
                                    }}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        const startX = e.clientX;
                                        const startArea = { ...cropModal.cropArea };
                                        const container = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
                                        if (!container) return;

                                        const onMouseMoveResizing = (moveEvent: MouseEvent) => {
                                            const deltaX = ((moveEvent.clientX - startX) / container.width) * 100;
                                            let newWidth = startArea.width;
                                            let newX = startArea.x;

                                            if (pos.endsWith('r')) {
                                                newWidth = Math.max(10, Math.min(100 - startArea.x, startArea.width + deltaX));
                                            } else {
                                                const potentialWidth = startArea.width - deltaX;
                                                if (potentialWidth >= 10 && startArea.x + deltaX >= 0) {
                                                    newWidth = potentialWidth;
                                                    newX = startArea.x + deltaX;
                                                }
                                            }

                                            // Maintain 4:3 Aspect Ratio
                                            const newHeight = newWidth * 0.75;
                                            let newY = startArea.y;
                                            if (pos.startsWith('t')) {
                                                newY = startArea.y + (startArea.height - newHeight);
                                            }

                                            // Check bounds
                                            if (newY >= 0 && newY + newHeight <= 100) {
                                                setCropModal(prev => ({
                                                    ...prev,
                                                    cropArea: { x: newX, y: newY, width: newWidth, height: newHeight }
                                                }));
                                            }
                                        };
                                        const onMouseUpResizing = () => {
                                            window.removeEventListener('mousemove', onMouseMoveResizing);
                                            window.removeEventListener('mouseup', onMouseUpResizing);
                                        };
                                        window.addEventListener('mousemove', onMouseMoveResizing);
                                        window.addEventListener('mouseup', onMouseUpResizing);
                                    }}
                                  ></div>
                              ))}
                              
                              {/* Selection Guide Lines */}
                              <div className="absolute inset-0 border border-white/30 grid grid-cols-3 grid-rows-3 pointer-events-none">
                                  <div className="border border-white/10"></div><div className="border border-white/10"></div><div className="border border-white/10"></div>
                                  <div className="border border-white/10"></div><div className="border border-white/10"></div><div className="border border-white/10"></div>
                                  <div className="border border-white/10"></div><div className="border border-white/10"></div><div className="border border-white/10"></div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Zoom Slider */}
                  <div className="w-full flex items-center gap-4 px-2 py-2 bg-gray-50 sketch-border">
                      <ZoomOut className="w-5 h-5 text-gray-500" />
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={100 - cropModal.cropArea.width}
                        onChange={(e) => {
                            const zoomVal = parseInt(e.target.value);
                            const newWidth = 100 - zoomVal;
                            const newHeight = newWidth * 0.75;
                            const centerX = cropModal.cropArea.x + (cropModal.cropArea.width / 2);
                            const centerY = cropModal.cropArea.y + (cropModal.cropArea.height / 2);
                            
                            setCropModal(prev => ({
                                ...prev,
                                cropArea: {
                                    x: Math.max(0, Math.min(100 - newWidth, centerX - (newWidth / 2))),
                                    y: Math.max(0, Math.min(100 - newHeight, centerY - (newHeight / 2))),
                                    width: newWidth,
                                    height: newHeight
                                }
                            }));
                        }}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                      />
                      <ZoomIn className="w-5 h-5 text-gray-500" />
                  </div>

                  <div className="flex gap-4 w-full">
                      <button 
                        onClick={() => setCropModal({ ...cropModal, isOpen: false })}
                        className="flex-1 py-4 sketch-border font-bold uppercase hover:bg-gray-100 font-['Titan_One'] text-lg tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                      >CANCEL</button>
                      <button 
                        onClick={() => {
                            const img = document.getElementById('crop-target') as HTMLImageElement;
                            const cvs = document.createElement('canvas');
                            cvs.width = 800; cvs.height = 600; 
                            const cctx = cvs.getContext('2d');
                            if (cctx && img) {
                                const container = img.parentElement?.getBoundingClientRect();
                                if (!container) return;
                                const imgAspect = img.naturalWidth / img.naturalHeight;
                                const contAspect = container.width / container.height;
                                
                                let renderedWidth, renderedHeight, renderedX, renderedY;
                                if (imgAspect > contAspect) {
                                    renderedWidth = container.width;
                                    renderedHeight = container.width / imgAspect;
                                    renderedX = 0;
                                    renderedY = (container.height - renderedHeight) / 2;
                                } else {
                                    renderedHeight = container.height;
                                    renderedWidth = container.height * imgAspect;
                                    renderedX = (container.width - renderedWidth) / 2;
                                    renderedY = 0;
                                }

                                const selX = (cropModal.cropArea.x / 100) * container.width;
                                const selY = (cropModal.cropArea.y / 100) * container.height;
                                const selW = (cropModal.cropArea.width / 100) * container.width;
                                const selH = (cropModal.cropArea.height / 100) * container.height;

                                const finalSX = ((selX - renderedX) / renderedWidth) * img.naturalWidth;
                                const finalSY = ((selY - renderedY) / renderedHeight) * img.naturalHeight;
                                const finalSW = (selW / renderedWidth) * img.naturalWidth;
                                const finalSH = (selH / renderedHeight) * img.naturalHeight;

                                cctx.drawImage(img, finalSX, finalSY, finalSW, finalSH, 0, 0, 800, 600);
                                finalizeCrop(cvs.toDataURL('image/jpeg', 0.9));
                            }
                        }}
                        className="flex-1 py-4 bg-black text-white sketch-border font-bold uppercase hover:bg-gray-800 font-['Titan_One'] text-lg tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none"
                      >CROP & ADD</button>
                  </div>
              </div>
          </div>
      )}

      {isProcessing && (
          <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 text-center">
              <Loader className="w-20 h-20 animate-spin text-black mb-6" />
              <h2 className="text-5xl bubbly-text text-black animate-wiggle" style={{ color: '#1a1a1a', textShadow: 'none', WebkitTextStroke: '0px' }}>PRINTING YOUR STRIP...</h2>
          </div>
      )}
    </div>
  );
};
