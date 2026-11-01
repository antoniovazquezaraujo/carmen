export {};

/** Jest stub for @angular/forms (no TestBed/template rendering in unit tests). */
const stub = class {};

module.exports = new Proxy({}, {
  get: () => stub
});
