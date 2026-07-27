import { APP_CONFIG } from '../../app/config';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo" aria-label={APP_CONFIG.name}>
      <span className="logo-mark" aria-hidden="true">
        <span />
      </span>
      {!compact && <span>{APP_CONFIG.name}</span>}
    </div>
  );
}
