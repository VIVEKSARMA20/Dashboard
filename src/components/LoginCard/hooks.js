import { useCallback, useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Crossfade between steps: the current step fades out and lifts slightly (outMs), then the next one mounts and fades in via CSS.
export function useStepTransition(initial, { outMs = 180 } = {}) {
  const [step, setStep] = useState(initial);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef();

  const goTo = useCallback(next => {
    clearTimeout(timer.current);
    if (prefersReducedMotion()) { setStep(next); return; }
    setLeaving(true);
    timer.current = setTimeout(() => { setStep(next); setLeaving(false); }, outMs);
  }, [outMs]);

  useEffect(() => () => clearTimeout(timer.current), []);
  return { step, leaving, goTo };
}

// Restarts the shake keyframe on the referenced element, even when triggered twice in a row.
export function useShake() {
  const ref = useRef(null);
  const shake = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('lc-shake');
    void el.offsetWidth;
    el.classList.add('lc-shake');
  }, []);
  return [ref, shake];
}

export function useCountdown(initialSeconds) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    if (seconds <= 0) return undefined;
    const id = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);
  const restart = useCallback(() => setSeconds(initialSeconds), [initialSeconds]);
  return [seconds, restart, setSeconds];
}
