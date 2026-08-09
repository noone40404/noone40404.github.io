(function () {
  'use strict';

  var rail = document.getElementById('night-index-rail');
  if (!rail) return;

  var buttons = Array.from(rail.querySelectorAll('button'));
  var selectedIndex = 0;
  var visual = document.querySelector('.night-index-visual');
  var cover = document.getElementById('night-index-cover');
  var panel = document.getElementById('night-index-panel');
  var title = document.getElementById('night-index-record-title');
  var volume = document.getElementById('night-index-volume');
  var description = document.getElementById('night-index-description');
  var date = document.getElementById('night-index-date');
  var signal = document.getElementById('night-index-signal');
  var enter = document.getElementById('night-index-enter');
  var previous = document.getElementById('night-index-previous');
  var next = document.getElementById('night-index-next');

  function selectRecord(index) {
    selectedIndex = Math.max(0, Math.min(buttons.length - 1, index));
    var record = buttons[selectedIndex].dataset;

    visual.classList.add('loading');
    visual.classList.remove('image-missing');
    cover.onload = function () { visual.classList.remove('loading', 'image-missing'); };
    cover.onerror = function () {
      visual.classList.remove('loading');
      visual.classList.add('image-missing');
    };
    cover.src = record.cover;
    cover.alt = record.title + '封面';
    panel.dataset.number = record.number;
    title.textContent = record.title;
    volume.textContent = 'VOLUME ' + record.number;
    description.textContent = record.description;
    date.textContent = record.date;
    signal.textContent = record.signal;
    enter.href = record.path;
    previous.disabled = selectedIndex === 0;
    next.disabled = selectedIndex === buttons.length - 1;
    buttons.forEach(function (button, buttonIndex) {
      button.setAttribute('aria-current', String(buttonIndex === selectedIndex));
    });
  }

  buttons.forEach(function (button, index) {
    button.addEventListener('click', function () { selectRecord(index); });
  });
  previous.addEventListener('click', function () { selectRecord(selectedIndex - 1); });
  next.addEventListener('click', function () { selectRecord(selectedIndex + 1); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') selectRecord(selectedIndex - 1);
    if (event.key === 'ArrowRight') selectRecord(selectedIndex + 1);
  });
}());
