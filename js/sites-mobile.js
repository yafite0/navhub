/* ============================================================
   「其他网页」页的头部交互
   ------------------------------------------------------------
   1. 「分类」按钮 → 把左栏那棵分类树弹成浮层，选完自动关
      （桌面端左栏是常驻的，按钮点了也要有反应，所以统一用浮层）
   2. 「?」圆按钮 → 弹出「关于国外站点」说明，绿色「我知道了」
   3. 「搜索」按钮 → 派发回车，交给 sites.js 现成的逻辑

   顶栏导航不参与这些，所有页面保持一致。
   ============================================================ */
(function () {
  /* ---------- 关于国外站点的弹窗 ---------- */
  function showHelp() {
    var mask = document.createElement('div');
    mask.className = 'hp-mask';

    var box = document.createElement('div');
    box.className = 'hp-box';

    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'hp-x';
    x.setAttribute('aria-label', '关闭');
    x.innerHTML = '&times;';
    box.appendChild(x);

    var title = document.createElement('div');
    title.className = 'hp-title';
    title.textContent = '关于国外站点';
    box.appendChild(title);

    var body = document.createElement('div');
    body.className = 'hp-body';

    var p1 = document.createElement('p');
    p1.textContent = '这些站点的服务器在境外，打开慢、图片加载不出来、甚至整个页面打不开，' +
      '都属于正常情况，和网址本身有没有失效无关。';
    body.appendChild(p1);

    var p2 = document.createElement('p');
    p2.textContent = '遇到这种先换个网络环境试试（比如切到手机热点、关掉加速器或换一个）。' +
      '只有极小概率是域名真的失效 —— 如果换了网络依然打不开，欢迎反馈。';
    body.appendChild(p2);

    box.appendChild(body);

    var row = document.createElement('div');
    row.className = 'hp-row';
    var ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'hp-ok';
    ok.textContent = '我知道了';
    row.appendChild(ok);
    box.appendChild(row);

    mask.appendChild(box);
    document.body.appendChild(mask);

    function close() {
      if (mask.parentNode) mask.parentNode.removeChild(mask);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    x.addEventListener('click', close);
    ok.addEventListener('click', close);
    mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
    document.addEventListener('keydown', onKey);

    setTimeout(function () { ok.focus(); }, 30);
  }

  function init() {
    var side = document.getElementById('asSide');
    var helpBtn = document.getElementById('asHelp');
    var goBtn = document.getElementById('asGo');
    var input = document.getElementById('asFilter');

    /* 「筛选器」按钮已经交给 js/filter.js ——
       那个按钮现在开的是标签弹窗，不再是左栏分类树。 */

    /* ---------- 2. 问号：说明弹窗 ---------- */
    if (helpBtn) {
      helpBtn.addEventListener('click', showHelp);
    }

    /* 原来摊在内容区最上面那块说明不需要了，内容已经进了弹窗 */
    var note = document.querySelector('.as-global-note');
    if (note && note.parentNode) note.parentNode.removeChild(note);

    /* ---------- 3. 搜索按钮 ---------- */
    if (goBtn && input) {
      goBtn.addEventListener('click', function () {
        input.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true
        }));
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 260); });
  } else {
    setTimeout(init, 260);
  }
})();
