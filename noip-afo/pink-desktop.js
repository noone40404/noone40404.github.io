(() => {
  const shell = document.querySelector('.os-shell');
  const scenes = [...document.querySelectorAll('.os-scene')];
  const tabs = [...document.querySelectorAll('.os-task-tabs [data-target]')];
  const previousButton = document.querySelector('.page-arrow-prev');
  const nextButton = document.querySelector('.page-arrow-next');
  let currentPage = 0;

  const showPage = pageIndex => {
    const nextPage = Math.max(0, Math.min(scenes.length - 1, pageIndex));
    const previousScene = scenes[currentPage];
    const nextScene = scenes[nextPage];

    document.querySelectorAll('.os-sidebar-ghost').forEach(sidebar => sidebar.remove());

    if (nextPage !== currentPage) {
      previousScene.querySelectorAll('.os-sidebar').forEach(sidebar => {
        const ghost = sidebar.cloneNode(true);
        ghost.classList.add('os-sidebar-ghost');
        nextScene.append(ghost);
        ghost.addEventListener('animationend', () => ghost.remove(), { once: true });
      });
    }

    currentPage = nextPage;
    shell.dataset.page = String(nextPage);

    scenes.forEach((scene, index) => {
      const isActive = index === nextPage;
      scene.classList.toggle('is-active', isActive);
      scene.hidden = !isActive;
    });

    tabs.forEach((tab, index) => {
      const isActive = index === nextPage;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    previousButton.disabled = nextPage === 0;
    nextButton.disabled = nextPage === scenes.length - 1;
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => showPage(Number(tab.dataset.target)));
  });

  previousButton.addEventListener('click', () => showPage(currentPage - 1));
  nextButton.addEventListener('click', () => showPage(currentPage + 1));

  document.addEventListener('keydown', event => {
    if (event.target.closest('.os-scroll-content')) return;
    if (event.key === 'ArrowLeft') showPage(currentPage - 1);
    if (event.key === 'ArrowRight') showPage(currentPage + 1);
  });

  document.querySelectorAll('.os-window').forEach(windowElement => {
    const titlebar = windowElement.querySelector('.os-titlebar');
    if (!titlebar) return;

    titlebar.addEventListener('pointerdown', event => {
      if (event.button !== 0 || window.matchMedia('(max-width: 700px)').matches) return;

      event.preventDefault();
      titlebar.setPointerCapture(event.pointerId);
      windowElement.classList.add('is-positioned');
      windowElement.classList.add('is-dragging');

      const workspace = windowElement.parentElement;
      const scene = windowElement.closest('.os-scene');
      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = windowElement.offsetLeft;
      const startTop = windowElement.offsetTop;
      const windowRect = windowElement.getBoundingClientRect();
      const workspaceRect = workspace.getBoundingClientRect();
      const sceneRect = scene.getBoundingClientRect();
      const leftSidebarRect = scene.querySelector('.os-sidebar-left').getBoundingClientRect();
      const rightSidebarRect = scene.querySelector('.os-sidebar-right').getBoundingClientRect();
      const fhdbgLeft = leftSidebarRect.right;
      const fhdbgRight = rightSidebarRect.left;
      const fitsBetweenSidebars = windowRect.width <= fhdbgRight - fhdbgLeft;
      const dragAreaLeft = fitsBetweenSidebars ? fhdbgLeft : sceneRect.left;
      const dragAreaRight = fitsBetweenSidebars ? fhdbgRight : sceneRect.right;
      const minimumLeft = Math.ceil(dragAreaLeft - workspaceRect.left) + 1;
      const maximumLeft = Math.floor(dragAreaRight - workspaceRect.left - windowRect.width) - 1;
      const minimumTop = Math.ceil(sceneRect.top - workspaceRect.top) + 1;
      const maximumTop = Math.floor(sceneRect.bottom - workspaceRect.top - windowRect.height) - 1;

      windowElement.style.right = 'auto';
      windowElement.style.bottom = 'auto';

      const drag = moveEvent => {
        const left = Math.max(minimumLeft, Math.min(maximumLeft, startLeft + moveEvent.clientX - startX));
        const top = Math.max(minimumTop, Math.min(maximumTop, startTop + moveEvent.clientY - startY));
        windowElement.style.left = `${left}px`;
        windowElement.style.top = `${top}px`;
      };

      const stopDragging = () => {
        windowElement.classList.remove('is-dragging');
        titlebar.removeEventListener('pointermove', drag);
        titlebar.removeEventListener('pointerup', stopDragging);
        titlebar.removeEventListener('pointercancel', stopDragging);
      };

      titlebar.addEventListener('pointermove', drag);
      titlebar.addEventListener('pointerup', stopDragging);
      titlebar.addEventListener('pointercancel', stopDragging);
    });
  });

  const medicineWindow = document.querySelector('.medicine-float');
  const medicineTitlebar = medicineWindow?.querySelector('.os-titlebar');

  if (medicineTitlebar) {
    const dropLayer = document.createElement('div');
    const smallMedicine = Array.from({ length: 6 }, (_, index) => `/noip-afo/assets/medicine-drops/pill-${index + 1}.png`);
    const largeMedicine = Array.from({ length: 6 }, (_, index) => `/noip-afo/assets/medicine-drops/box-${index + 1}.png`);
    let dragStartedAt = 0;
    let lastDropAt = 0;
    let nextDropDelay = 0;
    let hasSpawnedLarge = false;

    dropLayer.className = 'medicine-drop-layer';
    dropLayer.setAttribute('aria-hidden', 'true');
    medicineWindow.closest('.os-scene').append(dropLayer);
    [...smallMedicine, ...largeMedicine].forEach(source => {
      const image = new Image();
      image.src = source;
    });

    const spawnMedicine = isLarge => {
      const sources = isLarge ? largeMedicine : smallMedicine;
      const source = sources[Math.floor(Math.random() * sources.length)];
      const windowRect = medicineWindow.getBoundingClientRect();
      const taskbarRect = document.querySelector('.os-taskbar').getBoundingClientRect();
      const width = isLarge ? 64 + Math.random() * 24 : 26 + Math.random() * 12;
      const startX = windowRect.left + windowRect.width * (.18 + Math.random() * .64) - width / 2;
      const startY = Math.min(windowRect.top + windowRect.height * (.28 + Math.random() * .32), taskbarRect.top - 30);
      const image = document.createElement('img');

      image.className = `medicine-drop ${isLarge ? 'medicine-drop-box' : 'medicine-drop-pill'}`;
      image.alt = '';
      image.src = source;
      image.style.width = `${width}px`;

      const launch = () => {
        const aspectRatio = image.naturalWidth / image.naturalHeight || 1;
        const renderedHeight = width / aspectRatio;
        const rotatedFootprint = Math.hypot(width, renderedHeight);
        const floorY = Math.max(0, taskbarRect.top - rotatedFootprint - startY - 2);

        image.style.left = `${Math.max(2, Math.min(innerWidth - width - 2, startX))}px`;
        image.style.top = `${startY}px`;
        image.style.setProperty('--drop-distance', `${floorY}px`);
        image.style.setProperty('--drop-drift', `${-38 + Math.random() * 76}px`);
        image.style.setProperty('--drop-spin', `${-220 + Math.random() * 440}deg`);
        image.style.setProperty('--drop-duration', `${isLarge ? 1700 + Math.random() * 450 : 1250 + Math.random() * 350}ms`);
        dropLayer.append(image);
        window.setTimeout(() => {
          if (!image.isConnected) return;
          image.classList.add('is-expiring');
          window.setTimeout(() => image.remove(), 700);
        }, 20000);
        image.addEventListener('animationend', () => {
          image.classList.add('is-settled');
          const settledMedicine = dropLayer.querySelectorAll('.medicine-drop');
          if (settledMedicine.length > 80) settledMedicine[0].remove();
        }, { once: true });
      };

      if (image.complete) launch();
      else image.addEventListener('load', launch, { once: true });
    };

    medicineTitlebar.addEventListener('pointerdown', event => {
      if (event.button !== 0 || window.matchMedia('(max-width: 700px)').matches) return;

      dragStartedAt = performance.now();
      lastDropAt = 0;
      nextDropDelay = 0;
      hasSpawnedLarge = false;

      const trackMovement = () => {
        const now = performance.now();
        if (lastDropAt && now - lastDropAt < nextDropDelay) return;

        const isLongDrag = now - dragStartedAt >= 5000;
        const isLarge = isLongDrag && (!hasSpawnedLarge || Math.random() < .36);
        spawnMedicine(isLarge);
        hasSpawnedLarge ||= isLarge;
        lastDropAt = now;
        nextDropDelay = isLongDrag ? 130 + Math.random() * 130 : 70 + Math.random() * 80;
      };

      const stopDropping = () => {
        medicineTitlebar.removeEventListener('pointermove', trackMovement);
        medicineTitlebar.removeEventListener('pointerup', stopDropping);
        medicineTitlebar.removeEventListener('pointercancel', stopDropping);
      };

      medicineTitlebar.addEventListener('pointermove', trackMovement);
      medicineTitlebar.addEventListener('pointerup', stopDropping);
      medicineTitlebar.addEventListener('pointercancel', stopDropping);
    });
  }

  document.querySelectorAll('.os-window[data-resizable]').forEach(windowElement => {
    const handle = windowElement.querySelector('.os-resize-handle');
    if (!handle) return;

    handle.addEventListener('pointerdown', event => {
      if (window.matchMedia('(max-width: 700px)').matches) return;

      event.preventDefault();
      handle.setPointerCapture(event.pointerId);

      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = windowElement.offsetWidth;
      const startHeight = windowElement.offsetHeight;
      const parentRect = windowElement.parentElement.getBoundingClientRect();
      const windowRect = windowElement.getBoundingClientRect();
      const maximumWidth = parentRect.right - windowRect.left;
      const maximumHeight = parentRect.bottom - windowRect.top;

      const resize = moveEvent => {
        const width = Math.min(maximumWidth, Math.max(300, startWidth + moveEvent.clientX - startX));
        const height = Math.min(maximumHeight, Math.max(190, startHeight + moveEvent.clientY - startY));
        windowElement.style.width = `${width}px`;
        windowElement.style.height = `${height}px`;
      };

      const stopResize = () => {
        handle.removeEventListener('pointermove', resize);
        handle.removeEventListener('pointerup', stopResize);
        handle.removeEventListener('pointercancel', stopResize);
      };

      handle.addEventListener('pointermove', resize);
      handle.addEventListener('pointerup', stopResize);
      handle.addEventListener('pointercancel', stopResize);
    });
  });

  showPage(0);
})();