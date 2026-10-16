/* ============================================================
   二维码生成 —— 全部在本地完成，不发起任何网络请求
   ============================================================ */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  var DEFAULT_FG = '#17203A';
  var DEFAULT_BG = '#FFFFFF';
  var EXPORT_SIZE = 1024;      // 导出 PNG 的边长
  var MARGIN = 2;              // 静区宽度（单位：模块）

  var textEl, levelEl, fgEl, bgEl, canvasEl, emptyEl, noteEl;
  var lastSvg = '';
  var lastQr = null;

  /* ---------- 主题 ---------- */
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

  /* ---------- 提示 ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add('is-show'); });
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      t.classList.remove('is-show');
      window.setTimeout(function () { t.hidden = true; }, 260);
    }, 2200);
  }

  /* ---------- 生成 ---------- */
  function makeQr(text, level) {
    var qr = qrcode(0, level);
    qr.addData(text);
    qr.make();
    return qr;
  }

  /* 自己拼 SVG：颜色可控、体积小、矢量不失真 */
  function svgOf(qr, cell, fg, bg) {
    var count = qr.getModuleCount();
    var size = (count + MARGIN * 2) * cell;
    var d = '';

    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          var x = (c + MARGIN) * cell;
          var y = (r + MARGIN) * cell;
          d += 'M' + x + ' ' + y + 'h' + cell + 'v' + cell + 'h-' + cell + 'z';
        }
      }
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
      '" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges">' +
      '<rect width="' + size + '" height="' + size + '" fill="' + bg + '"/>' +
      '<path d="' + d + '" fill="' + fg + '"/></svg>';
  }

  /* 导出用：画到 canvas */
  function canvasOf(qr, pixel, fg, bg) {
    var count = qr.getModuleCount();
    var total = count + MARGIN * 2;
    var cell = Math.max(1, Math.floor(pixel / total));
    var real = cell * total;

    var cv = document.createElement('canvas');
    cv.width = real;
    cv.height = real;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, real, real);
    ctx.fillStyle = fg;
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect((c + MARGIN) * cell, (r + MARGIN) * cell, cell, cell);
        }
      }
    }
    return cv;
  }

  /* ============================================================
     内容类型：文字 / 网址、WiFi、名片
     ------------------------------------------------------------
     WiFi 和名片都是二维码的标准格式，手机自带相机扫一下就能
     连网 / 存联系人，不用装任何 App —— 比念一长串密码省事得多。
     这边只负责把表单拼成对应的字符串写进 qrText，
     下面 render() 那一套完全不用改。
     ============================================================ */

  /* WiFi 格式：WIFI:T:WPA;S:名字;P:密码;;
     值里的 \ ; , : 都要转义 —— 密码带个分号不转义的话整串就崩了 */
  function wifiEsc(s) {
    return String(s || '').replace(/([\\;,:"])/g, '\\$1');
  }

  function buildWifi() {
    var el = $('qrWifiSsid');
    var ssid = el ? el.value.trim() : '';
    if (!ssid) return '';
    var tEl = $('qrWifiType');
    var type = tEl ? tEl.value : 'WPA';
    var pEl = $('qrWifiPass');
    var pass = pEl ? pEl.value : '';
    if (type === 'nopass') return 'WIFI:T:nopass;S:' + wifiEsc(ssid) + ';;';
    return 'WIFI:T:' + type + ';S:' + wifiEsc(ssid) + ';P:' + wifiEsc(pass) + ';;';
  }

  /* 名片走 vCard 3.0 —— 比 4.0 兼容性好，Android / iOS 都认。
     只有姓名必填，其余空着就不写那一行。 */
  function buildVcard() {
    var nEl = $('qrVName');
    var name = nEl ? nEl.value.trim() : '';
    if (!name) return '';
    var lines = ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + name, 'FN:' + name];

    function add(key, id) {
      var el = $(id);
      var v = el ? el.value.trim() : '';
      if (v) lines.push(key + ':' + v);
    }
    add('TEL', 'qrVTel');
    add('EMAIL', 'qrVEmail');
    add('ORG', 'qrVOrg');
    add('URL', 'qrVUrl');

    lines.push('END:VCARD');
    return lines.join('\n');
  }

  function initKinds() {
    var bar = $('qrKinds');
    if (!bar) return;

    var forms = { wifi: $('qrWifiForm'), vcard: $('qrVcardForm') };
    var chips = $('qrTextChips');
    var kind = 'text';

    function sync() {
      /* 文字 / 网址：露出输入框；WiFi 和名片：换成各自的表单 */
      textEl.hidden = (kind !== 'text');
      if (chips) chips.hidden = (kind !== 'text');
      Object.keys(forms).forEach(function (k) {
        if (forms[k]) forms[k].hidden = (k !== kind);
      });

      if (kind === 'text') return;

      textEl.value = (kind === 'wifi') ? buildWifi() : buildVcard();
      render();
    }

    Array.prototype.forEach.call(bar.children, function (btn) {
      btn.addEventListener('click', function () {
        kind = btn.getAttribute('data-kind') || 'text';
        Array.prototype.forEach.call(bar.children, function (b) {
          b.classList.toggle('is-on', b === btn);
        });
        sync();
      });
    });

    /* 表单里改一个字就重画 —— 这几个字段都很短，不用防抖 */
    ['qrWifiForm', 'qrVcardForm'].forEach(function (id) {
      var f = $(id);
      if (!f) return;
      f.addEventListener('input', sync);
      f.addEventListener('change', sync);
    });

    sync();
  }

  function render() {
    if (!textEl || !canvasEl) return;

    var text = textEl.value;
    canvasEl.textContent = '';
    lastSvg = '';
    lastQr = null;

    if (!text.trim()) {
      if (emptyEl) emptyEl.hidden = false;
      setNote('下载的 PNG 是 1024×1024 高清图，适合打印');
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    var level = levelEl.value;
    /* 尺寸滑块已经去掉了，预览固定按 300 画（导出走的是另一条路径，
       本来就是固定 1024，和这里无关） */
    var size = 300;
    var qr;

    try {
      qr = makeQr(text, level);
    } catch (e) {
      var tip = document.createElement('p');
      tip.className = 'qr-empty';
      tip.textContent = '内容太长了，二维码装不下 —— 缩短一些，或把纠错等级降到 L 再试';
      canvasEl.appendChild(tip);
      setNote('当前内容超出二维码容量上限');
      return;
    }

    var count = qr.getModuleCount();
    var cell = Math.max(2, Math.round(size / (count + MARGIN * 2)));
    lastQr = qr;
    lastSvg = svgOf(qr, cell, fgEl.value, bgEl.value);
    canvasEl.innerHTML = lastSvg;

    setNote('二维码版本 ' + count + '×' + count + ' 模块 · 导出 PNG 为 ' + EXPORT_SIZE + '×' + EXPORT_SIZE + ' 高清图');
  }

  var timer = null;
  function renderSoon() {
    window.clearTimeout(timer);
    timer = window.setTimeout(render, 160);
  }

  function setNote(msg) {
    if (noteEl) noteEl.textContent = msg;
  }

  /* ---------- 下载 ---------- */
  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
  }

  function exportCanvas() {
    if (!lastQr) return null;
    return canvasOf(lastQr, EXPORT_SIZE, fgEl.value, bgEl.value);
  }

  /* ---------- 初始化 ---------- */
  function boot() {
    initTheme();

    textEl = $('qrText');
    levelEl = $('qrLevel');
    fgEl = $('qrFg');
    bgEl = $('qrBg');
    canvasEl = $('qrCanvas');
    emptyEl = $('qrEmpty');
    noteEl = $('qrNote');

    if (!textEl || typeof qrcode === 'undefined') {
      if (noteEl) noteEl.textContent = '二维码库没加载成功，请刷新页面重试';
      return;
    }

    textEl.addEventListener('input', renderSoon);
    levelEl.addEventListener('change', render);

    /* 内容类型切换（文字 / WiFi / 名片）—— 要放在 textEl 赋值之后，
       它里面直接读写 textEl.value */
    initKinds();


    fgEl.addEventListener('input', render);
    bgEl.addEventListener('input', render);

    $('qrResetColor').addEventListener('click', function () {
      fgEl.value = DEFAULT_FG;
      bgEl.value = DEFAULT_BG;
      render();
    });

    $('qrClear').addEventListener('click', function () {
      textEl.value = '';
      render();
      textEl.focus();
    });

    $('qrSiteUrl').addEventListener('click', function () {
      var url = location.href.split('?')[0].replace(/qr\.html$/, '');
      textEl.value = url;
      render();
    });

    var pasteBtn = $('qrPaste');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText().then(function (t) {
            if (!t) { toast('剪贴板是空的'); return; }
            textEl.value = t;
            render();
          }, function () { toast('读不到剪贴板，请手动粘贴'); });
        } else {
          toast('这个浏览器不支持读取剪贴板，请手动粘贴');
        }
      });
    }

    $('qrPng').addEventListener('click', function () {
      var cv = exportCanvas();
      if (!cv) { toast('先输入一点内容吧'); return; }
      if (cv.toBlob) {
        cv.toBlob(function (blob) {
          if (!blob) { toast('导出失败，换 SVG 试试'); return; }
          download(blob, 'qrcode.png');
          toast('已开始下载 PNG');
        }, 'image/png');
      } else {
        toast('当前浏览器不支持导出 PNG，可以下载 SVG');
      }
    });

    $('qrSvg').addEventListener('click', function () {
      if (!lastSvg) { toast('先输入一点内容吧'); return; }
      download(new Blob([lastSvg], { type: 'image/svg+xml;charset=utf-8' }), 'qrcode.svg');
      toast('已开始下载 SVG（矢量图，放多大都清晰）');
    });

    $('qrCopy').addEventListener('click', function () {
      var cv = exportCanvas();
      if (!cv) { toast('先输入一点内容吧'); return; }
      if (!navigator.clipboard || !window.ClipboardItem) {
        toast('这个浏览器不支持复制图片，请用下载');
        return;
      }
      cv.toBlob(function (blob) {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function () {
          toast('二维码图片已复制');
        }, function () {
          toast('复制失败，请用下载按钮');
        });
      }, 'image/png');
    });

    /* 支持从别的页面带内容过来：qr.html?u=https://... */
    try {
      var q = new URLSearchParams(location.search);
      var preset = q.get('u') || q.get('text');
      if (preset) textEl.value = preset;
    } catch (e) { }

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
