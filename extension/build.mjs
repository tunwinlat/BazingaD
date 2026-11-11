import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

const source = new URL('./src/', import.meta.url);
const output = new URL('./dist/', import.meta.url);
const dashboardPage = 'new-tab.html';

const manifest = {
  manifest_version: 3,
  name: 'BazingaD',
  version: '0.1.0',
  description: 'A local new tab dashboard.',
  permissions: ['storage'],
  chrome_url_overrides: { newtab: dashboardPage },
  options_ui: { page: 'settings.html', open_in_tab: true },
};

await mkdir(output, { recursive: true });

for (const browser of ['chrome', 'edge', 'firefox']) {
  const directory = new URL(`${browser}/`, output);
  await rm(directory, { recursive: true, force: true });
  await cp(source, directory, { recursive: true });

  const browserManifest = structuredClone(manifest);
  if (browser === 'firefox') {
    browserManifest.chrome_settings_overrides = { homepage: dashboardPage };
    browserManifest.browser_specific_settings = {
      gecko: {
        id: 'bazingad@tunwinlat.github.io',
        data_collection_permissions: { required: ['none'] },
      },
    };
  }

  await writeFile(new URL('manifest.json', directory), JSON.stringify(browserManifest, null, 2) + '\n');
}
