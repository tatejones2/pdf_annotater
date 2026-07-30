import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';

describe('browser security policy', () => {
  const policy = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)?.[1];

  it('blocks outbound and active-content capabilities by default', () => {
    expect(policy).toBeDefined();
    expect(policy).toContain("default-src 'none'");
    expect(policy).toContain("connect-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("form-action 'none'");
  });

  it('does not permit evaluated scripts', () => {
    expect(policy).not.toContain("'unsafe-eval'");
  });
});
