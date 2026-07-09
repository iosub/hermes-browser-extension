import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();

test('browser-runtime.mjs detects Firefox via UA and browser.sidebarAction', () => {
  const source = readFileSync(new URL('../extension/lib/browser-runtime.mjs', import.meta.url), 'utf8');
  assert.match(source, /Firefox/);
  assert.match(source, /browser\?\.sidebarAction/);
});

test('browser-runtime.mjs openNativeSidebar handles sidebarAction.open() for Firefox', () => {
  const source = readFileSync(new URL('../extension/lib/browser-runtime.mjs', import.meta.url), 'utf8');
  assert.match(source, /sidebarAction\.open/);
  assert.match(source, /typeof sidebarAction\.open === 'function'/);
});

test('browser-runtime.mjs setActionClickPanelBehavior handles Firefox', () => {
  const source = readFileSync(new URL('../extension/lib/browser-runtime.mjs', import.meta.url), 'utf8');
  assert.match(source, /BROWSER_IDS\.FIREFOX/);
});

test('background.js openHermesPanel falls back to popup window for Firefox', () => {
  const source = readFileSync(new URL('../extension/background.js', import.meta.url), 'utf8');
  assert.match(source, /browserId === 'opera' \|\| browserId === 'firefox'/);
  assert.match(source, /windows\.create/);
});

test('build-firefox.mjs exists and is valid JavaScript', () => {
  const buildScript = path.join(root, 'scripts', 'build-firefox.mjs');
  assert.ok(existsSync(buildScript), 'build-firefox.mjs should exist');
  // Syntax check
  execFileSync('node', ['--check', buildScript], { encoding: 'utf8' });
});

test('build-firefox.mjs strips Chrome-only manifest keys and adds Firefox settings', () => {
  const source = readFileSync(new URL('../scripts/build-firefox.mjs', import.meta.url), 'utf8');
  assert.match(source, /delete sourceManifest\.side_panel/);
  assert.match(source, /delete sourceManifest\.minimum_chrome_version/);
  assert.match(source, /sidePanel.*filter|filter.*sidePanel/);
  assert.match(source, /browser_specific_settings/);
  assert.match(source, /gecko/);
});

test('package.json has build:firefox script', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.ok(pkg.scripts['build:firefox'], 'build:firefox script should exist');
  assert.match(pkg.scripts['build:firefox'], /build-firefox\.mjs/);
});

test('manifest.json has sidebar_action for Firefox sidebar support', () => {
  const manifest = JSON.parse(readFileSync(new URL('../extension/manifest.json', import.meta.url), 'utf8'));
  assert.ok(manifest.sidebar_action, 'sidebar_action must be in manifest for Firefox');
  assert.ok(manifest.sidebar_action.default_panel, 'sidebar_action.default_panel must be set');
  assert.equal(manifest.sidebar_action.default_panel, manifest.side_panel.default_path, 'sidebar_action default_panel must match side_panel default_path');
});
