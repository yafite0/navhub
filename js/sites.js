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
          region: s.region || 'global', top: true,
          raw: s        /* 「介绍」按钮要拿原始对象去开弹窗（intro / shots 在里面） */
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
        region: s.region || 'global', top: false,
        raw: s          /* 同上：「介绍」按钮要用它开弹窗 */
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

  /* ---------- 单个站点（卡片） ----------
     格式和主页那张「精选卡片」对齐：
       上行：图标 + 名字（+ 别名 + 国内/国外标签）+ 一句话介绍
       下行：介绍（有 intro 才出现）+ 直达
     和主页那张的差别只有一个：**不加背景图 / 截图** ——
     这一页动辄上百个条目，图上去了列表会长得没边。
     图标走 app.js 的 paintIcon（和主页同一套），抓不到才退回名字首字。 */
  function buildItem(s) {
    var card = el('article', 'as-card');

    var top = el('div', 'as-card-top');
    var ico = el('span', 'site-ico');
    if (window.paintIcon) window.paintIcon(ico, s);
    else ico.textContent = (String(s.name).charAt(0) || '?').toUpperCase();
    top.appendChild(ico);

    /* 名字单独包一层才收得住：这一行是 flex，名字那截负责省略号，
       别名和标签 flex: none 不会被压掉 —— 不这么写，站名一长
       （还带着别名的那种），标签就被挤出去或者叠上去了。 */
    var title = el('div', 'as-card-title');
    var h4 = el('h4');
    h4.appendChild(el('span', 'name-main', s.name));
    /* 别名跟在名字后面：Photoshop（PS） */
    if (s.alias && s.alias.length) {
      h4.appendChild(el('span', 'name-alias', '（' + s.alias.slice(0, 2).join('、') + '）'));
    }
    /* 标签只用两个字：「国内站点」那种四字版会把名字挤到只剩三四个字
       （「WinRAR（RAR）」直接变「WinR…」），两个字省下的 26px 刚好还给名字。 */
    var isCn = s.region === 'cn';
    h4.appendChild(el('span', 'region-tag' + (isCn ? ' is-cn' : ' is-global'),
      isCn ? '国内' : '国外'));
    title.appendChild(h4);
    title.appendChild(el('p', 'as-card-short', s.desc || domainOf(s.url)));
    top.appendChild(title);
    card.appendChild(top);

    var actions = el('div', 'as-card-actions');
    var raw = s.raw || s;

    if (raw.intro) {
      var ib = el('button', 'as-card-btn is-ghost');
      ib.type = 'button';
      ib.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.4M12 7.8h.01"/></svg>介绍';
      /* openIntro 由 js/app.js 提供（sites.html 也引了它） */
      ib.addEventListener('click', function () { if (window.openIntro) window.openIntro(raw); });
      actions.appendChild(ib);
    }

    var go = el('a', 'as-card-btn is-solid');
    go.href = s.url;
    go.target = '_blank';
    go.rel = 'noopener noreferrer';
    go.innerHTML = '直达<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h12M12 6l6 6-6 6"/></svg>';
    actions.appendChild(go);
    card.appendChild(actions);

    return card;
  }

  /* ---------- 渲染 ----------
     两种模式：
       · 点分类标签 → onlyGroup 传分类 id，只显示这一个分类
       · 输入关键词 → keyword 生效，跨分类模糊匹配
     之前只有关键词模式，点标签时是拿分类名当关键词去搜，
     结果「游戏商城」会把「游戏平台」里的站点也带出来，看起来像两个分类打架。 */
  /* 一个分类下的一排站点。
     原来这里按国内 / 国外拆成两块（subBlock），现在不再拆 ——
     同一个分类里混着排、按名字排，归属改由每个条目自己那个标签标，
     省掉两层小标题，一屏能多放不少。 */
  function siteGrid(list) {
    var grid = el('div', 'as-grid');
    list.forEach(function (s) { grid.appendChild(buildItem(s)); });
    return grid;
  }

  function render(keyword, onlyGroup, onlyCat) {
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
        if (onlyCat && cat.id !== onlyCat) return;
        /* 国内 / 国外合并成一个列表，按名字排 —— 归属看条目上的标签 */
        var list = cat.cn.concat(cat.global).sort(byName)
          .filter(function (s) { return hit(s, cat.title); });
        if (!list.length) return;
        grpNum += list.length;
        blocks.push({ cat: cat, list: list });
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
          cHead.appendChild(el('span', 'as-cat-num', b.list.length + ' 个'));
          catSec.appendChild(cHead);
        }

        catSec.appendChild(siteGrid(b.list));
        sec.appendChild(catSec);
      });

      box.appendChild(sec);
    });

    if ($('asEmpty')) $('asEmpty').hidden = shown > 0;
  }

  /* ---------- 左侧分类导航 ----------
     大类下面挂小类，点大类看整块，点小类只看那一小块。
     侧栏跟着页面滚动一直停在左上角。 */
  function initSide() {
    var box = $('asSide');
    if (!box) return;
    box.textContent = '';

    var panel = el('div', 'as-side-box');
    panel.appendChild(el('p', 'as-side-title', '按分类浏览'));

    function clearActive() {
      Array.prototype.forEach.call(panel.querySelectorAll('.is-active'), function (n) {
        n.classList.remove('is-active');
      });
    }

    function pick(node, groupId, catId) {
      clearActive();
      node.classList.add('is-active');

      /* 点小类时，把所在的大类也标上，用户能看出自己在哪一层 */
      if (catId && groupId) {
        var owner = panel.querySelector('.as-side-btn[data-grp="' + groupId + '"]');
        if (owner) owner.classList.add('is-sub');
      }

      var input = $('asFilter');
      if (input) input.value = '';
      if ($('asClear')) $('asClear').hidden = true;

      render('', groupId, catId);
    }

    var all = el('button', 'as-side-all is-active');
    all.type = 'button';
    all.appendChild(el('span', null, '全部网站'));
    var total = TREE.reduce(function (n, g) {
      return n + g.cats.reduce(function (m, c) { return m + c.sites.length; }, 0);
    }, 0);
    all.appendChild(el('em', 'as-side-num', String(total)));
    all.addEventListener('click', function () { pick(all, '', ''); });
    panel.appendChild(all);

    TREE.forEach(function (grp) {
      var item = el('div', 'as-side-item');

      var btn = el('button', 'as-side-btn');
      btn.type = 'button';
      btn.setAttribute('data-grp', grp.id);
      btn.appendChild(el('span', 'as-side-ico', grp.icon || '📁'));
      btn.appendChild(el('span', 'as-side-name', grp.name));

      var num = grp.cats.reduce(function (n, c) { return n + c.sites.length; }, 0);
      btn.appendChild(el('em', 'as-side-num', String(num)));

      var arrow = el('span', 'as-side-arrow');
      arrow.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 6l6 6-6 6"/></svg>';
      btn.appendChild(arrow);

      btn.addEventListener('click', function () { pick(btn, grp.id, ''); });
      item.appendChild(btn);

      var sub = el('div', 'as-side-sub');
      grp.cats.forEach(function (cat) {
        var cb = el('button', 'as-side-cat');
        cb.type = 'button';
        var label = el('span');
        label.textContent = (cat.emoji ? cat.emoji + ' ' : '') + cat.title;
        cb.appendChild(label);
        cb.appendChild(el('em', 'as-side-num', String(cat.sites.length)));
        cb.addEventListener('click', function () { pick(cb, grp.id, cat.id); });
        sub.appendChild(cb);
      });
      item.appendChild(sub);

      panel.appendChild(item);
    });

    box.appendChild(panel);
  }

  /* ---------- 「关于国外站点」 ----------
     这条讲的是「打不开别慌，先换个网络试试」，第一次来的人最需要看到它。
     所以不折叠、不藏在左栏，直接摊在内容区最上面（见 boot 里的插入）。
     原来它先是页头一整块大提示，后来收成左栏分类卡片里的一个折叠按钮 ——
     折叠之后等于把这条最需要被看到的话藏起来了。 */
  /* 把这块插到内容区最上面（第一个分类之前）。
     左栏只有 236px 宽，全文塞进去要折十行；放在内容区是一两句的事，
     而且它本来就该在视线最先落到的地方。 */
  function mountGlobalNote() {
    var main = document.querySelector('.as-main');
    if (!main) return;
    main.insertBefore(buildGlobalNote(), main.firstChild);
  }

  function buildGlobalNote() {
    var wrap = el('div', 'as-global-note');

    var head = el('div', 'as-global-head');
    head.appendChild(el('span', 'as-global-ico', '🌐'));
    head.appendChild(el('b', null, '关于国外站点'));
    wrap.appendChild(head);

    wrap.appendChild(el('p', null,
      '这些站点的服务器在境外，打开慢、图片加载不出来、甚至整个页面打不开，' +
      '都属于正常情况，和网址本身有没有失效无关。' +
      '遇到这种先换个网络环境试试（比如切到手机热点、关掉加速器或换一个）。' +
      '只有极小概率是域名真的失效 —— 如果换了网络依然打不开，欢迎反馈。'));

    return wrap;
  }

  /* ---------- 启动 ---------- */
  function boot() {
    if ($('asTotal')) $('asTotal').textContent = TOTAL;
    if ($('asCn')) $('asCn').textContent = TOTAL_CN;
    if ($('asGlobal')) $('asGlobal').textContent = TOTAL_GLOBAL;
    /* 原来这里还有一句「另外还有 N 个『一搜就能找到』的官网没有列在这里」——
       方向改了（要尽量多收、不挑好不好搜），这句和新的说法打架，删了。
       后面的 EXTRA 常量也跟着没用了。 */

    initSide();
    mountGlobalNote();
    render('');

    /* 从主页分类的「更多」按钮跳过来时会带 ?cat=xxx，
       这里直接把筛选切到那个分类，并滚过去。 */
    var want = '';
    try { want = new URLSearchParams(location.search).get('cat') || ''; } catch (e) { }

    if (want) {
      /* 侧栏里找对应的大类按钮，直接点它 —— 高亮和筛选都走同一套逻辑。
         主页的「更多」按钮传的是小类 id（如 game-store），
         这种情况退回到它所属的大类。 */
      var btn = document.querySelector('.as-side-btn[data-grp="' + want + '"]');
      if (!btn) {
        var owner = '';
        for (var i = 0; i < GROUPS.length; i++) {
          if (GROUPS[i].id === want) { owner = GROUPS[i].group; break; }
        }
        if (owner) btn = document.querySelector('.as-side-btn[data-grp="' + owner + '"]');
      }
      if (btn) btn.click();
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

      /* 回车和主页那套保持一致：不是跳转，是把输入框里的内容交给搜索引擎。
         这个框是拿来筛列表的，不承担「打开官网」的职责 —— 要进官网就点列表里的条目。 */
      input.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();

        var raw = input.value.trim();
        if (!raw || !window.Seek || !Seek.engines().length) return;
        Seek.open(Seek.engineHref(Seek.engines()[0], raw));
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
