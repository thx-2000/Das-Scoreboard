/**
 * Modal fuer die Ausschnitts-Auswahl beim Avatar-Upload: Pan (Ziehen) + Zoom
 * (Regler) auf festem 2:3-Hochformat-Rahmen (Passfoto-Format), kein freies
 * Zuschneiden mit Ecken-Griffen - das haelt die Bedienung einfach und reicht,
 * um den gewuenschten Bildausschnitt zu waehlen. Erzeugt bei "Übernehmen"
 * ein JPEG-Blob in fester Aufloesung (OUTPUT_WIDTH x OUTPUT_HEIGHT).
 *
 * window.openAvatarCropper(file, { onCrop, onCancel }) oeffnet das Modal
 * (wird bei Bedarf einmalig erzeugt und danach wiederverwendet).
 */
(function () {
  const DISPLAY_WIDTH = 240;
  const DISPLAY_HEIGHT = 360;
  const OUTPUT_WIDTH = 480;
  const OUTPUT_HEIGHT = 720;
  const OUTPUT_SCALE = OUTPUT_WIDTH / DISPLAY_WIDTH;
  const MAX_ZOOM = 3;

  let modal = null;
  let canvas = null;
  let ctx = null;
  let zoomInput = null;
  let applyBtn = null;
  let cancelBtn = null;

  let image = null;
  let objectUrl = null;
  let baseScale = 1;
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panStartX = 0;
  let panStartY = 0;
  let currentCallbacks = null;
  let previouslyFocused = null;

  function buildModal() {
    const wrap = document.createElement('div');
    wrap.className = 'avatar-cropper-overlay';
    wrap.hidden = true;

    wrap.innerHTML = `
      <div class="avatar-cropper" role="dialog" aria-modal="true" aria-labelledby="avatar-cropper-heading">
        <h2 id="avatar-cropper-heading" data-i18n="avatarCropper.heading">Bildausschnitt wählen</h2>
        <p class="hint-text" data-i18n="avatarCropper.hint">Ziehen zum Verschieben, Regler zum Zoomen (Passfoto-Format 2:3).</p>
        <canvas class="avatar-cropper__canvas" width="${DISPLAY_WIDTH}" height="${DISPLAY_HEIGHT}"></canvas>
        <input type="range" class="avatar-cropper__zoom" min="1" max="${MAX_ZOOM}" step="0.01" value="1">
        <div class="avatar-cropper__actions">
          <button type="button" class="btn btn--ghost" data-role="cancel" data-i18n="common.buttons.cancel">Abbrechen</button>
          <button type="button" class="btn btn--primary" data-role="apply" data-i18n="avatarCropper.apply">Übernehmen</button>
        </div>
      </div>
    `;

    document.body.appendChild(wrap);

    canvas = wrap.querySelector('.avatar-cropper__canvas');
    ctx = canvas.getContext('2d');
    zoomInput = wrap.querySelector('.avatar-cropper__zoom');
    applyBtn = wrap.querySelector('[data-role="apply"]');
    cancelBtn = wrap.querySelector('[data-role="cancel"]');

    if (window.t) {
      wrap.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = window.t(el.getAttribute('data-i18n'));
      });
    }

    zoomInput.addEventListener('input', () => {
      scale = baseScale * Number(zoomInput.value);
      clampPan();
      render();
    });

    canvas.addEventListener('pointerdown', (event) => {
      dragging = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      panStartX = panX;
      panStartY = panY;
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      panX = panStartX + (event.clientX - dragStartX);
      panY = panStartY + (event.clientY - dragStartY);
      clampPan();
      render();
    });

    ['pointerup', 'pointercancel'].forEach((type) => {
      canvas.addEventListener(type, () => { dragging = false; });
    });

    cancelBtn.addEventListener('click', () => {
      close();
      if (currentCallbacks && currentCallbacks.onCancel) currentCallbacks.onCancel();
    });

    applyBtn.addEventListener('click', () => {
      const onCrop = currentCallbacks && currentCallbacks.onCrop;
      exportCrop((blob) => {
        close();
        if (onCrop) onCrop(blob);
      });
    });

    wrap.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') cancelBtn.click();
    });

    return wrap;
  }

  function clampPan() {
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    panX = Math.min(0, Math.max(DISPLAY_WIDTH - drawW, panX));
    panY = Math.min(0, Math.max(DISPLAY_HEIGHT - drawH, panY));
  }

  function render() {
    ctx.clearRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
    ctx.drawImage(image, panX, panY, image.width * scale, image.height * scale);
  }

  function exportCrop(onDone) {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = OUTPUT_WIDTH;
    outputCanvas.height = OUTPUT_HEIGHT;
    const outputCtx = outputCanvas.getContext('2d');
    outputCtx.drawImage(
      image,
      panX * OUTPUT_SCALE,
      panY * OUTPUT_SCALE,
      image.width * scale * OUTPUT_SCALE,
      image.height * scale * OUTPUT_SCALE,
    );
    outputCanvas.toBlob(onDone, 'image/jpeg', 0.9);
  }

  function close() {
    modal.hidden = true;
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    image = null;
    currentCallbacks = null;
    if (previouslyFocused) {
      previouslyFocused.focus();
      previouslyFocused = null;
    }
  }

  window.openAvatarCropper = function openAvatarCropper(file, callbacks) {
    if (!modal) modal = buildModal();
    currentCallbacks = callbacks || {};
    previouslyFocused = document.activeElement;

    objectUrl = URL.createObjectURL(file);
    image = new Image();
    image.onload = () => {
      baseScale = Math.max(DISPLAY_WIDTH / image.width, DISPLAY_HEIGHT / image.height);
      scale = baseScale;
      panX = (DISPLAY_WIDTH - image.width * scale) / 2;
      panY = (DISPLAY_HEIGHT - image.height * scale) / 2;
      zoomInput.value = '1';
      modal.hidden = false;
      cancelBtn.focus();
      render();
    };
    image.src = objectUrl;
  };
})();
