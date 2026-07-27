import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SplitText = ({
  text = '',
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete
}) => {
  const ref = useRef(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (!ref.current || !text) return;
    if (animationCompletedRef.current) return;

    const el = ref.current;
    const targets = el.querySelectorAll('.split-item');

    if (targets.length === 0) return;

    const startPct = (1 - threshold) * 100;
    const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
    const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
    const sign =
      marginValue === 0
        ? ''
        : marginValue < 0
          ? `-=${Math.abs(marginValue)}${marginUnit}`
          : `+=${marginValue}${marginUnit}`;
    const start = `top ${startPct}%${sign}`;

    const tween = gsap.fromTo(
      targets,
      { ...from },
      {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
          fastScrollEnd: true,
          anticipatePin: 0.4
        },
        onComplete: () => {
          animationCompletedRef.current = true;
          onCompleteRef.current?.();
        },
        willChange: 'transform, opacity',
        force3D: true
      }
    );

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === el) st.kill();
      });
    };
  }, [text, delay, duration, ease, splitType, JSON.stringify(from), JSON.stringify(to), threshold, rootMargin]);

  const Tag = tag || 'p';

  const renderContent = () => {
    if (!text) return null;

    if (splitType === 'words') {
      const words = text.split(' ');
      return words.map((word, wIdx) => (
        <span
          key={wIdx}
          className="split-item split-word"
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {word}{wIdx < words.length - 1 ? ' ' : ''}
        </span>
      ));
    }

    // Default: 'chars' or 'words, chars'
    const words = text.split(' ');
    return words.map((word, wIdx) => (
      <span
        key={wIdx}
        className="split-word"
        style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
      >
        {word.split('').map((char, cIdx) => (
          <span
            key={cIdx}
            className="split-item split-char"
            style={{ display: 'inline-block', willChange: 'transform, opacity' }}
          >
            {char}
          </span>
        ))}
        {wIdx < words.length - 1 ? <span style={{ display: 'inline-block' }}>&nbsp;</span> : null}
      </span>
    ));
  };

  return (
    <Tag
      ref={ref}
      className={`split-parent ${className}`}
      style={{
        textAlign,
        display: 'inline-block',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        willChange: 'transform, opacity'
      }}
    >
      {renderContent()}
    </Tag>
  );
};

export default SplitText;
