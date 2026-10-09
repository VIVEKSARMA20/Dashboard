import { useId, useState } from 'react';
import { useCountdown, useShake } from './hooks';
import OtpInput from './OtpInput';
import { FieldError, IconArrowLeft, IconClock, SubmitButton } from './ui';

const formatTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function OtpStep({ t, maskedPhone, length, resendSeconds, onVerify, onResend, onBack }) {
  const id = useId();
  const empty = () => Array(length).fill('');
  const [digits, setDigits] = useState(empty);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  const [seconds, restartCountdown, setSeconds] = useCountdown(resendSeconds);
  const [fieldRef, shake] = useShake();

  const reset = message => {
    setError(message);
    setDigits(empty());
    setFocusKey(k => k + 1);
    if (message) shake();
  };

  const verify = async code => {
    if (loading) return;
    if (code.length < length) { setError(t.errOtpLen(length)); shake(); return; }
    setLoading(true);
    try {
      await onVerify(code);
    } catch (err) {
      setLoading(false);
      reset(err?.message || t.errOtp);
    }
  };

  const handleResend = async () => {
    reset('');
    restartCountdown();
    try {
      await onResend?.();
    } catch (err) {
      setSeconds(0);
      setError(err?.message || t.errGeneric);
    }
  };

  return (
    <>
      <button type="button" className="lc-back" onClick={onBack}><IconArrowLeft />{t.back}</button>
      <h1 className="lc-title">{t.otpTitle}</h1>
      <div className="lc-sent">
        <span>{t.sentPre} <strong>{maskedPhone || t.yourMobile}</strong> {t.sentPost}</span>
        <button type="button" className="lc-textbtn" onClick={onBack}>{t.change}</button>
      </div>
      <form className="lc-form" noValidate onSubmit={e => { e.preventDefault(); verify(digits.join('')); }}>
        <div ref={fieldRef} className={`lc-field${error ? ' is-invalid' : ''}`}>
          <span className="lc-label" id={`${id}-label`}>{t.otpLabel(length)}</span>
          <OtpInput
            digits={digits}
            onChange={next => { setDigits(next); if (error) setError(''); }}
            onComplete={verify}
            invalid={!!error}
            labelledBy={`${id}-label`}
            describedBy={`${id}-err`}
            digitLabel={t.digit}
            focusKey={focusKey}
          />
          <FieldError id={`${id}-err`} message={error} />
          <p className="lc-help lc-resend">
            {seconds > 0
              ? <><IconClock />{t.resendIn(formatTime(seconds))}</>
              : <>{t.didnt} <button type="button" className="lc-textbtn" onClick={handleResend}>{t.resend}</button></>}
          </p>
        </div>
        <SubmitButton loading={loading}>{t.verify}</SubmitButton>
      </form>
    </>
  );
}
