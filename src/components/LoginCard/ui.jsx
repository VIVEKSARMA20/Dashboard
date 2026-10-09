// Small shared pieces: outline icons (Tabler, MIT), field error and the primary button.

const Icon = ({ children }) => (
  <svg className="lc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

export const IconArrowRight = () => <Icon><path d="M5 12h14" /><path d="M13 18l6-6" /><path d="M13 6l6 6" /></Icon>;
export const IconArrowLeft = () => <Icon><path d="M5 12h14" /><path d="M5 12l6 6" /><path d="M5 12l6-6" /></Icon>;
export const IconAlert = () => <Icon><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0" /><path d="M12 8v4" /><path d="M12 16h.01" /></Icon>;
export const IconClock = () => <Icon><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0" /><path d="M12 7v5l3 3" /></Icon>;
export const IconMobile =() => <Icon><path d="M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z" /><path d="M11 4h2" /><path d="M12 17v.01" /></Icon>;

export function FieldError({ id, message }) {
  return (
    <p id={id} className="lc-error" role="alert">
      {message && <><IconAlert />{message}</>}
    </p>
  );
}

export function SubmitButton({ loading, children }) {
  return (
    <button type="submit" className={`lc-btn${loading ? ' is-loading' : ''}`} aria-busy={loading || undefined}>
      <span className="lc-btn-label">{children}</span>
      <IconArrowRight />
      <span className="lc-spinner" aria-hidden="true" />
    </button>
  );
}
