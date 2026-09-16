import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Stethoscope, Zap, ShieldAlert, ArrowUpRight } from 'lucide-react';

export const CursorFollower = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [trailingPos, setTrailingPos] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const [tipInfo, setTipInfo] = useState({
    text: '',
    badge: '',
    type: 'default',
    title: '',
  });

  const targetRef = useRef({ x: -100, y: -100 });
  const animFrameRef = useRef(null);
  const isFinePointerRef = useRef(false);

  useEffect(() => {
    // Check if device supports fine cursor (mouse/trackpad, not touchscreen)
    isFinePointerRef.current = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointerRef.current) return;

    const handleMouseMove = (e) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Check if hovering an interactive or annotated element
      const target = e.target.closest('[data-cursor-tip], a, button, [role="button"], input, select');
      if (target) {
        setIsPointer(true);
        const tipText = target.getAttribute('data-cursor-tip');
        const tipBadge = target.getAttribute('data-cursor-badge');
        const tipType = target.getAttribute('data-cursor-type') || 'default';
        const tipTitle = target.getAttribute('data-cursor-title') || '';

        if (tipText || tipBadge) {
          setTipInfo({
            text: tipText || '',
            badge: tipBadge || '',
            type: tipType,
            title: tipTitle,
          });
        } else {
          setTipInfo({ text: '', badge: '', type: 'default', title: '' });
        }
      } else {
        setIsPointer(false);
        setTipInfo({ text: '', badge: '', type: 'default', title: '' });
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    // Smooth physics-based spring lerp for trailing outer ring
    const renderLoop = () => {
      setTrailingPos((prev) => {
        const ease = 0.18;
        const dx = targetRef.current.x - prev.x;
        const dy = targetRef.current.y - prev.y;
        return {
          x: prev.x + dx * ease,
          y: prev.y + dy * ease,
        };
      });
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  // Compute flip offset if close to screen borders
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const isNearRight = position.x > viewportWidth - 260;
  const isNearBottom = position.y > viewportHeight - 140;

  const popupLeft = isNearRight ? position.x - 220 : position.x + 18;
  const popupTop = isNearBottom ? position.y - 70 : position.y + 18;

  // Choose icon based on tip type
  const renderIcon = () => {
    switch (tipInfo.type) {
      case 'emergency':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />;
      case 'doctor':
        return <Stethoscope className="w-3.5 h-3.5 text-amber-400" />;
      case 'queue':
        return <Zap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden hidden md:block">
      {/* Inner precise dot */}
      <div
        className={`fixed w-2 h-2 rounded-full pointer-events-none transition-transform duration-75 ease-out ${
          isPointer ? 'bg-amber-400 scale-150' : 'bg-amber-500'
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 10px rgba(249, 208, 84, 0.8)',
        }}
      />

      {/* Trailing ambient halo ring */}
      <div
        className={`fixed rounded-full pointer-events-none border transition-all duration-300 ease-out ${
          isPointer
            ? 'w-10 h-10 border-amber-400/80 bg-amber-400/10 scale-110 shadow-gold-glow'
            : 'w-7 h-7 border-amber-500/40 bg-amber-500/5'
        }`}
        style={{
          left: `${trailingPos.x}px`,
          top: `${trailingPos.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Dynamic Cursor-Follow Floating Popup HUD */}
      {tipInfo.text && (
        <div
          className="fixed pointer-events-none z-[10000] animate-hud-popup"
          style={{
            left: `${popupLeft}px`,
            top: `${popupTop}px`,
          }}
        >
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-navy-950/95 backdrop-blur-xl border border-amber-400/50 shadow-2xl text-white max-w-xs transition-all">
            <div className="p-1 rounded-lg bg-amber-500/15 border border-amber-400/30 flex-shrink-0">
              {renderIcon()}
            </div>
            <div className="flex-1 min-w-0">
              {tipInfo.badge && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-widest bg-amber-500/25 text-amber-300 border border-amber-400/30">
                    {tipInfo.badge}
                  </span>
                  {tipInfo.title && (
                    <span className="text-[10px] font-bold text-slate-300 truncate">
                      {tipInfo.title}
                    </span>
                  )}
                </div>
              )}
              <p className="text-[11px] font-semibold text-slate-100 leading-tight">
                {tipInfo.text}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CursorFollower;
