/* ============================================================
   标签筛选器
   ------------------------------------------------------------
   一个弹窗，四组标签（类型 / 平台 / 特性 / 地区），可以任意多选。
   勾了几个就要求几个全部命中 —— 取交集。

   和左边那棵分类树是两个不同的切法：
     分类树 —— 一棵树，站点只属于一条路径，选一个就排除其他
     标签   —— 正交的组合，可以同时要求「免费 + 桌面端 + 中文界面」

   选完点「查看结果」才生效；点 × 或遮罩只是关掉，选择保留。

   ★ 站点标签在 js/tags.js 里维护，加站点时记得补一条。
   ============================================================ */
(function () {
  var TAG_DEF = window.NAV_TAGS;

  /* 当前选中的标签，sites.js 会读这个数组做交集过滤 */
  window.activeTags = [];

  function renderChips() {
    var box = document.getElementById('asTagChips');
    if (!box) return;

    box.innerHTML = '';

    if (!window.activeTags.length) {
      box.hidden = true;
      return;
    }

    window.activeTags.forEach(function (t) {
      var chip = document.createElement('span');
      chip.className = 'as-chip as-chip-tag';

      var txt = document.createElement('span');
      txt.textContent = t;
      chip.appendChild(txt);

      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'as-chip-x';
      x.setAttribute('aria-label', '移除这个标签');
      x.textContent = '\u00d7';
      x.addEventListener('click', function () {
        var i = window.activeTags.indexOf(t);
        if (i > -1) window.activeTags.splice(i, 1);
        renderChips();
        if (window.applyTagFilter) window.applyTagFilter();
      });
      chip.appendChild(x);

      box.appendChild(chip);
    });

    box.hidden = false;
  }

  window.renderTagChips = renderChips;

  /* ---------- 弹窗 ---------- */
  function openPanel() {
    var mask = document.createElement('div');
    mask.className = 'flt-mask';

    var box = document.createElement('div');
    box.className = 'flt-box';

    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'flt-x';
    x.setAttribute('aria-label', '关闭');
    x.innerHTML = '&times;';
    box.appendChild(x);

    var title = document.createElement('div');
    title.className = 'flt-title';
    title.textContent = '筛选';
    box.appendChild(title);

    var sub = document.createElement('p');
    sub.className = 'flt-sub';
    sub.textContent = '勾选多个标签时，只显示全部符合的站点。';
    box.appendChild(sub);

    var wrap = document.createElement('div');
    wrap.className = 'flt-groups';
    box.appendChild(wrap);

    /* 本地草稿：点「查看结果」才写回 activeTags */
    var draft = window.activeTags.slice();

    TAG_DEF.groups.forEach(function (g) {
      var sec = document.createElement('div');
      sec.className = 'flt-group';

      var gn = document.createElement('div');
      gn.className = 'flt-gname';
      gn.textContent = g.name;
      sec.appendChild(gn);

      var row = document.createElement('div');
      row.className = 'flt-tags';

      g.tags.forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'flt-tag' + (draft.indexOf(t) > -1 ? ' is-on' : '');
        b.textContent = t;

        b.addEventListener('click', function () {
          var i = draft.indexOf(t);
          if (i > -1) draft.splice(i, 1);
          else draft.push(t);
          b.classList.toggle('is-on', i < 0);
          syncCount();
        });

        row.appendChild(b);
      });

      sec.appendChild(row);
      wrap.appendChild(sec);
    });

    /* ---------- 底栏 ---------- */
    var foot = document.createElement('div');
    foot.className = 'flt-foot';

    var count = document.createElement('span');
    count.className = 'flt-count';
    foot.appendChild(count);

    var clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'flt-clear';
    clear.textContent = '清空';
    foot.appendChild(clear);

    var apply = document.createElement('button');
    apply.type = 'button';
    apply.className = 'flt-apply';
    apply.textContent = '查看结果';
    foot.appendChild(apply);

    box.appendChild(foot);
    mask.appendChild(box);
    document.body.appendChild(mask);

    function syncCount() {
      count.textContent = draft.length ? '已选 ' + draft.length + ' 个' : '未选择';
    }

    function close() {
      if (mask.parentNode) mask.parentNode.removeChild(mask);
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e) { if (e.key === 'Escape') close(); }

    clear.addEventListener('click', function () {
      draft = [];
      Array.prototype.forEach.call(wrap.querySelectorAll('.flt-tag'), function (b) {
        b.classList.remove('is-on');
      });
      syncCount();
    });

    apply.addEventListener('click', function () {
      window.activeTags = draft.slice();
      renderChips();
      if (window.applyTagFilter) window.applyTagFilter();
      close();
    });

    x.addEventListener('click', close);
    mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
    document.addEventListener('keydown', onKey);

    syncCount();
  }

  function init() {
    var btn = document.getElementById('asFilterOpen');
    if (btn) btn.addEventListener('click', openPanel);
    renderChips();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
