import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import licenses from 'virtual:licenses';
import { LegalPage } from './LegalPage.tsx';

/** Open-source licences (NIWA-PLAN-B-01 B3.P5) — generated at build time by `licenses.plugin.ts`. */
export function LicensesPage() {
  return (
    <LegalPage title="Open-source licences" updated="at every build">
      <p>
        The NIWA web app is built with these open-source packages. Thank you to everyone who makes them. The
        list is generated from the app's dependencies each time it is built.
      </p>
      <Table size="small" aria-label="Open-source packages" sx={{ mt: 3 }}>
        <TableHead>
          <TableRow>
            <TableCell>Package</TableCell>
            <TableCell>Version</TableCell>
            <TableCell>Licence</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {licenses.map((l) => (
            <TableRow key={`${l.name}@${l.version}`}>
              <TableCell sx={{ wordBreak: 'break-word' }}>
                {l.url ? (
                  <Link href={l.url} target="_blank" rel="noopener">
                    {l.name}
                  </Link>
                ) : (
                  l.name
                )}
              </TableCell>
              <TableCell>{l.version}</TableCell>
              <TableCell>{l.license}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </LegalPage>
  );
}
