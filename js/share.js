/* ============================================================
   小工具 · 分享 / 宣传海报
   ------------------------------------------------------------
   把宣传语和二维码画进一张 canvas，然后：
     · 复制图片 —— 直接进剪贴板，贴到聊天窗口就能发，不用先存文件
     · 下载图片 —— 存成 PNG
     · 复制链接 —— 只给网址，懒得发图的场合用
   全程在本机拼图，不联网、不上传、不用任何图床。

   【两条硬规矩】
   1. 二维码地址写死在 data.js 的 share.siteUrl 里，页面上只读、不接受参数覆盖 ——
      这张图是用来介绍本站的，不能让用户改成别的网址（万一被改成恶意站，
      挂的可是我们的名）。
   2. 宣传语只能从预设里挑，不接受自由输入 —— 同样是为了不被人改成
      违规内容或者脏话再传播出去。

   【源码是真的能用】
   左侧那份代码不是摆设：paintPoster 用 toString() 原样导出，
   所以「预览看到的」和「复制走的代码跑出来的」必然是同一张图。
   点「下载 .html」拿到的就是这份代码，双击就能打开。

   【浏览器差异】把图片写进剪贴板要用 ClipboardItem：
     Chrome / Edge 支持；桌面版 Firefox 目前不支持，Safari 部分版本受限。
     不支持时按钮不装作能用，会直接提示改用「下载图片」。
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.NAV_CONFIG || {};
  var S = CFG.share || {};
  function $(id) { return document.getElementById(id); }

  var W = 1080;
  var H = 1440;

  /* 当前选中的宣传语（只从预设里来） */
  var sloganIdx = typeof S.sloganIndex === 'number' ? S.sloganIndex : 0;
  if (!S.presets || !S.presets.length) sloganIdx = -1;
  else if (sloganIdx < 0 || sloganIdx >= S.presets.length) sloganIdx = 0;

  var SITE_URL = S.siteUrl || '';

  function currentSlogan() {
    return sloganIdx > -1 ? S.presets[sloganIdx].d : '';
  }

  /* ============================================================
     一、画海报
     ------------------------------------------------------------
     ⚠️ 这个函数的源码会被原样导出给用户（见下面的 posterHtml），
     所以它必须**自包含**：不引用本文件里的任何外部变量，
     常量在函数体里定义，内容全部从 O 取。
     要改画面就改这里，预览、导出、用户拿到的代码会一起变。
     ============================================================ */
  function paintPoster(cv, O) {
    var W = cv.width, H = cv.height;
    var ctx = cv.getContext('2d');
    var PAD = 88, CARD_W = 400, CARD_H = 440;
    var FONT = '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", system-ui, sans-serif';
    var BRAND = '#4D6BFE', BRAND2 = '#2E9BFF', INK = '#101528', SUBTXT = '#5A6479';

    function font(w, s) { return w + ' ' + s + 'px ' + FONT; }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    /* 中文没有词边界，只能按字断行；\n 是文案里写死的换行，优先尊重 */
    function wrap(text, maxW) {
      var out = [];
      String(text == null ? '' : text).split('\n').forEach(function (para) {
        if (!para) { out.push(''); return; }
        var cur = '';
        for (var i = 0; i < para.length; i++) {
          var ch = para.charAt(i);
          if (cur && ctx.measureText(cur + ch).width > maxW) { out.push(cur); cur = ch; }
          else cur += ch;
        }
        if (cur) out.push(cur);
      });
      return out;
    }

    /* --- 背景渐变 + 两个柔和光圈 --- */
    var bg = ctx.createLinearGradient(0, 0, W * 0.7, H);
    bg.addColorStop(0, BRAND);
    bg.addColorStop(1, BRAND2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.11;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(W - 40, 120, 300, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(20, H - 100, 250, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    /* --- 顶部：站点标识 --- */
    var y0 = 100;
    roundRect(PAD, y0, 96, 96, 28);
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = font(700, 52);
    ctx.fillText(O.site.charAt(0), PAD + 48, y0 + 52);

    ctx.textAlign = 'left';
    ctx.font = font(800, 42);
    ctx.fillText(O.site, PAD + 124, y0 + 36);

    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.font = font(400, 24);
    ctx.fillText(O.sub, PAD + 124, y0 + 76);
    ctx.restore();

    /* 二维码卡片的位置先定下来：宣传语在它上方那一段里垂直居中，
       不然宣传语短的时候中间会空出一大块 */
    var cardX = Math.round((W - CARD_W) / 2);
    var cardY = H - CARD_H - 150;

    /* --- 中间：宣传语（太长自动降字号，保证不撞到二维码） --- */
    var bandTop = y0 + 96 + 64;
    var bandH = (cardY - 64) - bandTop;
    var maxW = W - PAD * 2;
    var size = 46, lines = [];

    while (size >= 30) {
      ctx.font = font(800, size);
      lines = wrap(O.slogan, maxW);
      if (lines.length * size * 1.5 <= bandH) break;
      size -= 4;
    }
    if (lines.length > 6) lines = lines.slice(0, 6);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = font(800, size);
    var lh = size * 1.5;
    var ly = bandTop + Math.max(0, (bandH - lines.length * lh) / 2) + lh / 2;
    lines.forEach(function (ln) { ctx.fillText(ln, PAD, ly); ly += lh; });

    /* --- 二维码卡片 --- */
    ctx.save();
    ctx.shadowColor = 'rgba(9,16,40,.28)';
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 16;
    roundRect(cardX, cardY, CARD_W, CARD_H, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    /* --- 二维码：O.qr 是点阵，"1" 黑块、"0" 白块，一行一个字符串 --- */
    var qrSize = CARD_W - 80;
    var MARGIN = 2;                     /* 静区，留少了扫不出来 */
    var n = O.qr.length;
    var total = n + MARGIN * 2;
    var cell = Math.max(1, Math.floor(qrSize / total));
    var real = cell * total;
    var ox = cardX + 40 + Math.round((qrSize - real) / 2);
    var oy = cardY + 40 + Math.round((qrSize - real) / 2);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(ox, oy, real, real);
    ctx.fillStyle = INK;
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (O.qr[r].charAt(c) === '1') {
          ctx.fillRect(ox + (c + MARGIN) * cell, oy + (r + MARGIN) * cell, cell, cell);
        }
      }
    }

    ctx.fillStyle = SUBTXT;
    ctx.font = font(600, 25);
    ctx.textAlign = 'center';
    ctx.fillText('扫码打开', W / 2, cardY + CARD_H - 46);

    /* --- 底部：网址 --- */
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = font(400, 25);
    ctx.fillText(O.urlText, W / 2, H - 74);
    ctx.textAlign = 'left';
  }

  /* ============================================================
     二、二维码点阵
     ------------------------------------------------------------
     一次性算好存成字符串，画图时直接按位填 —— 这样导出的源码里
     不需要带二维码库，一个文件就能跑。
     ============================================================ */
  var QR_ROWS = (function () {
    try {
      var qr = qrcode(0, 'M');
      qr.addData(SITE_URL);
      qr.make();
    } catch (e) { return []; }

    var n = qr.getModuleCount();
    var rows = [];
    for (var r = 0; r < n; r++) {
      var s = '';
      for (var c = 0; c < n; c++) s += qr.isDark(r, c) ? '1' : '0';
      rows.push(s);
    }
    return rows;
  })();

  function currentOpt() {
    return {
      slogan: currentSlogan(),
      site: S.siteName || '启航',
      sub: S.subtitle || '精选网站导航',
      /* 完整网址，和右栏「二维码指向」显示的是同一个字符串 ——
         两处对不上，用户会怀疑扫出来的是不是同一个页面 */
      urlText: SITE_URL,
      qr: QR_ROWS
    };
  }

  /* ============================================================
     三、导出的独立源码
     ------------------------------------------------------------
     paintPoster 用 toString() 原样贴进去 —— 预览和导出的图必然一致，
     不存在"展示的代码和实际画的图对不上"这种事。
     ============================================================ */
  function posterHtml() {
    var o = currentOpt();

    var content = [
      '{',
      '  /* ① 海报正中间的几行大字（\\n 换行） */',
      '  slogan: ' + JSON.stringify(o.slogan) + ',',
      '  /* ② 左上角的站点名，以及它下面那行小字 */',
      '  site: ' + JSON.stringify(o.site) + ',',
      '  sub: ' + JSON.stringify(o.sub) + ',',
      '  /* ③ 最底下那行网址小字 */',
      '  urlText: ' + JSON.stringify(o.urlText) + ',',
      '  /* ④ 中间那个二维码的点阵，见下面 QR */',
      '  qr: []',
      '}'
    ].join('\n');

    var qrLines = QR_ROWS.map(function (row) { return '  "' + row + '",'; }).join('\n');

    return [
      '<!DOCTYPE html>',
      '<html lang="zh-CN">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<title>' + o.site + ' · 宣传海报</title>',
      '<style>',
      '  body { margin: 0; min-height: 100vh; display: grid; place-items: center;',
      '         background: #EEF2FB; padding: 24px 0;',
      '         font-family: "PingFang SC", "Microsoft YaHei", sans-serif; }',
      '  canvas { width: min(92vw, 540px); height: auto; border-radius: 18px;',
      '           box-shadow: 0 18px 50px -18px rgba(23, 32, 58, .4); }',
      '</style>',
      '</head>',
      '<body>',
      '',
      '<!-- 在图上右键可以「图片另存为」。想改内容，只动下面 ①②③ 三行。 -->',
      '<canvas id="cv" width="1080" height="1440"></canvas>',
      '',
      '<script>',
      '/* =========================================================',
      '   ' + o.site + ' · 宣传海报（独立源码）',
      '',
      '   这张图完全由下面这段代码画出来：不联网、不依赖任何库、',
      '   不在你的电脑上留下任何东西。改完存成 .html 双击就能看。',
      '   ========================================================= */',
      '',
      'var CONTENT = ' + content + ';',
      '',
      '/* 二维码点阵："1" 是黑块，"0" 是白块，一行一个字符串。',
      '   注意它和上面的 urlText 是分开的 —— 改了网址文字，二维码不会跟着变，',
      '   二维码需要重新生成（回本站的分享工具做一张新的即可）。 */',
      'var QR = [',
      qrLines,
      '];',
      'CONTENT.qr = QR;',
      '',
      '/* ------------------- 以下是画图的部分 ------------------- */',
      '',
      paintPoster.toString(),
      '',
      'paintPoster(document.getElementById("cv"), CONTENT);',
      '<\/script>',
      '</body>',
      '</html>',
      ''
    ].join('\n');
  }

  /* ============================================================
     四、预览 / 导出
     ============================================================ */
  function draw() {
    var cv = $('shCanvas');
    if (!cv) return;
    cv.width = W;
    cv.height = H;
    paintPoster(cv, currentOpt());

    /* 源码面板和预览是同一份内容，跟着一起更新 */
    var code = $('shCode');
    if (code) code.textContent = posterHtml();
  }

  var queued = false;
  function drawSoon() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; draw(); });
  }

  /* 整页一屏放得下这件事交给 CSS：body 变纵向 flex、卡片撑满、
     代码区 flex:1 吃掉剩下的高度（见 css/share.css 顶部那一段）。
     这里不用再算高度 —— 之前用 js 量过一版，页头行数一变就对不上。 */

  function toast(msg) { if (window.showToast) window.showToast(msg); }

  function copyText(text, msg) {
    function fallback() {
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
      toast(ok ? msg : '复制失败，手动选中吧');
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast(msg); }, fallback);
      return;
    }
    fallback();
  }

  function download(fileName, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var href = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { URL.revokeObjectURL(href); }, 5000);
  }

  /* 往剪贴板写图片：只有部分浏览器开放了这个能力 */
  function canCopyImage() {
    return !!(navigator.clipboard && typeof window.ClipboardItem !== 'undefined' && window.isSecureContext);
  }

  function copyImage() {
    var cv = $('shCanvas');
    if (!cv) return;

    if (!canCopyImage()) {
      toast('这个浏览器不支持把图片写进剪贴板，用「下载图片」吧');
      return;
    }

    cv.toBlob(function (blob) {
      if (!blob) { toast('生成图片失败，改用「下载图片」试试'); return; }
      navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })])
        .then(function () { toast('图片已复制，直接粘贴就能发'); },
          function () { toast('复制被浏览器挡下来了，用「下载图片」吧'); });
    }, 'image/png');
  }

  function saveImage() {
    var cv = $('shCanvas');
    if (!cv) return;
    cv.toBlob(function (blob) {
      if (!blob) { toast('生成图片失败'); return; }
      var href = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = href;
      a.download = (S.siteName || '启航') + '-宣传海报.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(function () { URL.revokeObjectURL(href); }, 5000);
      toast('图片已下载');
    }, 'image/png');
  }

  /* ============================================================
     五、界面
     ============================================================ */
  function renderPresets() {
    var box = $('shPresets');
    if (!box || !S.presets) return;
    box.textContent = '';

    S.presets.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sh-preset' + (i === sloganIdx ? ' is-on' : '');
      b.textContent = p.t;
      b.title = p.d.replace(/\n/g, ' / ');
      b.addEventListener('click', function () {
        sloganIdx = i;
        Array.prototype.forEach.call(box.children, function (n) { n.classList.remove('is-on'); });
        b.classList.add('is-on');
        drawSoon();
      });
      box.appendChild(b);
    });
  }

  function init() {
    if (!$('shCanvas')) return;

    if ($('shLead')) $('shLead').textContent = S.lead || '';

    /* 地址是写死的，页面上只读展示，不给输入框 —— 
       也不接受 ?url= 之类的参数覆盖，避免被人做成别家的"快捷方式" */
    if ($('shUrlText')) $('shUrlText').textContent = SITE_URL;

    renderPresets();

    if ($('shCopyImg')) $('shCopyImg').addEventListener('click', copyImage);
    if ($('shSave')) $('shSave').addEventListener('click', saveImage);
    if ($('shCopyLink')) $('shCopyLink').addEventListener('click', function () {
      copyText(SITE_URL, '链接已复制');
    });
    if ($('shCopyCode')) $('shCopyCode').addEventListener('click', function () {
      copyText(posterHtml(), '源码已复制，存成 .html 双击就能打开');
    });
    if ($('shSaveHtml')) $('shSaveHtml').addEventListener('click', function () {
      download((S.siteName || '启航') + '-宣传海报.html', posterHtml(), 'text/html;charset=utf-8');
      toast('已下载 .html，双击就能打开这张图');
    });

    /* 提示语按当前浏览器实际能力写，别装作都能复制 ——
       桌面版 Firefox 就不支持往剪贴板写图片 */
    if ($('shHint')) {
      $('shHint').textContent = canCopyImage()
        ? '「复制图片」会把海报直接放进剪贴板，贴到聊天窗口就能发，不用先存成文件。'
        : '你这个浏览器不支持把图片写进剪贴板（桌面版 Firefox 目前就不支持），用「下载图片」一样能发。';
    }

    /* 中文字体就绪后重画一次，否则第一张图可能用的是兜底字体 */
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(draw);
    }
    draw();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
