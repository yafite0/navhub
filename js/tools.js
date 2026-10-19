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
      /* 没有 d：这两句说明分别写进了两个换算区自己的标题旁边，
         页头再来一段只会把页面顶得更长（这一页本来就有滚动条）。 */
    },
    counter: {
      t: '字数统计',
      d: '统计含标点和不含标点的字数，按模型估算 token 用量，再根据你填写的价格估算费用。'
    },
    specs: {
      t: '驱动工具',
      /* 说清楚这些数字是「怎么来的」：浏览器有几个公开接口（WebGL 的
         UNMASKED_RENDERER、navigator.hardwareConcurrency / deviceMemory 等），
         任何网页都能读到，读到的也只是型号级别、不涉及个人身份。
         原来只写「在你的浏览器里读取」，没说来源，读者不好判断可信度。 */
      d: '先看看自己是什么显卡、CPU 和内存，认出型号后再去右边对应的官网下驱动。' +
         '这些数字来自浏览器几个公开接口（显卡走 WebGL 的渲染器标识，' +
         '核心数和内存走 navigator），任何网页都读得到，读到的也只是型号级别，' +
         '整个过程只在本机进行，不会上传。'
    },
    shortcut: {
      t: '生成网页快捷方式',
      d: '填一个网址，生成一个能放到桌面的小文件。以后双击就直接打开那个网站，不用先开浏览器再翻收藏夹。文件在本机生成，不联网、不上传。'
    },
    newpc: {
      t: '新机预设',
      d: '刚拿到一台新电脑该装什么。按用途分好类，每一条都指向官网 —— 不给安装包、没有一键安装，一个一个点，装什么由你决定。'
    },
    /* prompts 已经并进 translate.html，这里连面板一起删了，
       旧的 ?tool=prompts 由 initTool 转过去，不需要再留一份说明。 */
    share: {
      t: '分享小工具',
      d: '感谢您的分享，我不会忘记初心。努力做的更好，只因我被需要。'
    }
  };

  function initTool() {
    var panels = document.querySelectorAll('[data-tool-panel]');
    var want = '';
    try { want = new URLSearchParams(location.search).get('tool') || ''; } catch (e) { }

    /* 提示词已经并进「提示词助手」页（translate.html），这里不再留着重复的一份。
       旧的 ?tool=prompts 链接（可能被收藏过）原样把锚点带过去。 */
    if (want === 'prompts') {
      location.replace('translate.html' + String(location.hash || ''));
      return;
    }

    if (!want || !document.querySelector('[data-tool-panel="' + want + '"]')) want = 'unit';

    var nav = $('twNav');

    /* 切到某个工具：只换右栏、左栏高亮，不重排整页 */
    function apply(key) {
      Array.prototype.forEach.call(panels, function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-tool-panel') === key);
      });

      /* 把当前工具名挂到 body 上：个别工具（分享）要按视口高度撑满，
         用属性选择器比 :has() 稳，旧一点的浏览器也认。 */
      document.body.setAttribute('data-tool', key);

      if (nav) {
        Array.prototype.forEach.call(nav.querySelectorAll('[data-go]'), function (b) {
          b.classList.toggle('is-on', b.getAttribute('data-go') === key);
          b.setAttribute('aria-current', b.getAttribute('data-go') === key ? 'page' : 'false');
        });
      }

      var meta = TOOL_META[key];
      if (meta) {
        if ($('twTitle')) $('twTitle').textContent = meta.t;
        /* 有些工具页没有说明（比如单位换算），这时把 <p> 整个藏掉 ——
           留个空段落会占掉一行的高度 */
        var desc = $('twDesc');
        if (desc) {
          desc.textContent = meta.d || '';
          desc.hidden = !meta.d;
        }
      }
    }

    apply(want);

    /* 左栏点一下就换 —— 不刷新页面（列表本身不动），
       只把地址栏的 ?tool= 改掉，这样刷新 / 分享还能直达同一个工具。
       用 replaceState 而不是 pushState：不想为了切工具往历史里塞一堆记录，
       按浏览器「后退」应该回上一个页面，不是上一个工具。 */
    if (nav) {
      Array.prototype.forEach.call(nav.querySelectorAll('[data-go]'), function (btn) {
        btn.addEventListener('click', function () {
          var key = btn.getAttribute('data-go');
          if (key === want) return;
          want = key;
          apply(key);
          try { history.replaceState(null, '', '?tool=' + key); } catch (e) { }
        });
      });
    }
  }

  function boot() {
    initTheme();
    initTool();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
