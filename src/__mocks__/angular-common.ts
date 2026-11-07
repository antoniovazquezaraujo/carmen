export {};

/**
 * Jest stub for @angular/common.
 *
 * Unit tests instantiate components directly with local Angular mocks and do
 * not render templates, so the concrete CommonModule/NgTemplateOutlet
 * implementations are not needed. The standalones only reference them as
 * component metadata.
 */
const stub = class {};

module.exports = new Proxy({}, {
  get: () => stub
});
