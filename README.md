# Login screen (OAAP): redesign handoff

A React + plain CSS login screen: MSPIN, then a 4-digit OTP, then a success screen. The page has an auction-pattern background, an EN / हिंदी toggle, and an explicit Terms and conditions checkbox. All styling uses the app's existing design-system tokens.

## What to ship

| Path | Ship? | What it is |
|---|---|---|
| `src/components/LoginCard/` | **Yes** | The component: JSX, CSS, strings, hooks |
| `src/assets/oaap-logo.svg` | Optional | The original white logo. The component already inlines it in `OaapLogo.jsx`. |
| `preview/` | Review only | Runs the real component in a browser without Node. Don't copy it into the app. |
| `login-options.html`, `login-b-configurator.html` | No | Design explorations from round 1 and round 2 |
| `.claude/` | No | Local tooling config |

## Requirements

- **React 18 or later.** The component uses `useId`. It needs no other dependencies.
- **A bundler that can import CSS** (Vite, Create React App, Next.js, webpack). The JSX imports `./LoginCard.css`.
- **The app's global `styles.css`** (the `:root` tokens), loaded before this component. Every `var(--token, fallback)` has a fallback, so the component still renders without it. In the app, the real tokens take over.
- **Fonts:** Roboto (already the app font) and **Noto Sans Devanagari** for Hindi. Roboto has no Devanagari characters.
- **Next.js App Router only:** add `'use client';` as the first line of `LoginPage.jsx` and `LoginCard.jsx`, because they use hooks.

## Usage

```jsx
import { LoginPage } from './components/LoginCard';

export default function LoginRoute() {
  return (
    <LoginPage
      onSendOtp={async mspin => {
        const res = await api.sendOtp(mspin);          // throw if the MSPIN doesn't exist
        return { maskedPhone: res.maskedPhone };        // e.g. "+91 ••••• •4821"
      }}
      onVerify={(mspin, code) => api.verifyOtp(mspin, code)} // throw if the code is wrong
      onResend={mspin => api.resendOtp(mspin)}
      onComplete={() => navigate('/dashboard')}
      termsUrl="https://…/terms"
      supportUrl="https://…/support"
    />
  );
}
```

Use `LoginCard` instead of `LoginPage` to place the card inside your own layout. It comes without the background.

### Props

| Prop | Default | Notes |
|---|---|---|
| `onSendOtp(mspin)` | — | Returns `Promise<{ maskedPhone?: string }>`. This is where the MSPIN is validated. Throw to show "Enter a valid MSPIN.", or `throw new Error('…')` to show your own message. |
| `onVerify(mspin, code)` | — | Returns `Promise<void>`. Throw to show "That code didn't match…", or your own message. The boxes clear and the user can try again. |
| `onResend(mspin)` | — | Returns `Promise<void>`. If it throws, the resend link comes back straight away along with an error. |
| `onComplete()` | — | Called about 2.2s after the success animation. Redirect here. |
| `termsUrl` | `'#'` | Opens in a new tab |
| `supportUrl` | `'#'` | Footer "Contact support" link |
| `otpLength` | `4` | Number of OTP boxes |
| `resendSeconds` | `30` | Resend countdown |
| `defaultLanguage` | `'en'` | `'en'` or `'hi'` |
| `showLanguageToggle` | `true` | Hides the EN / हिं toggle when `false` |

### Validation rules

- **MSPIN:** digits only. Letters and symbols are removed as the user types and show "Enter a valid MSPIN." The frontend doesn't check length; the API decides whether the MSPIN exists. An empty submit shows "Enter your MSPIN to continue." and makes no API call.
- **Terms:** the box must be ticked before the OTP is sent.
- **OTP:** 4 digits. Paste and SMS autofill (`autocomplete="one-time-code"`) fill every box. The code submits automatically when the last box is filled.

All copy, English and Hindi, lives in `strings.js`.

## Previewing it without Node

The preview needs Python 3 and an internet connection (React, Babel and the fonts load from a CDN). From this `login/` folder, run:

```bash
python -m http.server 5173
```

Then open `http://localhost:5173/preview/index.html`. It has a Desktop / Mobile toggle and a mock API:
- MSPIN `0000` acts as "not found"; any other digits work.
- OTP `0000` acts as a wrong code; any other 4 digits log in.

## Review checklist

- [ ] **Design:** matches the comparison sheet on desktop (≥768px), tablet, and phone (≤540px, where the card goes full screen)
- [ ] **Code:** the API wiring, error messages from the backend, and the redirect in `onComplete`
- [ ] **Accessibility:** keyboard-only flow (Tab, Space on the checkbox, Enter to submit); a screen reader announces errors; visible focus everywhere; reduced motion turns animations off
- [ ] **QA:** empty MSPIN; letters in MSPIN; unknown MSPIN; terms unticked; wrong OTP; resend after 30s; Back / Change keeps the MSPIN; paste a 4-digit code; Hindi
- [ ] **Content:** a native speaker reviews the Hindi strings
- [ ] **Legal:** the real Terms and conditions URL
- [ ] **Backend:** OTP rate limits, expiry and lockout are enforced server-side. The UI's 30s timer is only a convenience.

## Still open

- The real `termsUrl` and `supportUrl`
- A native-speaker review of the Hindi copy
- **Design-system gaps.** These values are still local in `LoginCard.css`, each marked `/* local */`:
  - corner radius: 12px on controls, 20px on the card;
  - the card shadow;
  - line heights (24px and 20px);
  - the darker error-text red `#d92d20`. `--color-status-error` is 3.9:1 on white, which fails WCAG AA for small text.
- `--font-b4` and `--font-heading-*` reference `--lh-*` tokens that weren't found in `styles.css`. Confirm they're defined, otherwise those font shorthands break.

## Credits

Icons are Tabler Icons, MIT licence, inlined in `ui.jsx`. Fonts are from Google Fonts, under the SIL Open Font License. The logo belongs to the company.
