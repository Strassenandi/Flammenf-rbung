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

Der Workflow **Flammenlabor prüfen und veröffentlichen** läuft bei Pushes auf `main`, bei Pull Requests und auf Wunsch manuell. Er veröffentlicht ausschließlich erfolgreich geprüfte Änderungen auf `main`.

Die erstmalige Aktivierung erfolgt unter [Settings → Pages](https://github.com/Strassenandi/Flammenf-rbung/settings/pages): Unter **Build and deployment → Source** wähle **GitHub Actions**. Starte danach den Workflow über **Actions → Flammenlabor prüfen und veröffentlichen → Run workflow** erneut. Wenn Pages bereits so eingerichtet ist, erfolgt die Veröffentlichung automatisch.

Solange Pages nicht für GitHub Actions eingerichtet ist, laufen die Prüfungen trotzdem. Der Workflow zeigt dann einen Hinweis in seiner Zusammenfassung und überspringt die Veröffentlichung. Es ist kein persönlicher Zugriffstoken nötig.

Die vorgesehene Adresse nach erfolgreicher Veröffentlichung ist:

**https://strassenandi.github.io/Flammenf-rbung/**

## Projektstruktur

| Pfad | Inhalt |
| --- | --- |
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
