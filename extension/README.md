# BazingaD browser extension

The extension replaces the browser's New Tab page. Use **Settings** at the bottom of the dashboard or the browser's extension options to edit the dashboard title. Settings stay in the current browser profile, with access provided by the browser. The extension works offline and requires no BazingaD server. It does not include the self-hosted app's RSS/news AI integration. To configure OpenAI-, Anthropic-, or MiniMax-compatible news summarization, use the self-hosted app's `/admin` → **Integrations** → **RSS News & Summarization** settings; see the [main README](../README.md#configuring-news-ai).

## Build and load

From the repository root, run:

```sh
node extension/build.mjs
```

| Browser | Directory | Load for development |
| --- | --- | --- |
| Chrome | `extension/dist/chrome` | Open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**. |
| Edge | `extension/dist/edge` | Open `edge://extensions`, enable **Developer mode**, and choose **Load unpacked**. |
| Firefox | `extension/dist/firefox` | Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select the generated `manifest.json`. |

Open a new tab, change the title in **Settings**, then open another new tab to check that the title persisted. Firefox's temporary installation lasts until the browser restarts.

## Browser smoke tests

The **Extension browser smoke tests** workflow builds the extension and tests New Tab, settings, title persistence, and the Home shortcut in Chrome, Edge, and Firefox using Selenium 4.52.0 and Xvfb. Artifacts include screenshots and driver logs, including when browser startup fails.

For a local Linux run, install `xvfb`, `xdotool`, the browser, and the same Selenium release, then run from the repository root:

```sh
python -m pip install selenium==4.52.0
node extension/build.mjs
SE_SKIP_DRIVER_IN_PATH=true xvfb-run -a --server-args='-screen 0 1280x900x24' python extension/tests/smoke.py firefox
```

Replace `firefox` with `edge` to test Edge. For Chrome, also set `CHROME_TEST_BINARY` and `CHROME_TEST_DRIVER` to a Chrome for Testing binary and its matching ChromeDriver. CI downloads that exact browser/driver pair rather than using the runner's potentially older driver. `FIREFOX_TEST_BINARY` optionally selects a local Firefox binary; `SE_SKIP_DRIVER_IN_PATH=true` lets Selenium obtain a current compatible driver.

Firefox's test-only GeckoDriver session enables `--allow-system-access` because current Firefox versions classify extension pages as privileged. Chromium sandboxing is disabled only when `CI=true`, for disposable CI sessions on runners that restrict sandbox namespaces. Neither setting changes the extension or a user's regular browser profile. Local diagnostics are written to `extension-test-screenshots/`.

## Use BazingaD as your homepage

| Browser | Homepage setup |
| --- | --- |
| Firefox | Accept Firefox's homepage change prompt. To undo it, go to **Settings → Home** and restore your homepage. |
| Chrome | Go to **Settings → Appearance**, enable **Show Home button**, and select **New Tab page**. |
| Edge | Go to **Settings → Start, home, and new tab page**, enable **Show home button**, and select **New tab page**. |

With the New Tab override enabled, the Home button opens the same local dashboard and uses the same saved settings. Chrome and Edge let you change the Home button destination in the browser settings at any time.

The extension uses Manifest V3 and requests only the `storage` permission. The next step is to port the category and link dashboard using this storage layer. The self-hosted app's admin authentication remains in place.
