(function () {
  'use strict';

  var root = document.documentElement;
  var lampSwitch = document.querySelector('.night-lamp-switch');
  var articleBody = document.querySelector('.night-article-body');

  function passageRoot() {
    var encrypted = articleBody ? articleBody.querySelector('#hexo-blog-encrypt') : null;
    if (!encrypted || encrypted.querySelector('.hbe-content')) return articleBody;
    return encrypted.querySelector(':scope > div') || encrypted;
  }

  function isImageOnlyParagraph(paragraph, image) {
    return paragraph && paragraph.tagName === 'P' && Array.from(paragraph.childNodes).every(function (node) {
      return node === image || (node.nodeType === Node.TEXT_NODE && !node.textContent.trim());
    });
  }

  function classifyFigure(image, figure) {
    if (!image.naturalWidth || !image.naturalHeight) {
      figure.classList.add('missing');
      return;
    }

    var ratio = image.naturalWidth / image.naturalHeight;
    var orientation = ratio > 1.8 ? 'panorama' : ratio < 0.8 ? 'portrait' : 'standard';
    figure.classList.add(orientation, 'ready');
  }

  function enhanceImages() {
    if (!articleBody) return;

    var images = Array.from(articleBody.querySelectorAll('img'));
    images.forEach(function (image, index) {
      var originalParent = image.parentElement;
      var figure = document.createElement('figure');
      var caption = document.createElement('figcaption');
      var number = document.createElement('b');
      var description = document.createElement('span');

      figure.className = 'night-evidence';
      number.textContent = 'PLATE ' + String(index + 1).padStart(2, '0');
      description.textContent = image.getAttribute('alt') || '未命名观测记录';
      caption.append(number, description);

      if (isImageOnlyParagraph(originalParent, image)) {
        originalParent.replaceWith(figure);
      } else {
        image.replaceWith(figure);
      }
      figure.append(image, caption);

      if (image.complete) {
        classifyFigure(image, figure);
      } else {
        image.addEventListener('load', function () { classifyFigure(image, figure); }, { once: true });
        image.addEventListener('error', function () { figure.classList.add('missing'); }, { once: true });
      }
    });
  }

  function extractField(label) {
    var content = passageRoot();
    var blockquotes = content ? content.querySelectorAll(':scope > blockquote') : [];
    var pattern = new RegExp('^' + label + '\\s*[｜|:]\\s*(.+)$');
    var value = '';

    Array.from(blockquotes).some(function (blockquote) {
      return Array.from(blockquote.querySelectorAll('p')).some(function (paragraph) {
        var match = paragraph.textContent.trim().match(pattern);
        if (!match) return false;
        value = match[1].trim();
        return true;
      });
    });
    return value;
  }

  function extractFallbackLocation() {
    var content = passageRoot();
    var blockquotes = content ? Array.from(content.querySelectorAll(':scope > blockquote')) : [];
    var singleLine = blockquotes.find(function (blockquote) {
      return blockquote.querySelectorAll('p').length === 1 && !/[｜|:]/.test(blockquote.textContent);
    });
    return singleLine ? singleLine.textContent.trim() : '';
  }

  function passageTime(baseTime, index) {
    var match = baseTime.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return baseTime;
    var minutes = (Number(match[1]) * 60 + Number(match[2]) + index * 4) % (24 * 60);
    return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
  }

  function customTimelineMarks() {
    if (!articleBody) return [];
    return Array.from(articleBody.querySelectorAll(':scope > .night-timeline-data > li')).map(function (item) {
      return item.textContent.trim();
    });
  }

  function enhancePassages() {
    var content = passageRoot();
    if (!content) return;

    var paragraphs = Array.from(content.querySelectorAll(':scope > p'));
    if (!paragraphs.length) return;

    var location = articleBody.dataset.nightLocation || extractField('地点') || extractFallbackLocation() || '地点未记载';
    var recordedTime = articleBody.dataset.nightCustomTime || extractField('时间') || articleBody.dataset.nightTime || '时间未记载';
    var timelineMarks = customTimelineMarks();
    var ending = paragraphs[paragraphs.length - 1];

    paragraphs.forEach(function (paragraph, index) {
      paragraph.classList.add('night-passage');
      paragraph.dataset.nightMark = index < timelineMarks.length ? timelineMarks[index] : passageTime(recordedTime, index);
    });

    ending.classList.remove('night-passage');
    ending.classList.add('night-awakening');
    ending.removeAttribute('data-night-mark');
    content.append(ending);
  }

  function revealContent() {
    var targets = document.querySelectorAll('.night-passage, .night-article-body > blockquote, .night-article-body #hexo-blog-encrypt blockquote, .night-evidence, .night-awakening');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (target) { target.classList.add('seen'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('seen');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    targets.forEach(function (target) { observer.observe(target); });
  }

  function updateProgress() {
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    root.style.setProperty('--night-reading-progress', Math.min(1, Math.max(0, progress)));
  }

  if (lampSwitch) {
    var lampLabel = lampSwitch.querySelector('b');
    lampSwitch.addEventListener('click', function () {
      var isVeiled = root.dataset.nightLight !== 'veiled';
      root.dataset.nightLight = isVeiled ? 'veiled' : 'awake';
      lampSwitch.setAttribute('aria-pressed', String(isVeiled));
      lampSwitch.setAttribute('aria-label', isVeiled ? '点亮灯火' : '调暗灯火');
      lampLabel.textContent = isVeiled ? '灯火：暗' : '灯火：明';
    });
  }

  enhanceImages();
  enhancePassages();
  revealContent();
  window.addEventListener('hexo-blog-decrypt', function () {
    var encryptAgain = articleBody ? articleBody.querySelector('#hexo-blog-encrypt .hbe-button') : null;
    if (encryptAgain) encryptAgain.textContent = '重新封存记录';
    enhanceImages();
    enhancePassages();
    revealContent();
  });
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}());