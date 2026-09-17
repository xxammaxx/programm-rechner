// Kleiner statischer Server fuer lokale Tests und Sichtpruefungen.
// Keine Abhaengigkeiten. Liefert nur Dateien aus dem Projektverzeichnis.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT ?? 4173);

const typen = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function sichererPfad(urlPfad) {
  const ohneQuery = decodeURIComponent(urlPfad.split('?')[0].split('#')[0]);
  const normalisiert = normalize(ohneQuery).replace(/^(\.\.[/\\])+/, '');
  const voll = join(wurzel, normalisiert);
  if (!voll.startsWith(wurzel)) return null;
  return voll;
}

const server = createServer(async (anfrage, antwort) => {
  let pfad = sichererPfad(anfrage.url ?? '/');
  if (pfad === null) {
    antwort.writeHead(403).end('Verboten');
    return;
  }

  try {
    let info = await stat(pfad).catch(() => null);
    if (info?.isDirectory()) {
      pfad = join(pfad, 'index.html');
      info = await stat(pfad).catch(() => null);
    }
    if (!info?.isFile()) {
      antwort.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
      return;
    }
    const inhalt = await readFile(pfad);
    antwort.writeHead(200, {
      'content-type': typen[extname(pfad)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    antwort.end(inhalt);
  } catch {
    antwort.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end('Serverfehler');
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Programm-Rechner laeuft auf http://127.0.0.1:${port}/\n`);
});
