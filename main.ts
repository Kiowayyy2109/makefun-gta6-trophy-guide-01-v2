// Leonida Nights — hand-in entry point.
//
// What this small program does, in plain terms:
//   1. Works out where the finished bundle has to land. The grader's
//      container mounts that place at /output; anywhere else the
//      MAKEFUN_OUTPUT_DIR environment variable names it instead.
//   2. Copies the static guide (the app/ folder sitting next to this
//      file) plus the screenshots/ folder into that destination.
//   3. Asks the vendored make.fun library to summarise the bundle into
//      a dossier.json written at the destination root.
//
// The guide itself needs no building: app/ is plain HTML, CSS and JS
// that a browser opens directly, and vendor/ is library code that has
// to stay untouched, so this file is only the delivery plumbing.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as frontend from './vendor/makefun-frontend.ts';

// The folder this file lives in — app/ and screenshots/ sit beside it.
const sourceDir = path.dirname(fileURLToPath(import.meta.url));

// Destination: the environment wins, /output is the fallback.
const destDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Make sure the destination (and its screenshots corner) exists.
fs.mkdirSync(destDir, { recursive: true });
fs.mkdirSync(path.join(destDir, 'screenshots'), { recursive: true });

// Ship the guide itself.
fs.cpSync(path.join(sourceDir, 'app'), path.join(destDir, 'app'), {
  recursive: true,
});

// Ship the screenshots too, when the folder is present.
const shotsSource = path.join(sourceDir, 'screenshots');
if (fs.existsSync(shotsSource)) {
  fs.cpSync(shotsSource, path.join(destDir, 'screenshots'), {
    recursive: true,
  });
}

// Limits handed to the dossier builder — these mirror the scorer's own
// caps, so an oversized bundle is refused here rather than later.
const dossierLimits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

const dossierText = frontend.buildDossier(destDir, dossierLimits);
fs.writeFileSync(path.join(destDir, 'dossier.json'), dossierText);
