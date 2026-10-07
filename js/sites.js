/* ============================================================
   启航 · 全部网站
   把 data.js 里「精选分类」和「仅可搜索」的站点汇总成一页，支持实时筛选。
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.NAV_CONFIG || {};
  function $(id) { return document.getElementById(id); }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function domainOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }

  /* 字母（拼音）排序：中文靠 localeCompare 按拼音走，英文按字母 */
  function byName(a, b) {
    return String(a.name).localeCompare(String(b.name), 'zh-CN');
  }

  /* ---------- 汇总数据 ----------
     只收前两档：精选分类（top）和完整索引。
     第三档「仅网址」不在这里展示，只参与搜索。 */
  var GROUPS = (function () {
    var out = [];
    var seen = {};

    (CFG.categories || []).forEach(function (cat) {
      var sites = [];
      (cat.sites || []).forEach(function (s) {
        seen[s.url] = true;
        sites.push({
          name: s.name, url: s.url, desc: s.short || '',
          icon: s.icon, key: s.key || '',
          region: s.region || 'global', top: true
        });
      });
      if (sites.length) {
        out.push({
          id: cat.id || cat.name,
          title: cat.name,
          emoji: cat.icon || '',
          sites: sites
        });
      }
    });

    var byCat = {};
    var order = [];
    (CFG.index || []).forEach(function (s) {
      if (seen[s.url]) return;
      var c = s.cat || '其他';
      if (!byCat[c]) { byCat[c] = []; order.push(c); }
      byCat[c].push({
        name: s.name, url: s.url, desc: s.desc || '',
        icon: s.icon, key: s.key || '',
        region: s.region || 'global', top: false
      });
    });

    /* index 里如果用了和上面分类同名的 cat（比如「AI Agent」），
       就并进那个分类，不再单独生成一个重名分组 */
    order.forEach(function (c) {
      var merged = null;
      for (var i = 0; i < out.length; i++) {
        if (out[i].title === c) { merged = out[i]; break; }
      }
      if (merged) {
        byCat[c].forEach(function (s) { merged.sites.push(s); });
      } else {
        out.push({ id: 'so-' + c, title: c, emoji: '', sites: byCat[c] });
      }
    });

    /* 组内按字母排序，同时拆成国内 / 国外两段 */
    out.forEach(function (g) {
      g.cn = g.sites.filter(function (s) { return s.region === 'cn'; }).sort(byName);
      g.global = g.sites.filter(function (s) { return s.region !== 'cn'; }).sort(byName);
    });

    return out;
  })();

  var TOTAL = GROUPS.reduce(function (n, g) { return n + g.sites.length; }, 0);
  var TOTAL_CN = GROUPS.reduce(function (n, g) { return n + g.cn.length; }, 0);
  var TOTAL_GLOBAL = TOTAL - TOTAL_CN;
  var EXTRA = (CFG.urls || []).length;

  /* ---------- 单个站点 ---------- */
  function buildItem(s) {
    var a = el('a', 'as-item' + (s.top ? ' is-top' : ''));
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.title = s.name + ' · ' + domainOf(s.url);

    var ico = el('span', 'site-ico');
    a.appendChild(ico);
    if (window.paintIcon) window.paintIcon(ico, s);
    else ico.textContent = (s.name.charAt(0) || '?').toUpperCase();

    var text = el('span', 'as-text');
    text.appendChild(el('b', null, s.name));
    if (s.desc) text.appendChild(el('em', null, s.desc));
    a.appendChild(text);

    var go = el('span', 'as-go');
    go.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>';
    a.appendChild(go);

    return a;
  }

  /* ---------- 渲染 ----------
     两种模式：
       · 点分类标签 → onlyGroup 传分类 id，只显示这一个分类
       · 输入关键词 → keyword 生效，跨分类模糊匹配
     之前只有关键词模式，点标签时是拿分类名当关键词去搜，
     结果「游戏商城」会把「游戏平台」里的站点也带出来，看起来像两个分类打架。 */
  function subBlock(label, list, isGlobal) {
    var wrap = el('div', 'as-sub' + (isGlobal ? ' is-global' : ''));
    wrap.appendChild(el('span', 'as-sub-title', label));
    wrap.appendChild(el('span', 'as-sub-num', list.length));

    var grid = el('div', 'as-grid');
    list.forEach(function (s) { grid.appendChild(buildItem(s)); });
    wrap.appendChild(grid);
    return wrap;
  }

  function render(keyword, onlyGroup) {
    var key = String(keyword || '').trim().toLowerCase();
    var box = $('asGroups');
    if (!box) return;
    box.textContent = '';
    var shown = 0;

    GROUPS.forEach(function (g) {
      if (onlyGroup && g.id !== onlyGroup) return;

      function hit(s) {
        if (!key) return true;
        return (s.name + ' ' + s.desc + ' ' + s.key + ' ' + g.title).toLowerCase().indexOf(key) > -1;
      }

      var cn = g.cn.filter(hit);
      var gl = g.global.filter(hit);
      if (!cn.length && !gl.length) return;
      shown += cn.length + gl.length;

      var sec = el('section', 'as-group');
      sec.id = 'g-' + g.id;

      var head = el('div', 'as-group-head');
      var h2 = el('h2');
      if (g.emoji) h2.appendChild(el('span', 'as-group-emoji', g.emoji));
      h2.appendChild(document.createTextNode(g.title));
      head.appendChild(h2);
      head.appendChild(el('span', 'as-group-num', (cn.length + gl.length) + ' 个'));
      sec.appendChild(head);

      if (cn.length) sec.appendChild(subBlock('国内站点', cn, false));
      if (gl.length) sec.appendChild(subBlock('国外站点', gl, true));

      box.appendChild(sec);
    });

    if ($('asEmpty')) $('asEmpty').hidden = shown > 0;
  }

  /* ---------- 分类快捷筛选 ---------- */
  function initChips() {
    var box = $('asChips');
    if (!box) return;

    function setActive(node) {
      Array.prototype.forEach.call(box.children, function (n) { n.classList.remove('is-active'); });
      node.classList.add('is-active');
    }

    /* 点分类标签 = 精确看这一个分类，不再拿分类名当关键词去模糊匹配 */
    function pick(node, groupId) {
      setActive(node);
      var input = $('asFilter');
      if (input) input.value = '';
      if ($('asClear')) $('asClear').hidden = true;
      render('', groupId);
    }

    var all = el('button', 'as-chip is-active', '全部');
    all.type = 'button';
    all.addEventListener('click', function () { pick(all, ''); });
    box.appendChild(all);

    GROUPS.forEach(function (g) {
      var b = el('button', 'as-chip', (g.emoji ? g.emoji + ' ' : '') + g.title);
      b.type = 'button';
      b.addEventListener('click', function () { pick(b, g.id); });
      box.appendChild(b);
    });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    if ($('asTotal')) $('asTotal').textContent = TOTAL;
    if ($('asCn')) $('asCn').textContent = TOTAL_CN;
    if ($('asGlobal')) $('asGlobal').textContent = TOTAL_GLOBAL;
    if ($('asMore')) {
      $('asMore').textContent = '另外还有 ' + EXTRA +
        ' 个「一搜就能找到」的官网（网盘、视频、音乐、购物等）没有列在这里；' +
        '如果你不想自己搜，直接在下面的输入框里打关键词也能找到，比如「网盘」「听歌」「买票」。';
    }

    initChips();
    render('');

    /* 从主页分类的「更多」按钮跳过来时会带 ?cat=xxx，
       这里直接把筛选切到那个分类，并滚过去。 */
    var want = '';
    try { want = new URLSearchParams(location.search).get('cat') || ''; } catch (e) { }

    if (want) {
      var chips = $('asChips');
      var idx = -1;
      GROUPS.forEach(function (g, i) { if (g.id === want) idx = i; });

      /* chips 的第 0 个是「全部」，所以分类在 chips 里要往后挪一位 */
      var target = (chips && idx >= 0) ? chips.children[idx + 1] : null;
      if (target) {
        Array.prototype.forEach.call(chips.children, function (n) { n.classList.remove('is-active'); });
        target.classList.add('is-active');
        render('', want);

        var sec = document.getElementById('g-' + want);
        if (sec) {
          window.setTimeout(function () {
            try { sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            catch (e) { sec.scrollIntoView(); }
          }, 140);
        }
      }
    }

    var input = $('asFilter');
    var timer = null;

    if (input) {
      input.addEventListener('input', function () {
        var has = input.value.trim() !== '';
        if ($('asClear')) $('asClear').hidden = !has;

        var chips = $('asChips');
        if (chips) {
          Array.prototype.forEach.call(chips.children, function (n) { n.classList.remove('is-active'); });
        }

        window.clearTimeout(timer);
        timer = window.setTimeout(function () { render(input.value); }, 90);
      });
    }

    if ($('asClear')) {
      $('asClear').addEventListener('click', function () {
        if (input) input.value = '';
        $('asClear').hidden = true;
        render('');
        if (input) input.focus();
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
