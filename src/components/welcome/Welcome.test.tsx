import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Welcome } from './Welcome';

afterEach(cleanup);

describe('Welcome privacy controls', () => {
  it('offers explicit download and deletion for a legacy unencrypted draft', () => {
    const onDownloadRecent = vi.fn();
    const onDismissRecent = vi.fn();
    const onShowSecurity = vi.fn();

    render(
      <Welcome
        onOpen={vi.fn()}
        error={null}
        notice={null}
        recentName="tax-return.pdf"
        onDownloadRecent={onDownloadRecent}
        onDismissRecent={onDismissRecent}
        onOrganize={vi.fn()}
        onShowSecurity={onShowSecurity}
      />,
    );

    expect(screen.getByText('Older unencrypted draft found')).toBeInTheDocument();
    expect(screen.getByText(/tax-return\.pdf/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete local data' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review safe-use guidance' }));

    expect(onDownloadRecent).toHaveBeenCalledOnce();
    expect(onDismissRecent).toHaveBeenCalledOnce();
    expect(onShowSecurity).toHaveBeenCalledOnce();
  });
});
