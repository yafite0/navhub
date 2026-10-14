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
        '<div class="top-actions">' +
          '<button class="top-btn" id="aboutBtn" type="button">' + ICO.info + '<span>关于本站</span></button>' +
          '<a class="top-btn is-sponsor" href="https://afdian.com/a/L1295598306" target="_blank" rel="noopener noreferrer">' +
            '<img src="assets/icons/afdian.png" alt="" /><span>赞助</span>' +
          '</a>' +
        '</div>' +
        '<nav class="topnav" id="topnav">' +
          '<a href="index.html">首页</a>' +
          '<a href="sites.html" class="nav-all">其他网页</a>' +
        '</nav>' +
        '<div class="updated" id="updatedBox" hidden>' + ICO.clock + '<span id="updatedText"></span></div>' +
        '<button id="themeBtn" class="icon-btn" type="button" title="切换深浅色" aria-label="切换深浅色">' + ICO.sun + ICO.moon + '</button>' +
        '<a class="icon-btn" href="tools.html?tool=share" title="做张分享图" aria-label="做张分享图">' + ICO.share + '</a>' +
        '<button id="setBtn" class="icon-btn" type="button" title="设置" aria-label="设置">' + ICO.gear + '</button>' +
      '</div>';
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

    txt.textContent = '最后更新 ' + raw.slice(0, 10) + '（' + ago + '）';
    box.hidden = false;
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
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0B0F1A' : '#4D6BFE');
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { }
    applyTheme(saved === 'dark' ? 'dark' : 'light', false);

    var btn = $('themeBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { }
      syncThemeSeg();
    });
  }

  function syncThemeSeg() {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    Array.prototype.forEach.call(document.querySelectorAll('#setTheme button'), function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-theme-set') === cur);
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
          '</div>' +
          '<p class="about-note" id="aboutNote"></p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(mask);

    function set(id, txt) { var n = $(id); if (n && txt) n.textContent = txt; }
    set('aboutTitle', d.title || '关于本站');
    set('aboutSub', d.subtitle);
    set('aboutLead', d.lead);
    set('aboutNote', d.note);

    var grid = $('aboutGrid');
    (d.items || []).forEach(function (it) {
      var box = el('div', 'about-item');
      box.appendChild(el('h4', null, it.t));
      box.appendChild(el('p', null, it.d));
      grid.appendChild(box);
    });

    var tags = $('aboutTags');
    (d.tags || []).forEach(function (t) { tags.appendChild(el('span', null, t)); });

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
      syncThemeSeg();
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
        syncThemeSeg();
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

  function boot() {
    renderTopbar();
    initTheme();
    paintUpdated();
    renderAbout();
    renderSettings();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
