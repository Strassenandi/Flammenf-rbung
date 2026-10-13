import { appendFile } from 'node:fs/promises';

const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_API_URL = 'https://api.github.com', GITHUB_SERVER_URL = 'https://github.com', GITHUB_OUTPUT, GITHUB_STEP_SUMMARY } = process.env;
if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !GITHUB_OUTPUT || !GITHUB_STEP_SUMMARY) throw new Error('Dieses Skript wird vom GitHub-Pages-Workflow aufgerufen.');

const response = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/pages`, {
  headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
});
if (!response.ok && response.status !== 404) throw new Error(`GitHub-Pages-Status konnte nicht gelesen werden (HTTP ${response.status}).`);
const pages = response.ok ? await response.json() : null;
const enabled = pages?.build_type === 'workflow';
await appendFile(GITHUB_OUTPUT, `enabled=${enabled}\n`);

if (!enabled) {
  const settings = `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/settings/pages`;
  const message = 'Die Projektprüfung war erfolgreich. Für die Veröffentlichung bitte unter Settings → Pages → Source „GitHub Actions“ auswählen und diesen Workflow erneut starten.';
  console.log(`::notice title=GitHub Pages aktivieren::${message}`);
  await appendFile(GITHUB_STEP_SUMMARY, `### Flammenlabor ist geprüft und vorbereitet\n\n${message}\n\n[Pages-Einstellungen öffnen](${settings})\n`);
}
