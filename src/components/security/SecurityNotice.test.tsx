import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SecurityNotice } from './SecurityNotice';

afterEach(cleanup);

describe('SecurityNotice', () => {
  it('explains private-session risks before allowing access', () => {
    const onAccept = vi.fn();
    render(<SecurityNotice onAccept={onAccept} />);

    expect(screen.getByRole('dialog', { name: 'Use sensitive documents carefully.' }))
      .toBeInTheDocument();
    expect(screen.getByText(/does not intentionally upload them/i)).toBeInTheDocument();
    expect(screen.getByText(/public or shared computer/i)).toBeInTheDocument();
    expect(screen.getByText(/Nothing is saved automatically/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'I understand — continue' }));
    expect(onAccept).toHaveBeenCalledOnce();
  });
});
