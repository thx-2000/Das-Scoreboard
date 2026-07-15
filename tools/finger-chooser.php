<?php
$page_title = 'pages.chooser.title';
$active_nav = 'chooser';
$viewport_extra = ', maximum-scale=1.0, user-scalable=no';
$page_h1 = '<h1 data-i18n="chooser.heading">Wer fängt an?</h1>';
$page_subtitle = '<p class="app-header__subtitle" data-i18n="chooser.subtitle">Alle Finger gleichzeitig auf den Bildschirm legen — funktioniert per Multitouch (iPad/iPhone).</p>';
require __DIR__ . '/../includes/header.php';
?>

  <main id="main">
    <section class="card chooser-card">
      <div id="chooser-area" class="chooser-area">
        <p class="chooser-hint" id="chooser-hint" data-i18n="chooser.hint">Finger auf den Bildschirm legen …</p>
      </div>
    </section>
  </main>

<?php
$page_scripts = ['tools/finger-chooser.js'];
require __DIR__ . '/../includes/footer.php';
