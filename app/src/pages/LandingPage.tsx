import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Star, Rocket } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export function LandingPage() {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  // Preload images
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    const updateProgress = () => {
      loadedCount++;
      const progress = Math.round((loadedCount / 20) * 100);
      setLoadProgress(progress);
      if (loadedCount === 20) {
        setLoaded(true);
      }
    };

    for (let i = 1; i <= 20; i++) {
      const img = new Image();
      img.src = `/images/scroll-sequence/frame ${i}.webp`;
      img.onload = updateProgress;
      img.onerror = updateProgress;
      images.push(img);
    }

    imagesRef.current = images;
  }, []);

  // Cross-fade drawing function
  const drawCrossFade = (progress: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx || imagesRef.current.length === 0) return;

    const { width, height } = canvas;

    // Current frame index (0-19)
    const frameIndex = Math.floor(progress * 19);
    // Next frame index
    const nextFrameIndex = Math.min(frameIndex + 1, 19);
    // How far into the transition (0-1)
    const frameProgress = (progress * 19) - frameIndex;

    // Current and next images
    const currentImg = imagesRef.current[frameIndex];
    const nextImg = imagesRef.current[nextFrameIndex];

    if (!currentImg || !nextImg) return;

    // Helper to calculate image position
    const getImageParams = (img: HTMLImageElement) => {
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let drawWidth, drawHeight, offsetX, offsetY;

      if (canvasRatio > imgRatio) {
        drawWidth = width;
        drawHeight = width / imgRatio;
      } else {
        drawWidth = height * imgRatio;
        drawHeight = height;
      }

      offsetX = (width - drawWidth) / 2;
      offsetY = (height - drawHeight) / 2;

      return { drawWidth, drawHeight, offsetX, offsetY };
    };

    const currentParams = getImageParams(currentImg);
    const nextParams = getImageParams(nextImg);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Use easeInOut for smoother transition
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const easedProgress = easeInOut(frameProgress);

    // Draw current frame with fade out
    ctx.globalAlpha = 1 - easedProgress;
    ctx.drawImage(
      currentImg,
      currentParams.offsetX,
      currentParams.offsetY,
      currentParams.drawWidth,
      currentParams.drawHeight
    );

    // Draw next frame with fade in
    ctx.globalAlpha = easedProgress;
    ctx.drawImage(
      nextImg,
      nextParams.offsetX,
      nextParams.offsetY,
      nextParams.drawWidth,
      nextParams.drawHeight
    );

    // Reset alpha
    ctx.globalAlpha = 1;
  };

  // GSAP Scroll Animation with cross-fade
  useGSAP(() => {
    if (!loaded || !containerRef.current) return;

    // Handle canvas resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        drawCrossFade(scrollProgress);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Animate scroll progress for cross-fade
    gsap.to({ progress: 0 }, {
      progress: 1,
      duration: 1,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
          drawCrossFade(self.progress);
        }
      }
    });

    return () => window.removeEventListener('resize', handleResize);
  }, [loaded]);

  // Draw initial frame
  useEffect(() => {
    if (loaded) {
      drawCrossFade(0);
    }
  }, [loaded]);

  // Calculate nav visibility and styling
  const currentFrame = Math.min(19, Math.floor(scrollProgress * 19));
  const showNav = currentFrame <= 2 || currentFrame >= 15;

  // Nav background always white/glass, text always dark
  const navBg = 'rgba(255, 255, 255, 0.85)';
  const textColor = '#000000';
  const textMuted = 'rgba(0, 0, 0, 0.6)';
  const btnBg = '#000000';
  const btnText = '#ffffff';

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-foreground selection:bg-purple-500/30 font-sans">
      {/* Premium Navigation */}
      <div
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500"
        style={{
          opacity: showNav ? 1 : 0,
          pointerEvents: showNav ? 'auto' : 'none',
        }}
      >
        <div
          className="rounded-full px-5 md:px-7 py-2.5 w-[75vw] md:w-[50vw] max-w-2xl"
          style={{
            background: navBg,
            backdropFilter: 'blur(40px) saturate(250%)',
            WebkitBackdropFilter: 'blur(40px) saturate(250%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div className="flex items-center justify-between relative">
            {/* Logo - Left */}
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
              <Logo className="w-8 h-8 rounded-lg overflow-hidden transition-transform group-hover:scale-105 shrink-0" />
              <span
                className="text-lg font-semibold tracking-tight"
                style={{ color: textColor }}
              >
                Eventrax
              </span>
            </div>

            {/* Links - Absolute Center */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-8 text-sm font-medium"
              style={{ color: textMuted }}
            >
              {[
                { name: 'Features', progress: 0.4 },
                { name: 'About', targetId: 'about-section' }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.targetId) {
                      const section = document.getElementById(item.targetId);
                      if (section) section.scrollIntoView({ behavior: 'smooth' });
                    } else if (item.progress !== undefined) {
                      const targetScroll = (document.documentElement.scrollHeight - window.innerHeight) * item.progress;
                      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
                    }
                  }}
                  className="hover:opacity-100 transition-opacity relative group cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                  style={{ color: textColor, opacity: 0.7 }}
                >
                  {item.name}
                  <span
                    className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full"
                    style={{ backgroundColor: textColor }}
                  ></span>
                </button>
              ))}
            </div>

            {/* Button - Right */}
            <div className="flex items-center gap-3">
              <Button
                className="h-9 rounded-full px-5 text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: btnBg,
                  color: btnText,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
                }}
                onClick={() => navigate('/login')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Background - Cross-fade */}
      <div className="fixed inset-0 z-0">
        {!loaded && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white bg-black">
            <div className="text-xl font-bold mb-4 font-sans tracking-tight">Loading Experience</div>
            <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-200"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
        />
      </div>

      {/* Scroll spacer for the 20-frame image sequence */}
      <div style={{ height: '2000vh' }} className="relative z-10" />

      {/* Appended Document Content (Scrolls into view after the 2000vh sequence) */}
      <div id="about-section" className="relative z-30 w-full bg-[#0a001a]"> {/* Deep purple space base */}
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none h-full w-full overflow-hidden">
          <Moon className="absolute top-[15%] right-[10%] md:right-[20%] w-32 h-32 md:w-48 md:h-48 text-purple-300/10 -rotate-12 animate-[pulse_10s_ease-in-out_infinite]" />
          <Rocket className="absolute top-[60%] left-[5%] md:left-[15%] w-16 h-16 md:w-24 md:h-24 text-purple-300/10 rotate-[45deg] animate-[bounce_8s_ease-in-out_infinite]" />
          <Star className="absolute top-[25%] left-[25%] w-6 h-6 text-purple-200/20 animate-[pulse_3s_ease-in-out_infinite]" />
          <Star className="absolute bottom-[40%] right-[30%] w-4 h-4 text-purple-200/20 animate-[pulse_4s_ease-in-out_infinite]" />
          <Star className="absolute top-[50%] right-[15%] w-8 h-8 text-purple-200/20 animate-[pulse_5s_ease-in-out_infinite]" />
          <Star className="absolute bottom-[20%] left-[30%] w-5 h-5 text-purple-200/20 animate-[pulse_6s_ease-in-out_infinite]" />
        </div>
        {/* Seamless gradient merging the final galaxy frame into the dark purple background */}
        <div className="h-[600px] w-full bg-gradient-to-b from-transparent via-[#1a0b2e]/90 to-[#0a001a] absolute -top-[600px] left-0 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 pt-32 pb-32 text-center relative z-10">
          <div className="inline-block mb-8 px-6 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md">
            <span className="!text-white text-sm font-bold tracking-widest uppercase">The Future of Events</span>
          </div>

          <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 !text-white" style={{ textShadow: "0 2px 40px rgba(255,255,255,0.2)" }}>
            About Eventrax
          </h2>

          <p className="text-xl md:text-3xl font-light leading-relaxed mb-16 max-w-3xl mx-auto !text-white/90">
            Built for modern universities and dynamic organizations, we remove the friction from large-scale management. From the first idea to the final expense report, bring your entire team into one unified workspace.
          </p>

          <div className="flex gap-6 flex-wrap justify-center items-center">
            <Button
              className="h-14 rounded-full px-10 text-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]"
              style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: '#ffffff', border: 'none' }}
              onClick={() => navigate('/signup')}
            >
              Start Free Trial
            </Button>
            <Button
              className="h-14 rounded-full px-10 text-lg font-medium transition-all hover:scale-105 active:scale-95 hover:bg-white/10"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Ambient background glow for the About section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

        {/* Static Footer */}
        <footer className="w-full py-8 border-t border-purple-500/20 bg-[#050010] relative z-20">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm !text-purple-200/50">
            <div className="flex gap-4">
              <span className="!text-purple-200/50">Copyright © 2026 Eventrax Inc. All rights reserved.</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="!text-purple-300 transition-colors">Privacy Policy</a>
              <a href="#" className="!text-purple-300 transition-colors">Terms of Use</a>
              <a href="#" className="!text-purple-300 transition-colors">Sales Policy</a>
              <a href="#" className="!text-purple-300 transition-colors">Legal</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Scroll indicator - shows in early/middle frames */}
      <div
        className="fixed bottom-8 left-0 right-0 z-20 flex flex-col items-center justify-center pointer-events-none"
        style={{
          opacity: scrollProgress > 0.05 && scrollProgress < 0.8 ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        <div className="flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
