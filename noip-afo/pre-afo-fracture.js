(() => {
  const shell = document.querySelector('.pre-afo-shell');
  const content = document.querySelector('.pre-afo-content');
  const garble = document.querySelector('[data-garble]');
  const stabilizeButton = document.querySelector('.pre-afo-stabilize');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!shell || !content) return;

  document.querySelector('.noip-back-button')?.addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.href = '/';
  });

  const unstablePhrases = [
    '为什么要继续呢',
    '真的认为你能做到吗',
    '生活会抛弃你',
    '不能逃避不能逃避',
    '我的梦在哪儿',
    '我还是选择走下去',
    '为了得到肯定',
    '我已经能看到最后的失败了'
  ];

  const paragraphs = [...content.querySelectorAll('p, blockquote')];

  const splitIntoJitterChars = (element, phrase, phraseIndex) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    const textNode = textNodes.find(node => node.nodeValue.includes(phrase));
    if (!textNode) return;

    const start = textNode.nodeValue.indexOf(phrase);
    const before = textNode.nodeValue.slice(0, start);
    const after = textNode.nodeValue.slice(start + phrase.length);
    const fragment = document.createDocumentFragment();
    if (before) fragment.append(document.createTextNode(before));

    [...phrase].forEach((character, characterIndex) => {
      const span = document.createElement('span');
      span.className = 'pre-afo-jitter-char';
      span.textContent = character;
      span.style.setProperty('--jitter-delay', `${(characterIndex * 37 + phraseIndex * 113) % 420}ms`);
      span.style.setProperty('--jitter-amp', `${2 + ((characterIndex + phraseIndex) % 4)}px`);
      span.style.setProperty('--jitter-duration', `${290 + ((characterIndex * 41 + phraseIndex * 23) % 150)}ms`);
      fragment.append(span);
    });

    if (after) fragment.append(document.createTextNode(after));
    textNode.parentNode.replaceChild(fragment, textNode);
  };

  unstablePhrases.forEach((phrase, index) => {
    const target = paragraphs.find(element => element.textContent.includes(phrase));
    if (!target) return;
    target.classList.add('pre-afo-unstable-line');
    if (index % 2) target.classList.add('pre-afo-chroma-line');
    splitIntoJitterChars(target, phrase, index);
  });

  const mosaicCandidates = paragraphs.filter((element, index) => (
    index > 3 &&
    index < paragraphs.length - 2 &&
    element.tagName === 'P' &&
    element.textContent.trim().length > 18
  ));
  const mosaicCount = Math.min(6, Math.max(3, Math.floor(mosaicCandidates.length / 9)));
  const shuffledCandidates = [...mosaicCandidates].sort(() => Math.random() - .5);
  const selectedCandidates = shuffledCandidates.slice(0, mosaicCount).sort((first, second) => (
    paragraphs.indexOf(first) - paragraphs.indexOf(second)
  ));

  selectedCandidates.forEach((anchor, index) => {
    const mosaicBlock = document.createElement('span');
    mosaicBlock.className = 'pre-afo-mosaic-block';
    mosaicBlock.setAttribute('aria-hidden', 'true');
    mosaicBlock.style.setProperty('--mosaic-width', `${72 + Math.floor(Math.random() * 154)}px`);
    mosaicBlock.style.setProperty('--mosaic-height', `${9 + Math.floor(Math.random() * 18)}px`);
    mosaicBlock.style.setProperty('--mosaic-offset', `${5 + Math.floor(Math.random() * 64)}%`);
    mosaicBlock.style.setProperty('--mosaic-speed', `${430 + Math.floor(Math.random() * 760)}ms`);
    mosaicBlock.style.setProperty('--mosaic-delay', `${-Math.floor(Math.random() * 900)}ms`);
    mosaicBlock.style.setProperty('--mosaic-drift', `${4 + Math.floor(Math.random() * 13)}px`);
    mosaicBlock.dataset.mosaicIndex = String(index + 1);
    anchor.insertAdjacentElement('afterend', mosaicBlock);
  });

  content.querySelectorAll('img').forEach(image => {
    image.loading = 'lazy';
    image.decoding = 'async';
  });

  const garbleAlphabet = '01ABCDEF#%/\\[]{}<>?';
  const createGarble = () => {
    const chunks = Array.from({ length: 5 }, () => {
      const length = 3 + Math.floor(Math.random() * 5);
      return Array.from({ length }, () => garbleAlphabet[Math.floor(Math.random() * garbleAlphabet.length)]).join('');
    });
    return `${chunks.slice(0, 3).join(' ')} // ${chunks.slice(3).join(':')}`;
  };

  let monitorTicks = 0;
  let polarityTriggered = false;
  let progressStage = 0;

  const updateMonitor = () => {
    monitorTicks += 1;
    const stabilized = shell.classList.contains('is-stabilized');
    const coherence = document.querySelector('[data-monitor="coherence"]');
    const memory = document.querySelector('[data-monitor="memory"]');
    const output = document.querySelector('[data-monitor="output"]');
    const heartbeat = document.querySelector('[data-heartbeat]');
    const integrity = document.querySelector('[data-integrity]');

    if (garble) garble.textContent = stabilized ? '00 00 00 // SIGNAL STABLE' : createGarble();
    if (coherence) coherence.textContent = stabilized ? 'STABLE' : ['UNSTABLE', 'DRIFTING', 'PARTIAL'][monitorTicks % 3];
    if (memory) memory.textContent = stabilized ? 'HELD' : ['FRAGMENTED', 'LEAKING', 'RECALLING'][monitorTicks % 3];
    if (output) output.textContent = 'READABLE';
    if (heartbeat) heartbeat.textContent = String(stabilized ? 72 : 66 + Math.floor(Math.random() * 23)).padStart(3, '0');
    if (integrity) integrity.textContent = `${stabilized ? 100 : 78 + Math.floor(Math.random() * 19)}%`;

    window.setTimeout(updateMonitor, stabilized ? 1600 : 620 + Math.random() * 680);
  };

  const shakeScreen = () => {
    if (reducedMotion) return;
    shell.classList.remove('pre-afo-shake');
    void shell.offsetWidth;
    shell.classList.add('pre-afo-shake');
  };

  const updateProgressStage = () => {
    const maximumScroll = content.scrollHeight - content.clientHeight;
    const progress = maximumScroll > 0 ? content.scrollTop / maximumScroll : 1;
    const nextStage = progress >= .99 ? 3 : progress >= .66 ? 2 : progress >= .33 ? 1 : 0;
    if (nextStage <= progressStage) return;

    progressStage = nextStage;
    shell.dataset.instability = `stage-${nextStage}`;
    shell.classList.add(`pre-afo-stage-${nextStage}`);
    shell.style.setProperty('--pre-tilt', `${nextStage * (nextStage === 3 ? -.9 : -.55)}deg`);
    shakeScreen();
  };

  const checkPolarity = () => {
    updateProgressStage();
    const maximumScroll = content.scrollHeight - content.clientHeight;
    const progress = maximumScroll > 0 ? content.scrollTop / maximumScroll : 1;
    if (polarityTriggered || reducedMotion || monitorTicks < 6 || progress < .82) return;

    polarityTriggered = true;
    shell.classList.add('is-polarity-flipped');
    document.body.classList.add('is-pre-afo-polarity-flipped');
    shell.dataset.instability = 'polarity-error';
    shakeScreen();
  };

  content.addEventListener('scroll', checkPolarity, { passive: true });

  stabilizeButton?.addEventListener('click', () => {
    if (shell.classList.contains('is-polarity-flipped')) {
      shell.classList.remove('is-polarity-flipped');
      document.body.classList.remove('is-pre-afo-polarity-flipped');
      shell.dataset.instability = 'polarity-restored';
      stabilizeButton.textContent = 'RESTORE POLARITY';
      return;
    }

    shell.classList.toggle('is-stabilized');
    shell.dataset.instability = shell.classList.contains('is-stabilized') ? 'stabilized' : `stage-${progressStage}`;
    stabilizeButton.textContent = shell.classList.contains('is-stabilized') ? 'RESUME INSTABILITY' : 'RESTORE POLARITY';
  });

  document.querySelectorAll('.os-window[data-resizable]').forEach(windowElement => {
    const handle = windowElement.querySelector('.os-resize-handle');
    const titlebar = windowElement.querySelector('.os-titlebar');

    titlebar?.addEventListener('pointerdown', event => {
      if (event.button !== 0 || window.matchMedia('(max-width: 700px)').matches) return;
      event.preventDefault();
      titlebar.setPointerCapture(event.pointerId);
      const workspace = windowElement.parentElement;
      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = windowElement.offsetLeft;
      const startTop = windowElement.offsetTop;
      const maximumLeft = Math.max(0, workspace.clientWidth - windowElement.offsetWidth);
      const maximumTop = Math.max(0, workspace.clientHeight - windowElement.offsetHeight);
      windowElement.style.right = 'auto';
      windowElement.style.bottom = 'auto';

      const move = moveEvent => {
        windowElement.style.left = `${Math.max(0, Math.min(maximumLeft, startLeft + moveEvent.clientX - startX))}px`;
        windowElement.style.top = `${Math.max(0, Math.min(maximumTop, startTop + moveEvent.clientY - startY))}px`;
      };
      const stop = () => {
        titlebar.removeEventListener('pointermove', move);
        titlebar.removeEventListener('pointerup', stop);
        titlebar.removeEventListener('pointercancel', stop);
      };
      titlebar.addEventListener('pointermove', move);
      titlebar.addEventListener('pointerup', stop);
      titlebar.addEventListener('pointercancel', stop);
    });

    handle?.addEventListener('pointerdown', event => {
      if (window.matchMedia('(max-width: 700px)').matches) return;
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = windowElement.offsetWidth;
      const startHeight = windowElement.offsetHeight;
      const maximumWidth = windowElement.parentElement.clientWidth - windowElement.offsetLeft;
      const maximumHeight = windowElement.parentElement.clientHeight - windowElement.offsetTop;

      const resize = moveEvent => {
        windowElement.style.width = `${Math.max(215, Math.min(maximumWidth, startWidth + moveEvent.clientX - startX))}px`;
        windowElement.style.height = `${Math.max(190, Math.min(maximumHeight, startHeight + moveEvent.clientY - startY))}px`;
      };
      const stop = () => {
        handle.removeEventListener('pointermove', resize);
        handle.removeEventListener('pointerup', stop);
        handle.removeEventListener('pointercancel', stop);
      };
      handle.addEventListener('pointermove', resize);
      handle.addEventListener('pointerup', stop);
      handle.addEventListener('pointercancel', stop);
    });
  });

  updateMonitor();
})();