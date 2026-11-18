import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

run({
  files: [
    path.join(__dirname, 'persistencia.test.mjs'),
    path.join(__dirname, 'crud-context.test.mjs'),
    path.join(__dirname, 'api.test.mjs'),
    path.join(__dirname, 'livrosApi.test.mjs'),
  ],
})
  .compose(new spec())
  .pipe(process.stdout);
