<?php
// Spielerverwaltung ist als Reiter in die Einstellungen gewandert - alte
// Links/Lesezeichen auf /players.php bleiben so weiterhin nutzbar.
header('Location: /settings.php?tab=spieler');
exit;
