import { useId, useRef, useState } from 'react';
import { useShake } from './hooks';
import { FieldError, IconMobile, SubmitButton } from './ui';

// MSPIN is digits only; whether it exists is validated by the API (onSubmit rejects).
export default function MspinStep({ t, mspin, onMspinChange, termsAccepted, onTermsChange, termsUrl, onSubmit }) {
  const id = useId();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const checkboxRef = useRef(null);
  const [mspinFieldRef, shakeMspin] = useShake();
  const [termsFieldRef, shakeTerms] = useShake();

  const fail = (field, message) => {
    setError({ field, message });
    if (field === 'terms') { shakeTerms(); checkboxRef.current?.focus(); }
    else { shakeMspin(); inputRef.current?.focus(); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    if (!mspin) return fail('mspin', t.errEmpty);
    if (!termsAccepted) return fail('terms', t.errTerms);
    setLoading(true);
    try {
      await onSubmit(mspin);
    } catch (err) {
      setLoading(false);
      fail('mspin', err?.message || t.errInvalid);
    }
  };

  // Keep only digits; if anything else was typed or pasted, say so instead of silently dropping it.
  const handleChange = e => {
    const raw = e.target.value.replace(/\s/g, '');
    const digits = raw.replace(/\D/g, '');
    onMspinChange(digits);
    if (digits !== raw) {
      setError({ field: 'mspin', message: t.errInvalid });
      shakeMspin();
    } else if (error?.field === 'mspin') {
      setError(null);
    }
  };

  const mspinError = error?.field === 'mspin' ? error.message : null;
  const termsError = error?.field === 'terms' ? error.message : null;

  return (
    <>
      <h1 className="lc-title">{t.title}</h1>
      <p className="lc-sub">{t.sub}</p>
      <form className="lc-form" noValidate onSubmit={handleSubmit}>
        <div ref={mspinFieldRef} className={`lc-field${mspinError ? ' is-invalid' : ''}`}>
          <label className="lc-label" htmlFor={`${id}-mspin`}>{t.label}</label>
          <input
            ref={inputRef}
            id={`${id}-mspin`}
            className="lc-input"
            name="mspin"
            autoComplete="username"
            inputMode="numeric"
            pattern="[0-9]*"
            autoFocus
            placeholder={t.placeholder}
            value={mspin}
            onChange={handleChange}
            aria-invalid={!!mspinError || undefined}
            aria-describedby={`${id}-mspin-err ${id}-mspin-help`}
          />
          <FieldError id={`${id}-mspin-err`} message={mspinError} />
          <p className="lc-help" id={`${id}-mspin-help`}><IconMobile />{t.help}</p>
        </div>

        <div ref={termsFieldRef} className={`lc-field lc-terms${termsError ? ' is-invalid' : ''}`}>
          <label className="lc-check-row">
            <input
              ref={checkboxRef}
              type="checkbox"
              className="lc-checkbox"
              checked={termsAccepted}
              onChange={e => { onTermsChange(e.target.checked); if (termsError) setError(null); }}
              aria-invalid={!!termsError || undefined}
              aria-describedby={`${id}-terms-err`}
            />
            <span>
              {t.checkPre} <a className="lc-link" href={termsUrl} target="_blank" rel="noopener noreferrer">{t.terms}</a>{t.checkPost}
            </span>
          </label>
          <FieldError id={`${id}-terms-err`} message={termsError} />
        </div>

        <SubmitButton loading={loading}>{t.cta}</SubmitButton>
      </form>
    </>
  );
}
