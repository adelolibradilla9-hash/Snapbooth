
import React, { useState, useEffect } from 'react';
import { CameraBooth } from './components/CameraBooth.tsx';
import { Button } from './components/Button.tsx';
import { Camera, Share2, Ticket, Sparkles, Download, Check, X, ArrowLeft, RefreshCcw, HelpCircle, Shuffle, Instagram, Printer, Scissors, RotateCcw, Share } from 'lucide-react';

type Screen = 'home' | 'booth' | 'review' | 'gallery';

// Mock Data for Gallery
const MOCK_STRIPS = [
  { 
      id: 1, 
      user: '@chngyxx', 
      rotation: '-rotate-2', 
      images: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop'
      ]
  },
  { 
      id: 2, 
      user: '@frey22_05', 
      rotation: 'rotate-1', 
      images: [
          'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=300&fit=crop'
      ]
  },
  { 
      id: 3, 
      user: '@divazzara', 
      rotation: '-rotate-1', 
      images: [
          'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=300&fit=crop'
      ]
  },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'privacy' | 'faq' | 'about' | 'contact' | null>(null);

  const handleCapture = (img: string) => {
    setCapturedImage(img);
    setScreen('review');
  };

  const downloadImage = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `snapbooth-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (capturedImage && navigator.share) {
        try {
            const blob = await (await fetch(capturedImage)).blob();
            const file = new File([blob], 'snapbooth.jpg', { type: 'image/jpeg' });
            await navigator.share({
                files: [file],
                title: 'My Snapbooth Strip',
                text: 'Check out my photo strip!'
            });
        } catch (error) {
            console.log('Sharing failed or cancelled', error);
        }
    } else {
         alert("Sharing is not supported on this browser. Try downloading instead!");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && capturedImage) {
        printWindow.document.write(`
            <html>
                <head><title>Print Snapbooth</title></head>
                <body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh;">
                    <img src="${capturedImage}" style="height:100%; max-height:100vh; width:auto; border: 1px dashed #ccc;">
                    <script>
                        window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
  };

  const InfoModal = () => {
    if (!activeModal) return null;

    const content = {
      privacy: {
        title: "Privacy Policy",
        body: (
          <div className="space-y-4 text-sm md:text-base font-['Crimson_Text']">
             <div className="bg-yellow-50 p-3 border-2 border-black rounded-sm mb-2">
                <h3 className="font-bold text-lg uppercase tracking-wide text-center">Data Collection and Storage</h3>
             </div>
             <div>
                <h4 className="font-bold text-red-500 mb-1 border-b-2 border-red-100 inline-block">What The Website Does NOT Store</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li><strong>Photos and Images:</strong> All photos taken are processed locally in your browser. It does not store or transmit any of your photos.</li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold text-green-600 mb-1 border-b-2 border-green-100 inline-block">What The Website DOES Collect</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li><strong>Anonymous Metrics:</strong> Basic anonymous usage data to improve performance.</li>
                </ul>
             </div>
          </div>
        )
      },
      faq: {
        title: "Frequently Asked Questions",
        body: (
           <div className="space-y-6 text-sm md:text-base font-['Crimson_Text']">
               <div>
                   <p className="font-bold text-lg mb-1">Q: How does the online photobooth work?</p>
                   <p className="text-gray-700">A: Click "Enter", allow camera access, follow instructions to take 4 photos. We then generate a strip you can save.</p>
               </div>
               <div>
                   <p className="font-bold text-lg mb-1">Q: Are my photos stored?</p>
                   <p className="text-gray-700">A: No. Everything happens in your browser on your device.</p>
               </div>
           </div>
        )
      },
      about: {
        title: "About Me",
        body: (
            <div className="space-y-3 font-['Crimson_Text']">
                <p>Hello! I'm Adele. I made this online photobooth for fun.</p>
                <p>Follow me on <a href="https://instagram.com/itz.wdel" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-pink-600">@itz.wdel</a> on instagram!</p>
            </div>
        )
      },
      contact: {
        title: "Contact Me",
        body: (
            <div className="space-y-3 font-['Crimson_Text']">
                <p>Got suggestions or bugs?</p>
                <div className="bg-gray-100 p-4 rounded border-2 border-gray-200 mt-2">
                    <p className="font-bold text-sm text-gray-500 uppercase mb-1">Instagram</p>
                    <a href="https://instagram.com/itz.wdel" target="_blank" rel="noopener noreferrer" className="text-lg font-bold hover:text-pink-600 flex items-center gap-2">
                        <Instagram className="w-5 h-5" /> @itz.wdel
                    </a>
                </div>
            </div>
        )
      }
    }[activeModal];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
            <div className="bg-white sketch-border w-full max-w-md p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto animate-wiggle" onClick={e => e.stopPropagation()}>
                <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 hover:scale-110 transition-transform bg-gray-100 rounded-full p-1 border-2 border-black z-10">
                    <X className="w-4 h-4" />
                </button>
                <h2 className="text-2xl font-bold mb-4 font-['Titan_One'] tracking-wide">{content.title}</h2>
                <div className="text-gray-700 leading-relaxed font-['Crimson_Text'] text-lg">
                    {content.body}
                </div>
            </div>
        </div>
    );
  };

  const LandingPage = () => (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
          <button onClick={() => setScreen('home')} className="mb-12 sketch-border bg-white px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-wiggle hover:scale-105 transition-transform active:scale-95">
              <h1 className="text-5xl md:text-6xl text-center uppercase bubbly-text">SNAPBOOTH</h1>
          </button>
          <div className="flex flex-col md:flex-row items-center justify-center gap-16 md:gap-32 animate-wiggle-fast z-10 mt-8 w-full max-w-4xl px-4">
             <div className="flex flex-col items-center gap-6 relative group cursor-pointer" onClick={() => setScreen('gallery')}>
                 <div className="sketch-border bg-white w-40 h-52 flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-20 relative transition-transform group-hover:scale-105 group-active:scale-95 duration-200">
                    <div className="flex gap-2 opacity-90">
                        <div className="w-5 h-28 bg-gray-800 flex flex-col gap-1 p-0.5"><div className="bg-gray-600 flex-1"></div><div className="bg-gray-600 flex-1"></div><div className="bg-gray-600 flex-1"></div><div className="bg-gray-600 flex-1"></div></div>
                        <div className="w-5 h-28 bg-gray-600 flex flex-col gap-1 p-0.5 mt-4"><div className="bg-gray-400 flex-1"></div><div className="bg-gray-400 flex-1"></div><div className="bg-gray-400 flex-1"></div><div className="bg-gray-400 flex-1"></div></div>
                        <div className="w-5 h-28 bg-gray-400 flex flex-col gap-1 p-0.5"><div className="bg-gray-200 flex-1"></div><div className="bg-gray-200 flex-1"></div><div className="bg-gray-200 flex-1"></div><div className="bg-gray-200 flex-1"></div></div>
                    </div>
                 </div>
                 <div className="relative mt-8">
                     <span className="bubbly-text-sm text-xl text-black leading-none block text-center group-hover:underline decoration-wavy underline-offset-4 decoration-2 px-4 py-2" style={{ color: '#1a1a1a', textShadow: 'none', WebkitTextStroke: '0px' }}>featured<br/>strips</span>
                 </div>
             </div>
             <button onClick={() => setScreen('booth')} className="bg-white sketch-border px-12 py-6 hover:bg-yellow-50 hover:scale-105 active:scale-95 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 whitespace-nowrap">
                  <span className="bubbly-text-sm text-3xl text-black" style={{ color: '#1a1a1a', textShadow: 'none', WebkitTextStroke: '0px' }}>enter →</span>
             </button>
          </div>
          <div className="mt-24 text-xs text-gray-500 font-mono flex items-center gap-1 font-['Crimson_Text']">
              made by <a href="https://instagram.com/itz.wdel" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-bold hover:text-[#E1306C] transition-colors">@itz.wdel <Instagram className="w-3 h-3" /></a>
          </div>
      </div>
  );

  const GalleryPage = () => (
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[#f5f5f5] min-h-screen">
        <div className="w-full max-w-6xl h-full min-h-[85vh] bg-white sketch-border p-6 relative flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-center mb-8 px-2">
             <button onClick={() => setScreen('home')} className="hover:scale-110 transition-transform active:scale-95">
                 <ArrowLeft className="w-8 h-8 md:w-10 md:h-10 text-[#1a1a1a]" strokeWidth={2.5} />
             </button>
          </div>
          <div className="flex-1 overflow-x-auto flex items-center justify-start md:justify-center gap-16 px-8 pb-8 scrollbar-hide w-full">
              {MOCK_STRIPS.map((strip) => (
                  <div key={strip.id} className={`flex-shrink-0 flex flex-col items-center gap-4 transform ${strip.rotation} hover:rotate-0 transition-transform duration-300 hover:scale-105 cursor-pointer group`}>
                      <div className="w-[140px] md:w-[160px] bg-[#1a1a1a] p-3 pb-8 flex flex-col gap-3 shadow-xl group-hover:shadow-2xl transition-shadow">
                          {strip.images.map((img, idx) => (
                              <div key={idx} className="aspect-[4/3] w-full overflow-hidden bg-gray-800">
                                  <img src={img} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="" />
                              </div>
                          ))}
                      </div>
                      <a href={`https://instagram.com/${strip.user.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="font-['Crimson_Text'] text-sm md:text-base text-blue-600 hover:underline hover:text-blue-800">{strip.user}</a>
                  </div>
              ))}
          </div>
        </div>
      </div>
  );

  const ReviewPage = () => {
    const [showResult, setShowResult] = useState(false);
    const [timeLeft, setTimeLeft] = useState(3);
    
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setShowResult(true);
        }
    }, [timeLeft]);

    if (!showResult) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f5f5f5] p-4">
                 <div className="bg-white border-[3px] border-black p-6 mb-2 relative w-64 text-center z-20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                     <h2 className="font-bold text-[#1a3a5f] text-lg leading-tight tracking-wider font-['Crimson_Text']">PHOTOS<br/>DELIVERED<br/>HERE IN<br/>{Math.max(1, timeLeft)} SECOND{timeLeft !== 1 ? 'S' : ''}</h2>
                 </div>
                 <div className="relative w-64 h-[500px] border-[3px] border-black bg-white rounded-md flex justify-center pt-8 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="w-48 h-full border-x-4 border-black relative bg-gray-50">
                           <div className="w-full absolute -top-[450px] animate-[slideDown_2.8s_ease-out_forwards] flex justify-center p-2"><img src={capturedImage!} className="w-full shadow-lg border border-gray-200" alt="Printing..." /></div>
                      </div>
                 </div>
                 <style>{`@keyframes slideDown { 0% { top: -450px; } 20% { top: -450px; } 100% { top: 20px; } }`}</style>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-white p-4 relative overflow-y-auto">
            {/* Background Decorative Elements */}
            <div className="absolute top-10 right-[15%] md:right-[30%] flex flex-col items-center rotate-12 pointer-events-none">
                 <span className="font-['Titan_One'] text-xl md:text-2xl text-black">your<br/>photostrip!</span>
                 <svg className="w-12 h-12 -scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <path d="M7 7c0 0 10 0 10 10" strokeLinecap="round" strokeLinejoin="round" />
                     <path d="M13 17h4v-4" strokeLinecap="round" strokeLinejoin="round" />
                 </svg>
            </div>

            <div className="absolute bottom-20 left-[10%] md:left-[25%] flex flex-col items-center gap-2">
                 <div className="flex flex-col items-center pointer-events-none">
                    <span className="font-['Titan_One'] text-lg text-black mb-1">tag me :)</span>
                    <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 17l-5 5-5-5M12 22V10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                 </div>
                 <div className="flex flex-col gap-4">
                     <a href="https://instagram.com/itz.wdel" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform active:scale-95">
                         <Instagram className="w-10 h-10 text-black" />
                     </a>
                 </div>
            </div>

            <div className="absolute bottom-10 right-[10%] md:right-[25%] pointer-events-none">
                 <Scissors className="w-16 h-16 text-black rotate-[150deg]" />
            </div>

            {/* Main Strip Review */}
            <div className="relative flex items-center justify-center w-full max-w-4xl py-12 z-10">
                <div className="relative shadow-[15px_15px_30px_rgba(0,0,0,0.2)] rotate-1 transition-transform hover:rotate-0 duration-300 sketch-border overflow-hidden">
                    <img src={capturedImage!} alt="Final Strip" className="h-[65vh] md:h-[75vh] w-auto object-contain bg-white" />
                </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:gap-6 z-30 w-full max-w-4xl px-4 font-['Crimson_Text']">
                <button onClick={downloadImage} className="border-[2px] border-[#1a1a1a] bg-white px-4 md:px-6 py-2 md:py-3 min-w-[120px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-bold text-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                    <Download className="w-4 h-4 md:w-5 md:h-5" /> <span className="text-sm md:text-base">download</span>
                </button>
                <button onClick={handleShare} className="border-[2px] border-[#1a1a1a] bg-white px-4 md:px-6 py-2 md:py-3 min-w-[120px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-bold text-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                    <Share className="w-4 h-4 md:w-5 md:h-5" /> <span className="text-sm md:text-base">share</span>
                </button>
                <button onClick={handlePrint} className="border-[2px] border-[#1a1a1a] bg-white px-4 md:px-6 py-2 md:py-3 min-w-[120px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-bold text-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                    <Printer className="w-4 h-4 md:w-5 md:h-5" /> <span className="text-sm md:text-base">print</span>
                </button>
                <button onClick={() => { setCapturedImage(null); setScreen('booth'); }} className="border-[2px] border-[#1a1a1a] bg-white px-4 md:px-6 py-2 md:py-3 min-w-[120px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-bold text-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                    <RotateCcw className="w-4 h-4 md:w-5 md:h-5" /> <span className="text-sm md:text-base">restart</span>
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] flex flex-col font-serif">
      <main className="flex-1 flex flex-col relative">
        {screen === 'home' && <LandingPage />}
        {screen === 'gallery' && <GalleryPage />}
        {screen === 'booth' && <CameraBooth onCapture={handleCapture} onCancel={() => setScreen('home')} />}
        {screen === 'review' && capturedImage && <ReviewPage />}
        {activeModal && <InfoModal />}
      </main>
    </div>
  );
}
