# Flammenlabor

Neugier brennt bunt. Dein virtuelles Labor für Flammenfärbung.

Ein interaktives Chemielabor im modernen Comic-Stil, übernommen aus dem [Hatchable-Projekt](https://flammenlabor.hatchable.site).

Das Labor läuft vollständig im Browser: sieben Metallsalzproben, animierter Bunsenbrenner, einstellbare Luftzufuhr und Probenmenge, Mischmodus, unbekannte Probe X, Natriumverunreinigung, Drahtreinigung und Kobaltglas. Beobachtungen lassen sich im lokalen Laborbuch merken und als CSV exportieren. Der Farbatlas und die wissenschaftlichen Quellen erklären die Grenzen der qualitativen Lernsimulation.

## Lokal starten

Voraussetzung: Node.js 22 oder neuer; empfohlen ist Node.js 24. Es gibt keine npm-Abhängigkeiten und keinen Installationsschritt.

```sh
git clone https://github.com/Strassenandi/Flammenf-rbung.git
cd Flammenf-rbung
npm start
```

Öffne anschließend **http://127.0.0.1:4173/**. Ein HTTP-Server ist nötig, weil die Anwendung JavaScript-Module verwendet; `index.html` sollte nicht per Doppelklick als `file://` geöffnet werden.

## Prüfen und für Hosting vorbereiten

```sh
npm run verify
```

Der Befehl prüft JavaScript-Syntax, Assetpfade und HTML-Verweise, testet Flammenmodell, Laborbuch und die Auslieferung unter einem Projektpfad und kopiert anschließend die Website nach `dist/`. Dabei wird kein JavaScript gebündelt oder kompiliert.

```sh
npm run preview
# GitHub-Pages-Projektpfad lokal prüfen:
npm run preview -- --base-path /Flammenf-rbung/
```

Für statisches Hosting reicht der Inhalt von `dist/`. Die Website benötigt keine Datenbank, Serverfunktionen, API-Schlüssel oder Hatchable-Dienste. Google Fonts werden für die vorhandene Gestaltung geladen; bei fehlendem Zugriff greifen Ersatzschriften.

## GitHub Pages

GitHub Pages ist für dieses Repository bereits mit **Deploy from a branch → main → / (root)** eingerichtet. Der Einstieg `index.html` öffnet die Anwendung unter `public/`; `.nojekyll` sorgt für die direkte Auslieferung der statischen Dateien. Pushes auf `main` werden über GitHubs vorhandenen Pages-Workflow veröffentlicht.

**https://strassenandi.github.io/Flammenf-rbung/**

Der zusätzliche Workflow **Flammenlabor prüfen und veröffentlichen** prüft Pushes auf `main`, Pull Requests und manuelle Starts. Bei der vorhandenen Veröffentlichung aus einem Branch führt er die Prüfungen aus und überspringt eine doppelte Veröffentlichung. Der vorhandene Pages-Workflow wartet dabei nicht auf die Tests.

Optional kannst du die Veröffentlichung an erfolgreiche Prüfungen koppeln: Wähle unter [Settings → Pages](https://github.com/Strassenandi/Flammenf-rbung/settings/pages) bei **Build and deployment → Source** den Eintrag **GitHub Actions**. Starte danach **Actions → Flammenlabor prüfen und veröffentlichen → Run workflow**. In diesem Modus veröffentlicht der zusätzliche Workflow ausschließlich erfolgreich geprüfte Änderungen auf `main` und liefert den Inhalt von `dist/` direkt an der Hauptadresse aus.

Für ein neu geklontes Repository ist diese erstmalige Pages-Einrichtung nötig. Es ist kein persönlicher Zugriffstoken erforderlich.

## Projektstruktur

| Pfad | Inhalt |
| --- | --- |
| `index.html`, `.nojekyll` | Einstieg für die vorhandene Pages-Veröffentlichung aus dem Repository-Root |
| `public/index.html`, `public/style.css` | Oberfläche, Comic-Gestaltung und responsive Layouts |
| `public/app.js` | Auswahl, Versuchsmodi und Bedienung |
| `public/data.js` | Salzproben, Referenzfarben und Quellen |
| `public/model.js` | Qualitatives Flammen- und Mischmodell |
| `public/render.js` | Canvas-Zeichnung und Animation |
| `public/journal.js` | Lokales Laborbuch und CSV-Export |
| `scripts/` | Startserver, Prüfung, statischer Export und Pages-Status |
| `tests/` | Automatische Funktions- und Hostingprüfungen |
| `hatchable.toml` | Ursprünglicher Hatchable-Export; für den GitHub-Betrieb nicht benötigt |

Das Laborbuch liegt im Browserspeicher der jeweiligen Website-Adresse. Vorhandene Beobachtungen von Hatchable werden deshalb nicht automatisch auf die GitHub-Pages-Adresse übertragen; sie können auf der bisherigen Seite als CSV gesichert werden.

Die Farben und zeitlichen Verläufe sind didaktische Annäherungen, keine kalibrierte Messung und kein sicherer Elementnachweis. Reale Flammenproben gehören in ein betreutes Labor.
