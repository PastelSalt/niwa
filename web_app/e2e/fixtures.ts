/** Throwaway test account for the in-memory dev/e2e backend (`pnpm dev:memory`). Not a real credential. */
export const TEST_USER = {
  email: 'gardener@niwa.test',
  password: 'garden-password-123',
};

/** A fresh address per test run (the in-memory API keeps accounts until it restarts). */
export function uniqueEmail(tag: string): string {
  return TEST_USER.email.replace(
    '@',
    `+${tag}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@`,
  );
}
