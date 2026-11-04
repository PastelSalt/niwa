import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DateField, formatDateValue, parseDateInput } from './DateField.tsx';

describe('parseDateInput', () => {
  it('reads ISO and written dates', () => {
    expect(parseDateInput('2026-11-04')).toBe('2026-11-04');
    expect(parseDateInput('2026-1-4')).toBe('2026-01-04');
    expect(parseDateInput('4 Nov 2026')).toBe('2026-11-04');
    expect(parseDateInput('Nov 4, 2026')).toBe('2026-11-04');
    expect(parseDateInput('Wed, 4 November 2026')).toBe('2026-11-04');
    expect(parseDateInput(formatDateValue('2026-11-04'))).toBe('2026-11-04');
  });

  it('rejects partial or impossible dates', () => {
    for (const t of ['', '2026-11', '31 Feb 2026', '4 Nov', 'tomorrow', '2026-13-01', '04/11/2026'])
      expect(parseDateInput(t)).toBeNull();
  });
});

describe('DateField', () => {
  it('commits a typed date as soon as it is complete, and clears', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<DateField label="Due" value={null} onChange={onChange} />);
    const input = screen.getByLabelText('Due');
    await userEvent.type(input, '2026-11-04');
    expect(onChange).toHaveBeenLastCalledWith('2026-11-04');
    rerender(<DateField label="Due" value="2026-11-04" onChange={onChange} />);
    await userEvent.clear(input);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('picks from the calendar', async () => {
    const onChange = vi.fn();
    render(<DateField label="Due" value="2026-11-04" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await userEvent.click(screen.getByRole('button', { name: /November 12, 2026|12 November 2026/ }));
    expect(onChange).toHaveBeenCalledWith('2026-11-12');
  });
});
