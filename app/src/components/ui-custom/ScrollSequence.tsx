import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface ScrollSequenceProps {
    frameCount?: number;
    imagesPath?: string;
    imagePrefix?: string;
    imageExtension?: string;
    height?: string;
    scale?: number;
    shiftY?: number;
    onFrameChange?: (currentFrame: number) => void;
    onTimeline?: (timeline: gsap.core.Timeline) => void;
    children?: React.ReactNode;
}

export function ScrollSequence({
    frameCount = 20,
    imagesPath = "/images/scroll-sequence",
    imagePrefix = "frame ",
    imageExtension = ".webp",
    height = "400vh", // Total scroll distance
    scale = 1,
    shiftY = 0,
    onFrameChange,
    onTimeline,
    children,
}: ScrollSequenceProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);

    const imagesRef = useRef<HTMLImageElement[]>([]);
    const frameObj = useRef({ frame: 0 }); // Object to tween

    // Refs for callbacks to prevent unnecessary re-runs
    const onFrameChangeRef = useRef(onFrameChange);
    const onTimelineRef = useRef(onTimeline);

    // Update refs when props change
    useEffect(() => {
        onFrameChangeRef.current = onFrameChange;
        onTimelineRef.current = onTimeline;
    }, [onFrameChange, onTimeline]);

    // Preload images
    useEffect(() => {
        let loadedCount = 0;
        const totalFrames = frameCount;
        const images: HTMLImageElement[] = [];

        const updateProgress = () => {
            loadedCount++;
            const progress = Math.round((loadedCount / totalFrames) * 100);
            setLoadProgress(progress);

            if (loadedCount === totalFrames) {
                setLoading(false);
                // Initial render handled by GSAP or manual call?
                // We'll let GSAP take over, but draw frame 0 immediately
                if (imagesRef.current.length > 0) {
                    drawFrame(0);
                }
            }
        };

        for (let i = 1; i <= totalFrames; i++) {
            const img = new Image();
            img.src = `${imagesPath}/${imagePrefix}${i}${imageExtension}`;
            img.onload = updateProgress;
            img.onerror = () => {
                console.error(`Failed to load image: ${img.src}`);
                updateProgress();
            };
            images.push(img);
        }

        imagesRef.current = images;

        return () => {
            imagesRef.current = [];
        };
    }, [frameCount, imagesPath, imagePrefix, imageExtension]);

    const drawFrame = (index: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const img = imagesRef.current[Math.round(index)]; // Round for array access

        if (!canvas || !ctx || !img) return;

        const { width, height } = canvas;
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

        drawWidth *= scale;
        drawHeight *= scale;

        offsetX = (width - drawWidth) / 2;
        offsetY = (height - drawHeight) / 2 + shiftY;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    // GSAP Animation
    useGSAP(() => {
        if (loading || !canvasRef.current || !containerRef.current) return;

        // Make sure canvas fits window
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                drawFrame(frameObj.current.frame);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial size

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: `+=${height}`, // Scroll duration
                scrub: 0.5, // 0.5s smoothing time -> KEY to fixing "slideshow" feel
                pin: true,
                anticipatePin: 1,
            }
        });

        // Expose timeline to parent
        if (onTimelineRef.current) {
            onTimelineRef.current(tl);
        }

        tl.to(frameObj.current, {
            frame: frameCount - 1,
            snap: "frame", // Optional: snap to exact integer frames? No, safer to just round in drawFrame for smoother scrub
            ease: "none",
            onUpdate: () => {
                const currentFrame = Math.round(frameObj.current.frame);
                drawFrame(currentFrame);
                // Call the ref instead of the prop directly
                if (onFrameChangeRef.current) {
                    onFrameChangeRef.current(currentFrame);
                }
            }
        });

        return () => window.removeEventListener('resize', handleResize);

    }, [loading, height, frameCount]); // Removed onFrameChange from deps to prevent re-init

    return (
        <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden">
            {loading && (
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
            {/* Overlay Children */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {children}
            </div>
        </div>
    );
}
