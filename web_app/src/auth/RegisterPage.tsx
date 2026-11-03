import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { RegisterInput } from '@niwa/contracts';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router';
import { z } from 'zod';
import { messageOf } from '../api/client.ts';
import { muiField } from '../lib/forms.ts';
import { AuthLayout } from './AuthLayout.tsx';
import { useAuth } from './AuthProvider.tsx';

const RegisterForm = RegisterInput.extend({ confirmPassword: z.string() }).refine(
  (v) => v.password === v.confirmPassword,
  { message: "Passwords don't match", path: ['confirmPassword'] },
);

type FormIn = z.input<typeof RegisterForm>;
type FormOut = z.output<typeof RegisterForm>;

export function RegisterPage() {
  const { register: createAccount } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(RegisterForm),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      await createAccount({ email, password });
    } catch (err) {
      setError(messageOf(err));
    }
  });

  return (
    <AuthLayout title="Plant your garden" subtitle="NIWA is personal — one account per instance.">
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
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password?.message ?? 'At least 12 characters.'}
            {...muiField(register('password'))}
          />
          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            {...muiField(register('confirmPassword'))}
          />
          <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
            Create account
          </Button>
          <Typography variant="body2" color="text.secondary" align="center">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login">
              Log in
            </Link>
          </Typography>
        </Stack>
      </form>
    </AuthLayout>
  );
}
