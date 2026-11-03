import LocalFloristOutlined from '@mui/icons-material/LocalFloristOutlined';
import Button from '@mui/material/Button';
import { Link } from 'react-router';
import { EmptyState } from './EmptyState.tsx';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={<LocalFloristOutlined />}
      title="Nothing grows here"
      description="This page doesn't exist. It may have been moved or never planted."
      action={
        <Button component={Link} to="/" variant="outlined">
          Back to the garden
        </Button>
      }
    />
  );
}
