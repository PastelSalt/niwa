import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Pure MUI rule — PROJECT-SPECS.md §11.7. Anything that styles UI outside MUI is blocked. */
const PURE_MUI_RESTRICTIONS = {
  paths: [
    { name: 'tailwindcss', message: 'Pure MUI: style with the theme, sx or styled().' },
    { name: 'styled-components', message: 'Pure MUI: use styled() from @mui/material/styles.' },
    { name: '@mui/styles', message: 'Legacy JSS API — use sx or styled().' },
    { name: 'antd', message: 'Pure MUI: use @mui/material components.' },
    { name: 'react-bootstrap', message: 'Pure MUI: use @mui/material components.' },
    { name: 'bootstrap', message: 'Pure MUI: use @mui/material components.' },
    { name: 'lucide-react', message: 'Pure MUI: use @mui/icons-material.' },
    { name: 'react-icons', message: 'Pure MUI: use @mui/icons-material.' },
  ],
  patterns: [
    {
      group: ['*.css', '*.scss', '*.sass', '*.less'],
      message: 'Pure MUI: no stylesheet imports; use theme / sx / GlobalStyles.',
    },
    {
      group: ['@radix-ui/*', '@headlessui/*', '@chakra-ui/*', '@mantine/*', '@heroicons/*', '@shadcn/*'],
      message: 'Pure MUI: use @mui/material components.',
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'flutter_app/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // Operator CLIs print their results.
  { files: ['backend/scripts/**/*.ts'], rules: { 'no-console': 'off' } },
  // The visual audit prints its report and runs part of its code inside the page (B-02 V0).
  {
    files: ['web_app/scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: { 'no-console': 'off' },
  },
  {
    files: [
      'web_app/src/**/*.{ts,tsx}',
      'packages/ui/**/*.{ts,tsx}',
      'desktop_app/src/renderer/**/*.{ts,tsx}',
    ],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': ['error', PURE_MUI_RESTRICTIONS],
    },
  },
);
