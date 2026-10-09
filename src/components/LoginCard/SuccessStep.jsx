import { useEffect, useRef } from 'react';

export default function SuccessStep({ t, onDone, delay = 2200 }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const id = setTimeout(() => onDoneRef.current?.(), delay);
    return () => clearTimeout(id);
  }, [delay]);

  return (
    <div className="lc-success" role="status">
      <div className="lc-check" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </div>
      <h1 className="lc-title">{t.welcome}</h1>
      <p className="lc-sub">{t.redirect}</p>
      <div className="lc-progress" style={{ '--lc-progress-ms': `${delay}ms` }}><span /></div>
    </div>
  );
}
