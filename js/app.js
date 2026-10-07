/* ============================================================
   启航 · 网站导航  —  页面渲染 / 搜索 / 介绍弹窗 / 主题
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.NAV_CONFIG || { siteName: '启航', categories: [] };

  var ICON_COLORS = [
    ['#4D6BFE', '#7B9BFF'], ['#2E9BFF', '#68C4FF'], ['#6C5CE7', '#A29BFE'],
    ['#00B4A6', '#4FE0C8'], ['#F2994A', '#F7C06B'], ['#EB5757', '#FF8A80'],
    ['#0EA5E9', '#54C8F5'], ['#8B5CF6', '#C4A2FF'], ['#10B981', '#5FE0B0'],
    ['#F43F5E', '#FF8FA3']
  ];

  /* ---------- 工具函数 ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function domainOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }

  function firstChar(name) {
    /* 注意：不能用 \W 过滤，中文在 JS 正则里也属于 \W，会把整个名字吃掉 */
    var s = String(name).trim();
    return (s.charAt(0) || '?').toUpperCase();
  }

  function hashOf(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
    return h;
  }

  function openSite(url) { window.open(url, '_blank', 'noopener,noreferrer'); }

  /* 站点图标：直接画进传进来的元素里。
     要点：图标是异步加载的，所以先把名字首字当作占位显示出来，图片就绪后再替换掉。
     这里必须「直接操作目标元素」，不能先造一个临时元素再搬内容 ——
     临时元素上的 onload 回调只会往临时元素里塞图，搬过去的目标元素永远是空的。 */
  function paintIcon(box, site) {
    box.className = 'site-ico';
    box.textContent = '';
    box.removeAttribute('style');

    var pair = ICON_COLORS[hashOf(site.name) % ICON_COLORS.length];
    box.style.background = 'linear-gradient(135deg,' + pair[0] + ',' + pair[1] + ')';

    function placeholder() { box.textContent = firstChar(site.name); }

    if (site.emoji) { box.textContent = site.emoji; return box; }

    var host = domainOf(site.url);
    var chain = [];
    if (site.icon) chain.push(site.icon);                    // 数据里指定的优先
    if (host) {
      chain.push('assets/icons/' + host + '.png');           // 按域名命名的本地图标
      chain.push('https://www.google.com/s2/favicons?sz=128&domain=' + host);
      chain.push('https://icons.duckduckgo.com/ip3/' + host + '.ico');
    }

    placeholder();
    if (!chain.length) return box;

    /* 注意：这里不能写 img.loading = 'lazy'。
       图片在 onload 之前是游离在 DOM 之外的，浏览器没法判断它"在不在视口里"，
       于是懒加载可能永远不触发，图标就一直停在名字首字上。
       图标本身只有几十 KB，直接加载即可，也不需要超时兜底
       （超时反而会把已经加载好的状态覆盖回首字）。 */
    var idx = 0;
    var img = new Image();
    img.alt = '';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';

    img.onload = function () {
      box.textContent = '';
      box.appendChild(img);
      box.style.background = '#fff';
    };
    img.onerror = function () {
      idx++;
      if (idx < chain.length) img.src = chain[idx];
      else placeholder();
    };
    img.src = chain[0];
    return box;
    }

  /* 需要一个独立图标元素时用这个（卡片等） */
  function buildIcon(site) {
    return paintIcon(el('span', 'site-ico'), site);
  }

  /* 全部网站页（sites.js）也要用同一套图标逻辑 */
  window.paintIcon = paintIcon;

  /* ---------- 精选卡片 ---------- */
  function buildPickCard(site) {
    var card = el('article', 'pick-card');
    if (site.intro) card.classList.add('has-intro');

    var top = el('div', 'pick-top');
    top.appendChild(buildIcon(site));
    var title = el('div', 'pick-title');
    title.appendChild(el('h4', null, site.name));
    title.appendChild(el('p', 'pick-short', site.short || site.desc || domainOf(site.url)));
    top.appendChild(title);
    card.appendChild(top);

    var bottom = el('div', 'pick-bottom');
    bottom.appendChild(el('span', 'pick-host', site.url));

    var actions = el('div', 'pick-actions');
    if (site.intro) {
      var introBtn = el('button', 'pick-btn is-ghost');
      introBtn.type = 'button';
      introBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.4M12 7.8h.01"/></svg>介绍';
      introBtn.addEventListener('click', function (e) { e.preventDefault(); openIntro(site); });
      actions.appendChild(introBtn);
    }

    var go = el('a', 'pick-btn is-solid');
    go.href = site.url;
    go.target = '_blank';
    go.rel = 'noopener noreferrer';
    go.innerHTML = '直达<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h12M12 6l6 6-6 6"/></svg>';
    actions.appendChild(go);

    bottom.appendChild(actions);
    card.appendChild(bottom);
    return card;
  }

  /* ---------- 介绍弹窗 ---------- */
  var lastFocus = null;
  var shotList = [];      // 当前弹窗的截图列表
  var shotIndex = 0;
  var shotName = '';
  var shotMeta = '';

  /* 截图数据兼容两种写法：新的 shots 数组，或旧的单张 shot */
  function shotOf(site) {
    if (site.shots && site.shots.length) return site.shots;
    if (site.shot) return [{ src: site.shot, t: '官网首页' }];
    return [];
  }

  function paintShot() {
    var item = shotList[shotIndex];
    if (!item) return;
    var img = document.getElementById('modalImg');
    img.src = item.src;
    img.alt = shotName + ' 官网截图' + (item.t ? '：' + item.t : '');
    updateShotNav();
  }

  /* 页码与左右箭头：只有一张图时整体隐藏 */
  function updateShotNav() {
    var many = shotList.length > 1;
    var item = shotList[shotIndex] || {};

    var count = document.getElementById('shotCount');
    if (count) {
      count.hidden = !many;
      count.textContent = (shotIndex + 1) + ' / ' + shotList.length + (item.t ? ' · ' + item.t : '');
    }

    var prev = document.getElementById('shotPrev');
    var next = document.getElementById('shotNext');
    if (prev) prev.hidden = !many;
    if (next) next.hidden = !many;
  }

  function stepShot(n) {
    if (shotList.length < 2) return;
    shotIndex = (shotIndex + n + shotList.length) % shotList.length;
    paintShot();
  }

  function openIntro(site) {
    var mask = document.getElementById('introModal');
    if (!mask || !site.intro) return;
    var d = site.intro;

    shotName = site.name;
    shotList = shotOf(site);
    shotIndex = 0;
    shotMeta = site.shotUpdated ? '截图更新于 ' + site.shotUpdated : '';

    var shotBox = document.getElementById('modalShot');
    var metaEl = document.getElementById('shotMeta');

    if (shotList.length) {
      shotBox.hidden = false;
      paintShot();

      /* 标签写清截图来源与更新日期，避免访客看到过期信息 */
      metaEl.textContent = '官网截图 · 未登录状态' + (site.shotUpdated ? ' · 更新于 ' + site.shotUpdated : '');
    } else {
      shotBox.hidden = true;
    }

    /* 直接把图标画进弹窗里的这个元素（不要再造临时元素搬运，
       那样搬过来的只有文字占位，异步加载完成的图片会留在临时元素上） */
    paintIcon(document.getElementById('modalIcon'), site);

    document.getElementById('modalTitle').textContent = site.name;
    document.getElementById('modalTagline').textContent = d.tagline || '';

    var pros = document.getElementById('modalPros');
    var cons = document.getElementById('modalCons');
    pros.textContent = '';
    cons.textContent = '';
    (d.pros || []).forEach(function (t) { pros.appendChild(el('li', null, t)); });
    (d.cons || []).forEach(function (t) { cons.appendChild(el('li', null, t)); });

    var best = document.getElementById('modalBest');
    if (d.best) { best.hidden = false; best.textContent = '适合谁：' + d.best; }
    else best.hidden = true;

    var tips = document.getElementById('modalTips');
    if (d.tips) { tips.hidden = false; tips.textContent = d.tips; }
    else tips.hidden = true;

    document.getElementById('modalGo').href = site.url;
    document.getElementById('modalTopGo').href = site.url;
    document.getElementById('modalHost').textContent = domainOf(site.url);

    lastFocus = document.activeElement;
    mask.hidden = false;
    document.body.classList.add('modal-open');
    document.getElementById('modalClose').focus();
  }

  function closeIntro() {
    var mask = document.getElementById('introModal');
    if (!mask || mask.hidden) return;
    mask.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- 全屏看图 ---------- */
  function renderLightbox() {
    var item = shotList[shotIndex];
    if (!item) return;
    document.getElementById('lbImg').src = item.src;
    document.getElementById('lbCaption').textContent =
      shotName + (item.t ? ' · ' + item.t : '') + (shotMeta ? ' · ' + shotMeta : '');
    document.getElementById('lbCount').textContent = (shotIndex + 1) + ' / ' + shotList.length;
    var many = shotList.length > 1;
    document.getElementById('lbPrev').hidden = !many;
    document.getElementById('lbNext').hidden = !many;
  }

  function openLightbox(i) {
    var lb = document.getElementById('lightbox');
    if (!lb || !shotList.length) return;
    shotIndex = i;
    renderLightbox();
    lb.hidden = false;
    document.body.classList.add('modal-open');
    document.getElementById('lbClose').focus();
  }

  function closeLightbox() {
    var lb = document.getElementById('lightbox');
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    var intro = document.getElementById('introModal');
    if (intro && !intro.hidden) return;      // 弹窗还开着，滚动锁要留着
    document.body.classList.remove('modal-open');
  }

  function initLightbox() {
    var lb = document.getElementById('lightbox');
    if (!lb) return;

    function step(n) {
      if (shotList.length < 2) return;
      shotIndex = (shotIndex + n + shotList.length) % shotList.length;
      renderLightbox();
    }

    document.getElementById('lbClose').addEventListener('click', closeLightbox);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.getElementById('lbPrev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    document.getElementById('lbNext').addEventListener('click', function (e) { e.stopPropagation(); step(1); });

    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
  }

  function initModal() {
    var mask = document.getElementById('introModal');
    if (!mask) return;
    document.getElementById('modalClose').addEventListener('click', closeIntro);
    mask.addEventListener('click', function (e) { if (e.target === mask) closeIntro(); });
    document.addEventListener('keydown', function (e) {
      if (mask.hidden || e.key !== 'Escape') return;
      var lb = document.getElementById('lightbox');
      if (lb && !lb.hidden) return;          // 全屏看图优先处理 Esc
      closeIntro();
    });

    var main = document.getElementById('shotMain');
    if (main) main.addEventListener('click', function () { openLightbox(shotIndex); });

    var prev = document.getElementById('shotPrev');
    var next = document.getElementById('shotNext');
    if (prev) prev.addEventListener('click', function (e) { e.stopPropagation(); stepShot(-1); });
    if (next) next.addEventListener('click', function (e) { e.stopPropagation(); stepShot(1); });

    initLightbox();
  }

  /* ---------- 关于本站 ---------- */
  function initAbout() {
    var mask = document.getElementById('aboutModal');
    var btn = document.getElementById('aboutBtn');
    if (!mask || !btn) return;

    var data = CFG.about || {};

    function fill() {
      function set(id, txt) {
        var n = document.getElementById(id);
        if (n && txt) n.textContent = txt;
      }
      set('aboutTitle', data.title);
      set('aboutSub', data.subtitle);
      set('aboutLead', data.lead);
      set('aboutNote', data.note);

      var grid = document.getElementById('aboutGrid');
      if (grid) {
        grid.textContent = '';
        (data.items || []).forEach(function (it) {
          var box = el('div', 'about-item');
          box.appendChild(el('h4', null, it.t));
          box.appendChild(el('p', null, it.d));
          grid.appendChild(box);
        });
      }

      var tags = document.getElementById('aboutTags');
      if (tags) {
        tags.textContent = '';
        (data.tags || []).forEach(function (t) { tags.appendChild(el('span', null, t)); });
      }

      /* 署名行：data.credit 留空时整行隐藏 */
      var creditBox = document.getElementById('aboutCredit');
      var creditText = document.getElementById('aboutCreditText');
      if (creditBox && creditText) {
        if (data.credit) {
          creditText.textContent = data.credit;
          creditBox.hidden = false;
        } else {
          creditBox.hidden = true;
        }
      }

      var gh = document.getElementById('githubBtn');
      var ghText = document.getElementById('githubText');
      if (gh && ghText) {
        if (data.github) {
          gh.href = data.github;
          ghText.textContent = data.githubText || '在 GitHub 上查看源码';
        } else {
          gh.href = '#';
          gh.classList.add('is-pending');
          ghText.textContent = (data.githubText || '在 GitHub 上查看源码') + '（链接待补充）';
        }
      }

      var sp = document.getElementById('sponsorBtn');
      var spText = document.getElementById('sponsorText');
      if (sp && data.sponsor) sp.href = data.sponsor;
      if (spText && data.sponsorText) spText.textContent = data.sponsorText;
    }

    function close() {
      mask.hidden = true;
      document.body.classList.remove('modal-open');
      btn.focus();
    }

    function open() {
      fill();
      mask.hidden = false;
      document.body.classList.add('modal-open');
      var c = document.getElementById('aboutClose');
      if (c) c.focus();
    }

    btn.addEventListener('click', open);
    var closeBtn = document.getElementById('aboutClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mask.hidden) close();
    });

    var ghBtn = document.getElementById('githubBtn');
    if (ghBtn) {
      ghBtn.addEventListener('click', function (e) {
        if (!data.github) {
          e.preventDefault();
          if (window.showToast) window.showToast('GitHub 链接还没填，稍后补上');
        }
      });
    }
  }

  /* ---------- 渲染 ---------- */
  var ALL_SITES = [];

  /* 三档数据：
       tier 1 = 精选（主页展示，有截图和介绍）
       tier 2 = 完整索引（全部网站页 + 搜索，有图标和一句话）
       tier 3 = 只保留网址（仅搜索，无图标无介绍） */
  function collectSites() {
    ALL_SITES = [];
    (CFG.categories || []).forEach(function (cat) {
      (cat.sites || []).forEach(function (s) {
        ALL_SITES.push({ site: s, cat: cat, listed: true, tier: 1 });
      });
    });
    (CFG.index || []).forEach(function (s) {
      ALL_SITES.push({ site: s, cat: { name: s.cat || '其他' }, listed: false, tier: 2 });
    });
    (CFG.urls || []).forEach(function (s) {
      ALL_SITES.push({ site: s, cat: { name: '常见官网' }, listed: false, tier: 3, bare: true });
    });
  }

  function renderFeatured() {
    var section = document.getElementById('featured');
    var box = document.getElementById('featuredGrid');
    if (!section || !box) return;
    var nav = document.getElementById('navFeatured');
    var list = ALL_SITES.filter(function (x) { return x.site.featured; });
    if (!list.length) {
      section.hidden = true;
      if (nav) nav.hidden = true;
      return;
    }
    section.hidden = false;
    if (nav) nav.hidden = false;
    box.textContent = '';
    list.forEach(function (x) { box.appendChild(buildPickCard(x.site)); });
  }

  function renderCategories() {
    var box = document.getElementById('categoryList');
    if (!box) return;
    box.textContent = '';

    (CFG.categories || []).forEach(function (cat) {
      var sec = el('section', 'category');
      sec.id = 'cat-' + (cat.id || cat.name);

      var head = el('div', 'category-head');
      head.appendChild(el('span', 'cat-icon', cat.icon || '📁'));
      var titleBox = el('div');
      titleBox.appendChild(el('h3', null, cat.name));
      if (cat.desc) titleBox.appendChild(el('p', 'cat-desc', cat.desc));
      head.appendChild(titleBox);
      head.appendChild(el('span', 'cat-count', (cat.sites || []).length + ' 个'));
      sec.appendChild(head);

      /* 分类自带的额外入口（比如「显卡与驱动」里先做一次配置检测） */
      if (cat.tool && cat.tool.href) {
        var bar = el('a', 'cat-tool');
        bar.href = cat.tool.href;

        var ico = el('span', 'cat-tool-ico');
        ico.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3.5" y="5" width="17" height="11" rx="2"/><path d="M8 20h8M12 16v4"/></svg>';
        bar.appendChild(ico);

        var barTxt = el('div', 'cat-tool-txt');
        barTxt.appendChild(el('b', null, cat.tool.label));
        if (cat.tool.note) barTxt.appendChild(el('small', null, cat.tool.note));
        bar.appendChild(barTxt);

        bar.appendChild(el('span', 'cat-tool-go', '去检测 →'));
        sec.appendChild(bar);
      }

      var grid = el('div', 'pick-grid');
      (cat.sites || []).forEach(function (s) { grid.appendChild(buildPickCard(s)); });
      sec.appendChild(grid);
      box.appendChild(sec);
    });

    if (CFG.notice) {
      var note = el('div', 'notice');
      note.innerHTML = '<span class="notice-dot"></span>' + CFG.notice;
      box.appendChild(note);
    }
  }

  function renderChips() {
    var box = document.getElementById('quickChips');
    if (!box) return;
    box.textContent = '';

    var cats = (CFG.categories || []).filter(function (c) { return (c.sites || []).length; });
    cats.forEach(function (cat) {
      var b = el('button', 'chip');
      b.type = 'button';
      b.textContent = (cat.icon || '') + ' ' + cat.name;
      b.addEventListener('click', function () {
        var target = document.getElementById('cat-' + (cat.id || cat.name));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      box.appendChild(b);
    });

    var hint = el('span', 'chip-hint', '按 / 可以快速搜索');
    box.appendChild(hint);
  }

  function renderBrand() {
    var nameEl = document.getElementById('brandName');
    if (nameEl && CFG.siteName) nameEl.textContent = CFG.siteName;
    var subEl = document.querySelector('.brand-text small');
    if (subEl && CFG.subtitle) subEl.textContent = CFG.subtitle;
    var foot = document.getElementById('footerText');
    if (foot && CFG.tip) foot.textContent = CFG.tip;
    if (CFG.siteName) document.title = CFG.siteName + ' · ' + (CFG.subtitle || '网站导航');
  }

  /* ---------- 搜索 ----------
     支持空格分隔的多个关键词（每个词都要命中才算匹配）。
     命中优先级：名称完全一致 > 名称前缀 > 名称包含 > 关键词 > 分类 > 说明 > 域名。
     关键词（key）是特意留的语义入口，比如给网盘类站点写「网盘 云盘 存文件」，
     用户搜「网盘」就能一次把百度网盘、阿里云盘、夸克网盘、迅雷都带出来。 */
  function score(entry, q) {
    var s = entry.site;
    var name = (s.name || '').toLowerCase();
    var desc = (s.desc || s.short || '').toLowerCase();
    var key = (s.key || '').toLowerCase();
    var cat = ((entry.cat && entry.cat.name) || s.cat || '').toLowerCase();
    var url = (s.url || '').toLowerCase();

    var qs = String(q).split(/\s+/).filter(function (x) { return x; });
    if (!qs.length) return 0;

    var total = 0;
    for (var k = 0; k < qs.length; k++) {
      var t = qs[k];
      var n = 0;

      if (name === t) n = 120;
      else if (name.indexOf(t) === 0) n = 100;
      else if (name.indexOf(t) > -1) n = 80;
      else if (key.indexOf(t) > -1) n = 62;
      else if (cat.indexOf(t) > -1) n = 46;
      else if (desc.indexOf(t) > -1) n = 36;
      else if (url.indexOf(t) > -1) n = 26;
      else {
        /* 名称逐字命中，比如搜「盘」能带出「百度网盘」 */
        var hit = 0;
        for (var i = 0; i < t.length; i++) if (name.indexOf(t[i]) > -1) hit++;
        if (hit === t.length && t.length > 1) n = 18;
      }

      if (!n) return 0;                  // 有任意一个词没命中，整体不算
      total += n;
    }

    total = Math.round(total / qs.length); // 按词数取平均，避免长词条虚高
    if (entry.listed) total += 10;
    if (s.featured) total += 6;
    if (entry.tier === 3) total -= 4;      // 只留网址的排在有资料的后面
    return total;
  }

  function initSearch() {
    var input = document.getElementById('searchInput');
    var panel = document.getElementById('searchPanel');
    var clearBtn = document.getElementById('searchClear');
    var form = document.getElementById('searchForm');
    if (!input || !panel) return;

    var results = [];
    var cursor = -1;

    function isUrl(t) {
      return /^(https?:\/\/|www\.)[^\s]+$/i.test(t) || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t);
    }

    function search(qRaw) {
      var q = qRaw.trim().toLowerCase();
      var out = [];

      /* 还没输入内容时，先把精选分类里的站点列出来，方便直接点 */
      if (!q) {
        ALL_SITES.filter(function (x) { return x.listed; }).slice(0, 8).forEach(function (x) {
          out.push({
            site: x.site,
            cat: x.cat,
            listed: true,
            url: x.site.url
          });
        });
        return out;
      }

      if (isUrl(qRaw.trim())) {
        var u = qRaw.trim();
        if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
        out.push({ url: u, site: { name: u.replace(/^https?:\/\//, '').replace(/\/$/, ''), short: '直接打开这个网址', url: u } });
      }

      ALL_SITES.map(function (entry) { return { entry: entry, n: score(entry, q) }; })
        .filter(function (x) { return x.n > 0; })
        .sort(function (a, b) {
          /* 相关度相同时按拼音排序 */
          return b.n - a.n || a.entry.site.name.localeCompare(b.entry.site.name, 'zh-CN');
        })
        .slice(0, 8)
        .forEach(function (x) {
          out.push({
            site: x.entry.site,
            cat: x.entry.cat,
            listed: x.entry.listed,
            bare: x.entry.bare,
            url: x.entry.site.url
          });
        });

      return out;
    }

    function renderList(q) {
      results = search(q);
      cursor = -1;
      panel.textContent = '';

      if (!results.length) {
        panel.appendChild(el('div', 'search-empty', '没找到，换个名字或关键词试试（比如「网盘」「听歌」）'));
        panel.hidden = false;
        return;
      }

      results.forEach(function (r, i) {
        var bare = !!r.bare;
        var a = el('a', 'search-item' + (bare ? ' is-bare' : ''));
        a.href = r.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.dataset.idx = i;

        /* 第三档只保留网址，不配图标 */
        if (!bare) a.appendChild(buildIcon(r.site));

        var txt = el('div', 'site-text');
        txt.appendChild(el('div', 'si-name', r.site.name));
        var sub = r.site.short || r.site.desc;
        txt.appendChild(el('div', 'site-desc', sub || domainOf(r.url)));
        if (!bare) txt.appendChild(el('div', 'si-url', r.url));
        a.appendChild(txt);

        if (bare) a.appendChild(el('span', 'si-cat', '仅网址'));
        else if (r.cat && r.cat.name) a.appendChild(el('span', 'si-cat', r.cat.name));
        panel.appendChild(a);
      });
      panel.hidden = false;
    }

    function highlight(dir) {
      var items = panel.querySelectorAll('.search-item');
      if (!items.length) return;
      cursor = (cursor + dir + items.length) % items.length;
      for (var i = 0; i < items.length; i++) items[i].classList.toggle('is-on', i === cursor);
      items[cursor].scrollIntoView({ block: 'nearest' });
    }

    function close() { panel.hidden = true; cursor = -1; }

    input.addEventListener('input', function () {
      clearBtn.hidden = !input.value;
      renderList(input.value);
    });

    /* 只要重新点回搜索框，即使还没输入，也直接给出结果 */
    input.addEventListener('focus', function () {
      renderList(input.value);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(-1); }
      else if (e.key === 'Escape') { close(); input.blur(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (cursor > -1 && results[cursor]) { openSite(results[cursor].url); close(); }
        else if (results.length) { openSite(results[0].url); close(); }
        else if (isUrl(input.value)) {
          var u = input.value.trim();
          if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
          openSite(u);
        }
      }
    });

    form.addEventListener('submit', function (e) { e.preventDefault(); });

    clearBtn.addEventListener('click', function () {
      input.value = '';
      clearBtn.hidden = true;
      close();
      input.focus();
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-wrap')) close();
    });

    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  /* ---------- 主题 ---------- */
  function initTheme() {
    var KEY = 'navhub.theme';
    var btn = document.getElementById('themeBtn');
    var root = document.documentElement;

    function apply(t, animate) {
      if (animate) {
        root.classList.add('theming');
        window.setTimeout(function () { root.classList.remove('theming'); }, 320);
      }
      root.setAttribute('data-theme', t);
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', t === 'dark' ? '#0B0F1A' : '#4D6BFE');
    }

    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { }
    apply(saved === 'dark' ? 'dark' : 'light', false);

    if (btn) {
      btn.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        apply(next, true);
        try { localStorage.setItem(KEY, next); } catch (e) { }
      });
    }
  }

  /* ---------- 提示 ---------- */
  var toastTimer = null;
  window.showToast = function (msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add('is-show'); });
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      t.classList.remove('is-show');
      window.setTimeout(function () { t.hidden = true; }, 260);
    }, 2000);
  };

  /* 搜索框下方「全部网站」按钮上的收录数量（只算前两档，第三档仅在搜索里出现） */
  function paintAllEntry() {
    var num = document.getElementById('allEntryNum');
    if (!num) return;
    var pick = 0;
    (CFG.categories || []).forEach(function (c) { pick += (c.sites || []).length; });
    num.textContent = pick + (CFG.index || []).length;
  }

  /* ---------- 启动 ---------- */
  function boot() {
    initTheme();
    renderBrand();
    collectSites();
    renderFeatured();
    renderCategories();
    renderChips();
    paintAllEntry();
    initSearch();
    initModal();
    initAbout();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
