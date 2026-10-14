/* ============================================================
   小工具 · 预设列表
   ------------------------------------------------------------
   两个页面共用同一套「可折叠分组」：
     · 新机预设    —— data.js 的 newPC，一组一类软件，每条指向官网
     · 预设提示词  —— data.js 的 prompts，一组一类场景，每条是一段提示词
   默认全部展开，点标题收起；右上角有个「全部收起 / 全部展开」。
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

  /* 复制到剪贴板，返回 Promise<boolean>。
     点 AI 对话按钮时要先确认复制成功了再开新页，所以得能拿到结果，
     不能只是弹个提示就完事。 */
  function copyAsync(text) {
    function fb() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }

    return new Promise(function (resolve) {
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { resolve(true); },
          function () { resolve(fb()); });
      } else {
        resolve(fb());
      }
    });
  }

  function copy(text, msg) {
    copyAsync(text).then(function (ok) {
      if (window.showToast) window.showToast(ok ? msg : '复制失败，请手动选中');
    });
  }

  /* ---------- 站点图标 ----------
     tools.html 不加载 app.js，所以这里用一份精简版：
     先试本地图标（assets/icons/<域名>.png），没有再退回名字首字。
     全站不依赖任何外部图标服务，这里也守住这条。 */
  var COLORS = [
    ['#4D6BFE', '#7B9BFF'], ['#2E9BFF', '#68C4FF'], ['#6C5CE7', '#A29BFE'],
    ['#00B4A6', '#4FE0C8'], ['#F2994A', '#F7C06B'], ['#EB5757', '#FF8A80'],
    ['#0EA5E9', '#54C8F5'], ['#8B5CF6', '#C4A2FF'], ['#10B981', '#5FE0B0'],
    ['#F43F5E', '#FF8FA3']
  ];

  function paintIco(node, name, url) {
    var host = '';
    try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { }

    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 100000;
    var pair = COLORS[h % COLORS.length];
    node.style.background = 'linear-gradient(135deg,' + pair[0] + ',' + pair[1] + ')';
    node.textContent = (String(name).charAt(0) || '?').toUpperCase();

    if (!host) return;

    var img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.onload = function () { node.textContent = ''; node.appendChild(img); };
    img.onerror = function () { /* 没有就保持首字 */ };
    img.src = 'assets/icons/' + host + '.png';
  }

  /* ---------- 折叠分组 ----------
     onToggle 是「全部收起/展开」按钮要的刷新函数：
     用户单独收起某一组时，按钮上的文案也得跟着变。 */
  function buildGroup(g, key, renderItem, onToggle, startOpen) {
    var open = startOpen !== false;

    var sec = el('section', 'pg' + (open ? ' is-open' : ''));
    sec.setAttribute('data-key', key);
    sec.id = 'pg-' + key;                 /* 左侧导航要滚到它 */

    var head = el('button', 'pg-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', open ? 'true' : 'false');

    var arrow = el('span', 'pg-arrow');
    arrow.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 6l6 6-6 6"/></svg>';
    head.appendChild(arrow);

    head.appendChild(el('span', 'pg-emoji', g.icon || '📁'));

    var tt = el('span', 'pg-title');
    tt.appendChild(el('b', null, g.name));
    head.appendChild(tt);

    head.appendChild(el('em', 'pg-num', String((g.items || []).length)));

    var body = el('div', 'pg-body');
    body.hidden = !open;
    if (g.note) body.appendChild(el('p', 'pg-note', g.note));

    var grid = el('div', 'pg-grid');
    (g.items || []).forEach(function (it) { grid.appendChild(renderItem(it)); });
    body.appendChild(grid);

    head.addEventListener('click', function () {
      var open = body.hidden;
      body.hidden = !open;
      sec.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (onToggle) onToggle();
    });

    sec.appendChild(head);
    sec.appendChild(body);
    return sec;
  }

  /* 「全部收起 / 全部展开」按钮。
     文案始终显示「点下去会发生什么」，所以每次有分组变化都要刷一次。 */
  function makeToggleAll(btn, box) {
    function secs() { return box.querySelectorAll('.pg'); }

    function allOpen() {
      var list = secs();
      if (!list.length) return true;
      for (var i = 0; i < list.length; i++) {
        if (!list[i].classList.contains('is-open')) return false;
      }
      return true;
    }

    function apply(open) {
      Array.prototype.forEach.call(secs(), function (sec) {
        sec.classList.toggle('is-open', open);
        sec.querySelector('.pg-body').hidden = !open;
        sec.querySelector('.pg-head').setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      refresh();
    }

    function refresh() {
      if (btn) btn.textContent = allOpen() ? '全部收起' : '全部展开';
    }

    if (btn) {
      btn.textContent = '全部收起';
      btn.addEventListener('click', function () { apply(!allOpen()); });
    }
    return refresh;
  }

  /* ---------- 把 newPC 或 prompts 里的 groups 拍平成一个列表 ----------
     两个数据结构的差别只在组里多不多一个 once 字段，这里统一处理。 */
  function flatGroups(raw) {
    var out = (raw.groups || []).slice();
    if (raw.once) out.push(raw.once);
    return out;
  }

  /* ---------- 顶部说明块 ----------
     新机预设靠它先说清「为什么不提供一键安装」——
     不然访客第一眼只看到一串要一个个点的官网，很容易直接关掉。 */
  function buildIntro(I) {
    var box = el('div', 'preset-intro');
    if (I.title) box.appendChild(el('h4', null, I.title));
    if (I.body) box.appendChild(el('p', null, I.body));

    if (I.points && I.points.length) {
      var pts = el('div', 'preset-intro-points');
      I.points.forEach(function (p) {
        var it = el('div', 'preset-intro-point');
        it.appendChild(el('b', null, p.t));
        it.appendChild(el('span', null, p.d));
        pts.appendChild(it);
      });
      box.appendChild(pts);
    }

    if (I.note) {
      var n = el('p', 'preset-intro-note');
      n.innerHTML = I.note;          /* 数据是我们自己写的，允许一点粗体 */
      box.appendChild(n);
    }
    return box;
  }

  /* ---------- 新机预设 ---------- */
  function linkItem(it) {
    var a = el('a', 'pg-item');
    a.href = it.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.title = it.name + ' 官网';

    var ico = el('span', 'pg-ico');
    paintIco(ico, it.name, it.url);
    a.appendChild(ico);

    var txt = el('span', 'pg-text');
    txt.appendChild(el('b', null, it.name));
    if (it.desc) txt.appendChild(el('em', null, it.desc));
    if (it.tip) txt.appendChild(el('small', null, it.tip));
    a.appendChild(txt);

    a.appendChild(el('span', 'pg-go', '官网 →'));
    return a;
  }

  function renderNewPC() {
    var D = CFG.newPC;
    var box = $('npGroups');
    if (!D || !box) return;

    if ($('npLead')) $('npLead').textContent = D.lead || '';
    if ($('npBadge')) $('npBadge').textContent = D.title || '新机预设';

    if ($('npIntro')) {
      $('npIntro').textContent = '';
      if (D.intro) $('npIntro').appendChild(buildIntro(D.intro));
    }

    var total = 0;
    flatGroups(D).forEach(function (g) { total += (g.items || []).length; });
    if ($('npCount')) $('npCount').textContent = total + ' 个推荐，分 ' + flatGroups(D).length + ' 类';

    box.textContent = '';
    var refresh = makeToggleAll($('npToggle'), box);
    flatGroups(D).forEach(function (g, i) {
      box.appendChild(buildGroup(g, 'np' + i, linkItem, refresh));
    });

    if ($('npFoot') && D.footer) {
      $('npFoot').textContent = D.footer;
      $('npFoot').hidden = false;
    }
    refresh();
  }

  /* ============================================================
     预设提示词 —— 左边选，右边看
     ------------------------------------------------------------
     左边是预设选择区：完整工具（网页翻译）+ 16 条提示词，
     按分组收在可折叠的小节里，全部都在这，不用来回滚页面。
     右边是显示和处理区：只显示当前选中的那一条，可以就地改、复制。
     ============================================================ */

  function buildPresetNav(nav, onPick) {
    var D = CFG.prompts;
    if (!nav || !D) return null;
    nav.textContent = '';

    /* ① 完整工具（网页翻译）—— 它也是提示词，自己就算一个大类，
          排在「求职」上面。以前这里插了一句「提示词」当分隔，
          反倒暗示它不算提示词，去掉了。
          它就在这一页展开（多带语言和语气设置），不再跳到别的页面。 */
    (D.tools || []).forEach(function (t, ti) {
      var b = el('button', 'pm-nav-tool');
      b.type = 'button';
      b.setAttribute('data-tool', String(ti));
      b.appendChild(el('span', 'pm-nav-emoji', t.icon || '🧰'));
      var tx = el('span', 'pm-nav-txt');
      tx.appendChild(el('b', null, t.name));
      tx.appendChild(el('small', null, '完整工具 · 就在这一页'));
      b.appendChild(tx);
      b.addEventListener('click', function () { onPick({ tool: ti }); });
      nav.appendChild(b);
    });

    /* ② 各分组：默认全部收起，展开一类就收起其他类。
          这样一眼能看全有哪几类，不用滚一长条去找。 */
    var boxes = [];

    flatGroups(D).forEach(function (g, gi) {
      var box = el('div', 'pm-nav-group');

      var head = el('button', 'pm-nav-group-head');
      head.type = 'button';
      head.setAttribute('aria-expanded', 'false');
      head.appendChild(el('span', 'pm-nav-emoji', g.icon || '📁'));
      head.appendChild(el('span', 'pm-nav-name', g.name));
      head.appendChild(el('em', 'pm-nav-num', String((g.items || []).length)));

      var list = el('div', 'pm-nav-items');
      list.hidden = true;

      (g.items || []).forEach(function (it, ii) {
        var b = el('button', 'pm-nav-item');
        b.type = 'button';
        b.setAttribute('data-gi', String(gi));
        b.setAttribute('data-ii', String(ii));
        b.appendChild(el('span', 'pm-nav-dot'));
        b.appendChild(el('span', 'pm-nav-name', it.title));
        b.addEventListener('click', function () { onPick({ gi: gi, ii: ii }); });
        list.appendChild(b);
      });

      head.addEventListener('click', function () { openOnly(gi); });

      box.appendChild(head);
      box.appendChild(list);
      nav.appendChild(box);
      boxes.push({ box: box, list: list, head: head });
    });

    /* 只留一个开着 —— 点标题展开自己、收起别的；选中某一条时也走这里 */
    function openOnly(gi) {
      boxes.forEach(function (o, i) {
        var on = i === gi;
        o.list.hidden = !on;
        o.head.setAttribute('aria-expanded', on ? 'true' : 'false');
        o.box.classList.toggle('is-open', on);
      });
    }

    return { openGroup: openOnly };
  }

  /* sel 是 { tool: n } 或 { gi, ii } —— 两种选中状态共用一套标记 */
  function markNav(nav, sel) {
    Array.prototype.forEach.call(nav.querySelectorAll('.pm-nav-tool'), function (n) {
      var on = sel.tool != null && Number(n.getAttribute('data-tool')) === sel.tool;
      n.classList.toggle('is-on', on);
    });
    Array.prototype.forEach.call(nav.querySelectorAll('.pm-nav-item'), function (n) {
      var on = sel.tool == null &&
        Number(n.getAttribute('data-gi')) === sel.gi && Number(n.getAttribute('data-ii')) === sel.ii;
      n.classList.toggle('is-on', on);
    });
  }

  /* 当前选中的是哪一条：{ tool: 0 }（网页翻译）或 { gi, ii }（普通提示词）。
     默认选中「网页翻译」—— 进来第一眼就是那个带语言设置的完整工具。 */
  var pmCur = { tool: 0 };

  /* 中栏有两种形态，结构都写死在 translate.html 里：
     · #trTool  —— 网页翻译，带语言/语气设置，由 js/translate.js 管
     · #pmPlain —— 普通提示词，只要一个正文框
     这里只负责决定显示哪一个、把后者的内容填进去。 */
  function renderDetail() {
    var D = CFG.prompts;
    if (!D) return;

    var plain = $('pmPlain');
    var tool = $('trTool');

    if (pmCur.tool != null) {
      if (plain) plain.hidden = true;
      if (tool) tool.hidden = false;
      return;
    }

    var groups = flatGroups(D);
    var g = groups[pmCur.gi];
    var it = g && (g.items || [])[pmCur.ii];
    if (!it || !plain) return;

    if (tool) tool.hidden = true;
    plain.hidden = false;

    var tags = $('pmTags');
    if (tags) {
      tags.textContent = '';
      tags.appendChild(el('span', 'pm-group-chip', (g.icon ? g.icon + ' ' : '') + g.name));
      if (it.tag) tags.appendChild(el('span', 'pm-tag', it.tag));
    }
    if ($('pmTitle')) $('pmTitle').textContent = it.title;
    if ($('pmDesc')) { $('pmDesc').textContent = it.desc || ''; $('pmDesc').hidden = !it.desc; }

    var ta = $('pmText');
    if (ta) ta.value = it.body;

    if ($('pmTip')) { $('pmTip').textContent = it.tip || ''; $('pmTip').hidden = !it.tip; }

    /* 这里只绑「和这条提示词有关」的操作。
       去 AI 对话归右边第三栏管，中栏不放 —— 各栏只管自己那件事。 */
    /* 用 onclick 覆盖而不是 addEventListener —— 每换一条都要换掉旧的闭包，
       监听器会越挂越多。 */
    if ($('pmCopy')) {
      $('pmCopy').onclick = function () {
        copy(ta ? ta.value : '', '提示词已复制 —— 粘到 AI 对话里就能用');
      };
    }
    if ($('pmReset')) {
      $('pmReset').onclick = function () {
        if (ta) ta.value = it.body;
        if (window.showToast) window.showToast('已恢复成默认内容');
      };
    }
  }

  /* 右栏点 AI 时要复制的那条提示词：选的是网页翻译就取翻译正文，
     选的是普通提示词就取它那一条。中栏换成写死的结构之后，得这么问。 */
  function currentPromptText() {
    if (pmCur.tool != null) {
      return window.TranslateTool ? window.TranslateTool.text() : '';
    }
    var ta = $('pmText');
    return ta ? ta.value : '';
  }

  /* 右栏：AI 对话入口。点一下 = 复制中栏当前这条提示词 + 打开对话页。 */
  function renderAiList() {
    var box = $('aiList');
    if (!box || !window.AiList) return;

    window.AiList.render(box, function (item) {
      /* 复制必须在这次点击里发起，否则浏览器会当成「不是用户操作」拦掉。
         先复制、再开新页，顺序不能反。 */
      var p = copyAsync(currentPromptText());
      if (window.TranslateTool) window.TranslateTool.markCopied();
      window.open(item.url, '_blank', 'noopener,noreferrer');
      p.then(function (ok) {
        if (window.showToast) {
          window.showToast(ok
            ? '提示词已复制，到 ' + item.name + ' 直接粘贴就行'
            : '自动复制没成功，请回来点一下「复制」');
        }
      });
    });
  }

  function renderPrompts() {
    var D = CFG.prompts;
    var nav = $('pmNav');
    if (!D || !nav) return;

    var api = buildPresetNav(nav, function (sel) {
      pmCur = sel;
      markNav(nav, sel);
      if (sel.gi != null) api.openGroup(sel.gi);   /* 选中某条时展开它所在那一类 */
      renderDetail();
      /* 窄屏上中栏跑到下面去了，选完得滚过去，不然点了像没反应 */
      if (window.innerWidth <= 1000) {
        var main = document.querySelector('.pm-main');
        if (main) {
          try { main.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
          catch (e) { main.scrollIntoView(); }
        }
      }
    });

    /* 带锚点进来的直接定位：#pm-tool-0 是网页翻译，#pm-<组>-<条> 是某一条 */
    var hash = '';
    try { hash = String(location.hash || '').replace(/^#/, ''); } catch (e) { }
    var mt = hash.match(/^pm-tool-(\d+)$/);
    var m = hash.match(/^pm-(\d+)-(\d+)$/);
    if (mt) pmCur = { tool: Number(mt[1]) };
    else if (m) pmCur = { gi: Number(m[1]), ii: Number(m[2]) };

    var groups = flatGroups(D);
    if (pmCur.tool != null) {
      if (!(D.tools || [])[pmCur.tool]) pmCur = { tool: 0 };
    } else if (!groups[pmCur.gi] || !((groups[pmCur.gi].items || [])[pmCur.ii])) {
      pmCur = { tool: 0 };
    }

    markNav(nav, pmCur);
    if (pmCur.gi != null) api.openGroup(pmCur.gi);
    renderDetail();
    renderAiList();
  }

  /* ============================================================
     右栏「去找 AI 对话」列表本身 —— 数据在 data.js 的 prompts.aiSites
     ============================================================ */
  var AI_COLORS = [
    ['#4D6BFE', '#7B9BFF'], ['#2E9BFF', '#68C4FF'], ['#6C5CE7', '#A29BFE'],
    ['#00B4A6', '#4FE0C8'], ['#F2994A', '#F7C06B'], ['#EB5757', '#FF8A80'],
    ['#0EA5E9', '#54C8F5'], ['#8B5CF6', '#C4A2FF'], ['#10B981', '#5FE0B0']
  ];

  /* 图标：自定义 → 本地图标 → 在线 favicon → 名字首字，逐级降级 */
  function aiIcon(name, url, custom) {
    var box = el('span', 'tr-item-ico');
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 100000;
    var pair = AI_COLORS[h % AI_COLORS.length];
    box.style.background = 'linear-gradient(135deg,' + pair[0] + ',' + pair[1] + ')';
    box.textContent = (String(name).replace(/^[\s\W]+/, '')[0] || '?').toUpperCase();

    var host = '';
    try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { }
    if (!host && !custom) return box;

    var chain = [];
    if (custom) chain.push(custom);
    if (host) {
      chain.push('assets/icons/' + host + '.png');
      chain.push('https://icons.duckduckgo.com/ip3/' + host + '.ico');
    }

    var idx = 0;
    var img = new Image();
    img.alt = '';
    img.referrerPolicy = 'no-referrer';
    img.onload = function () {
      box.textContent = '';
      box.appendChild(img);
      box.style.background = '#fff';
    };
    img.onerror = function () {
      idx++;
      if (idx < chain.length) img.src = chain[idx];
      else img.remove();
    };
    img.src = chain[0];
    return box;
  }

  window.AiList = {
    /* onPick(item) 交给调用方 —— 一般是「复制当前提示词 + 打开对话页」 */
    render: function (box, onPick) {
      var D = CFG.prompts || {};
      var list = D.aiSites || [];
      if (!box) return 0;

      box.textContent = '';
      list.forEach(function (item) {
        var b = el('button', 'tr-item');
        b.type = 'button';
        b.title = item.url;
        b.appendChild(aiIcon(item.name, item.url, item.icon));

        var txt = el('span', 'tr-item-text');
        txt.appendChild(el('b', null, item.name));
        if (item.note) txt.appendChild(el('span', null, item.note));
        b.appendChild(txt);

        b.addEventListener('click', function () { onPick(item); });
        box.appendChild(b);
      });
      return list.length;
    }
  };

  /* 左栏的列表不再对外暴露 —— 所有提示词都收在「提示词助手」一个页面里，
     没有第二个页面需要复用这份导航了。 */

  function boot() {
    renderNewPC();
    renderPrompts();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
