# BazingaD browser extension

The extension replaces the browser's New Tab page. Use **Settings** at the bottom of the dashboard or the browser's extension options to edit the dashboard title. Settings stay in the current browser profile, with access provided by the browser. The extension works offline and requires no BazingaD server.

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

The extension uses Manifest V3 and requests only the `storage` permission. The next step is to port the category and link dashboard using this storage layer. The self-hosted app's admin authentication remains in place.
