import { AlertTriangle, Check, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Logo } from '../common/Logo';

type Props = {
  onAccept: () => void;
};

export function SecurityNotice({ onAccept }: Props) {
  return (
    <main className="security-gate">
      <section
        className="security-notice"
        role="dialog"
        aria-modal="true"
        aria-labelledby="security-notice-title"
        aria-describedby="security-notice-description"
      >
        <header>
          <Logo />
          <span className="local-badge"><LockKeyhole size={14} /> Private session</span>
        </header>

        <div className="security-notice-heading">
          <span className="security-notice-icon"><ShieldCheck size={30} /></span>
          <div>
            <p className="eyebrow">Before you continue</p>
            <h1 id="security-notice-title">Use sensitive documents carefully.</h1>
          </div>
        </div>

        <p id="security-notice-description" className="security-notice-lede">
          Paperwood processes PDFs locally in this browser and does not intentionally upload
          them. A browser app cannot protect documents on a compromised or shared device.
        </p>

        <div className="security-guidance">
          <div>
            <strong><Check size={17} /> For sensitive documents</strong>
            <ul>
              <li>Use a trusted, updated personal device and browser.</li>
              <li>Use a private browser profile protected by your device login.</li>
              <li>Export your work before refreshing or closing the page.</li>
              <li>Close the private session as soon as you finish.</li>
            </ul>
          </div>
          <div className="security-warning">
            <strong><AlertTriangle size={17} /> Do not continue when</strong>
            <ul>
              <li>You are using a public or shared computer.</li>
              <li>Untrusted browser extensions are installed.</li>
              <li>You suspect malware or unauthorized device access.</li>
              <li>Someone else can access your unlocked browser profile.</li>
            </ul>
          </div>
        </div>

        <div className="security-session-note">
          <LockKeyhole size={18} />
          <p>
            <strong>Nothing is saved automatically.</strong>
            Refreshing or closing the page will discard work that you have not downloaded.
          </p>
        </div>

        <button className="security-accept" onClick={onAccept} autoFocus>
          I understand — continue
        </button>
      </section>
    </main>
  );
}
