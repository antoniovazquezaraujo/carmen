export {};

/**
 * Jest stub for PrimeNG entry points.
 *
 * The unit tests instantiate component classes with local Angular mocks and do
 * not render PrimeNG templates. Returning a harmless class for every named
 * export keeps the component imports resolvable without loading the ESM
 * PrimeNG runtime in Jest's CommonJS environment.
 */
const stub = class {};

module.exports = new Proxy({}, {
  get: () => stub
});
