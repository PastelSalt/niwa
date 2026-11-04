import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Plugin } from 'vite';

/**
 * `virtual:licenses` — the open-source packages shipped in the web bundle, read from node_modules at
 * build time so the /licenses page is never hand-maintained (NIWA-PLAN-B-01 B3.P5).
 *
 * Walks production `dependencies` transitively with Node's lookup (each package's own node_modules,
 * then its parents), which matches pnpm's layout. Workspace packages (`@niwa/*`) are NIWA's own code.
 */
export interface LicenseEntry {
  name: string;
  version: string;
  license: string;
  url: string | null;
}

interface PackageJson {
  name: string;
  version: string;
  license?: string | { type?: string };
  homepage?: string;
  repository?: string | { url?: string };
  dependencies?: Record<string, string>;
}

const VIRTUAL_ID = 'virtual:licenses';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

// Assets copied into the repo rather than installed (see src/assets/fonts/).
const VENDORED: LicenseEntry[] = [
  {
    name: 'Noto Sans JP (one slice, for 庭)',
    version: '5.3.1',
    license: 'OFL-1.1',
    url: 'https://fonts.google.com/noto/specimen/Noto+Sans+JP',
  },
];

function findPackageDir(name: string, fromDir: string): string | null {
  let dir = fromDir;
  for (;;) {
    const candidate = join(dir, 'node_modules', name);
    // Real path: under pnpm a package's own dependencies sit next to its real folder, not the symlink.
    if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate);
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function repoUrl(pkg: PackageJson): string | null {
  const raw = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
  const url = pkg.homepage ?? raw ?? null;
  if (!url) return null;
  return url
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^github:/, 'https://github.com/');
}

export function collectLicenses(root: string): LicenseEntry[] {
  const read = (dir: string) => JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as PackageJson;
  const seen = new Map<string, LicenseEntry>();
  const queue: [string, string][] = Object.keys(read(root).dependencies ?? {}).map((n) => [n, root]);

  while (queue.length) {
    const [name, from] = queue.shift()!;
    if (name.startsWith('@niwa/')) continue;
    const dir = findPackageDir(name, from);
    if (!dir) continue;
    const pkg = read(dir);
    const key = `${pkg.name}@${pkg.version}`;
    if (seen.has(key)) continue;
    const license = typeof pkg.license === 'string' ? pkg.license : (pkg.license?.type ?? 'See package');
    seen.set(key, { name: pkg.name, version: pkg.version, license, url: repoUrl(pkg) });
    for (const dep of Object.keys(pkg.dependencies ?? {})) queue.push([dep, dir]);
  }
  return [...seen.values(), ...VENDORED].sort((a, b) => a.name.localeCompare(b.name));
}

export function licensesPlugin(): Plugin {
  const root = resolve(import.meta.dirname);
  return {
    name: 'niwa-licenses',
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : null),
    load: (id) => (id === RESOLVED_ID ? `export default ${JSON.stringify(collectLicenses(root))};` : null),
  };
}
