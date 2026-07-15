<?php
$page_title = 'pages.players.title';
$active_nav = 'players';
$page_h1 = '<h1 data-i18n="players.heading">Spieler verwalten</h1>';
require __DIR__ . '/includes/header.php';
?>

  <main id="main">
    <section class="card">
      <h2 data-i18n="players.newPlayer.heading">Neuer Spieler</h2>
      <form id="add-player-form" class="form">
        <label for="new-player-name" data-i18n="players.newPlayer.nameLabel">Name</label>
        <input type="text" id="new-player-name" maxlength="40" required autocomplete="off">
        <button type="submit" class="btn btn--primary" data-i18n="common.buttons.add">Hinzufügen</button>
      </form>
      <p id="add-player-error" class="error-text" role="alert" hidden></p>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="players.active.heading">Aktive Spieler</h2>
      <p class="hint-text" data-i18n="players.active.hint">Diese Spieler stehen bei neuen Spielen zur Schnellauswahl bereit.</p>
      <ul class="player-list" id="active-player-list"></ul>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="players.inactive.heading">Deaktivierte Spieler</h2>
      <p class="hint-text" data-i18n="players.inactive.hint">Bleiben in vergangenen Spielen sichtbar, erscheinen aber nicht mehr in der Schnellauswahl.</p>
      <ul class="player-list" id="inactive-player-list"></ul>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="groups.newGroup.heading">Neue Gruppe</h2>
      <p class="hint-text" data-i18n="groups.hint">Fasse Spieler zu Gruppen zusammen (z.B. "Familie", "Stammtisch") — beim Einrichten eines Spiels lässt sich dann mit einem Klick die ganze Gruppe auswählen. Eine Person kann in mehreren Gruppen sein.</p>
      <form id="add-group-form" class="form">
        <label for="new-group-name" data-i18n="groups.newGroup.nameLabel">Gruppenname</label>
        <input type="text" id="new-group-name" maxlength="40" placeholder="z.B. Familie" data-i18n-placeholder="groups.newGroup.namePlaceholder" required autocomplete="off">
        <label data-i18n="groups.newGroup.membersLabel">Mitglieder</label>
        <div class="player-picker" id="new-group-members"></div>
        <button type="submit" class="btn btn--primary" data-i18n="common.buttons.add">Hinzufügen</button>
      </form>
      <p id="add-group-error" class="error-text" role="alert" hidden></p>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="groups.active.heading">Aktive Gruppen</h2>
      <ul class="group-list" id="active-group-list"></ul>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="groups.inactive.heading">Deaktivierte Gruppen</h2>
      <ul class="group-list" id="inactive-group-list"></ul>
    </section>
  </main>

<?php
$page_scripts = ['js/avatar-cropper.js', 'js/players.js', 'js/groups.js'];
require __DIR__ . '/includes/footer.php';
