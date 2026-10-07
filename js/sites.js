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
          icon: s.icon, key: s.key || '', alias: s.alias || null,
          region: s.region || 'global', top: true
        });
      });
      if (sites.length) {
        out.push({
          id: cat.id || cat.name,
          title: cat.name,
          emoji: cat.icon || '',
          group: cat.group || '',
          /* 分类自带的额外入口（如显卡检测），跟着一起带过去 */
          tool: cat.tool || null,
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
        icon: s.icon, key: s.key || '', alias: s.alias || null,
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
        /* 这些分组来自「完整索引」，用 data.js 的 indexGroupOf 说明它归哪个大类 */
        out.push({
          id: 'so-' + c, title: c, emoji: '',
          group: (CFG.indexGroupOf || {})[c] || '',
          sites: byCat[c]
        });
      }
    });

    /* 每个分组标上大类名，并按大类的顺序排在一起 */
    var GNAMES = {};
    (CFG.groups || []).forEach(function (g) { GNAMES[g.id || g.name] = g.name; });
    out.forEach(function (g) { g.groupName = GNAMES[g.group] || ''; });

    /* 组内按字母排序，同时拆成国内 / 国外两段 */
    out.forEach(function (g) {
      g.cn = g.sites.filter(function (s) { return s.region === 'cn'; }).sort(byName);
      g.global = g.sites.filter(function (s) { return s.region !== 'cn'; }).sort(byName);
    });

    /* 同一个大类的分组排到一起，顺序跟着 data.js 里 groups 的声明走；
       没归大类的排在最后。 */
    var GORDER = {};
    (CFG.groups || []).forEach(function (g, i) { GORDER[g.id || g.name] = i; });
    out.sort(function (a, b) {
      var ia = a.group in GORDER ? GORDER[a.group] : 999;
      var ib = b.group in GORDER ? GORDER[b.group] : 999;
      return ia - ib;
    });

    return out;
  })();

  /* 再往上归一层：把小类按大类归并成「大类 → 小类」的树。
     主页是两层，这里跟着两层，两页的分类体系才一致。 */
  var TREE = (function () {
    var out = [];
    var byId = {};

    (CFG.groups || []).forEach(function (g) {
      var gid = g.id || g.name;
      if (byId[gid]) return;
      var item = {
        id: gid,
        name: g.name,
        icon: g.icon || '',
        desc: g.desc || '',
        cats: []
      };
      out.push(item);
      byId[gid] = item;
    });

    GROUPS.forEach(function (c) {
      var bucket = byId[c.group];
      if (!bucket) {
        bucket = {
          id: c.group || ('solo-' + c.id),
          name: c.groupName || c.title,
          icon: c.emoji || '',
          desc: '',
          cats: []
        };
        out.push(bucket);
        byId[bucket.id] = bucket;
      }
      bucket.cats.push(c);
    });

    return out.filter(function (g) { return g.cats.length; });
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
    var b = el('b');
    b.appendChild(document.createTextNode(s.name));
    /* 别名跟在名字后面：Photoshop（PS） */
    if (s.alias && s.alias.length) {
      b.appendChild(el('span', 'name-alias', '（' + s.alias.slice(0, 2).join('、') + '）'));
    }
    text.appendChild(b);
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

    TREE.forEach(function (grp) {
      if (onlyGroup && grp.id !== onlyGroup) return;

      function hit(s, catTitle) {
        if (!key) return true;
        /* 别名也参与筛选，输「PS」「酒馆」都能筛到 */
        var alias = (s.alias || []).join(' ');
        return (s.name + ' ' + alias + ' ' + s.desc + ' ' + s.key + ' ' + catTitle + ' ' + grp.name)
          .toLowerCase().indexOf(key) > -1;
      }

      /* 先算每个小类命中多少，空的小类不占位置 */
      var blocks = [];
      var grpNum = 0;

      grp.cats.forEach(function (cat) {
        var cn = cat.cn.filter(function (s) { return hit(s, cat.title); });
        var gl = cat.global.filter(function (s) { return hit(s, cat.title); });
        if (!cn.length && !gl.length) return;
        grpNum += cn.length + gl.length;
        blocks.push({ cat: cat, cn: cn, gl: gl });
      });

      if (!blocks.length) return;
      shown += grpNum;

      var sec = el('section', 'as-group');
      sec.id = 'g-' + grp.id;

      var head = el('div', 'as-group-head');
      var h2 = el('h2');
      if (grp.icon) h2.appendChild(el('span', 'as-group-emoji', grp.icon));
      h2.appendChild(document.createTextNode(grp.name));
      head.appendChild(h2);
      head.appendChild(el('span', 'as-group-num', grpNum + ' 个'));
      sec.appendChild(head);

      if (grp.desc) sec.appendChild(el('p', 'as-group-desc', grp.desc));

      /* 大类底下只剩一个小类时把小类标题省掉，免得和上面重复 */
      var solo = blocks.length === 1;

      blocks.forEach(function (b) {
        var catSec = el('div', 'as-cat');
        catSec.id = 'gc-' + b.cat.id;

        /* 分类自带的工具入口（如显卡检测）。放在标题判断外面 ——
           因为「显卡与驱动」这种只有一个小类的情况会省掉标题，
           但检测入口还是得有。 */
        if (b.cat.tool && b.cat.tool.href) {
          var toolBar = el('a', 'as-cat-tool');
          toolBar.href = b.cat.tool.href;

          var tIco = el('span', 'as-cat-tool-ico');
          tIco.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3.5" y="5" width="17" height="11" rx="2"/><path d="M8 20h8M12 16v4"/></svg>';
          toolBar.appendChild(tIco);

          var tTxt = el('div', 'as-cat-tool-txt');
          tTxt.appendChild(el('b', null, b.cat.tool.label || '用工具测一下'));
          if (b.cat.tool.note) tTxt.appendChild(el('small', null, b.cat.tool.note));
          toolBar.appendChild(tTxt);

          toolBar.appendChild(el('span', 'as-cat-tool-go', '去检测 →'));
          catSec.appendChild(toolBar);
        }

        if (!solo) {
          var cHead = el('div', 'as-cat-head');
          var h3 = el('h3');
          if (b.cat.emoji) h3.appendChild(el('span', 'as-cat-emoji', b.cat.emoji));
          h3.appendChild(document.createTextNode(b.cat.title));
          cHead.appendChild(h3);
          cHead.appendChild(el('span', 'as-cat-num', (b.cn.length + b.gl.length) + ' 个'));
          catSec.appendChild(cHead);
        }

        if (b.cn.length) catSec.appendChild(subBlock('国内站点', b.cn, false));
        if (b.gl.length) catSec.appendChild(subBlock('国外站点', b.gl, true));
        sec.appendChild(catSec);
      });

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

    /* 快捷词按大类排，点一下看整个大类 —— 免得「游戏商城 / 游戏引擎 / 游戏平台」
       三个挤在一起，看着像三个不相干的东西。 */
    TREE.forEach(function (grp) {
      var b = el('button', 'as-chip', (grp.icon ? grp.icon + ' ' : '') + grp.name);
      b.type = 'button';
      b.addEventListener('click', function () { pick(b, grp.id); });
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
      TREE.forEach(function (g, i) { if (g.id === want) idx = i; });

      /* 主页的「更多」传的是小类 id（如 game-store），
         chips 上只有大类，这时就退回到它所属的大类。 */
      if (idx < 0) {
        var owner = '';
        for (var i = 0; i < GROUPS.length; i++) {
          if (GROUPS[i].id === want) { owner = GROUPS[i].group; break; }
        }
        if (owner) {
          want = owner;
          TREE.forEach(function (g, j) { if (g.id === want) idx = j; });
        }
      }

      /* chips 的第 0 个是「全部」，所以大类在 chips 里要往后挪一位 */
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
