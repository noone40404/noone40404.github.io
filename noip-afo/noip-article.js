(() => {
  const sourceTemplate = document.querySelector('#noip-article-source');
  const targets = [...document.querySelectorAll('[data-article-section]')];
  if (!sourceTemplate || targets.length !== 4) return;

  const source = sourceTemplate.content.querySelector('.noip-rendered-source');
  let sectionIndex = 0;

  [...source.childNodes].forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE && /^H[2-4]$/.test(node.tagName)) {
      const heading = node.textContent.replace(/\s+/g, '').toLowerCase();
      if (heading.includes('写在noip退役后')) sectionIndex = 1;
      if (heading.includes('两年后')) sectionIndex = 2;
      if (heading.includes('2024.2')) sectionIndex = 3;
    }
    targets[sectionIndex].append(node);
  });

  targets.forEach((target, index) => {
    if (!target.children.length && !target.textContent.trim()) {
      target.innerHTML = '<p class="noip-empty-section">NO RECORDS FOUND.</p>';
    }

    target.querySelectorAll('img').forEach(image => {
      image.loading = index === 0 ? 'eager' : 'lazy';
      image.decoding = 'async';
    });

    target.querySelectorAll('h2, h3, h4').forEach(heading => {
      if (!heading.textContent.includes('Day -2')) return;
      const anchor = heading.querySelector('.headerlink');
      heading.replaceChildren();
      if (anchor) heading.append(anchor);
      heading.append(document.createTextNode('Day -2'));
    });
  });

  sourceTemplate.remove();

  document.querySelector('.noip-back-button')?.addEventListener('click', () => {
    if (history.length > 1) {
      history.back();
    } else {
      location.href = '/';
    }
  });

  const progressRanges = {
    status: [24, 48],
    archive: [52, 74],
    recovery: [72, 92]
  };

  document.querySelectorAll('[data-random-progress]').forEach(progress => {
    const bar = progress.querySelector('i');
    const range = progressRanges[progress.dataset.randomProgress];
    if (!bar || !range) return;

    const fluctuate = () => {
      const value = Math.round(range[0] + Math.random() * (range[1] - range[0]));
      bar.style.width = `${value}%`;
      window.setTimeout(fluctuate, 650 + Math.random() * 850);
    };

    fluctuate();
  });

  const retryButton = document.querySelector('.noip-retry-button');
  const brokenScreen = document.querySelector('.broken-screen-effect');
  let retryCount = 0;

  retryButton?.addEventListener('click', () => {
    retryCount += 1;
    retryButton.dataset.retryCount = String(retryCount);
    if (retryCount <= 5 || !brokenScreen || brokenScreen.classList.contains('is-shattered')) return;

    brokenScreen.classList.add('is-shattered');
    document.querySelector('.os-shell')?.classList.add('screen-impact');
  });
})();