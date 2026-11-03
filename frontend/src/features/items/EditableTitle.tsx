import InputBase from '@mui/material/InputBase';
import type { SxProps, Theme } from '@mui/material/styles';
import { useState } from 'react';

/** Inline title editor: commits on blur or Enter, reverts on Escape or empty. */
export function EditableTitle({
  value,
  onCommit,
  sx,
  ariaLabel = 'Title',
}: {
  value: string;
  onCommit: (next: string) => void;
  sx?: SxProps<Theme>;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState(value);
  // Reset the draft when the saved value changes (e.g. after a server update).
  const [saved, setSaved] = useState(value);
  if (value !== saved) {
    setSaved(value);
    setDraft(value);
  }

  const commit = () => {
    const next = draft.trim();
    if (!next) setDraft(value);
    else if (next !== value) onCommit(next);
  };

  return (
    <InputBase
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        } else if (e.key === 'Escape') {
          setDraft(value);
          (e.target as HTMLElement).blur();
        }
      }}
      multiline
      fullWidth
      inputProps={{ 'aria-label': ariaLabel, maxLength: 300 }}
      sx={[
        {
          borderRadius: 1,
          px: 0.5,
          '&:hover': { bgcolor: 'action.hover' },
          '&.Mui-focused': { bgcolor: 'action.hover' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
