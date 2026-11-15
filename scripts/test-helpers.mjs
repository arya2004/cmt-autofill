import { Buffer } from 'node:buffer';
import { fileURLToPath, URL } from 'node:url';
import { build } from 'vite';

export async function loadSourceModule(path) {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    publicDir: false,
    build: {
      write: false,
      minify: false,
      lib: {
        entry: fileURLToPath(new URL(path, import.meta.url)),
        formats: ['es'],
      },
    },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from((Array.isArray(result) ? result[0] : result).output[0].code).toString('base64')}`
  );
}

// Chrome callbacks expose lastError only during that callback.
export function mockStorage(initial = {}) {
  let data = globalThis.structuredClone(initial);
  let failure;
  let writes = 0;
  const runtime = {};
  function respond(operation, callback, result) {
    if (failure?.operation === operation)
      runtime.lastError = { message: failure.message };
    try {
      callback(result);
    } finally {
      delete runtime.lastError;
    }
  }
  globalThis.chrome = {
    runtime,
    storage: {
      sync: {
        get(_, callback) {
          respond('get', callback, globalThis.structuredClone(data));
        },
        set(values, callback) {
          if (failure?.operation !== 'set') {
            data = { ...data, ...globalThis.structuredClone(values) };
            writes++;
          }
          respond('set', callback);
        },
        remove(key, callback) {
          if (failure?.operation !== 'remove') delete data[key];
          respond('remove', callback);
        },
      },
    },
  };
  return {
    data: () => globalThis.structuredClone(data),
    writes: () => writes,
    fail(operation, message = 'Storage unavailable') {
      failure = { operation, message };
    },
    recover() {
      failure = undefined;
    },
  };
}
