/**
 * Device emulation that is legal inside a `test.describe()`.
 *
 * THE PROBLEM
 *
 * Several mobile specs build a device matrix in the file itself:
 *
 *   mobileDevices.forEach(({ name, device }) => {
 *     test.describe(`… ${name}`, () => {
 *       test.use(device);        // ← throws at collection time
 *
 * Playwright splits fixture options into two scopes. Test-scoped options
 * (viewport, userAgent, hasTouch…) may be changed anywhere. Worker-scoped
 * options cannot: changing one mid-file would force Playwright to tear down the
 * worker and start another, so it refuses outright —
 *
 *   Cannot use({ defaultBrowserType }) in a describe group, because it forces a
 *   new worker. Make it top-level in the test file or put in the configuration
 *   file.
 *
 * A `devices[...]` descriptor carries exactly one worker-scoped key,
 * `defaultBrowserType`, and that single key is enough to reject the whole call.
 * Every one of these files was therefore dead: not failing, not skipped —
 * rejected before a single test was collected.
 *
 * THE TRADE
 *
 * Stripping the worker-scoped keys keeps everything that makes the emulation a
 * phone — viewport, device pixel ratio, touch, mobile user-agent — and gives up
 * the one thing that cannot vary within a file: WHICH BROWSER ENGINE runs it.
 * The engine then comes from the project, so an iPhone entry in the matrix is
 * Chromium wearing an iPhone's dimensions rather than WebKit.
 *
 * That distinction is worth stating plainly, because it is a real loss: layout
 * and viewport bugs still surface, WebKit-specific ones do not. For genuine
 * WebKit coverage a spec must either declare its device at FILE scope (legal —
 * see the iphone-*.spec.js files, which do exactly that) or be given its own
 * project. An in-file matrix and per-device engines are mutually exclusive, and
 * this is the side of that trade these files were already assuming.
 */

/**
 * Options Playwright resolves per WORKER rather than per test. Any of them
 * inside a describe is what triggers the error above. `defaultBrowserType` is
 * the one device descriptors actually carry; the rest are listed so a
 * hand-assembled object cannot reintroduce the bug quietly.
 */
const WORKER_SCOPED = [
  'defaultBrowserType',
  'browserName',
  'channel',
  'launchOptions',
  'connectOptions',
  'headless',
];

/**
 * @param {Record<string, unknown>} device  A `devices[...]` descriptor, or that
 *   spread together with extra per-test options.
 * @returns {Record<string, unknown>} The same options minus anything
 *   worker-scoped, safe to pass to `test.use()` inside a `test.describe()`.
 */
function emulationOnly(device) {
  const out = { ...(device ?? {}) };
  for (const key of WORKER_SCOPED) delete out[key];
  return out;
}

module.exports = { emulationOnly, WORKER_SCOPED };
