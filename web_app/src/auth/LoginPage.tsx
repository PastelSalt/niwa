import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LoginInput } from '@niwa/contracts';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router';
import type { z } from 'zod';
import { messageOf } from '../api/client.ts';
import { muiField } from '../lib/forms.ts';
import { useRegistrationOpen } from '../public/useRegistrationOpen.ts';
import { AuthLayout } from './AuthLayout.tsx';
import { useAuth } from './AuthProvider.tsx';

type FormIn = z.input<typeof LoginInput>;
type FormOut = z.output<typeof LoginInput>;

export function LoginPage() {
  const registrationOpen = useRegistrationOpen();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(LoginInput),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      // GuestOnly redirects back to the requested page once the session exists.
      await login(values);
    } catch (err) {
      setError(messageOf(err));
    }
  });

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to tend your garden.">
      <form onSubmit={onSubmit} noValidate>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            error={!!errors.email}
            helperText={errors.email?.message}
            {...muiField(register('email'))}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...muiField(register('password'))}
          />
          <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
            Log in
          </Button>
          {registrationOpen && (
            <Typography variant="body2" color="text.secondary" align="center">
              First time here?{' '}
              <Link component={RouterLink} to="/register">
                Create your account
              </Link>
            </Typography>
          )}
        </Stack>
      </form>
    </AuthLayout>
  );
}
