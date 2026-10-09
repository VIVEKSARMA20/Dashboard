import { useEffect, useRef } from 'react';

// Controlled N-box code input: auto-advance, backspace to previous, arrow keys, paste/SMS autofill fills all boxes.
export default function OtpInput({ digits, onChange, onComplete, invalid, labelledBy, describedBy, digitLabel, focusKey }) {
  const refs = useRef([]);
  const length = digits.length;

  useEffect(() => { refs.current[0]?.focus(); }, [focusKey]);

  const focusAt = i => refs.current[Math.max(0, Math.min(i, length - 1))]?.focus();

  const commit = next => {
    onChange(next);
    if (next.every(Boolean)) onComplete?.(next.join(''));
  };

  const fillFrom = (start, str) => {
    const next = [...digits];
    let i = start;
    for (const ch of str) {
      if (i >= length) break;
      next[i++] = ch;
    }
    commit(next);
    focusAt(i);
  };

  const handleChange = (i, e) => {
    let d = e.target.value.replace(/\D/g, '');
    const prev = digits[i];
    // Typed next to an existing digit instead of replacing it: drop the old one.
    if (prev && d.length > 1) {
      if (d.startsWith(prev)) d = d.slice(1);
      else if (d.endsWith(prev)) d = d.slice(0, -1);
    }
    // Several digits at once (autofill, IME, multi-char insert): spread them across boxes.
    if (d.length > 1) { fillFrom(i, d); return; }
    const next = [...digits];
    next[i] = d;
    commit(next);
    if (d) focusAt(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      const next = [...digits];
      next[i - 1] = '';
      onChange(next);
      focusAt(i - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(i + 1);
    }
  };

  const handlePaste = e => {
    e.preventDefault();
    const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
    if (d) fillFrom(0, d);
  };

  return (
    <div className="lc-otp" role="group" aria-labelledby={labelledBy} style={{ '--lc-otp-count': length }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          className={`lc-otp-box${d ? ' is-filled' : ''}`}
          style={{ '--i': i }}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={digitLabel(i + 1)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          value={d}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
        />
      ))}
    </div>
  );
}
