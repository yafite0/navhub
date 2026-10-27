/* ============================================================
   手机端：预设页的三层切换
   ------------------------------------------------------------
   桌面端三栏同时可见，没有「哪一页」的概念，这套逻辑在桌面端不生效。
   手机端：
     ① 选预设  →  ② 提示词  →  ③ AI 入口
     「返回上一页」往回走一步。
   ============================================================ */
(function () {
  var layout = document.querySelector('.pm-layout');
  var back = document.getElementById('pmBack');
  if (!layout) return;

  var step = 1;

  function isNarrow() {
    return window.matchMedia('(max-width: 600px)').matches;
  }

  function setStep(n) {
    step = Math.max(1, Math.min(3, n));
    layout.setAttribute('data-step', String(step));

    /* 换页后回到顶部 —— 否则会停在上一页滚到的位置 */
    layout.scrollTop = 0;
    var cur = layout.querySelector(':scope > .pm-side, :scope > .pm-main, :scope > .pm-ai');
    Array.prototype.forEach.call(layout.children, function (c) {
      if (c.scrollTop) c.scrollTop = 0;
    });

    placeBack();
  }

  /* ---------- 返回按钮跟着页面走 ----------
     原本它钉在页头，第 2 页的标题在中间那一栏，两边离得老远。
     现在第 2 页挂到 .pm-main 的标题右侧，第 3 页挂到 .pm-ai 的标题右侧，
     第 1 页没有「上一页」，直接藏起来。 */
  function placeBack() {
    if (!back) return;

    var host = null;
    if (step === 2) host = layout.querySelector('.pm-main > .pm-head');
    else if (step === 3) host = layout.querySelector('.pm-ai > .pm-head');

    if (!isNarrow() || !host) {
      back.style.display = 'none';
      return;
    }

    /* 顺手把「去 AI 对话」的显隐也定了 —— 只在手机端出现。
       用内联样式是因为 CSS 里那条全局 display: none 会把它算成 0 宽。 */
    var goAiBtn = document.getElementById('pmGoAi');
    if (goAiBtn) {
      /* 先脱离 #pmPlain —— 那个面板在没选中提示词时是 display:none，
         按钮会被一起藏掉。挪到 .pm-main 末尾，两种面板下都在。 */
      var mainPane = layout.querySelector('.pm-main');
      if (mainPane && goAiBtn.parentNode !== mainPane) {
        mainPane.appendChild(goAiBtn);
      }

      goAiBtn.style.display = step === 2 ? 'flex' : 'none';
      goAiBtn.style.alignItems = 'center';
      goAiBtn.style.justifyContent = 'center';
    }

    if (back.parentNode !== host) host.appendChild(back);
    back.style.display = '';
  }

  /* 返回上一页 */
  if (back) {
    back.addEventListener('click', function () {
      setStep(step - 1);
    });
  }

  /* ---------- 第 1 页：点预设就进第 2 页 ----------
     用事件委托挂在左栏上，不去改 presets.js 里的 onPick，
     那边逻辑多，动它容易牵一发动全身。 */
  var side = layout.querySelector('.pm-side');
  if (side) {
    side.addEventListener('click', function (e) {
      if (!isNarrow()) return;
      var t = e.target;
      /* 只认列表里的条目 */
      if (t.closest && t.closest('.pm-nav *')) {
        setTimeout(function () { setStep(2); }, 0);
      }
    });
  }

  /* ---------- 第 2 页：点复制就进第 3 页 ----------
     presets.js 里 pmCopy 用的是 onclick，这里用捕获阶段先跑，
     再让它自己的复制逻辑照常执行。 */
  var main = layout.querySelector('.pm-main');
  if (main) {
    main.addEventListener('click', function (e) {
      if (!isNarrow()) return;
      var t = e.target;
      if (t.closest && t.closest('#pmCopy')) {
        setTimeout(function () { setStep(3); }, 120);
      }
    });
  }

  /* ---------- 第 2 页：「去 AI 对话」直达第 3 页 ---------- */
  var goAi = document.getElementById('pmGoAi');
  if (goAi) {
    goAi.addEventListener('click', function () {
      setStep(3);
    });
  }

  /* 从第 3 页点 AI 入口开新页后，回到第 2 页，
     这样用户回来还在提示词那页，不用重新选 */
  var ai = layout.querySelector('.pm-ai');
  if (ai) {
    ai.addEventListener('click', function (e) {
      if (!isNarrow()) return;
      var t = e.target;
      if (t.closest && t.closest('a')) {
        setTimeout(function () { setStep(2); }, 400);
      }
    });
  }

  /* 初始状态 */
  setStep(1);

  /* 转屏 / 改窗口大小时重新判断按钮显隐 */
  window.addEventListener('resize', function () {
    setStep(isNarrow() ? step : 1);
  });
})();
