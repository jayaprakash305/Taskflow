import React, { useEffect, useRef, useCallback, useMemo } from 'react';

const DEFAULT_INNER_GRADIENT = 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  DEVICE_BETA_OFFSET: 20,
  ENTER_TRANSITION_MS: 180
};

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v, fMin, fMax, tMin, tMax) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

// Inject keyframes once
const KEYFRAMES_ID = 'pc-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(KEYFRAMES_ID)) {
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes pc-holo-bg {
      0% { background-position: 0 var(--background-y), 0 0, center; }
      100% { background-position: 0 var(--background-y), 90% 90%, center; }
    }
  `;
  document.head.appendChild(style);
}

const ProfileCardComponent = ({
  avatarUrl = '',
  iconUrl = '',
  grainUrl = '',
  innerGradient,
  behindGlowEnabled = true,
  behindGlowColor,
  behindGlowSize,
  className = '',
  enableTilt = true,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  miniAvatarUrl,
  name = 'User',
  title = 'Employee',
  handle = 'user',
  status = 'Online',
  contactText = 'Contact',
  showUserInfo = true,
  onContactClick
}) => {
  const wrapRef = useRef(null);
  const shellRef = useRef(null);
  const enterTimerRef = useRef(null);
  const leaveRafRef = useRef(null);

  const tiltEngine = useMemo(() => {
    if (!enableTilt) return null;
    let rafId = null;
    let running = false;
    let lastTs = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x, y) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;
      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;
      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);
      const centerX = percentX - 50;
      const centerY = percentY - 50;
      const properties = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top': `${percentY / 100}`,
        '--pointer-from-left': `${percentX / 100}`,
        '--rotate-x': `${round(-(centerX / 5))}deg`,
        '--rotate-y': `${round(centerY / 4)}deg`
      };
      for (const [k, v] of Object.entries(properties)) wrap.style.setProperty(k, v);
    };

    const step = ts => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;
      setVarsFromXY(currentX, currentY);
      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;
      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setImmediate(x, y) { currentX = x; currentY = y; setVarsFromXY(currentX, currentY); },
      setTarget(x, y) { targetX = x; targetY = y; start(); },
      toCenter() { const shell = shellRef.current; if (!shell) return; this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2); },
      beginInitial(durationMs) { initialUntil = performance.now() + durationMs; start(); },
      getCurrent() { return { x: currentX, y: currentY, tx: targetX, ty: targetY }; },
      cancel() { if (rafId) cancelAnimationFrame(rafId); rafId = null; running = false; lastTs = 0; }
    };
  }, [enableTilt]);

  const getOffsets = (evt, el) => {
    const rect = el.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  };

  const handlePointerMove = useCallback(event => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    const { x, y } = getOffsets(event, shell);
    tiltEngine.setTarget(x, y);
  }, [tiltEngine]);

  const handlePointerEnter = useCallback(event => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    shell.classList.add('active');
    shell.classList.add('entering');
    if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
    enterTimerRef.current = window.setTimeout(() => { shell.classList.remove('entering'); }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);
    const { x, y } = getOffsets(event, shell);
    tiltEngine.setTarget(x, y);
  }, [tiltEngine]);

  const handlePointerLeave = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    tiltEngine.toCenter();
    const checkSettle = () => {
      const { x, y, tx, ty } = tiltEngine.getCurrent();
      const settled = Math.hypot(tx - x, ty - y) < 0.6;
      if (settled) { shell.classList.remove('active'); leaveRafRef.current = null; }
      else { leaveRafRef.current = requestAnimationFrame(checkSettle); }
    };
    if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
    leaveRafRef.current = requestAnimationFrame(checkSettle);
  }, [tiltEngine]);

  const handleDeviceOrientation = useCallback(event => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    const { beta, gamma } = event;
    if (beta == null || gamma == null) return;
    const centerX = shell.clientWidth / 2;
    const centerY = shell.clientHeight / 2;
    const x = clamp(centerX + gamma * mobileTiltSensitivity, 0, shell.clientWidth);
    const y = clamp(centerY + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * mobileTiltSensitivity, 0, shell.clientHeight);
    tiltEngine.setTarget(x, y);
  }, [tiltEngine, mobileTiltSensitivity]);

  useEffect(() => {
    if (!enableTilt || !tiltEngine) return;
    const shell = shellRef.current;
    if (!shell) return;
    shell.addEventListener('pointerenter', handlePointerEnter);
    shell.addEventListener('pointermove', handlePointerMove);
    shell.addEventListener('pointerleave', handlePointerLeave);
    const handleClick = () => {
      if (!enableMobileTilt || location.protocol !== 'https:') return;
      const anyMotion = window.DeviceMotionEvent;
      if (anyMotion && typeof anyMotion.requestPermission === 'function') {
        anyMotion.requestPermission().then(state => {
          if (state === 'granted') window.addEventListener('deviceorientation', handleDeviceOrientation);
        }).catch(console.error);
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    };
    shell.addEventListener('click', handleClick);
    const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    tiltEngine.setImmediate(initialX, initialY);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);
    return () => {
      shell.removeEventListener('pointerenter', handlePointerEnter);
      shell.removeEventListener('pointermove', handlePointerMove);
      shell.removeEventListener('pointerleave', handlePointerLeave);
      shell.removeEventListener('click', handleClick);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
      shell.classList.remove('entering');
    };
  }, [enableTilt, enableMobileTilt, tiltEngine, handlePointerMove, handlePointerEnter, handlePointerLeave, handleDeviceOrientation]);

  const cardRadius = '24px';

  const cardStyle = useMemo(() => ({
    '--icon': iconUrl ? `url(${iconUrl})` : 'none',
    '--grain': grainUrl ? `url(${grainUrl})` : 'none',
    '--inner-gradient': innerGradient ?? DEFAULT_INNER_GRADIENT,
    '--behind-glow-color': behindGlowColor ?? 'rgba(100, 140, 255, 0.5)',
    '--behind-glow-size': behindGlowSize ?? '60%',
    '--pointer-x': '50%', '--pointer-y': '50%',
    '--pointer-from-center': '0', '--pointer-from-top': '0.5', '--pointer-from-left': '0.5',
    '--card-opacity': '1', '--rotate-x': '0deg', '--rotate-y': '0deg',
    '--background-x': '50%', '--background-y': '50%', '--card-radius': cardRadius,
  }), [iconUrl, grainUrl, innerGradient, behindGlowColor, behindGlowSize, cardRadius]);

  const handleContactClick = useCallback(() => { onContactClick?.(); }, [onContactClick]);

  return (
    <div ref={wrapRef} className={`relative ${className}`.trim()}
      style={{ perspective: '500px', transform: 'translate3d(0, 0, 0.1px)', touchAction: 'none', ...cardStyle }}>

      {/* Behind glow */}
      {behindGlowEnabled && (
        <div style={{
          position: 'absolute', inset: '-20px', zIndex: 0, pointerEvents: 'none',
          background: `radial-gradient(circle at var(--pointer-x) var(--pointer-y), var(--behind-glow-color) 0%, transparent var(--behind-glow-size))`,
          filter: 'blur(40px) saturate(1.2)', opacity: 0.7
        }} />
      )}

      <div ref={shellRef} style={{ position: 'relative', zIndex: 1 }}>
        <section style={{
          display: 'grid', position: 'relative', overflow: 'hidden', backfaceVisibility: 'hidden',
          height: '60svh', maxHeight: '460px', aspectRatio: '0.718', borderRadius: cardRadius,
          boxShadow: 'rgba(0, 0, 0, 0.6) calc((var(--pointer-from-left) * 10px) - 3px) calc((var(--pointer-from-top) * 20px) - 6px) 30px -5px',
          transition: 'transform 1s ease',
          transform: 'translateZ(0) rotateX(0deg) rotateY(0deg)',
        }}
          onMouseEnter={e => { e.currentTarget.style.transition = 'none'; e.currentTarget.style.transform = 'translateZ(0) rotateX(var(--rotate-y)) rotateY(var(--rotate-x))'; }}
          onMouseLeave={e => {
            const shell = shellRef.current;
            if (shell?.classList.contains('entering')) e.currentTarget.style.transition = 'transform 180ms ease-out';
            else e.currentTarget.style.transition = 'transform 1s ease';
            e.currentTarget.style.transform = 'translateZ(0) rotateX(0deg) rotateY(0deg)';
          }}>

          {/* Background gradient layer */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'var(--inner-gradient)',
            borderRadius: cardRadius, zIndex: 0
          }} />

          {/* Avatar photo - CLEARLY VISIBLE, no blend mode destroying it */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            zIndex: 1, borderRadius: cardRadius, overflow: 'hidden'
          }}>
            <img
              src={avatarUrl}
              alt={`${name || 'User'} avatar`}
              loading="lazy"
              style={{
                width: '85%',
                maxHeight: '75%',
                objectFit: 'contain',
                objectPosition: 'bottom center',
                display: 'block',
                filter: 'brightness(0.95) contrast(1.05)',
                transform: 'translateX(calc((var(--pointer-from-left) - 0.5) * 6px)) translateY(calc((var(--pointer-from-top) - 0.5) * 4px))',
                transition: 'transform 120ms ease-out',
              }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* Subtle top shadow for text readability */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            background: 'linear-gradient(to bottom, rgba(10, 10, 30, 0.7) 0%, rgba(10, 10, 30, 0.2) 30%, transparent 50%, transparent 70%, rgba(10, 10, 30, 0.5) 100%)',
            borderRadius: cardRadius
          }} />

          {/* Very subtle shine overlay - low opacity so photo stays visible */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
            background: `radial-gradient(
              farthest-corner circle at var(--pointer-x) var(--pointer-y),
              rgba(200, 220, 255, 0.08) 0%,
              transparent 60%
            )`,
            borderRadius: cardRadius,
            mixBlendMode: 'screen'
          }} />

          {/* Subtle glare on hover */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
            backgroundImage: `radial-gradient(
              farthest-corner circle at var(--pointer-x) var(--pointer-y),
              rgba(180, 200, 255, 0.12) 0%,
              transparent 70%
            )`,
            borderRadius: cardRadius,
            mixBlendMode: 'screen',
            opacity: 0.6
          }} />

          {/* Border glow */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
            borderRadius: cardRadius,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)'
          }} />

          {/* Name and Title - clearly visible at top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 6,
            textAlign: 'center', pointerEvents: 'none', padding: '28px 20px 0',
            transform: 'translate3d(calc(var(--pointer-from-left) * -4px + 2px), calc(var(--pointer-from-top) * -4px + 2px), 0.1px)',
          }}>
            <h3 style={{
              fontWeight: 700, margin: 0,
              fontSize: 'clamp(1.4rem, 4svh, 2.2rem)',
              color: '#ffffff',
              textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)',
              letterSpacing: '-0.01em',
              lineHeight: 1.2
            }}>{name}</h3>
            <p style={{
              fontWeight: 500, margin: '4px 0 0',
              fontSize: 'clamp(0.75rem, 1.8svh, 1rem)',
              color: 'rgba(180, 190, 220, 0.9)',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              letterSpacing: '0.02em'
            }}>{title}</p>
          </div>

          {/* User info bar at bottom */}
          {showUserInfo && (
            <div style={{
              position: 'absolute', bottom: '16px', left: '16px', right: '16px', zIndex: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '14px', padding: '10px 14px',
              pointerEvents: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  borderRadius: '50%', overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,0.15)',
                  flexShrink: 0, width: '40px', height: '40px',
                  background: 'rgba(0,0,0,0.3)'
                }}>
                  <img
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                    src={miniAvatarUrl || avatarUrl}
                    alt={`${name} mini avatar`}
                    loading="lazy"
                    onError={e => { e.target.style.opacity = '0.5'; e.target.src = avatarUrl; }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.95)', lineHeight: 1 }}>@{handle}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>{status}</div>
                </div>
              </div>
              <button onClick={handleContactClick} type="button" aria-label={`Contact ${name || 'user'}`}
                style={{
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 16px',
                  fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', cursor: 'pointer',
                  backdropFilter: 'blur(10px)', transition: 'all 0.2s ease-out', background: 'rgba(255,255,255,0.06)',
                  pointerEvents: 'auto'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                {contactText}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const ProfileCard = React.memo(ProfileCardComponent);
export default ProfileCard;
