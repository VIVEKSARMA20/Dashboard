import { useState } from 'react';
import { LANGUAGES, STRINGS } from './strings';
import { useStepTransition } from './hooks';
import OaapLogo from './OaapLogo';
import MspinStep from './MspinStep';
import OtpStep from './OtpStep';
import SuccessStep from './SuccessStep';
import './LoginCard.css';

/**
 * MSPIN + OTP login card.
 *
 * onSendOtp(mspin)        -> Promise<{ maskedPhone?: string }>; validates the MSPIN exists. Throw to show
 *                            "Enter a valid MSPIN" (or throw Error(message) to show your own text)
 * onVerify(mspin, code)   -> Promise<void>; throw to show "code didn't match" (or your message)
 * onResend(mspin)         -> Promise<void>
 * onComplete()            -> called after the success animation; redirect here
 */
export default function LoginCard({
  onSendOtp,
  onVerify,
  onResend,
  onComplete,
  termsUrl = '#',
  supportUrl = '#',
  otpLength = 4,
  resendSeconds = 30,
  defaultLanguage = 'en',
  showLanguageToggle = true
}) {
  const [lang, setLang] = useState(defaultLanguage);
  const [mspin, setMspin] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');
  const { step, leaving, goTo } = useStepTransition('mspin');
  const t = STRINGS[lang] ?? STRINGS.en;

  const sendOtp = async value => {
    const res = await onSendOtp?.(value);
    setMaskedPhone(res?.maskedPhone ?? '');
    goTo('otp');
  };

  const verify = async code => {
    await onVerify?.(mspin, code);
    goTo('success');
  };

  return (
    <section className="lc-card" lang={lang}>
      {showLanguageToggle && (
        <div className="lc-lang" role="group" aria-label={t.language}>
          {LANGUAGES.map(l => (
            <button key={l.code} type="button" lang={l.code} aria-label={l.name} aria-pressed={lang === l.code} onClick={() => setLang(l.code)}>
              {l.short}
            </button>
          ))}
        </div>
      )}

      <OaapLogo className="lc-logo" title={t.logo} />

      <div key={step} className={`lc-step ${leaving ? 'is-leaving' : 'is-entering'}`}>
        {step === 'mspin' && (
          <MspinStep
            t={t}
            mspin={mspin}
            onMspinChange={setMspin}
            termsAccepted={termsAccepted}
            onTermsChange={setTermsAccepted}
            termsUrl={termsUrl}
            onSubmit={sendOtp}
          />
        )}
        {step === 'otp' && (
          <OtpStep
            t={t}
            maskedPhone={maskedPhone}
            length={otpLength}
            resendSeconds={resendSeconds}
            onVerify={verify}
            onResend={() => onResend?.(mspin)}
            onBack={() => goTo('mspin')}
          />
        )}
        {step === 'success' && <SuccessStep t={t} onDone={onComplete} />}
      </div>

      {step !== 'success' && (
        <footer className="lc-foot">
          {t.trouble} <a className="lc-link" href={supportUrl}>{t.support}</a>
        </footer>
      )}
    </section>
  );
}
