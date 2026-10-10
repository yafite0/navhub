/* ============================================================
   小工具页 —— 顶部提示、主题切换、工具标签页
   （各工具本身的逻辑在 js/widgets.js 里）
   ============================================================ */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  /* 屏幕中下方的简短提示：自动消失、不挡点击 */
  var toastTimer = null;
  window.showToast = function (msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add('is-show'); });
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      t.classList.remove('is-show');
      window.setTimeout(function () { t.hidden = true; }, 260);
    }, 2400);
  };

  function initTheme() {
    var KEY = 'navhub.theme';
    var btn = $('themeBtn');
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

  /* 每个工具是独立界面：由地址栏的 ?tool=xxx 决定显示哪一个，
     没有工具栏、也没有互相切换的按钮。主页各按钮直接指向对应地址。 */
  var TOOL_META = {
    unit: {
      t: '单位 / 汇率换算',
      d: '长度、重量、面积、体积、温度、速度、数据、时间八大类换算，外加 57 种常用货币汇率。两个输入框都可以直接改，换算是双向的。'
    },
    counter: {
      t: '字数统计 / Token 预估',
      d: '统计含标点和不含标点的字数，按模型估算 token 用量，再根据你填写的价格估算费用。'
    },
    specs: {
      t: '驱动工具',
      d: '先看看自己是什么显卡、CPU 和内存，认出型号后再去右边对应的官网下驱动。所有信息都在你的浏览器里读取，不会上传到任何地方。'
    }
  };

  function initTool() {
    var panels = document.querySelectorAll('[data-tool-panel]');
    var want = '';
    try { want = new URLSearchParams(location.search).get('tool') || ''; } catch (e) { }

    if (!want || !document.querySelector('[data-tool-panel="' + want + '"]')) want = 'unit';

    Array.prototype.forEach.call(panels, function (p) {
      p.classList.toggle('is-active', p.getAttribute('data-tool-panel') === want);
    });

    var meta = TOOL_META[want];
    if (meta) {
      if ($('twTitle')) $('twTitle').textContent = meta.t;
      if ($('twDesc')) $('twDesc').textContent = meta.d;
    }
  }

  function boot() {
    initTheme();
    initTool();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
