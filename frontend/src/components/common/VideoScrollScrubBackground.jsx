import React, { useEffect, useRef, useState, useCallback } from 'react';

const LOCAL_VIDEO_URL = '/videos/background-087.mp4';
const REMOTE_VIDEO_URL =
  '';

const OPACITY_PRESETS = [
  { id: 'subtle', label: 'Subtle', value: 0.35 },
  { id: 'balanced', label: 'Balanced', value: 0.55 },
  { id: 'vivid', label: 'Vivid', value: 0.8 },
];

/**
 * VideoScrollScrubBackground
 * High-performance GPU-accelerated video background that scrubs playback time
 * dynamically based on the user's scroll position across the homepage.
 */
export const VideoScrollScrubBackground = () => {
  const videoRef = useRef(null);
  const targetTimeRef = useRef(0);
  const durationRef = useRef(10.04);
  const isSeekingRef = useRef(false);
  const rafIdRef = useRef(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10.04);
  const [opacityMode, setOpacityMode] = useState('balanced');
  const [isVisible, setIsVisible] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Compute active opacity value
  const activeOpacity = OPACITY_PRESETS.find((p) => p.id === opacityMode)?.value ?? 0.55;

  // Track page scroll and calculate target video time
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY || window.pageYOffset;
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1
    );
    const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

    setScrollProgress(progress);
    targetTimeRef.current = progress * durationRef.current;
  }, []);

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial measure
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      const vidDuration = videoRef.current.duration;
      durationRef.current = vidDuration;
      setDuration(vidDuration);
      setIsVideoLoaded(true);
      videoRef.current.pause(); // Ensure paused for manual scrubbing
      handleScroll();
    }
  };

  // Buttery-Smooth LERP requestAnimationFrame seeking loop
  useEffect(() => {
    // Respect user reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let isSubscribed = true;

    const tick = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && !isSeekingRef.current) {
        const current = video.currentTime;
        const target = targetTimeRef.current;
        const diff = target - current;

        // Smooth interpolation step (LERP)
        if (Math.abs(diff) > 0.02) {
          isSeekingRef.current = true;
          // Responsive & smooth dampening factor
          const nextTime = current + diff * 0.30;
          video.currentTime = Math.min(Math.max(nextTime, 0), durationRef.current);
          setCurrentTime(video.currentTime);
        } else if (Math.abs(diff) > 0.001) {
          video.currentTime = Math.min(Math.max(target, 0), durationRef.current);
          setCurrentTime(video.currentTime);
        } else {
          setCurrentTime(current);
        }
      }

      if (isSubscribed) {
        rafIdRef.current = requestAnimationFrame(tick);
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      isSubscribed = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Clear seeking lock on seeked event
  const handleSeeked = () => {
    isSeekingRef.current = false;
  };

  // Format seconds to mm:ss.s
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${tenths}`;
  };

  return (
    <>
      {/* Fixed Ambient Background Video Layer with Smooth Scrub */}
      <div
        className={`fixed inset-0 pointer-events-none -z-20 overflow-hidden transition-opacity duration-700 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ willChange: 'opacity' }}
        aria-hidden="true"
      >
        <video
          ref={videoRef}
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleSeeked}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover select-none filter contrast-[1.05] saturate-[1.1]"
          style={{
            opacity: activeOpacity,
            transition: 'opacity 0.4s ease-in-out',
            transform: 'scale(1.02)', // Avoid subpixel edge lines
          }}
        >
          <source src={LOCAL_VIDEO_URL} type="video/mp4" />
          <source src={REMOTE_VIDEO_URL} type="video/mp4" />
        </video>

        {/* Ambient Theme-Aware Gradient Veil for Optimal Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-[#F8FAFC]/65 to-white/80 dark:from-[#070D18]/80 dark:via-[#0B1524]/75 dark:to-[#070D18]/85 backdrop-blur-[1px] transition-colors duration-300 pointer-events-none" />

        {/* Subtle Cyber Grid Texture on Top of Video */}
        <div className="absolute inset-0 bg-cyber-grid opacity-30 dark:opacity-20 pointer-events-none" />
      </div>

    </>
  );
};

export default VideoScrollScrubBackground;
