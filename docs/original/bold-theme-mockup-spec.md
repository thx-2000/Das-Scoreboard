# Bold-Scorekeeper-Mockup — Referenz-Beschreibung

Der User hat ein Mockup-Sammelblatt mit 12 durchnummerierten Screens hochgeladen
(dritte Übertragung — vorherige zwei gingen bei Kontext-Kompression verloren,
siehe [[project_scoreboard]]). Diese Datei ist die textuelle Sicherung, damit die
Vorgaben unabhängig von der Bildquelle erhalten bleiben. Falls möglich, die
Original-Bilddatei zusätzlich per Finder/Datei-Kopie hier ins Verzeichnis legen
(z.B. `bold-theme-mockup.png`).

Alle Screens: durchgehend dunkles Theme (Hintergrund fast schwarz), Statusleiste
oben (09:41, Dienstag 14. Mai, Akku), abgerundete Karten, Neon-Akzentfarben.
Farbzyklus für Spieler: **Grün, Orange, Violett/Lila, Cyan** (in dieser
Reihenfolge; RAGE-Modus-Karte nutzt stattdessen Rot/Flammen-Orange).

## 1. Startseite
- Logo "DAS SCOREBOARD" oben links (fett, zweizeilig), Zahnrad-Icon oben rechts.
- Großer durchgehender Neongrün-Button "+ NEUES SPIEL STARTEN".
- "SPIELMODUS WÄHLEN" — 2×2-Grid an Modus-Karten, je mit farbigem Icon-Kreis:
  - Punkte bis Höchstwert — Grün, Zielscheiben-Icon
  - Offene Punkterunde — Orange, Unendlich-Icon
  - Feste Rundenzahl — Violett, "10"-Icon
  - RAGE — Rot/Flammen-Orange, Flammen-Icon
- "ZULETZT GESPIELT" mit "Alle anzeigen"-Link — Liste mit Icon (farbig,
  passend zum Modus), Titel, Status-Badge (LAUFEND/BEENDET), Meta-Zeile
  (Datum, Spielernamen), Ergebnis/Punktestand rechts.
- "SCHNELL-AKTION" — breiter Button "🖐 WER FÄNGT AN?" mit Pfeil-Icon rechts.

## 2. Spieler verwalten
- Header mit Zurück-Pfeil, "+"-Icon oben rechts.
- "NEUER SPIELER": Textfeld + grüner "HINZUFÜGEN"-Button.
- "AKTIVE SPIELER (4)": Zeilen mit **vollflächig farbig getöntem Hintergrund**
  (nicht nur linker Rand!) je Spielerfarbe, Name, "AKTIV"-Badge, Kebab-Menü
  (⋮) rechts statt sichtbarer Einzel-Buttons.
- "DEAKTIVIERTE SPIELER (2)": ausgegraute Zeilen mit "REAKTIVIEREN"-Button.
- Tipp-Kasten (Glühbirne-Icon): "Deaktivierte Spieler bleiben in den
  Statistiken erhalten."
- Keine Gruppen-Verwaltung im Mockup sichtbar (Gruppen sind ein späteres,
  eigenständiges Feature, nicht Teil dieser Referenz).

## 3. Verlauf
- Header mit Filter-Icon.
- Tab-Umschalter **"ALLE" / "LAUFEND" / "BEENDET"** (aktiver Tab grün gefüllt)
  — aktuell in der Live-Version vermutlich NICHT vorhanden, nur eine flache
  Liste.
- Liste als Karten: farbiger Icon-Kreis (Modusfarbe), Titel, Status-Badge,
  Meta (Datum/Uhrzeit, Spielernamen), Ergebnis-/Gewinner-Zeile.
- "VERLAUF EXPORTIEREN"-Button unten mit Icon.

## 4. Statistiken
- Header mit Datumsbereich ("01.05.2024 – 14.05.2024") + Filter-Icon.
- **4 KPI-Kacheln in einer Reihe**: "12 SPIELE", "8 SIEGE", "67% SIEGQUOTE",
  "412 Ø PUNKTE" — je große Zahl + Label. Existiert aktuell nicht.
- "SPIELER ÜBERSICHT": Zeilen mit farbigem Punkt, Name, Kronen-Icon beim
  Erstplatzierten, Anzahl Siege, Sieg-%, +/- Punkte-Differenz (grün/rot).
- "HEAD-TO-HEAD": **Matrix/Tabelle** (Spieler als Zeilen UND Spalten, Zellen
  zeigen z.B. "3:1") — aktuell nur eine flache Liste von Paaren
  ("Anna – Ben: 2:0 …"), keine Matrix.
- "MODUS VERTEILUNG": **Donut-/Kreisdiagramm** mit Prozent-Legende je Modus —
  existiert aktuell nicht.
- "DETAILLIERTE STATISTIKEN"-Button unten (führt vermutlich zur bisherigen
  Tabellenansicht als Detail-Ebene).

## 5. Wer fängt an?
- Header "WER FÄNGT AN?" mit Info-Icon.
- Mitte: "ALLE BEREIT?" + "GLEICHZEITIG BERÜHREN!".
- **4 feste, benannte Kreise in 2×2-Anordnung** (Anna/Ben/Chris/Dana, je in
  Spielerfarbe) — KEIN freies Auflegen der Finger irgendwo auf dem
  Bildschirm wie aktuell implementiert! Jeder Spieler hat einen festen,
  eigenen Kreis mit Namen, alle berühren gleichzeitig ihren eigenen Kreis.
- Unten: Toggle "ZUFÄLLIG AUSWÄHLEN".
- **Das ist ein grundlegend anderes Interaktionsmodell** als die aktuelle
  Multitouch-Umsetzung (freie Position, kein Bezug zu bestimmten Spielern).
  Vor Umsetzung mit User klären, ob wirklich fest zugeordnete Spieler-Kreise
  gewünscht sind (z.B. aus der Spielerliste des zuletzt gespielten Spiels)
  oder ob das nur eine vereinfachte Mockup-Darstellung ist.

## 6. Einstellungen
- "ALLGEMEIN": Spieltitel (Wert "Das Scoreboard"), Ton (Toggle), Sprache
  ("Deutsch", Chevron), Logo (Chips "Standard" / "Minimal").
- "ERSCHEINUNGSBILD": Akzentfarbe als **Reihe farbiger Punkte zum Antippen**
  (Grün/Orange/Pink/Violett/Cyan) statt Hex-Eingabefeldern; Hintergrund als
  Chips "Dunkel" / "Dunkel Blau" / "Schwarz"; Kartenstil als Chips
  "Klassisch" / "Modern".
- "WEITERE OPTIONEN": Bestätigungen anzeigen (Toggle), Rundenauto-Speicherung
  (Toggle), Statistiken teilen (Chevron-Zeile).
- Roter "EINSTELLUNGEN ZURÜCKSETZEN"-Button unten.
- **Deutlich einfacher/kuratierter als die aktuelle Settings-Seite** (keine
  Hex-Farbwahl, kein Datei-Upload-UI für Logo, kein Backup/Export sichtbar —
  vermutlich bewusst reduziert für die Mockup-Darstellung; mit User klären,
  ob Backup/Logo-Upload/Hex-Paare komplett wegfallen sollen oder nur nicht
  Teil des Mockups waren).

## 7. Punkte bis Höchstwert — Setup
- Spieltitel-Feld.
- "ZIELPUNKTE": großer zentrierter Zahlenwert mit -/+ (200).
- "SPIELER (4)": entfernbare farbige Chips mit "×", "+ Spieler hinzufügen".
- "ERWEITERTE OPTIONEN": Toggles "Negativpunkte erlauben",
  "Rundenverlauf speichern", Stepper "Bonus bei Zielerreichung" (Wert "0").
  **Kein Team-Modus im Mockup sichtbar** — aktuell ist Team-Modus die einzige
  "Erweiterte Option". Bonus/Negativpunkte-Optionen existieren aktuell nicht
  im Backend.
- Grüner "▶ SPIEL STARTEN"-Button.

## 8. Offene Punkterunde — Setup
- Spieltitel, "GEWINNER-MODUS" (Höchste/Niedrigste Punktzahl, Pokal-Icons
  hoch/runter) — entspricht ungefähr dem aktuellen Sieg-Richtung-Picker.
- Spieler-Chips, "ERWEITERTE OPTIONEN" → "Negativpunkte erlauben"-Toggle.

## 9. Feste Rundenzahl — Setup
- Spieltitel, "RUNDENANZAHL"-Stepper (10), Gewinner-Modus, Spieler-Chips,
  "RUNDEN-ENDE HINWEIS" → "Hinweis nach jeder Runde anzeigen"-Toggle.
- **Deckt sich weitgehend mit der aktuellen Umsetzung.**

## 10. RAGE — Setup
- Info-Kasten (Regel-Hinweis), Spieler-Chips, "OPTIONEN":
  "Rundenverlauf speichern"-Toggle, "Bonus/Malus anzeigen"-Toggle.

## 11. Punkte bis Höchstwert — Aktives Spiel
- Header "ZIEL: 200" + Kebab-Menü.
- Rangliste als Karten: Rang in farbigem Kreis, Name, große farbige
  Punktzahl, Prozent, Fortschrittsbalken (farbig) — **entspricht bereits
  weitgehend der aktuellen Umsetzung (#91).**
- "RUNDE HINZUFÜGEN": ausgewählter Spieler-Chip ("Anna") DIREKT NEBEN
  Stepper (-/10/+) in einer Zeile, plus Häkchen-Bestätigungs-Button daneben.
  Aktuelle Umsetzung zeigt Chips + separaten Stepper-Bereich darunter, kein
  Häkchen-Button pro Spieler.
- "RUNDE SPEICHERN"-Button.
- **"VERLAUF & KORREKTUR" ist ein eingeklappter Link (Chevron) unten, NICHT
  eine immer sichtbare Tabelle wie aktuell umgesetzt.**

## 12. RAGE — Aktives Spiel
- Header "RUNDE 5/10" mit segmentiertem Fortschrittsbalken (rot/Gradient).
- Runden-Differenz-Badges pro Spieler in einer Reihe: "Anna +17", "Ben -8",
  "Chris +23", "Dana -32" (farbig, +/- grün/rot).
- **Kompakte Tabelle** darunter: Spalten "BIET / STICHE / BONUS / MALUS /
  RUNDE", Zeilen je Spieler (farbig) — NICHT die aktuell umgesetzten
  Mini-Stepper-Karten pro Spieler (#92)! Unklar, ob das eine
  Zusammenfassungs-Ansicht nach Eingabe ist oder die tatsächliche
  Eingabe-UI (Tabellenzellen antippen?) — mit User klären.
- "RUNDE SPEICHERN"-Button, "RUNDENVERLAUF" als eingeklappter Link unten
  (wie bei Screen 11).

## Übergreifende Muster, die in mehreren Screens auffallen
1. **Eingeklappte Verlauf/Korrektur-Sektion**: bei beiden Aktiv-Ansichten
   (11, 12) ist die Runden-Korrektur-Tabelle hinter einem Link/Chevron
   versteckt, nicht permanent sichtbar wie aktuell.
2. **Kebab-Menüs (⋮)** statt mehrerer sichtbarer Buttons (Startseite-Header,
   Spielerverwaltung-Zeilen, aktive Spielansicht-Header).
3. **Spielerfarben-Zyklus** ist in allen Screens konsistent Grün→Orange→
   Violett→Cyan (aktuelle CSS-Variablen `--player-color-1..4` passen dazu,
   sollte geprüft werden ob Hex-Werte exakt übereinstimmen).
4. Mehrere im Mockup gezeigte Optionen existieren aktuell gar nicht im
   Backend (Bonus bei Zielerreichung, Negativpunkte-Toggle, Bonus/Malus-
   Toggle in RAGE, Statistiken-KPI-Kacheln, Donut-Chart, Head-to-Head-
   Matrix, Kartenstil/Hintergrund-Presets in Settings) — das sind keine
   reinen CSS-Anpassungen, sondern teils neue Features/Backend-Felder.

## Nächster Schritt
Diese Datei ist eine Bestandsaufnahme, noch kein Umsetzungsplan. Vor
Umsetzung: Screenshots des aktuellen Bold-Themes je Seite erstellen, gegen
diese Beschreibung abgleichen, konkrete Abweichungsliste priorisieren und
mit dem User die offenen Fragen (Wer-fängt-an-Interaktionsmodell, RAGE-
Tabellen-vs-Karten, Umfang der Settings-Vereinfachung) klären, bevor
größere Refactors gestartet werden.
