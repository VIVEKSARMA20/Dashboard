import LoginCard from './LoginCard';
import './LoginCard.css';

// Full-screen login: drifting auction pattern behind the centered card. Props pass through to LoginCard.
export default function LoginPage(props) {
  return (
    <div className="lc-page">
      <div className="lc-pattern" aria-hidden="true" />
      <main className="lc-shell">
        <LoginCard {...props} />
      </main>
    </div>
  );
}
