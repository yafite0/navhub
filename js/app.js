/* ============================================================
   启航 · 网站导航  —  页面渲染 / 搜索 / 介绍弹窗 / 主题
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.NAV_CONFIG || { siteName: '启航', groups: [], categories: [] };

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

  /* 移动端对 window.open 的拦截比桌面严，统一交给 seek.js ——
     被拦下来时它会退化成当前页跳转，至少能打开，不会点了没反应 */
  function openSite(url) {
    if (window.Seek) Seek.open(url);
    else window.open(url, '_blank', 'noopener,noreferrer');
  }

  /* ============================================================
     图标加载：排队 + 进视口才抓
     ------------------------------------------------------------
     「其他网页」页有 100 个站点，本地 assets/icons 只覆盖八成，
     剩下十几个要往外网抓。手机浏览器的并发数很少（同一域名大约 6 个），
     一股脑全发出去会互相抢、还可能撞上限卡在超时上 ——
     表现就是「图标半天不出来、页面发飘」。所以外网请求排个队，
     一次最多 3 个。
     ============================================================ */
  var ICON_REMOTE_MAX = 3;

  var ICON_QUEUE = (function () {
    var running = 0, wait = [];
    function next() {
      while (running < ICON_REMOTE_MAX && wait.length) {
        running++;
        (wait.shift())(function () { running--; next(); });
      }
    }
    return { push: function (task) { wait.push(task); next(); } };
  })();

  /* 图标是**先离屏加载、成功后再插进 DOM** 的，所以 img.loading='lazy'
     对它完全无效 —— 浏览器判断不了一个还没入 DOM 的图在不在视口里，
     懒加载可能永远不触发、图标就一直停在名字首字上。
     改成盯住那个占位盒子：进了视口（再往外放 300px）才开始抓。 */
  var ICON_EYE = window.IntersectionObserver ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      ICON_EYE.unobserve(e.target);
      var go = e.target.__iconGo;
      e.target.__iconGo = null;
      if (go) go();
    });
  }, { rootMargin: '300px' }) : null;

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

    /* 真正的抓取从这里开始。链条上每一环失败了才试下一环；
       外网那两环走 ICON_QUEUE 排队，本地那个直接发。 */
    function start() {
      var idx = 0;

      function tryOne() {
        if (idx >= chain.length) { placeholder(); return; }
        var src = chain[idx++];
        var remote = /^https?:/i.test(src);

        var img = new Image();
        img.alt = '';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.className = 'site-ico-img';
        /* 属性上先写死 1:1，再由 CSS 拉满盒子 ——
           不占位的话，图从无到有那一下会把这一行顶一顶，列表长了就是满屏抖 */
        img.width = 1;
        img.height = 1;

        function ok() {
          box.textContent = '';
          box.appendChild(img);
          box.style.background = '#fff';
        }

        img.onload = ok;
        img.onerror = tryOne;

        if (remote) {
          ICON_QUEUE.push(function (done) {
            img.onload = function () { done(); ok(); };
            img.onerror = function () { done(); tryOne(); };
            img.src = src;
          });
        } else {
          img.src = src;
        }
      }

      tryOne();
    }

    /* 进了视口才开始抓。没有 IntersectionObserver 的老浏览器直接抓。

       注意这里必须**等盒子真的进了文档**再 observe ——
       调用方是「paintIcon 拿到盒子 → 自己 append 到列表里」，
       直接在 paintIcon 里 observe 的话，观察的是一个游离节点，
       永远等不到 isIntersecting（实测：出图 0/101，全卡在首字上）。 */
    if (ICON_EYE) {
      box.__iconGo = start;
      (function arm(tries) {
        if (!box.__iconGo) return;
        if (box.isConnected) { ICON_EYE.observe(box); return; }
        if (tries > 60) { box.__iconGo = null; start(); return; }   /* 1.2s 还没插进来就别等了 */
        window.setTimeout(function () { arm(tries + 1); }, 20);
      })(0);
      /* 兜底：万一一直没进视口（被折叠、被隐藏），也别永远停在首字上 */
      window.setTimeout(function () {
        if (box.__iconGo) { box.__iconGo = null; start(); }
      }, 5000);
    } else {
      start();
    }

    return box;
  }

  /* 需要一个独立图标元素时用这个（卡片等） */
  function buildIcon(site) {
    return paintIcon(el('span', 'site-ico'), site);
  }

  /* 全部网站页（sites.js）也要用同一套图标逻辑和介绍弹窗。
     sites.html 同样引了这个文件，所以这里挂到 window 上就能直接用。 */
  window.paintIcon = paintIcon;

  /* ---------- 精选卡片 ---------- */
  function buildPickCard(site) {
    var card = el('article', 'pick-card');
    if (site.intro) card.classList.add('has-intro');

    var top = el('div', 'pick-top');
    top.appendChild(buildIcon(site));
    var title = el('div', 'pick-title');
    var h4 = el('h4');
    h4.appendChild(document.createTextNode(site.name));
    /* 别名跟在名字后面：Unreal Engine（UE、虚幻引擎） */
    if (site.alias && site.alias.length) {
      h4.appendChild(el('span', 'name-alias', '（' + site.alias.slice(0, 2).join('、') + '）'));
    }
    title.appendChild(h4);
    title.appendChild(el('p', 'pick-short', site.short || site.desc || domainOf(site.url)));
    top.appendChild(title);
    card.appendChild(top);

    var bottom = el('div', 'pick-bottom');
    var host = el('span', 'pick-host', site.url);
    host.title = site.url;          // 截断后用悬停提示补全
    bottom.appendChild(host);

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

  /* 「其他网页」页的卡片上也有一个「介绍」按钮，走的是同一个弹窗 */
  window.openIntro = openIntro;

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

  /* 首屏底部的「常去」条 —— 横向滚动的一排应用胶囊。
     数据还是精选里标了 featured 的那些，只是从卡片换成紧凑的胶囊：
     点一下直接在新标签打开。带「介绍」弹窗的卡片式样留在下面分类里，
     那边信息更全，这里只负责「一眼扫过去、直接点」。 */
  /* 首屏底部那条「精选」的候选池。
     data.js 里标了 featured 的优先；一条都没标就每个分类挑第一个 ——
     不然整条是空的，搜索块底下会空一大块。
     以后想固定几个常去的，给那些站点加 featured: true 就行。 */
  function featuredPool() {
    var marked = ALL_SITES.filter(function (x) { return x.site.featured; })
      .map(function (x) { return x.site; });
    if (marked.length) return marked;

    var out = [];
    (CFG.categories || []).forEach(function (cat) {
      var s = (cat.sites || [])[0];
      if (s) out.push(s);
    });
    return out;
  }

  /* 首屏底部的「精选」条 —— 横向滚动的一排应用胶囊。
     点一下直接在新标签打开；带「介绍」弹窗的卡片式样留在下面分类里，
     那边信息更全，这里只负责「一眼扫过去、直接点」。 */
  function renderFeatured() {
    var row = document.getElementById('featured');
    var box = document.getElementById('featuredGrid');
    if (!row || !box) return;

    var list = featuredPool();
    if (!list.length) { row.hidden = true; return; }
    row.hidden = false;

    /* 顶栏那个「常用直达」只在 data.js 里真标了 featured 时才露出来 ——
       兜底池是自动凑的，不能拿它去改动顶栏（顶栏照旧保持原样）。 */
    var nav = document.getElementById('navFeatured');
    if (nav) nav.hidden = !ALL_SITES.some(function (x) { return x.site.featured; });

    box.textContent = '';
    list.forEach(function (s) {
      var a = el('a', 'app');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = s.name + '：' + (s.short || s.desc || domainOf(s.url));
      a.appendChild(buildIcon(s));
      a.appendChild(el('span', null, s.name));
      box.appendChild(a);
    });
  }

  /* 首屏「预设」块里的一排入口：网页翻译 + 六大类提示词。
     点了直接去「提示词助手」页对应那一条（锚点和左边导航是同一套）。 */
  function renderPresetChips() {
    var box = document.getElementById('presetChips');
    if (!box || !CFG.prompts) return;
    var D = CFG.prompts;

    box.textContent = '';
    (D.tools || []).forEach(function (t, ti) {
      var a = el('a', 'pw-chip');
      a.href = 'translate.html#pm-tool-' + ti;
      a.appendChild(el('span', 'pw-chip-ico', t.icon || '🧰'));
      a.appendChild(el('span', null, t.name));
      box.appendChild(a);
    });
    (D.groups || []).forEach(function (g, gi) {
      if (!(g.items || []).length) return;
      var a = el('a', 'pw-chip');
      a.href = 'translate.html#pm-' + gi + '-0';
      a.appendChild(el('span', 'pw-chip-ico', g.icon || '📁'));
      a.appendChild(el('span', null, g.name));
      box.appendChild(a);
    });
  }

  /* 把 categories 按 group 字段归到大类下。
     没写 group 的分类会自己单独成一组（标题就用分类名），
     这样以后往 data.js 里塞一条扁平分类也不会崩。 */
  function buildGroups() {
    var out = [];
    var byId = {};

    (CFG.groups || []).forEach(function (g) {
      var gid = g.id || g.name;
      if (byId[gid]) return;
      var item = {
        id: gid,
        name: g.name,
        icon: g.icon || '📁',
        desc: g.desc || '',
        cats: []
      };
      out.push(item);
      byId[gid] = item;
    });

    (CFG.categories || []).forEach(function (cat) {
      if (!(cat.sites || []).length) return;
      var gid = cat.group || '';
      var bucket = byId[gid];

      if (!bucket) {
        bucket = {
          id: gid || ('solo-' + (cat.id || cat.name)),
          name: gid || cat.name,
          icon: cat.icon || '📁',
          desc: '',
          cats: []
        };
        out.push(bucket);
        byId[bucket.id] = bucket;
      }
      bucket.cats.push(cat);
    });

    return out.filter(function (g) { return g.cats.length; });
  }

  /* 单个小类：标题 + 数量 + 「更多」+ 卡片网格。
     - 默认收起：点标题才展开卡片，免得一屏塞满
     - solo 表示它是所在大类下的唯一分类（如「显卡与驱动」），
       这种不折、也省掉标题，免得和上面的大类标题重复 */
  function buildCategory(cat, solo) {
    var sec = el('section', 'category');
    sec.id = 'cat-' + (cat.id || cat.name);

    if (solo) sec.classList.add('is-solo');
    else sec.classList.add('is-collapsed');

    var body = el('div', 'cat-body');

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
      body.appendChild(bar);
    }

    var grid = el('div', 'pick-grid');
    (cat.sites || []).forEach(function (s) { grid.appendChild(buildPickCard(s)); });
    body.appendChild(grid);

    if (!solo) {
      /* 标题行 = 一个展开/收起的按钮 + 一个独立的「更多」链接。
         两者不能嵌套（按钮里放不了链接），所以并排放在外面。 */
      var head = el('div', 'category-head');

      var headBtn = el('button', 'cat-head-btn');
      headBtn.type = 'button';
      headBtn.setAttribute('aria-expanded', 'false');
      headBtn.appendChild(el('span', 'cat-icon', cat.icon || '📁'));

      var titleBox = el('div');
      titleBox.appendChild(el('h4', null, cat.name));
      if (cat.desc) titleBox.appendChild(el('p', 'cat-desc', cat.desc));
      headBtn.appendChild(titleBox);

      headBtn.appendChild(el('span', 'cat-count', (cat.sites || []).length + ' 个'));

      var toggle = el('span', 'cat-toggle');
      toggle.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5 12 15.5l6-6"/></svg>';
      headBtn.appendChild(toggle);

      headBtn.addEventListener('click', function () {
        var open = sec.classList.toggle('is-collapsed') === false;
        headBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      head.appendChild(headBtn);

      /* 主页每个小类只挑了几个最值得收藏的，这里给一个出口，
         免得访客以为「就这些了」。点进去是「其他网页」页并直接筛到该分类。 */
      var more = el('a', 'cat-more');
      more.href = 'sites.html?cat=' + encodeURIComponent(cat.id || cat.name);
      more.title = '主页只挑了其中最值得收藏的几个，点这里看「' + cat.name + '」的完整列表';
      more.appendChild(document.createTextNode('更多'));
      more.appendChild(el('span', 'cat-more-arrow', '→'));
      head.appendChild(more);

      sec.appendChild(head);
    }

    sec.appendChild(body);
    return sec;
  }

  function renderCategories() {
    var box = document.getElementById('categoryList');
    if (!box) return;
    box.textContent = '';

    buildGroups().forEach(function (grp) {
      var wrap = el('section', 'group');
      wrap.id = 'grp-' + grp.id;

      /* 大类默认折叠 —— 站点一多，全展开能把主页拉得很长 */
      wrap.classList.add('is-collapsed');

      var gHead = el('button', 'group-head');
      gHead.type = 'button';
      gHead.setAttribute('aria-expanded', 'false');
      gHead.appendChild(el('span', 'group-icon', grp.icon));

      var gTitle = el('div', 'group-title');
      gTitle.appendChild(el('h3', null, grp.name));
      if (grp.desc) gTitle.appendChild(el('p', 'group-desc', grp.desc));
      gHead.appendChild(gTitle);

      var total = grp.cats.reduce(function (n, c) { return n + (c.sites || []).length; }, 0);
      gHead.appendChild(el('span', 'group-count',
        grp.cats.length > 1 ? (grp.cats.length + ' 个小类 · ' + total + ' 个') : (total + ' 个')));

      var toggle = el('span', 'group-toggle');
      toggle.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5 12 15.5l6-6"/></svg>';
      gHead.appendChild(toggle);

      gHead.addEventListener('click', function () {
        var open = wrap.classList.toggle('is-collapsed') === false;
        gHead.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      wrap.appendChild(gHead);

      var body = el('div', 'group-body');
      grp.cats.forEach(function (cat) { body.appendChild(buildCategory(cat, grp.cats.length === 1)); });
      wrap.appendChild(body);

      /* 不记展开状态：每次进页面都是全部收起来的，页面干净。
         想改回「记住上次展开的那个」，用 localStorage 存 grp.id 即可。 */

      box.appendChild(wrap);
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

    /* 快捷词只放大类，免得小类一多就排成一大片 */
    buildGroups().forEach(function (grp) {
      var b = el('button', 'chip');
      b.type = 'button';
      b.textContent = (grp.icon || '') + ' ' + grp.name;
      b.addEventListener('click', function () {
        var target = document.getElementById('grp-' + grp.id);
        if (!target) return;
        /* 折叠着的话先展开再滚，否则滚过去是一片空白 */
        if (target.classList.contains('is-collapsed')) {
          var head = target.querySelector('.group-head');
          if (head) head.click();
        }
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      box.appendChild(b);
    });

    var hint = el('span', 'chip-hint', '按 / 可以快速搜索');
    box.appendChild(hint);
  }

  function renderBrand() {
    var nameEl = document.getElementById('brandName');
    if (nameEl && CFG.siteName) nameEl.textContent = CFG.siteName;
    /* 顶栏标题下面那块是固定的制作信息（写死在 HTML 里），
       不要再用 CFG.subtitle 覆盖它 —— 一覆盖三行说明就没了。 */
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
    var alias = (s.alias || []).join(' ').toLowerCase();
    var desc = (s.desc || s.short || '').toLowerCase();
    var key = (s.key || '').toLowerCase();
    var cat = ((entry.cat && entry.cat.name) || s.cat || '').toLowerCase();
    var url = (s.url || '').toLowerCase();

    var qs = String(q).split(/\s+/).filter(function (x) { return x; });
    if (!qs.length) return 0;

    /* 名字的拼音（全拼 + 首字母）。
       搜「爱」要能带出拼音域名带 ai 的站，搜「ai」也要能带出「爱奇艺」——
       中文和字母之间只能靠这层转换搭桥。 */
    var py = window.PinyinLite;
    var namePy = py ? py.toPinyin(name) : '';
    var nameIni = py ? py.toInitials(name) : '';

    var total = 0;
    for (var k = 0; k < qs.length; k++) {
      var t = qs[k];
      var n = 0;

      /* 别名精确命中要压过「名字里恰好包含」，否则搜「PS」会被 DeepSeek
         （deePS eek 里真的含 ps）顶到前面去。 */
      var aliasExact = alias.split(' ').indexOf(t) > -1;

      if (name === t) n = 120;
      else if (aliasExact) n = 116;
      else if (name.indexOf(t) === 0) n = 100;
      else if (name.indexOf(t) > -1) n = 80;
      else if (alias.indexOf(t) > -1) n = 72;
      else if (key.indexOf(t) > -1) n = 62;
      else if (cat.indexOf(t) > -1) n = 46;
      else if (desc.indexOf(t) > -1) n = 36;
      else if (url.indexOf(t) > -1) n = 26;
      /* ---- 拼音匹配 ----
         放在逐字命中前面：拼音是「真的对上了读音」，比碰巧含一个字更可信。 */
      else if (namePy && namePy.indexOf(t) === 0) n = 58;
      else if (nameIni && nameIni === t) n = 54;
      else if (namePy && namePy.indexOf(t) > -1) n = 48;
      else if (url && /[\u4e00-\u9fa5]/.test(t) && (function () {
        /* 中文查询 → 拼音 → 去匹配拼音域名。
           搜「爱」时 iqiyi / aiqiyi 这种才算命中。 */
        var tp = py ? py.toPinyin(t) : '';
        return tp && tp !== t && url.indexOf(tp) > -1;
      })()) n = 26;

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
    var goBtn = document.getElementById('searchGo');
    var form = document.getElementById('searchForm');
    if (!input || !panel) return;

    /* 输入框的提示语：要说清「没收录的也能搜」这件事。
       很多人以为这只是个站内目录，看到没有对应条目就退出去了。 */
    /* 原来的「如果没有对应网站，也能进行纯净搜索！」20 个字，
       放大字号之后搜索框里放不下会被截断，精简成 8 个字。 */
    input.placeholder = '输入网址或关键词';

    /* 框里空着就把「搜索」按钮灰掉、禁掉。
       亮着的蓝色按钮按下去什么也不会发生（go() 第一句就 return 了），
       比灰着更让人困惑：会以为是自己哪里点错了。 */
    function syncGo() { if (goBtn) goBtn.disabled = !input.value.trim(); }
    syncGo();

    /* 网址判断和搜索引擎都统一走 js/seek.js，别再各写一套标准 */
    function isUrl(t) { return window.Seek ? Seek.isUrl(t) : false; }

    /* 用户直接粘了个网址时，看这个域名我们收没收录。
       收录了就给对应卡片（点它才跳官网）；没收录就不自己给跳转 ——
       我们只对自己核对过的地址负责，剩下的交给搜索引擎。 */
    function findByHost(raw) {
      var host = window.Seek ? Seek.hostOf(Seek.normalize(raw)) : '';
      if (!host) return null;
      for (var i = 0; i < ALL_SITES.length; i++) {
        if (Seek.hostOf(ALL_SITES[i].site.url) === host) return ALL_SITES[i];
      }
      return null;
    }

    function search(qRaw) {
      var raw = String(qRaw == null ? '' : qRaw).trim();
      var q = raw.toLowerCase();
      var out = [];

      /* 还没输入内容时，先把精选分类里的站点列出来，方便直接点 */
      /* 还没输入时，列几个「常用工具类的官网」（解压、剪辑、图像处理这些）——
         不是本站自己的小工具：那些是「搜索到才能用」的东西，
         顶到推荐位会让人以为这就是导航的全部内容。

         全部标 noRank：用户一个字都没打，哪来的「匹配度高」？
         第一候选那种深色底只应该在真的匹配上时出现。 */
      if (!q) {
        var TOOLISH = /压缩|解压|剪辑|图像|处理|转换|工具/;
        ALL_SITES.filter(function (x) {
          return x.cat && TOOLISH.test(x.cat.name || '') && !x.bare;
        }).slice(0, 6).forEach(function (x) {
          out.push({
            site: x.site,
            cat: x.cat,
            listed: x.listed,
            url: x.site.url,
            noRank: true
          });
        });
        return out;
      }

      if (isUrl(raw)) {
        /* 网址：只可能是「我们收录了 → 给卡片」或「没收录 → 什么都不给」 */
        var hit = findByHost(raw);
        if (hit) {
          out.push({
            site: hit.site,
            cat: hit.cat,
            listed: hit.listed,
            bare: hit.bare,
            url: hit.site.url
          });
        }
      } else {
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
              url: x.entry.site.url,
              /* 带出相关度：列表里按它分三档亮度 */
              score: x.n
            });
          });
      }

      /* 面板里只放「点得开」的站内结果。
         搜索本身固定走必应（回车 / 点「搜索」），不再往列表里插引擎入口 ——
         那一条和「点条目就是前往官网」是两套动作，摆在一起只会让人分不清。 */
      return out;
    }

    /* 面板是绝对定位的，默认会一路盖到下面的「预设 / 工具」上面去。
       这里按「面板顶边 → 搜索块底边」算出还剩多少地方，超出就在面板里滚 ——
       保证它永远不越出搜索块，也就不可能挡住那两块。 */
    function fitPanel() {
      var top = panel.getBoundingClientRect().top;

      /* 简约档案 + 宽屏：fixed 定位，按视口实算
         （fixed 是为了躲开 #top 的 overflow: hidden ——
          absolute 时超出 #top 底边的部分会被裁掉，屏幕越矮裁得越狠） */
      var theme = document.documentElement.getAttribute('data-theme');
      var narrow = window.matchMedia('(max-width: 600px)').matches;

      var wrap = document.querySelector('.hero-block .search-wrap');

      /* 调试痕迹：把这次判断的三个依据记在 dataset 上。
         诊断页(diag.html)会读它 —— 这样能确认「执行那一刻」条件是什么，
         而不是事后从外部推测。 */
      panel.dataset.fitTheme = String(theme);
      panel.dataset.fitNarrow = String(narrow);
      panel.dataset.fitWrap = String(!!wrap);
      panel.dataset.fitAt = String(Date.now()).slice(-6);

      if (theme === 'c' && !narrow && wrap) {
        panel.dataset.fitBranch = 'new';
        var wr = wrap.getBoundingClientRect();
        var pt = wr.bottom + 10;                    /* 接在搜索框底下 */
        var ph = window.innerHeight - pt - 24;      /* 到视口底部，留 24px */

        /* fixed 的基准是视口，所以直接用 rect 的视口坐标即可 */
        panel.style.position = 'fixed';
        panel.style.left = Math.round(wr.left) + 'px';
        panel.style.right = 'auto';
        panel.style.top = Math.round(pt) + 'px';
        panel.style.width = Math.round(wr.width) + 'px';
        panel.style.height = Math.max(120, Math.round(ph)) + "px";
        panel.style.maxHeight = '';
        return;
      }

      /* 其他情况（原版 / 工业 / 手机）：恢复 absolute，走原来的算法 */
      panel.dataset.fitBranch = 'old';
      panel.style.position = '';
      panel.style.left = '';
      panel.style.right = '';
      panel.style.top = '';
      panel.style.width = '';

      var block = document.querySelector('.hero-block');
      if (!block) return;
      var room = block.getBoundingClientRect().bottom - top - 14;
      panel.style.maxHeight = Math.max(150, Math.round(room)) + 'px';
      panel.style.height = '';
    }
    function show() { panel.hidden = false; fitPanel(); }
    /* 皮肤或明暗切换后布局会变，面板要是开着就重新量一次 */
    window.addEventListener('navhub:themechange', function () { if (!panel.hidden) fitPanel(); });
    window.addEventListener('resize', function () { if (!panel.hidden) fitPanel(); });
  /* 把文本里命中查询词的部分包成 <mark>。
     查询可能带空格（多关键词），逐个都要标出来。 */
  function highlight(text, qRaw) {
    var raw = String(text == null ? '' : text);
    var qs = String(qRaw == null ? '' : qRaw).trim().toLowerCase()
      .split(/\s+/).filter(function (x) { return x; });
    if (!qs.length || !raw) return document.createTextNode(raw);

    var lower = raw.toLowerCase();
    /* 先把每个查询词在文本里的所有出现位置收集起来，再合并重叠区间 */
    var spans = [];
    qs.forEach(function (t) {
      var i = lower.indexOf(t);
      while (i > -1) {
        spans.push([i, i + t.length]);
        i = lower.indexOf(t, i + t.length);
      }
    });
    if (!spans.length) return document.createTextNode(raw);

    spans.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [spans[0]];
    for (var k = 1; k < spans.length; k++) {
      var last = merged[merged.length - 1];
      if (spans[k][0] <= last[1]) last[1] = Math.max(last[1], spans[k][1]);
      else merged.push(spans[k]);
    }

    var frag = document.createDocumentFragment();
    var pos = 0;
    merged.forEach(function (sp) {
      if (sp[0] > pos) frag.appendChild(document.createTextNode(raw.slice(pos, sp[0])));
      var m = document.createElement('mark');
      m.textContent = raw.slice(sp[0], sp[1]);
      frag.appendChild(m);
      pos = sp[1];
    });
    if (pos < raw.length) frag.appendChild(document.createTextNode(raw.slice(pos)));
    return frag;
  }


    function renderList(q) {
      var results = search(q);
      panel.textContent = '';

      if (!results.length) {
        panel.appendChild(el('div', 'search-empty',
          '本站没有收录「' + String(q == null ? '' : q).trim() + '」相关站点 —— 按回车或点「搜索」去网上搜'));
        /* 搜不到的时候顺手列几个常用工具类官网（解压、剪辑这些）——
           全是白底，因为它们不是「匹配结果」，只是「顺便看看」。 */
        panel.appendChild(el('div', 'search-empty', '常用工具类官网：'));
        var picks = [];
        ALL_SITES.filter(function (x) {
          var n = (x.cat && x.cat.name) || '';
          return /压缩|解压|剪辑|图像|处理|转换|工具/.test(n) && !x.bare;
        }).slice(0, 3).forEach(function (x) {
          var a = el('a', 'search-item');
          a.href = x.site.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.dataset.rank = '3';
          a.appendChild(buildIcon(x.site));
          var txt = el('div', 'site-text');
          txt.appendChild(el('div', 'si-name', x.site.name));
          txt.appendChild(el('div', 'site-desc', x.site.short || x.site.desc || domainOf(x.site.url)));
          a.appendChild(txt);
          if (x.cat && x.cat.name) a.appendChild(el('span', 'si-cat', x.cat.name));
          panel.appendChild(a);
        });
        show();
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

        /* 三档亮度。第一档固定给排在最前面的那条 —— 用户要的是
           「最可能是我想找的那个」比其他都亮，而不是按分数分段。
           剩下两条按分数分：够得着 60 的算有点相关，其余偏灰。 */
        /* noRank：空输入时的推荐，用户一个字都没打，谈不上「匹配度」，
           一律白底 —— 给它深色底会让人以为这是「最相关的结果」。 */
        var score = r.score || 0;
        a.dataset.rank = r.noRank
          ? '3'
          : ((i === 0) ? '1' : (i <= 2 ? '2' : '3'));

        var txt = el('div', 'site-text');
        var nameEl = el('div', 'si-name');
        nameEl.appendChild(highlight(r.site.name, q));

        /* 网址里命中的话，也把那段标出来（第三档主要靠这个被认出来） */
        if (score && score < 60) a.dataset.matchedByUrl = '1';
        if (r.site.alias && r.site.alias.length) {
          nameEl.appendChild(el('span', 'name-alias', '（' + r.site.alias.slice(0, 2).join('、') + '）'));
        }
        txt.appendChild(nameEl);
        var sub = r.site.short || r.site.desc;
        txt.appendChild(el('div', 'site-desc', sub || domainOf(r.url)));
        if (!bare) {
          /* 网址里命中的关键词也要标出来 —— 搜「ai」时，
             「op**ai**.com」这种一眼就知道为什么被列出来 */
          var urlEl = el('div', 'si-url');
          urlEl.appendChild(highlight(r.url, q));
          txt.appendChild(urlEl);
        }
        a.appendChild(txt);

        if (bare) a.appendChild(el('span', 'si-cat', '仅网址'));
        else if (r.cat && r.cat.name) a.appendChild(el('span', 'si-cat', r.cat.name));
        panel.appendChild(a);
      });
      show();
    }

    /* 上下键高亮整套撤了：回车不再"打开高亮的那条"（改成固定去搜网页），
       高亮了也没用，留着只会让人以为按回车会跳到那一条。
       列表条目本身是 <a>，用 Tab 键能聚焦、回车能打开，无障碍不受影响。 */

    function close() { panel.hidden = true; }

    input.addEventListener('input', function () {
      clearBtn.hidden = !input.value;
      syncGo();
      renderList(input.value);
    });

    /* 只要重新点回搜索框，即使还没输入，也直接给出结果 */
    input.addEventListener('focus', function () {
      renderList(input.value);
    });

    /* 回车、点「搜索」、手机键盘上的「前往」，三条路都走这里。
       搜索框**只干搜索这一件事**：把输入框里的内容交给必应搜网页，
       不做任何跳转 —— 想去某个官网，点下面列表里那一条。

       以前这里会「有结果就打开第一条」，和「点条目就是前往官网」撞在一起，
       同一个动作两套结果，说不清点了会发生什么。 */
    function go() {
      var raw = input.value.trim();
      if (!raw) return;

      var engines = window.Seek ? Seek.engines() : [];
      if (!engines.length) return;

      openSite(Seek.engineHref(engines[0], raw));
      close();
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); input.blur(); }
      else if (e.key === 'Enter') { e.preventDefault(); go(); }
    });

    form.addEventListener('submit', function (e) { e.preventDefault(); go(); });

    clearBtn.addEventListener('click', function () {
      input.value = '';
      clearBtn.hidden = true;
      syncGo();
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

  /* ---------- 问候语右侧的随机推荐 ----------
     只从精选分类里挑；每 3 秒换一个；
     鼠标移上去暂停且保留剩余时间，移开接着走剩下的；
     左箭头回看走过的（最多留 5 个），右箭头立即换下一个并重置计时。 */
  function initHeroPick() {
    var box = document.getElementById('hpBody');
    if (!box) return;

    /* 候选池 = 主页精选的全部站点 */
    var pool = [];
    (CFG.categories || []).forEach(function (cat) {
      (cat.sites || []).forEach(function (s) { pool.push(s); });
    });
    if (!pool.length) return;

    var INTERVAL = 5000;
    var picks = [];          // 走过的下标，最后一个就是当前显示的那个
    var remain = INTERVAL;   // 还剩多少毫秒换下一个
    var rafId = null;
    var lastTs = 0;

    var wrap = document.getElementById('heroPick');
    var prevBtn = document.getElementById('hpPrev');
    var nextBtn = document.getElementById('hpNext');
    var barEl = document.getElementById('hpBar');

    function paint() {
      var s = pool[picks[picks.length - 1]];
      if (!s) return;

      box.textContent = '';

      var card = el('div', 'hp-card');
      var top = el('div', 'hp-top');

      var ico = el('span', 'site-ico');
      top.appendChild(ico);
      if (window.paintIcon) window.paintIcon(ico, s);
      else ico.textContent = (s.name.charAt(0) || '?').toUpperCase();

      var info = el('div', 'hp-info');
      var nm = el('b');
      nm.appendChild(document.createTextNode(s.name));
      if (s.alias && s.alias.length) {
        nm.appendChild(el('span', 'name-alias', '（' + s.alias.slice(0, 2).join('、') + '）'));
      }
      info.appendChild(nm);
      var sub = s.short || s.desc || '';
      if (sub) info.appendChild(el('em', null, sub));
      info.appendChild(el('small', 'hp-url', domainOf(s.url)));
      top.appendChild(info);
      card.appendChild(top);

      var acts = el('div', 'hp-acts');
      if (s.intro) {
        var ib = el('button', 'hp-act');
        ib.type = 'button';
        ib.textContent = '介绍';
        ib.addEventListener('click', function () {
          /* 看介绍的时候必须停住 —— 否则用户读完回来，卡片已经换成别的了 */
          halt();
          openIntro(s);
        });
        acts.appendChild(ib);
      }
      var go = el('a', 'hp-act is-primary');
      go.href = s.url;
      go.target = '_blank';
      go.rel = 'noopener noreferrer';
      go.textContent = '直达';
      acts.appendChild(go);
      card.appendChild(acts);

      box.appendChild(card);
      if (prevBtn) prevBtn.disabled = picks.length < 2;
    }

    /* 随机挑一个和当前不一样的，并记进历史 */
    function roll(reset) {
      var cur = picks.length ? picks[picks.length - 1] : -1;
      var i = cur;
      if (pool.length > 1) {
        while (i === cur) i = Math.floor(Math.random() * pool.length);
      } else {
        i = 0;
      }
      picks.push(i);
      if (picks.length > 5) picks.shift();
      if (reset !== false) remain = INTERVAL;
      paint();
    }

    /* 回看上一个 */
    function back() {
      if (picks.length < 2) return;
      picks.pop();
      remain = INTERVAL;
      if (barEl) barEl.style.transform = 'scaleX(1)';
      paint();
    }

    /* 用逐帧更新而不是 setInterval：进度条跟着屏幕刷新率走，不会有卡顿感 */
    function tickFn() {
      rafId = window.requestAnimationFrame(tickFn);

      var now = Date.now();
      /* 切走标签页、或者掉帧的时候，别一口气把剩余时间全扣光 */
      var dt = Math.min(now - lastTs, 100);
      lastTs = now;
      remain -= dt;

      if (barEl) barEl.style.transform = 'scaleX(' + Math.max(0, remain / INTERVAL) + ')';
      if (remain <= 0) {
        remain = INTERVAL;
        roll();
      }
    }

    /* 暂停 = 停掉逐帧更新，remain 保留着，恢复时接着走剩下的 */
    function halt() {
      if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; }
    }
    function run() {
      if (rafId) return;
      lastTs = Date.now();
      rafId = window.requestAnimationFrame(tickFn);
    }

    if (wrap) {
      wrap.addEventListener('mouseenter', halt);
      wrap.addEventListener('mouseleave', run);
      wrap.addEventListener('focusin', halt);
      wrap.addEventListener('focusout', run);
      /* 触屏：点一下暂停，过一会儿自己恢复 */
      wrap.addEventListener('touchstart', halt, { passive: true });
      wrap.addEventListener('touchend', function () {
        window.setTimeout(run, 2600);
      }, { passive: true });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () { remain = INTERVAL; roll(); });
    }
    if (prevBtn) prevBtn.addEventListener('click', back);

    /* 介绍弹窗开着的时候也要停 —— 不管它是从哪打开的。
       关掉之后接着走，而且显示的仍然是原来那一条。 */
    var modal = document.getElementById('introModal');
    if (modal && window.MutationObserver) {
      new MutationObserver(function () {
        if (modal.hidden) run();
        else halt();
      }).observe(modal, { attributes: true, attributeFilter: ['hidden'] });
    }

    roll(false);
    run();
  }

  /* ---------- 让首屏左右两翼等宽 ----------
     首屏那一行是「问候 ┊ 搜索 ┊ 天气」，两边都 flex: none、中间吃剩余宽度。
     所以「搜索」居中的是「中间那一格」，不是整块 ——
     左边问候比右边天气窄一截，不补这一下标题会偏左几十像素。
     补法：把问候的 min-width 抬到和天气一样宽，两翼对称，中间那格自然也居中。
     窗口不够宽时不补 —— 宁可标题偏一点，也别把搜索框挤没了。 */
  function syncHeroWings() {
    var row = document.querySelector('.hb-row');
    var hi = document.querySelector('.hb-hi');
    var hold = document.querySelector('.hb-hold');
    var wx = document.querySelector('.wx');
    if (!row || !hi || !wx) return;

    hi.style.minWidth = '';
    if (hold) hold.style.width = '';
    if (window.innerWidth <= 980) return;      /* 窄屏是上下两行，不适用 */

    var w = Math.max(hi.offsetWidth, wx.offsetWidth);
    var need = w * 2 + 48 + 420;               /* 两翼 + 两个 gap + 中间至少留住 420 */
    if (row.offsetWidth < need) return;
    hi.style.minWidth = w + 'px';
    /* 右角那个空占位跟着左翼一样宽，中间那组才是夹在正中间 */
    if (hold) hold.style.width = w + 'px';
  }

  /* ---------- 启动 ----------
     主题、"关于本站"、"设置" 这三块已经交给 js/topbar.js 了 ——
     它们是全站共用的，放在这里只有首页和「其他网页」页能用到。
     这个文件只管首页自己的内容：卡片、搜索、随机推荐、介绍弹窗。 */
  function boot() {
    renderBrand();
    collectSites();
    renderFeatured();
    renderPresetChips();
    renderCategories();
    renderChips();
    paintAllEntry();
    initSearch();
    initHeroPick();
    initModal();
    syncHeroWings();
    window.addEventListener('resize', syncHeroWings);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
