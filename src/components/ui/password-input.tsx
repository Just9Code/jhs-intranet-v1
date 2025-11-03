'use client';

import { useState, useRef, useEffect, InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string;
}

const OPEN_TOP = "M1 12C1 12 5 4 12 4C19 4 23 12 23 12";
const CLOSED_TOP = "M1 12C1 12 5 12 12 12C19 12 23 12 23 12";
const OPEN_BOTTOM = "M1 12C1 12 5 20 12 20C19 20 23 12 23 12";
const CLOSED_BOTTOM = "M1 12C1 12 5 12 12 12C19 12 23 12 23 12";

export function PasswordInput({ className, value, onChange, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  
  const irisRef = useRef<SVGGElement>(null);
  const topLidRef = useRef<SVGPathElement>(null);
  const bottomLidRef = useRef<SVGPathElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const originalValueRef = useRef('');
  const resetEyeRef = useRef<gsap.core.Tween | null>(null);

  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:',.<>?/`~";

  // Update original value ref when value changes
  useEffect(() => {
    if (typeof value === 'string') {
      originalValueRef.current = value;
      if (!isAnimating) {
        setDisplayValue(value);
      }
    }
  }, [value, isAnimating]);

  // Blink animation
  const blink = () => {
    if (!topLidRef.current || !bottomLidRef.current || !isVisible) return;

    const delay = gsap.utils.random(2, 7);
    const reps = Math.random() > 0.5 ? 2 : 1;
    
    blinkTimeoutRef.current = setTimeout(() => {
      const tl = gsap.timeline({
        repeat: reps - 1,
        yoyo: false,
        onComplete: blink
      });

      tl.to(topLidRef.current, { attr: { d: CLOSED_TOP }, duration: 0.08 })
        .to(bottomLidRef.current, { attr: { d: CLOSED_TOP }, duration: 0.08 }, 0)
        .to(topLidRef.current, { attr: { d: OPEN_TOP }, duration: 0.08 })
        .to(bottomLidRef.current, { attr: { d: OPEN_BOTTOM }, duration: 0.08 }, "<");
    }, delay * 1000);
  };

  // Scramble text animation
  const scrambleText = (targetText: string, onUpdate: (text: string) => void, onComplete: () => void) => {
    const duration = 1000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const charsRevealed = Math.floor(targetText.length * progress);
      let result = targetText.slice(0, charsRevealed);
      
      const remaining = targetText.length - charsRevealed;
      for (let i = 0; i < remaining; i++) {
        result += charset[Math.floor(Math.random() * charset.length)];
      }
      
      onUpdate(result);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    
    animate();
  };

  // Eye open/close animation with scramble
  const toggleEye = () => {
    if (!topLidRef.current || !bottomLidRef.current || !irisRef.current || isAnimating) return;

    if (blinkTimeoutRef.current) {
      clearTimeout(blinkTimeoutRef.current);
      blinkTimeoutRef.current = null;
    }

    setIsAnimating(true);
    const original = originalValueRef.current;

    if (isVisible) {
      // Close eye - hide password
      gsap.timeline({
        onComplete: () => {
          setIsVisible(false);
          setDisplayValue(original);
          setIsAnimating(false);
        }
      })
      .to(topLidRef.current, { attr: { d: CLOSED_TOP }, duration: 0.12 })
      .to(bottomLidRef.current, { attr: { d: CLOSED_BOTTOM }, duration: 0.12 }, 0)
      .to(irisRef.current, { opacity: 0, duration: 0.12 }, 0);

      // Scramble from text to bullets
      const bullets = '•'.repeat(original.length);
      scrambleText(bullets, (text) => {
        setDisplayValue(text);
      }, () => {});

    } else {
      // Open eye - show password
      setIsVisible(true);
      
      gsap.timeline({
        onComplete: () => {
          setIsAnimating(false);
          blink();
        }
      })
      .to(topLidRef.current, { attr: { d: OPEN_TOP }, duration: 0.12 })
      .to(bottomLidRef.current, { attr: { d: OPEN_BOTTOM }, duration: 0.12 }, 0)
      .to(irisRef.current, { opacity: 1, duration: 0.12 }, 0);

      // Scramble from bullets to text
      scrambleText(original, (text) => {
        setDisplayValue(text);
      }, () => {
        setDisplayValue(original);
      });
    }
  };

  // Track mouse position for iris movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current || !irisRef.current) return;
      
      if (resetEyeRef.current) {
        resetEyeRef.current.kill();
      }
      
      resetEyeRef.current = gsap.delayedCall(2, () => {
        gsap.to(irisRef.current, { xPercent: 0, yPercent: 0, duration: 0.2 });
      });
      
      const bounds = buttonRef.current.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      
      const mapRange = (value: number) => {
        const normalized = value / 100;
        return normalized * 60 - 30;
      };
      
      const xPercent = Math.max(-30, Math.min(30, mapRange((centerX - e.clientX) * -1)));
      const yPercent = Math.max(-30, Math.min(30, mapRange((centerY - e.clientY) * -1)));
      
      gsap.set(irisRef.current, { xPercent, yPercent });
    };

    window.addEventListener('pointermove', handleMouseMove);
    return () => window.removeEventListener('pointermove', handleMouseMove);
  }, []);

  // Initial setup - eye closed with iris hidden
  useEffect(() => {
    if (topLidRef.current && bottomLidRef.current && irisRef.current) {
      gsap.set(topLidRef.current, { attr: { d: CLOSED_TOP } });
      gsap.set(bottomLidRef.current, { attr: { d: CLOSED_BOTTOM } });
      gsap.set(irisRef.current, { opacity: 0 });
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
      if (resetEyeRef.current) {
        resetEyeRef.current.kill();
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    originalValueRef.current = newValue;
    setDisplayValue(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="relative">
      <Input
        {...props}
        ref={inputRef}
        type={isVisible ? 'text' : 'password'}
        value={isAnimating ? displayValue : (value ?? displayValue)}
        onChange={handleChange}
        className={cn('pr-14', className)}
        autoComplete="off"
        disabled={isAnimating || props.disabled}
      />
      
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleEye}
        disabled={isAnimating}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={isVisible ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
          <defs>
            <mask id="mask-open">
              <path 
                d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12V20H12H1V12Z" 
                fill="#D9D9D9" 
                stroke="black" 
                strokeWidth="1.5" 
                strokeLinejoin="round" 
              />
            </mask>
          </defs>
          
          <path 
            ref={topLidRef}
            className="lid top-lid" 
            d={CLOSED_TOP}
            stroke="rgb(63, 63, 70)"
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
          
          <path 
            ref={bottomLidRef}
            className="lid bottom-lid" 
            d={CLOSED_BOTTOM}
            stroke="rgb(63, 63, 70)"
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
          
          <g mask="url(#mask-open)">
            <g ref={irisRef} className="iris">
              <circle 
                className="iris-base" 
                cx="12" 
                cy="12" 
                r="4" 
                fill="rgb(0, 191, 191)" 
              />
              <circle 
                className="pupil" 
                cx="12" 
                cy="12" 
                r="1.5" 
                fill="black"
              />
              <circle 
                className="glare" 
                cx="13" 
                cy="11" 
                r="0.9" 
                fill="white"
              />
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
}