(() => {
  'use strict';

  const themes = ['locksmith', 'cho-10', 'christmas', 'spring-festival'];
  const overrideKey = 'home-season-preview';
  const shellStyleId = 'home-season-shell-style';
  const switchSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA', 'KeyB', 'KeyA'];
  const labels = { auto: '自动', locksmith: '锁匠', 'cho-10': '超天酱', christmas: '圣诞', 'spring-festival': '春节' };
  const skinData = {
    locksmith: { kicker: 'THE ONEIRIC TERMINAL', index: 'ARCHIVE LOCKED', title: '关于门的梦境', copy: '我梦见了敞开的门。红色的门，金色的门，玻璃门，像书籍一样装订起来的门，轨道车厢门还有城堡大门。我身后便是我寻找的某个事物。我醒来时，门阖上的声音仍回荡在耳边。', symbol: '⌑', triggerCopy: '今日是锁匠的梦境系列文章发布纪念日，那里有一扇不该开启的门，现在连它的合页都在摇摇欲动：', triggerLabel: '过往的回忆', footer: 'ONEIRIC ARCHIVE' },
    'cho-10': { kicker: 'LOST IN THOUGHTS', index: 'SIGNAL // 100%', title: 'You Can (Not) Redo', copy: '伴随着剧烈的疼痛，noone的时间线被压缩成一个奇点。此前的事已无关紧要，后续的一切都将或多或少与此相关', symbol: '♡', triggerCopy: '绝望似狼，吞噬念想', triggerLabel: '正在经历：[创伤]', footer: 'HELP ME PLEASE' },
    christmas: { kicker: '是圣诞节限定博客皮肤', index: 'DECEMBER 24th', title: '欧耶今天是圣诞节', copy: '把一年中仍值得记住的文章放在常青枝叶与暖光之间，等待一个安静的冬夜被重新打开。', symbol: '✦', footer: '鸡公煲，鸡公煲，经过我的胃' },
    'spring-festival': { kicker: 'noone给您拜年啦', index: '岁次更新 // 万事胜意', title: '新春辞旧岁', copy: '以朱红、宣纸和金色印记迎接新一年的博客。愿技术有所进益，远行皆有回声。', symbol: '福', footer: '新春快乐' }
  };
  const springFestivalRanges = [
    ['2026-02-16', '2026-03-03'], ['2027-02-05', '2027-02-20'],
    ['2028-01-25', '2028-02-09'], ['2029-02-12', '2029-02-27'],
    ['2030-02-02', '2030-02-17'], ['2031-01-22', '2031-02-06'],
    ['2032-02-10', '2032-02-25'], ['2033-01-30', '2033-02-14'],
    ['2034-02-18', '2034-03-05'], ['2035-02-07', '2035-02-22']
  ];
  let renderVersion = 0;

  const escapeHTML = value => String(value == null ? '' : value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  const parseLocksmithDates = () => {
    try {
      return JSON.parse(document.querySelector('#home-season-locksmith-dates')?.textContent || '[]');
    } catch (error) {
      return [];
    }
  };

  const shanghaiDate = date => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date).reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  };

  const automaticTheme = date => {
    const day = shanghaiDate(date);
    if (parseLocksmithDates().includes(day)) return 'locksmith';
    if (springFestivalRanges.some(([start, end]) => day >= start && day <= end)) return 'spring-festival';
    if (['12-24', '12-25'].includes(day.slice(5))) return 'christmas';
    if (day.slice(5) >= '11-15' && day.slice(5) <= '11-30') return 'cho-10';
    return null;
  };

  const isHome = () => Boolean(window.CONFIG && CONFIG.page && CONFIG.page.isHome);
  const currentPage = () => Number(location.pathname.match(/\/page\/(\d+)\/?$/)?.[1] || 1);
  const dataURL = () => currentPage() === 1 ? '/home-season/data/index.json' : `/home-season/data/page/${currentPage()}.json`;

  const loadShellStyle = () => new Promise((resolve, reject) => {
    const existing = document.querySelector(`#${shellStyleId}`);
    if (existing) {
      if (existing.sheet) resolve();
      else existing.addEventListener('load', resolve, { once: true });
      return;
    }
    const link = document.createElement('link');
    link.id = shellStyleId;
    link.rel = 'stylesheet';
    link.href = '/home-season/home-season-skins.css';
    link.addEventListener('load', resolve, { once: true });
    link.addEventListener('error', reject, { once: true });
    document.head.append(link);
  });

  const removeShell = () => {
    document.querySelector('.home-season-shell')?.remove();
    document.querySelector(`#${shellStyleId}`)?.remove();
    document.body.classList.remove('home-season-shell-active', ...themes.map(theme => `skin-${theme}`));
  };

  const setOverride = theme => {
    if (theme === 'auto') sessionStorage.removeItem(overrideKey);
    else sessionStorage.setItem(overrideKey, theme);
    applyTheme();
  };

  const ensureDefaultSwitcher = override => {
    let switcher = document.querySelector('.home-season-switcher');
    if (!switcher) {
      switcher = document.createElement('aside');
      switcher.className = 'home-season-switcher';
      switcher.setAttribute('aria-label', '临时切换首页主题');
      switcher.setAttribute('aria-hidden', 'true');
      switcher.innerHTML = '<div class="home-season-switcher-menu" role="group" aria-label="选择临时主题"></div>';
      switcher.querySelector('.home-season-switcher-menu').innerHTML = ['auto', ...themes].map(theme => `<button type="button" data-home-theme="${theme}">${labels[theme]}</button>`).join('');
      document.body.append(switcher);
    }
    switcher.querySelectorAll('[data-home-theme]').forEach(button => {
      const active = override ? button.dataset.homeTheme === override : button.dataset.homeTheme === 'auto';
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  const paginationHTML = pagination => {
    const links = [];
    if (pagination.previous) links.push(`<a href="${escapeHTML(pagination.previous)}" aria-label="上一页">‹</a>`);
    links.push(`<span>${pagination.current} / ${pagination.total}</span>`);
    if (pagination.next) links.push(`<a href="${escapeHTML(pagination.next)}" aria-label="下一页">›</a>`);
    return `<nav class="season-pagination" aria-label="分页">${links.join('')}</nav>`;
  };

  const shellHTML = (theme, data) => {
    const skin = skinData[theme];
    const today = shanghaiDate(new Date());
    const heroPath = theme === 'locksmith'
      ? (data.triggers.locksmithByDate[today] || data.triggers.locksmithDefault)
      : theme === 'cho-10' ? data.triggers.cho : null;
    const heroTrigger = heroPath
      ? `<div class="season-trigger"><span>${escapeHTML(skin.triggerCopy)}</span><a href="${escapeHTML(heroPath)}">${escapeHTML(skin.triggerLabel)} <b aria-hidden="true">→</b></a></div>`
      : '';
    const posts = data.posts.map((post, index) => `
      <article class="post-card" data-record="REC-${String(index + 1).padStart(3, '0')}">
        <a class="post-card-main" href="${escapeHTML(post.path)}">
          <time datetime="${escapeHTML(post.date)}">${escapeHTML(post.date)}</time>
          <h3>${escapeHTML(post.title)}</h3>
          ${post.description ? `<p>${escapeHTML(post.description)}</p>` : ''}
        </a>
        <footer><span>${escapeHTML(post.category)}</span><i aria-hidden="true"></i><span>${post.tags} TAGS</span></footer>
      </article>`).join('');
    const themeButtons = ['auto', ...themes].map(item => `<button class="${item === theme ? 'is-active' : ''}" type="button" data-home-theme="${item}" aria-pressed="${item === theme}">${labels[item]}</button>`).join('');
    return `
      <div class="skin-atmosphere" aria-hidden="true"><div class="skin-moon"></div><div class="skin-particles"></div></div>
      <div class="theme-props" aria-hidden="true">
        <div class="locksmith-props"><i class="broken-door door-one"></i><i class="broken-door door-two"></i><i class="broken-door door-three"></i><span>THE HIGHER I RISE<br>THE MORE I SEE</span></div>
        <div class="cho-desktop-icons"><span><img src="/noip-afo/assets/memory/icon-1.png" alt="">noone</span><span><img src="/noip-afo/assets/memory/icon-5.png" alt="">JINE</span><span><img src="/noip-afo/assets/memory/folder-1.png" alt="">BLOG.LOG</span></div>
        <div class="christmas-garland"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="spring-couplets"><span>旧岁文章皆入卷</span><b>春</b><span>新年故事再开篇</span></div>
      </div>
      <aside class="skin-switcher" aria-label="主页皮肤切换"><span>SEASON MODE</span><div role="group">${themeButtons}</div></aside>
      <header class="demo-header"><a class="demo-brand" href="/"><small>${escapeHTML(skin.kicker)}</small><strong>${escapeHTML(data.site.title)}</strong><span>${escapeHTML(data.site.subtitle)}</span></a><nav aria-label="主导航"><a href="/">首页</a><a href="/archives/">归档</a><a href="/categories/">分类</a><a href="/tags/">标签</a><a href="/about/">关于</a></nav></header>
      <main class="demo-main">
        <section class="skin-hero"><div><span class="hero-index">${escapeHTML(skin.index)}</span><h1>${escapeHTML(skin.title)}</h1><p>${escapeHTML(skin.copy)}</p>${heroTrigger}</div><div class="hero-emblem" aria-hidden="true"><span>${escapeHTML(skin.symbol)}</span></div><div class="cho-window-controls" aria-hidden="true"><i>_</i><i>□</i><i>×</i></div><div class="christmas-postmark" aria-hidden="true">NORTH POLE<br>DEC 24</div></section>
        <section class="demo-dashboard" aria-label="博客概览"><div><b>${data.stats.posts}</b><span>文章</span></div><div><b>${data.stats.categories}</b><span>分类</span></div><div><b>${data.stats.tags}</b><span>标签</span></div><div><b>${data.stats.since}–${data.stats.currentYear}</b><span>记录期间</span></div></section>
        <section class="demo-feed"><header class="section-heading"><div><small>RECENT RECORDS</small><h2>最近文章</h2></div><a href="/archives/">查看全部</a></header><div class="post-list">${posts}</div>${paginationHTML(data.pagination)}</section>
        <aside class="theme-side-panel" aria-hidden="true"><div class="locksmith-index"><small>层叠秘史</small><b>I</b><b>II</b><b>III</b><b>IV</b><b>V</b><span>余下部分不可尽知</span></div><div class="cho-status-window"><header>STATUS.EXE <i>×</i></header><p>(Un)happy end World</p><dl><dt>SIGNAL</dt><dd>100%</dd><dt>MEMORY</dt><dd>FRAGMENTED</dd><dt>HEART</dt><dd>ONLINE</dd></dl></div><div class="christmas-mailbag"><small>DELIVERY STATUS</small><b>${data.stats.posts}</b><span>封记录等待投递</span></div><div class="spring-seal">${data.stats.currentYear}<br>新春<br>档案</div></aside>
      </main>
      <footer class="demo-footer">© ${data.stats.since}–${data.stats.currentYear} ${escapeHTML(data.site.author)} · ${escapeHTML(skin.footer)}</footer>`;
  };

  const buildParticles = (shell, theme) => {
    const container = shell.querySelector('.skin-particles');
    const count = theme === 'christmas' ? 42 : theme === 'spring-festival' ? 24 : 0;
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement('i');
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${-10 - Math.random() * 90}%`;
      particle.style.setProperty('--size', `${theme === 'christmas' ? 2 + Math.random() * 5 : 5 + Math.random() * 8}px`);
      particle.style.setProperty('--speed', `${6 + Math.random() * 9}s`);
      particle.style.setProperty('--delay', `${-Math.random() * 12}s`);
      particle.style.setProperty('--drift', `${-70 + Math.random() * 140}px`);
      container.append(particle);
    }
  };

  async function renderShell(theme, version) {
    const response = await fetch(dataURL(), { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Season data request failed: ${response.status}`);
    const data = await response.json();
    await loadShellStyle();
    if (version !== renderVersion) return;
    document.querySelector('.home-season-switcher')?.remove();
    document.querySelector('.home-season-shell')?.remove();
    const shell = document.createElement('div');
    shell.className = 'home-season-shell';
    shell.innerHTML = shellHTML(theme, data);
    document.body.append(shell);
    document.body.classList.remove(...themes.map(item => `skin-${item}`));
    document.body.classList.add('home-season-shell-active', `skin-${theme}`);
    buildParticles(shell, theme);
  }

  async function applyTheme() {
    const version = ++renderVersion;
    const home = isHome();
    const override = sessionStorage.getItem(overrideKey);
    const theme = home ? (themes.includes(override) ? override : automaticTheme(new Date())) : null;
    removeShell();
    document.querySelector('.home-season-switcher')?.remove();
    if (!home) return;
    if (!theme) {
      ensureDefaultSwitcher(override);
      return;
    }
    try {
      await renderShell(theme, version);
    } catch (error) {
      console.error(error);
      if (version === renderVersion) {
        removeShell();
        ensureDefaultSwitcher(override);
      }
    }
  }

  let switchSequenceIndex = 0;

  document.addEventListener('keydown', event => {
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
    switchSequenceIndex = event.code === switchSequence[switchSequenceIndex]
      ? switchSequenceIndex + 1
      : event.code === switchSequence[0] ? 1 : 0;
    if (switchSequenceIndex !== switchSequence.length) return;
    switchSequenceIndex = 0;
    const switcher = document.querySelector('.home-season-switcher');
    if (!switcher) return;
    const expanded = switcher.classList.toggle('is-open');
    switcher.setAttribute('aria-hidden', String(!expanded));
    event.preventDefault();
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-home-theme]');
    if (button) setOverride(button.dataset.homeTheme);
  });
  document.addEventListener('DOMContentLoaded', applyTheme);
  document.addEventListener('pjax:success', applyTheme);
})();
