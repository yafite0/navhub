/* ============================================================
   全站统一的顶栏
   ------------------------------------------------------------
   每个页面只放一个空的 <header class="topbar"></header>，
   里面的东西全部由这里生成 —— 连「关于本站」和「设置」两个弹窗也一起带上。

   为什么不各页写一份：五个页面各抄一遍的话，改一处得改五处，
   早晚会不一致。这次要统一之前，几页的顶栏已经各长各的了
   （有的叫「翻译助手」、有的带「返回首页」、有的连署名都没有）。

   依赖：js/data.js（署名、最后更新时间、关于本站的内容）
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.NAV_CONFIG || {};
  var THEME_KEY = 'navhub.theme';

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var ICO = {
    info: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.4M12 7.8h.01"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.6V12l3 1.9"/></svg>',
    sun: '<svg class="ico-sun" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>',
    moon: '<svg class="ico-moon" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.2A8.4 8.4 0 1 1 9.8 4a6.9 6.9 0 0 0 10.2 10.2Z"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="17.5" cy="6" r="2.6"/><circle cx="6.5" cy="12" r="2.6"/><circle cx="17.5" cy="18" r="2.6"/><path d="M8.9 10.8 15.1 7.2M8.9 13.2l6.2 3.6"/></svg>',
    gear: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h9M17 18h3"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="18" r="2"/></svg>'
  };

  /* ---------- 顶栏本体 ---------- */
  function renderTopbar() {
    var host = document.querySelector('header.topbar');
    if (!host) return;

    host.innerHTML =
      '<div class="wrap topbar-inner">' +
        '<a class="brand" href="index.html">' +
          '<span class="brand-mark">启</span>' +
          '<span class="brand-text">' +
            '<strong>启航</strong>' +
            '<small class="brand-credit">' +
              '<i>界面布局：凌霄云弈</i>' +
              '<i>agent工具：Code Buddy</i>' +
              '<i>代码编写：Deep Seek</i>' +
            '</small>' +
          '</span>' +
        '</a>' +
        /* 三个界面预设。放在 logo 右边 —— 左上角是最先看到的位置，
           而且这三个按钮是「换整套界面」这种大动作，值得占这个位置。 */
        '<nav class="skin-nav" aria-label="主导航">' +
          '<a href="index.html" class="is-on">首页</a>' +
          '<a href="sites.html">其他网页</a>' +
          '<a href="tools.html">工具</a>' +
          '<a href="translate.html">预设</a>' +
        '</nav>' +

        '<div class="top-actions">' +
          '<button class="top-btn" id="aboutBtn" type="button">' + ICO.info + '<span>关于本站</span></button>' +
          '<a class="top-btn is-sponsor" href="https://afdian.com/a/L1295598306" target="_blank" rel="noopener noreferrer">' +
            '<img src="assets/icons/afdian.png" alt="" /><span>赞助</span>' +
          '</a>' +
        '</div>' +
        /* 顶栏那两个导航（首页 / 其他网页）撤了：
           回首页靠左上角那个 logo（它本来就是个链接，而且位置固定不变）、
           以及次级页页头那个「返回主页」大按钮；去其他网页页靠首页的「更多官网」。
           撤掉之后右边这一堆得自己撑到最右 —— 原来那个 margin-left: auto
           挂在 .topnav 上，导航一走就没人推了，所以这里包一层 .top-right。 */
        '<div class="top-right">' +
          /* 界面切换：做成和「设置」同级的一个独立图标按钮，
             点开是一个独立面板，里面三张卡片垂直排列。 */
          '<button id="skinOpen" class="icon-btn" type="button" title="切换界面" aria-label="切换界面" aria-expanded="false">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="3.5" y="4" width="17" height="5" rx="1.2"/><rect x="3.5" y="11.5" width="17" height="3" rx="1"/>' +
              '<rect x="3.5" y="16.5" width="17" height="3.5" rx="1"/>' +
            '</svg>' +
          '</button>' +
          /* 昼 / 夜：和界面按钮同级、同尺寸。只换配色，布局不动。 */
          '<button id="modeBtn" class="icon-btn" type="button" title="切换白天 / 黑夜" aria-label="切换白天黑夜">' +
            '<svg class="ico-day" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">' +
              '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"/>' +
            '</svg>' +
            '<svg class="ico-night" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M20 14.4A8.4 8.4 0 1 1 9.6 4a6.8 6.8 0 0 0 10.4 10.4z"/>' +
            '</svg>' +
          '</button>' +
          '<div class="updated" id="updatedBox" hidden>' + ICO.clock + '<span id="updatedText"></span></div>' +
          '<a class="icon-btn" href="tools.html?tool=share" title="做张分享图" aria-label="做张分享图">' + ICO.share + '</a>' +
          '<button id="setBtn" class="icon-btn" type="button" title="设置" aria-label="设置">' + ICO.gear + '</button>' +
        '</div>' +
      '</div>';

    /* 界面选择面板单独挂到 body：它要 position: fixed 盖住整页，
       放在 topbar 内部会被 header 的层叠上下文限制住 */
    document.body.insertAdjacentHTML('beforeend', skinPanelHTML());
  }

  /* ---------- 最后更新时间 ----------
     只显示日期 + 一个粗颗粒的「多久之前」（一天内 / 一周内 / 一月内 / 一年内）。
     不到一小时、几小时前这种太细的说法没必要 —— 顶栏这是给人一个
     「这站还在维护」的印象，不是给人对表的。 */
  function paintUpdated() {
    var box = $('updatedBox'), txt = $('updatedText');
    if (!box || !txt || !CFG.lastUpdated) return;

    var raw = String(CFG.lastUpdated);
    var day = 86400000;
    var d = new Date(raw.replace(/-/g, '/'));

    if (isNaN(d.getTime())) {
      txt.textContent = '最后更新 ' + raw;
      box.hidden = false;
      return;
    }

    var diff = Date.now() - d.getTime();
    var ago = diff < day ? '一天内'
      : diff < day * 7 ? '一周内'
        : diff < day * 30 ? '一月内'
          : diff < day * 365 ? '一年内'
            : '一年前';

    var line = '最后更新 ' + raw.slice(0, 10) + '（' + ago + '）';
    txt.textContent = line;
    box.hidden = false;

    /* 关于弹窗里那个「最后更新」一起填 —— 顶栏那行已经隐藏了，
       这一份才是用户看得到的。 */
    var au = $('aboutUpdated');
    if (au) au.textContent = line;
  }

  /* ---------- 主题 ---------- */
  function applyTheme(t, animate) {
    var root = document.documentElement;
    if (animate) {
      root.classList.add('theming');
      window.setTimeout(function () { root.classList.remove('theming'); }, 320);
    }
    root.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    /* 地址栏/状态栏的配色跟着皮肤走 */
    var tc = { dark: '#07080A', c: '#F4F3EF', blue: '#4D6BFE' };
    if (meta) meta.setAttribute('content', tc[t] || '#F4F3EF');

    /* 通知其他模块布局可能变了。搜索候选框的高度是按视口实算的，
       换了皮肤之后要是面板正开着，得重新量一次。 */
    try {
      window.dispatchEvent(new CustomEvent('navhub:themechange', { detail: { skin: t } }));
    } catch (e) { }
    }
  /* 三个界面预设：图纸 / 工业 / 原版。
     老版本只有 light / dark 两个值，localStorage 里可能还存着 'light'，
     这里统一映射成 'c'，不然读出来的皮肤名并不存在。 */
  /* 界面选择面板。三张卡片垂直排列，每张有预览占位 + 名称 + 介绍。
     预览先做占位（灰块 + 几条线），等真做出来再换成缩略图。 */
  function skinPanelHTML() {
    var items = [
      { id: 'blue', name: '经典色块', d: '品牌蓝 + 彩色卡片，信息密度最高，最常见的那种' },
      { id: 'c', name: '简约档案', d: '米白纸面、编号、细线，字大留白多，看着不费劲' }
      /* 「先进工业」暂时不开放选择 —— 那个界面还没做完，
         半成品摆出来比没有更糟。样式文件（skin-b.css）留着，
         做完之后把这一行加回来就行。 */
    ];
    var list = items.map(function (it) {
      return '<button class="skin-card" type="button" data-skin="' + it.id + '">' +
        '<span class="skin-thumb is-' + it.id + '" aria-hidden="true">' +
          '<i></i><i></i><i></i>' +
        '</span>' +
        '<span class="skin-meta">' +
          '<b>' + it.name + '</b>' +
          '<em>' + it.d + '</em>' +
        '</span>' +
        '<span class="skin-pick" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7.5"/></svg>' +
        '</span>' +
      '</button>';
    }).join('');

    return '<div class="skin-mask" id="skinMask" hidden>' +
      '<div class="skin-panel" role="dialog" aria-modal="true" aria-labelledby="skinPanelTitle">' +
        '<div class="skin-panel-head">' +
          '<h4 id="skinPanelTitle">选择界面</h4>' +
          '<p>两套界面对应不同的使用习惯，随时能换回。</p>' +
        '</div>' +
        '<div class="skin-list">' + list + '</div>' +
      '</div>' +
    '</div>';
  }

  function normSkin(v) {
    /* 「先进工业」暂时下架（那个界面还没做完）。
       localStorage 里如果还留着 'dark'，一律回落到经典色块，
       不然访问者会停在一个选不回来的界面上。 */
    if (v === 'dark') return 'blue';
    if (v === 'c') return 'c';         /* 简约档案 */
    if (v === 'blue') return 'blue';   /* 经典色块 */
    return 'blue';                     /* 默认、以及旧版本残留的 'light' */
  }
  /* ---------- 昼 / 夜 ---------- */
  var MODE_KEY = 'navhub.mode';

  function applyMode(m) {
    document.documentElement.setAttribute('data-mode', m === 'dark' ? 'dark' : 'light');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', m === 'dark' ? '#0A0C10' : '#F4F3EF');
  }

  function initMode() {
    var saved = null;
    try { saved = localStorage.getItem(MODE_KEY); } catch (e) { }
    /* 没存过就跟随系统。系统也没有就当白天 —— 三套皮肤默认都是亮的 */
    if (!saved) {
      saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    applyMode(saved);

    var btn = $('modeBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
      applyMode(next);
      try { localStorage.setItem(MODE_KEY, next); } catch (e) { }
    });
  }



  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { }
    applyTheme(normSkin(saved), false);

    var mask = $('skinMask');
    var openBtn = $('skinOpen');
    if (!mask || !openBtn) return;

    /* 面板要盖住整页，挂在 topbar 里会被 header 的层叠上下文限制住 */
    if (mask.parentNode !== document.body) document.body.appendChild(mask);

    function openPanel() {
      mask.hidden = false;
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('skin-open');
      syncSkinBtns();
      var cur = mask.querySelector('.skin-card.is-on');
      if (cur) cur.focus();
    }
    function closePanel() {
      mask.hidden = true;
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('skin-open');
    }

    openBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (mask.hidden) openPanel(); else closePanel();
    });

    /* 点遮罩关掉，点面板内部不关 */
    mask.addEventListener('click', function (e) {
      if (e.target === mask) closePanel();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mask.hidden) closePanel();
    });

    Array.prototype.forEach.call(mask.querySelectorAll('.skin-card'), function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-skin');
        applyTheme(v, true);
        try { localStorage.setItem(THEME_KEY, v); } catch (e) { }
        syncSkinBtns();
        closePanel();
        toastSkin(SKIN_NAME[v] || v);
      });
    });

    syncSkinBtns();
  }

  var SKIN_NAME = { blue: '经典色块', c: '简约档案', dark: '先进工业' };

  /* 换完给一句轻提示，不然点了不知道生效没 */
  function toastSkin(name) {
    var t = $('skinToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'skinToast';
      t.className = 'skin-toast';
      document.body.appendChild(t);
    }
    t.textContent = '已切换到「' + name + '」';
    t.classList.add('is-show');
    clearTimeout(toastSkin._t);
    toastSkin._t = setTimeout(function () { t.classList.remove('is-show'); }, 1800);
  }

  /* 当前皮肤那个按钮高亮 */
  function syncSkinBtns() {
    var cur = normSkin(document.documentElement.getAttribute('data-theme'));
    Array.prototype.forEach.call(document.querySelectorAll('.skin-card'), function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-skin') === cur);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#setTheme button'), function (b) {
      b.classList.toggle('is-on', normSkin(b.getAttribute('data-theme-set')) === cur);
    });
  }


  /* ---------- 弹窗的通用开关 ---------- */
  function bindDialog(mask, closeFn) {
    mask.addEventListener('click', function (e) { if (e.target === mask) closeFn(); });
    document.addEventListener('keydown', function (e) {
      if (!mask.hidden && e.key === 'Escape') closeFn();
    });
  }

  /* ---------- 关于本站 ---------- */
  function renderAbout() {
    var d = CFG.about || {};
    var mask = el('div', 'modal-mask');
    mask.id = 'aboutModal';
    mask.hidden = true;
    mask.innerHTML =
      '<div class="modal about-modal" role="dialog" aria-modal="true" aria-labelledby="aboutTitle">' +
        '<button class="modal-close is-plain" id="aboutClose" type="button" aria-label="关闭">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
        '<div class="modal-body">' +
          '<div class="about-head">' +
            '<span class="brand-mark">启</span>' +
            '<div><h3 id="aboutTitle"></h3><p id="aboutSub"></p></div>' +
          '</div>' +
          '<p class="about-lead" id="aboutLead"></p>' +
          '<div class="about-grid" id="aboutGrid"></div>' +
          '<div class="about-tags" id="aboutTags"></div>' +
          '<p class="about-credit" id="aboutCredit" hidden>' +
            '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.4 13.9 9l5.6.2-4.5 3.5 1.6 5.5L12 15.1l-4.6 3.1 1.6-5.5L4.5 9.2 10.1 9z"/></svg>' +
            '<span id="aboutCreditText"></span>' +
          '</p>' +
          '<div class="about-links">' +
            '<a class="go-btn" id="githubBtn" href="#" target="_blank" rel="noopener noreferrer">' +
              '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 8 4.5 12l4 4M15.5 8l4 4-4 4"/></svg>' +
              '<span id="githubText">在 GitHub 上查看源码</span>' +
            '</a>' +
            '<a class="sponsor-btn" id="sponsorBtn" href="https://afdian.com/a/L1295598306" target="_blank" rel="noopener noreferrer">' +
              '<img src="assets/icons/afdian.png" alt="" /><span id="sponsorText">请我喝杯奶茶</span>' +
            '</a>' +
            /* 「最后更新」从顶栏挪到这儿：顶栏那一行太挤，
               而且这个信息本来就是「想知道站点多久没动过」才会看，
               放在关于弹窗里更合适。 */
            '<span class="about-updated" id="aboutUpdated"></span>' +
          '</div>' +
          '<p class="about-note" id="aboutNote"></p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(mask);

    function set(id, txt) { var n = $(id); if (n && txt) n.textContent = txt; }

    /* lead、tags 这些段落是可有可无的：有内容才显示，没内容就把整块藏起来。
       它们的节点一直挂在 DOM 里、各自还带 margin，
       留空会在弹窗里留出一段莫名其妙的空白。 */
    function setBlock(id, txt) {
      var n = $(id);
      if (!n) return;
      if (txt) { n.textContent = txt; n.hidden = false; }
      else { n.hidden = true; }
    }

    set('aboutTitle', d.title || '关于本站');
    set('aboutSub', d.subtitle);
    setBlock('aboutLead', d.lead);
    set('aboutNote', d.note);

    var grid = $('aboutGrid');
    (d.items || []).forEach(function (it) {
      var box = el('div', 'about-item');
      box.appendChild(el('h4', null, it.t));
      box.appendChild(el('p', null, it.d));
      grid.appendChild(box);
    });
    if (grid) grid.hidden = !grid.children.length;

    var tags = $('aboutTags');
    (d.tags || []).forEach(function (t) { tags.appendChild(el('span', null, t)); });
    if (tags) tags.hidden = !tags.children.length;

    if (d.credit && $('aboutCredit')) {
      $('aboutCreditText').textContent = d.credit;
      $('aboutCredit').hidden = false;
    }
    if (d.github && $('githubBtn')) $('githubBtn').href = d.github;
    set('githubText', d.githubText);
    if (d.sponsor && $('sponsorBtn')) $('sponsorBtn').href = d.sponsor;
    set('sponsorText', d.sponsorText);

    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      mask.hidden = false;
      document.body.classList.add('modal-open');
      $('aboutClose').focus();
    }
    function close() {
      mask.hidden = true;
      document.body.classList.remove('modal-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    if ($('aboutBtn')) $('aboutBtn').addEventListener('click', open);
    $('aboutClose').addEventListener('click', close);
    bindDialog(mask, close);
  }

  /* ---------- 设置 ---------- */
  function renderSettings() {
    var mask = el('div', 'modal-mask');
    mask.id = 'setModal';
    mask.hidden = true;
    mask.innerHTML =
      '<div class="modal set-modal" role="dialog" aria-modal="true" aria-labelledby="setTitle">' +
        '<div class="set-head">' +
          '<h3 id="setTitle">设置</h3>' +
          '<button class="set-x" id="setClose" type="button" aria-label="关闭">×</button>' +
        '</div>' +
        '<div class="set-body">' +
          '<section class="set-group">' +
            '<h4>外观</h4>' +
            '<div class="set-seg" id="setTheme">' +
              '<button type="button" data-theme-set="light">浅色</button>' +
              '<button type="button" data-theme-set="dark">深色</button>' +
            '</div>' +
          '</section>' +
          '<section class="set-group">' +
            '<h4>天气城市</h4>' +
            '<p class="set-desc">首屏右上角那个天气，按这里选的城市取数。</p>' +
            '<button class="set-btn" id="setCity" type="button"><span id="setCityName">北京</span><em>更换 →</em></button>' +
          '</section>' +
          '<section class="set-group">' +
            '<h4>本地记录</h4>' +
            '<p class="set-desc">主题和城市只存在你这台机器上，不会上传。清掉就回到默认。</p>' +
            '<button class="set-btn is-danger" id="setReset" type="button">清空本地记录</button>' +
          '</section>' +
        '</div>' +
      '</div>';
    document.body.appendChild(mask);

    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      syncSkinBtns();
      var src = $('cityName'), dst = $('setCityName');
      if (src && dst) dst.textContent = src.textContent;
      mask.hidden = false;
      document.body.classList.add('modal-open');
      $('setClose').focus();
    }
    function close() {
      mask.hidden = true;
      document.body.classList.remove('modal-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    if ($('setBtn')) $('setBtn').addEventListener('click', open);
    $('setClose').addEventListener('click', close);
    bindDialog(mask, close);

    var seg = $('setTheme');
    if (seg) {
      seg.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-theme-set]') : null;
        if (!b) return;
        var t = b.getAttribute('data-theme-set') === 'dark' ? 'dark' : 'light';
        applyTheme(t, true);
        try { localStorage.setItem(THEME_KEY, t); } catch (err) { }
        syncSkinBtns();
      });
    }

    /* 换城市借页面里那个城市选择器 —— 那套 UI 已经写好了，不再造一个 */
    if ($('setCity')) {
      $('setCity').addEventListener('click', function () {
        close();
        var c = $('cityBtn');
        if (c) window.setTimeout(function () { c.click(); }, 120);
        else if (window.showToast) window.showToast('这个页面没有天气模块');
      });
    }

    if ($('setReset')) {
      $('setReset').addEventListener('click', function () {
        ['navhub.theme', 'navhub.city', 'navhub.geo'].forEach(function (k) {
          try { localStorage.removeItem(k); } catch (err) { }
        });
        if (window.showToast) window.showToast('已清空本地记录，刷新后回到默认');
      });
    }
  }
  /* ============================================================
     主页那三个入口：整块都能点
     ------------------------------------------------------------
     卡片本身是 <section>，只有右边那个箭头是 <a>。
     之前试过用伪元素铺一层盖住整卡，但在 flex 布局里被兄弟元素
     盖住了，鼠标移上去有指针、点下去却没反应（只有箭头有效）。
     这里直接挂点击，最稳。
     ============================================================ */
  function bindCardLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('.pw'), function (card) {
      var link = card.querySelector('.pw-go');
      if (!link || !link.getAttribute('href')) return;

      card.style.cursor = 'pointer';
      card.addEventListener('click', function (e) {
        /* 点到的本来就是那个 <a>，让它自己跳，别跳两次 */
        if (e.target.closest && e.target.closest('a')) return;
        window.location.href = link.getAttribute('href');
      });
    });
  }


  function boot() {
    renderTopbar();
    initTheme();
  initMode();    bindCardLinks();
    paintUpdated();
    renderAbout();
    /* 关于弹窗是 renderAbout 才造出来的，里面那个「最后更新」
       第一次填的时候还不存在，所以造完再填一次 */
    paintUpdated();
    renderSettings();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
