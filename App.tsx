import React, { useState, useEffect } from 'react';
import { CameraBooth } from './components/CameraBooth';
import { Button } from './components/Button';
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
  { 
      id: 4, 
      user: '@yj.shinp', 
      rotation: 'rotate-2', 
      images: [
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop'
      ]
  },
  { 
      id: 5, 
      user: '@danis.rewind', 
      rotation: '-rotate-1', 
      images: [
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop'
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
                    <li><strong>Photos and Images:</strong> All photos taken through the photobooth are processed locally in your browser. It does not store, save, or transmit any of your photos to any servers/databases.</li>
                    <li><strong>Personal Information:</strong> The website does not collect or store any personal information such as names, email addresses, or contact details.</li>
                </ul>
             </div>

             <div>
                <h4 className="font-bold text-green-600 mb-1 border-b-2 border-green-100 inline-block">What The Website DOES Collect</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li><strong>Analytics Data:</strong> The website uses Vercel Analytics which collects anonymous data including page views, device type, and browser info. No cookies are used and visitor sessions are discarded after 24 hours.</li>
                </ul>
             </div>

             <div>
                <h4 className="font-bold text-blue-600 mb-1 border-b-2 border-blue-100 inline-block">How The Website Uses Your Data</h4>
                <div className="space-y-2 text-gray-700">
                    <p><span className="font-bold">Analytics:</span> The analytics data helps the website understand user interactions, improve performance, and make informed decisions about feature development.</p>
                    <p><span className="font-bold">Local Processing:</span> All photo processing happens entirely in your browser - camera access, image editing, filter application, and downloads are all handled locally on your device.</p>
                    <p><span className="font-bold">Third-Party Services:</span> Vercel Analytics: Privacy-focused analytics that doesn't use cookies, doesn't collect personal identifiers, and automatically discards visitor sessions after 24 hours.</p>
                </div>
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
                   <p className="text-gray-700">A: Click "Enter" on the homepage, allow camera access when prompted, and follow the on-screen instructions to take your photos. The photobooth will guide you through the process and create a vintage-style photostrip that you can download instantly.</p>
               </div>
               <div>
                   <p className="font-bold text-lg mb-1">Q: Do I need to create an account or sign up?</p>
                   <p className="text-gray-700">A: No! The photobooth is completely free to use and doesn't require any registration, account creation, or personal information. Just visit the site and start taking photos!</p>
               </div>
               <div>
                   <p className="font-bold text-lg mb-1">Q: Are my photos stored or saved anywhere?</p>
                   <p className="text-gray-700">A: No, your photos are never stored anywhere. All photo processing happens locally in your browser, and photos only exist on your device unless you choose to download them. The website does not have access to any of your images.</p>
               </div>
               <div>
                   <p className="font-bold text-lg mb-1">Q: What devices and browsers are supported?</p>
                   <p className="text-gray-700">A: The photobooth works on most modern devices including phones, tablets, and computers. It's compatible with Chrome, Safari, Firefox, and Edge browsers. You'll need a working camera and internet connection.</p>
               </div>
               <div>
                   <p className="font-bold text-lg mb-1">Q: How do I download my photostrip?</p>
                   <p className="text-gray-700">A: After taking your photos, you'll see a preview of your photo strip. Click the download button to save it to your device and on mobile devices and tables, you also can press and hold on the image to save directly to your photo library! The image will be saved in high quality and ready to print or share.</p>
               </div>
               <div>
                   <p className="font-bold text-lg mb-1">Q: Is there a limit to how many photos I can take?</p>
                   <p className="text-gray-700">A: No limits! You can use the photobooth as many times as you want. Each session creates a new photostrip, so feel free to experiment with different poses!</p>
               </div>
               <div>
                   <p className="font-bold text-lg mb-1">Q: What if my camera isn't working?</p>
                   <p className="text-gray-700">A: Make sure you've granted camera permissions when prompted. If you're still having issues, try refreshing the page or try using a different browser. The photobooth needs camera access to function.</p>
               </div>
               <div>
                   <p className="font-bold text-lg mb-1">Q: Can I share my photos on social media?</p>
                   <p className="text-gray-700">A: Absolutely! Once you download your photostrip, you can share it anywhere you like - Instagram, TikTok, Twitter, or any other platform. I would love to see your photostrips so please feel free to tag or message me with with your photos <a href="https://instagram.com/itz.wdel" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-pink-600">@itz.wdel</a> on instagram!</p>
               </div>
           </div>
        )
      },
      about: {
        title: "About Me",
        body: (
            <div className="space-y-3 font-['Crimson_Text']">
                <p>hello! I'm Adele and I made this online photobooth just because i was interested in making one and was bored, It wasnt that easy making this project of mine,i was exicted on publishing this app and had fun,so I hope you enjoyed using it as much as i did.</p>
                <p>I wasnt the only one making this project, my father helped me on making this project. And i did this project in my spare time so it is not in any means perfect but please shoot me a message me if you have any feedback/suggestions/issues with the website at all.</p>
                <p>im still adding new features and improving the website, feel free to follow me on <a href="https://instagram.com/itz.wdel" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-pink-600">@itz.wdel</a> on instagram!</p>
                
                <div className="pt-4 border-t-2 border-dashed border-gray-200 mt-2">
                    <p className="text-sm text-gray-500 italic mb-1">(credits to sketchbook!! it gaved me ideas on how to make this website:))</p>
                    <a href="https://mysketchbooth.com" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">link: https://mysketchbooth.com</a>
                </div>
            </div>
        )
      },
      contact: {
        title: "Contact Me",
        body: (
            <div className="space-y-3 font-['Crimson_Text']">
                <p>Got a suggestion, found a bug, or just want to say hi?</p>
                <div className="bg-gray-100 p-4 rounded border-2 border-gray-200 mt-2">
                    <p className="font-bold text-sm text-gray-500 uppercase mb-1">Instagram</p>
                    <a href="https://instagram.com/itz.wdel" target="_blank" rel="noopener noreferrer" className="text-lg font-bold hover:text-pink-600 flex items-center gap-2">
                        <Instagram className="w-5 h-5" /> @itz.wdel
                    </a>
                </div>
                <div className="bg-gray-100 p-4 rounded border-2 border-gray-200">
                     <p className="font-bold text-sm text-gray-500 uppercase mb-1">Email</p>
                     <a href="mailto:adelolibradilla9@gmail.com" className="text-lg font-bold hover:text-blue-600 break-all">adelolibradilla9@gmail.com</a>
                </div>
            </div>
        )
      }
    }[activeModal];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
            <div className="bg-white sketch-border w-full max-w-md p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto animate-wiggle" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={() => setActiveModal(null)}
                    className="absolute top-4 right-4 hover:scale-110 transition-transform bg-gray-100 rounded-full p-1 border-2 border-black z-10"
                >
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
          
          <button 
              onClick={() => setScreen('home')}
              className="mb-12 sketch-border bg-white px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-wiggle hover:scale-105 transition-transform active:scale-95"
          >
              <h1 className="text-5xl md:text-6xl text-center uppercase bubbly-text">
                  SNAPBOOTH
              </h1>
          </button>

          {/* Main Content Area */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-16 md:gap-32 animate-wiggle-fast z-10 mt-8 w-full max-w-4xl px-4">
             
             {/* Left Column: Strips Box + Label - NOW SEPARATED */}
             <div 
                className="flex flex-col items-center gap-6 relative group cursor-pointer" 
                onClick={() => setScreen('gallery')}
             >
                 {/* The Box (Just the strips) */}
                 <div className="sketch-border bg-white w-40 h-52 flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-20 relative transition-transform group-hover:scale-105 group-active:scale-95 duration-200">
                    <div className="flex gap-2 opacity-90">
                        {/* Simulated Mini Strips */}
                        <div className="w-5 h-28 bg-gray-800 flex flex-col gap-1 p-0.5">
                            <div className="bg-gray-600 flex-1"></div>
                            <div className="bg-gray-600 flex-1"></div>
                            <div className="bg-gray-600 flex-1"></div>
                            <div className="bg-gray-600 flex-1"></div>
                        </div>
                        <div className="w-5 h-28 bg-gray-600 flex flex-col gap-1 p-0.5 mt-4">
                             <div className="bg-gray-400 flex-1"></div>
                             <div className="bg-gray-400 flex-1"></div>
                             <div className="bg-gray-400 flex-1"></div>
                             <div className="bg-gray-400 flex-1"></div>
                        </div>
                        <div className="w-5 h-28 bg-gray-400 flex flex-col gap-1 p-0.5">
                             <div className="bg-gray-200 flex-1"></div>
                             <div className="bg-gray-200 flex-1"></div>
                             <div className="bg-gray-200 flex-1"></div>
                             <div className="bg-gray-200 flex-1"></div>
                        </div>
                    </div>
                    {/* Inner frame line for detail */}
                    <div className="absolute inset-2 border border-gray-100 pointer-events-none"></div>
                 </div>
                 
                 {/* The Label & Arrow */}
                 <div className="relative mt-8">
                     <div className="relative">
                        <span className="bubbly-text-sm text-xl text-black leading-none block text-center group-hover:underline decoration-wavy underline-offset-4 decoration-2 px-4 py-2" style={{ color: '#1a1a1a', textShadow: 'none', WebkitTextStroke: '0px' }}>
                            featured<br/>strips
                        </span>
                     </div>
                     
                     {/* Arrow pointing from text up to box */}
                     <svg className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 text-black" viewBox="0 0 40 40" fill="none">
                         <path d="M20,35 L 20,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                         <path d="M20,5 L 14,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                         <path d="M20,5 L 26,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                     </svg>
                 </div>

             </div>

             {/* Enter Button */}
             <button 
                onClick={() => setScreen('booth')}
                className="bg-white sketch-border px-12 py-6 hover:bg-yellow-50 hover:scale-105 active:scale-95 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 whitespace-nowrap"
             >
                  <span className="bubbly-text-sm text-3xl text-black" style={{ color: '#1a1a1a', textShadow: 'none', WebkitTextStroke: '0px' }}>enter →]</span>
             </button>

          </div>
          
          <div className="mt-24 text-xs text-gray-500 font-mono flex items-center gap-1 font-['Crimson_Text']">
              made by 
              <a 
                href="https://instagram.com/itz.wdel" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-bold hover:text-[#E1306C] transition-colors"
              >
                @itz.wdel <Instagram className="w-3 h-3" />
              </a>
          </div>
          <div className="mt-4 flex gap-4 text-xs text-gray-400 underline decoration-gray-300 flex-wrap justify-center font-['Crimson_Text'] text-sm">
              <button onClick={() => setActiveModal('privacy')} className="hover:text-black transition-colors">Privacy Policy</button>
              <button onClick={() => setActiveModal('faq')} className="hover:text-black transition-colors">FAQ</button>
              <button onClick={() => setActiveModal('about')} className="hover:text-black transition-colors">About Me</button>
              <button onClick={() => setActiveModal('contact')} className="hover:text-black transition-colors">Contact Me</button>
          </div>
      </div>
  );

  const GalleryPage = () => (
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[#f5f5f5] min-h-screen">
        {/* Main Container Frame */}
        <div className="w-full max-w-6xl h-full min-h-[85vh] bg-white sketch-border p-6 relative flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8 px-2">
             <button onClick={() => setScreen('home')} className="hover:scale-110 transition-transform active:scale-95">
                 <ArrowLeft className="w-8 h-8 md:w-10 md:h-10 text-[#1a1a1a]" strokeWidth={2.5} />
             </button>
             <button className="hover:scale-110 transition-transform active:scale-95" onClick={() => alert("This is a gallery of community snaps!")}>
                 <HelpCircle className="w-8 h-8 md:w-10 md:h-10 text-[#1a1a1a]" strokeWidth={2.5} />
             </button>
          </div>

          {/* Strips Scroll Container */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center justify-start md:justify-center gap-16 px-8 pb-8 scrollbar-hide w-full">
              {MOCK_STRIPS.map((strip) => (
                  <div key={strip.id} className={`flex-shrink-0 flex flex-col items-center gap-4 transform ${strip.rotation} hover:rotate-0 transition-transform duration-300 hover:scale-105 cursor-pointer group`}>
                      {/* The Strip Itself */}
                      <div className="w-[140px] md:w-[160px] bg-[#1a1a1a] p-3 pb-8 flex flex-col gap-3 shadow-xl group-hover:shadow-2xl transition-shadow">
                          {strip.images.map((img, idx) => (
                              <div key={idx} className="aspect-[4/3] w-full overflow-hidden bg-gray-800">
                                  <img src={img} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="" />
                              </div>
                          ))}
                      </div>
                      {/* Username */}
                      <a href={`https://instagram.com/${strip.user.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="font-['Crimson_Text'] text-sm md:text-base text-blue-600 hover:underline hover:text-blue-800">
                          {strip.user}
                      </a>
                  </div>
              ))}
          </div>
          
          <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400 pointer-events-none font-['Crimson_Text']">
              scroll to see more →
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

    // Phase 1: Printing / Sliding Animation
    if (!showResult) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f5f5f5] p-4">
                 {/* Sign */}
                 <div className="bg-white border-[3px] border-black p-6 mb-2 relative w-64 text-center z-20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                     <div className="flex justify-between absolute top-2 left-2 right-2">
                        <div className="w-2 h-2 rounded-full border border-black bg-white"></div>
                        <div className="w-2 h-2 rounded-full border border-black bg-white"></div>
                     </div>
                     <div className="flex justify-between absolute bottom-2 left-2 right-2">
                        <div className="w-2 h-2 rounded-full border border-black bg-white"></div>
                        <div className="w-2 h-2 rounded-full border border-black bg-white"></div>
                     </div>
                     <h2 className="font-bold text-[#1a3a5f] text-lg leading-tight tracking-wider font-['Crimson_Text']">
                        PHOTOS<br/>DELIVERED<br/>HERE IN<br/>
                        {Math.max(1, timeLeft)} SECOND{timeLeft !== 1 ? 'S' : ''}
                     </h2>
                     <div className="flex justify-center mt-3 animate-bounce">
                         <div className="text-3xl font-bold">⬇</div>
                     </div>
                 </div>

                 {/* Slot Machine / Dispenser */}
                 <div className="relative w-64 h-[500px] border-[3px] border-black bg-white rounded-md flex justify-center pt-8 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {/* The Vertical Track */}
                      <div className="w-48 h-full border-x-4 border-black relative bg-gray-50">
                           <div className="absolute top-0 left-0 right-0 h-4 bg-gray-300 z-10 border-b-2 border-black"></div>
                           
                           {/* The Strip Sliding Down */}
                           <div className="w-full absolute -top-[450px] animate-[slideDown_2.8s_ease-out_forwards] flex justify-center p-2">
                                <img src={capturedImage!} className="w-full shadow-lg border border-gray-200" alt="Printing..." />
                           </div>
                           
                           {/* Middle divider line */}
                           <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-black/10 -ml-0.5 pointer-events-none z-20"></div>
                      </div>
                 </div>
                 
                 <style>{`
                    @keyframes slideDown {
                        0% { top: -450px; }
                        20% { top: -450px; } /* Pause briefly at start */
                        100% { top: 20px; }
                    }
                 `}</style>
            </div>
        );
    }

    // Phase 2: Final Result View
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#f5f5f5] p-4 relative overflow-hidden">
            
            <div className="relative flex items-center justify-center w-full max-w-4xl py-8">
                
                {/* Decoration: Top Right "your photostrip!" */}
                <div className="absolute -top-4 md:right-[20%] right-4 z-20 rotate-6 pointer-events-none">
                    <span className="font-['Crimson_Text'] text-3xl font-bold text-[#333] italic">your<br/>photostrip!</span>
                    <svg className="w-16 h-16 mt-1 text-[#333]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M80,10 Q40,40 10,80" strokeLinecap="round"/>
                        <path d="M10,80 L 25,75" strokeLinecap="round"/>
                        <path d="M10,80 L 15,65" strokeLinecap="round"/>
                    </svg>
                </div>

                {/* The Strip */}
                <div className="relative z-10 shadow-[8px_8px_15px_rgba(0,0,0,0.15)] rotate-1 transition-transform hover:rotate-0 duration-300">
                    <img src={capturedImage!} alt="Final Strip" className="h-[60vh] md:h-[65vh] w-auto object-contain bg-white" />
                </div>

                {/* Decoration: Bottom Left "tag me :)" */}
                <div className="absolute bottom-4 md:left-[22%] left-4 flex flex-col gap-2 -rotate-6 z-20">
                     <div className="relative pointer-events-none">
                        <span className="font-['Crimson_Text'] text-2xl font-bold text-[#333] italic">tag<br/>me :)</span>
                        <svg className="absolute -bottom-8 -right-8 w-12 h-12 text-[#333] rotate-[100deg]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
                             <path d="M80,10 Q40,40 10,80" strokeLinecap="round"/>
                             <path d="M10,80 L 25,75" strokeLinecap="round"/>
                             <path d="M10,80 L 15,65" strokeLinecap="round"/>
                        </svg>
                     </div>
                     <div className="mt-10 flex flex-col gap-4 pl-4">
                         {/* TikTok Icon (Custom SVG) */}
                         <a href="#" className="hover:scale-110 transition-transform text-black">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                            </svg>
                         </a>
                         <a href="#" className="hover:scale-110 transition-transform text-black">
                             <Instagram className="w-7 h-7" />
                         </a>
                     </div>
                </div>
                
                {/* Decoration: Scissors */}
                <div className="absolute bottom-8 md:right-[25%] right-8 opacity-60 pointer-events-none">
                    <Scissors className="w-16 h-16 stroke-1 -rotate-[15deg]" />
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:gap-6 z-30 w-full max-w-4xl px-4 font-['Crimson_Text']">
                
                <button 
                    onClick={downloadImage} 
                    className="border-[2px] border-[#1a1a1a] bg-white px-4 md:px-6 py-2 md:py-3 min-w-[120px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-bold text-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                >
                    <Download className="w-4 h-4 md:w-5 md:h-5" /> 
                    <span className="text-sm md:text-base">download</span>
                </button>
                
                <button 
                    onClick={handleShare} 
                    className="border-[2px] border-[#1a1a1a] bg-white px-4 md:px-6 py-2 md:py-3 min-w-[120px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-bold text-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                >
                    <Share className="w-4 h-4 md:w-5 md:h-5" /> 
                    <span className="text-sm md:text-base">share</span>
                </button>
                
                <button 
                    onClick={handlePrint} 
                    className="border-[2px] border-[#1a1a1a] bg-white px-4 md:px-6 py-2 md:py-3 min-w-[120px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-bold text-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                >
                    <Printer className="w-4 h-4 md:w-5 md:h-5" /> 
                    <span className="text-sm md:text-base">print</span>
                </button>
                
                <button 
                    onClick={() => { setCapturedImage(null); setScreen('booth'); }} 
                    className="border-[2px] border-[#1a1a1a] bg-white px-4 md:px-6 py-2 md:py-3 min-w-[120px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-bold text-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                >
                    <RotateCcw className="w-4 h-4 md:w-5 md:h-5" /> 
                    <span className="text-sm md:text-base">restart</span>
                </button>

            </div>
            
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] flex flex-col font-serif selection:bg-yellow-200">
      <main className="flex-1 flex flex-col relative">
        {screen === 'home' && <LandingPage />}
        {screen === 'gallery' && <GalleryPage />}
        {screen === 'booth' && (
          <CameraBooth 
            onCapture={handleCapture}
            onCancel={() => setScreen('home')}
          />
        )}
        {screen === 'review' && capturedImage && <ReviewPage />}
        {activeModal && <InfoModal />}
      </main>
    </div>
  );
}