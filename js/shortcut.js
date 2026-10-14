/* ============================================================
   小工具 · 生成网页快捷方式
   ------------------------------------------------------------
   思路：生成一个只有几十行的纯文本文件，放到桌面双击就能直达网址。
     .html 版：靠 <meta refresh> + location.replace 跳转，所有系统都能用
     .url  版：Windows 的「Internet 快捷方式」，本质是 INI，双击不留中间页
   全部在本机拼字符串 + Blob 下载，不联网、不上传。
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.NAV_CONFIG || {};
  function $(id) { return document.getElementById(id); }

  /* ---------- 构造两种文件的内容 ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* 用户可能只输 pan.baidu.com，补上协议头 */
  function cleanUrl(raw) {
    var s = String(raw || '').trim();
    if (!s) return '';
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    return s;
  }

  function nameOf(url, custom) {
    var n = String(custom || '').trim();
    if (n) return n;
    /* 用户没填名字时，用自动认出来的那个，保证文件名和标题不会又长又丑 */
    var auto = suggestName(url);
    if (auto) return auto;
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch (e) { return url; }
  }

  /* ---------- 网址 → 名称 ----------
     顺序：本站收录的站点 → 下面这张表 → 从域名推。
     收录数据放第一位，因为它最准，而且不用手工维护 —— 加了新站自动就有。 */
  var NAME_TABLE = {
    'github.com': 'GitHub', 'gitlab.com': 'GitLab', 'gitee.com': 'Gitee',
    'stackoverflow.com': 'Stack Overflow', 'npmjs.com': 'npm', 'pypi.org': 'PyPI',
    'python.org': 'Python', 'nodejs.org': 'Node.js', 'docker.com': 'Docker',
    'google.com': 'Google', 'youtube.com': 'YouTube', 'bing.com': '必应',
    'office.com': 'Microsoft 365', 'microsoft.com': '微软', 'apple.com': 'Apple',
    'adobe.com': 'Adobe', 'jetbrains.com': 'JetBrains',
    'code.visualstudio.com': 'Visual Studio Code', 'notepad-plus-plus.org': 'Notepad++',
    'wikipedia.org': 'Wikipedia', 'arxiv.org': 'arXiv', 'huggingface.co': 'Hugging Face',
    'openai.com': 'OpenAI', 'anthropic.com': 'Anthropic', 'deepseek.com': 'DeepSeek',
    'aliyun.com': '阿里云', 'tencent.com': '腾讯', 'qq.com': '腾讯',
    'weixin.qq.com': '微信', 'baidu.com': '百度', 'zhihu.com': '知乎',
    'bilibili.com': '哔哩哔哩', 'taobao.com': '淘宝', 'jd.com': '京东',
    'csdn.net': 'CSDN', 'cnblogs.com': '博客园', 'juejin.cn': '稀土掘金',
    'nvidia.com': 'NVIDIA', 'amd.com': 'AMD', 'intel.com': 'Intel',
    'steampowered.com': 'Steam', 'epicgames.com': 'Epic Games', 'unity.com': 'Unity',
    'unrealengine.com': 'Unreal Engine', 'godotengine.org': 'Godot',
    'blender.org': 'Blender', 'obsproject.com': 'OBS Studio', 'videolan.org': 'VLC',
    'gimp.org': 'GIMP', 'inkscape.org': 'Inkscape', 'figma.com': 'Figma',
    'notion.so': 'Notion', 'feishu.cn': '飞书', 'dingtalk.com': '钉钉',
    'wps.cn': 'WPS', '7-zip.org': '7-Zip', '12306.cn': '铁路 12306'
  };

  /* 域名里常见的「凑数后缀」，推断名字时先去掉：
     godotengine.org → godot → Godot */
  var TAIL_WORDS = [
    'official', 'gaming', 'games', 'game', 'studio', 'studios', 'software', 'soft',
    'technology', 'tech', 'cloud', 'engine', 'apps', 'app', 'group', 'global', 'online'
  ];

  /* 本站收录的站点：一次建好 hostname → 名字 的索引 */
  var HOST_NAMES = (function () {
    var map = {};
    function add(list) {
      (list || []).forEach(function (s) {
        if (!s || !s.url || !s.name) return;
        var h = window.Seek ? Seek.hostOf(s.url) : '';
        if (h && !map[h]) map[h] = s.name;
      });
    }
    (CFG.categories || []).forEach(function (c) { add(c.sites); });
    add(CFG.index);
    add(CFG.urls);
    return map;
  })();

  function guessName(host) {
    var parts = String(host || '').split('.');
    if (!parts.length) return '';
    var core = parts[0];

    /* www / m / store 这类前缀没有信息量，往后挪一级 */
    if (/^(www\d?|m|mobile|store|shop|home|web|app)$/.test(core) && parts.length > 2) core = parts[1];

    var words = core.split(/[-_]+/).filter(Boolean);
    if (words.length === 1) {
      var w = words[0];
      for (var i = 0; i < TAIL_WORDS.length; i++) {
        var t = TAIL_WORDS[i];
        if (w.length > t.length + 2 && w.slice(-t.length) === t) { w = w.slice(0, -t.length); break; }
      }
      words = [w];
    }

    return words.map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  }

  function suggestName(url) {
    var host = window.Seek ? Seek.hostOf(String(url || '')) : '';
    if (!host) return '';
    if (HOST_NAMES[host]) return HOST_NAMES[host];
    if (NAME_TABLE[host]) return NAME_TABLE[host];
    return guessName(host);
  }

  function iconOf(url) {
    try { return new URL(url).origin + '/favicon.ico'; }
    catch (e) { return ''; }
  }

  /* 生成 .html 快捷页。
     注释是刻意写进去的 —— 用户在页面上就能看到文件长什么样，
     以后想手改也知道每一行管哪一部分。 */
  function buildHtml(url, name) {
    var icon = iconOf(url);

    var lines = [
      '<!DOCTYPE html>',
      '<html lang="zh-CN">',
      '<head>',
      '<meta charset="utf-8">',
      '',
      '<!-- ① 快捷方式的名字：浏览器标签、收藏夹里显示的就是它 -->',
      '<title>' + esc(name) + '</title>',
      '',
      '<!-- ② 要打开的网址。它在整个文件里出现 3 次 ——',
      '     这里、下面 <a> 的 href、最后那句 location.replace。',
      '     要改网址的话三处都得一起改，否则会跳错。 -->',
      '<meta http-equiv="refresh" content="0; url=' + esc(url) + '">',
      '',
      '<!-- ③ 图标：直接借用目标网站自己的 favicon；抓不到就用系统默认图标 -->',
      icon ? '<link rel="shortcut icon" href="' + esc(icon) + '">' : null,
      '',
      '<!-- ④ 下面这些只是「跳转页」长什么样，不影响功能，随便改 -->',
      '<style>',
      '  html, body { height: 100%; margin: 0; }',
      '  body { display: flex; align-items: center; justify-content: center; text-align: center;',
      '         font: 15px/1.7 system-ui, -apple-system, "Microsoft YaHei", sans-serif;',
      '         color: #888; background: #fafafa; }',
      '  a { color: #4D6BFE; text-decoration: none; }',
      '  a:hover { text-decoration: underline; }',
      '</style>',
      '</head>',
      '<body>',
      '<p>正在打开「' + esc(name) + '」…<br>',
      '<a href="' + esc(url) + '">没有自动跳转就点这里</a></p>',
      '',
      '<!-- ⑤ 真正的跳转动作。和上面那句 refresh 是双保险，禁掉一个还有一个 -->',
      '<script>location.replace(' + JSON.stringify(url) + ');<\/script>',
      '</body>',
      '</html>'
    ];

    return lines.filter(function (x) { return x !== null; }).join('\r\n') + '\r\n';
  }

  /* 生成 .url（Windows 专有格式，本质是个 INI）。
     ; 开头的行是注释，Windows 读的时候会跳过，留着不影响使用。 */
  function buildUrlFile(url, icon) {
    var lines = [
      '; Windows 的「Internet 快捷方式」—— 双击就用默认浏览器打开下面的网址',
      '; 它其实就是个纯文本，记事本能打开也能改；改完存回 .url 照样能用',
      ';',
      '; ① 要打开的网址，必须写在 URL= 后面（整行只放网址，别加引号）',
      '[InternetShortcut]',
      'URL=' + url
    ];

    if (icon) {
      lines.push('');
      lines.push('; ② 图标文件。这里借用目标网站的 favicon；');
      lines.push(';    不想要这个图标，把下面这行删掉即可，Windows 会给个默认图标');
      lines.push('IconFile=' + icon);
    }

    lines.push('');
    lines.push('; ③ 用图标文件里的第几个图标，从 0 开始数；一般不用动');
    lines.push('IconIndex=0');

    return lines.join('\r\n') + '\r\n';
  }

  /* 文件名里不能出现 \ / : * ? " < > | 这几个字符 */
  function safeName(s) {
    var n = String(s || '').trim().replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ');
    return n.slice(0, 60) || '快捷方式';
  }

  /* ---------- 下载 ---------- */
  function download(filename, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var href = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    /* 立刻 revoke 在部分浏览器上会打断下载，缓一下再释放 */
    window.setTimeout(function () { URL.revokeObjectURL(href); }, 5000);
  }

  /* 复制到剪贴板。clipboard API 要求 https / localhost，
     不满足（比如直接双击打开的 file://）就退回老办法。 */
  function copyText(text, okMsg) {
    var msg = okMsg || '已复制';
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        if (window.showToast) window.showToast(msg);
      }, function () { fallbackCopy(text, msg); });
      return;
    }
    fallbackCopy(text, msg);
  }

  function fallbackCopy(text, msg) {
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
    if (window.showToast) window.showToast(ok ? (msg || '已复制') : '复制失败，请手动选中');
  }

  /* ---------- 界面 ---------- */

  /* 当前是什么系统。.url 只有 Windows 认，选错了得提前说，
     免得下载完拖到桌面双击没反应还不知道为什么。 */
  function detectOS() {
    var ua = String(navigator.userAgent || '').toLowerCase();
    var plat = String((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '').toLowerCase();

    /* 先看 UA、再看 platform，顺序不能反 —— 
       UA 更贴近真实系统，而 platform 可能和 UA 对不上（改过 UA 的浏览器、
       某些套壳客户端）。之前把两者拼在一起判断，macOS 会被 platform 带到 Windows 去。 */
    if (/android/.test(ua)) return 'android';
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/mac os x|macintosh/.test(ua)) {
      /* iPadOS 13 之后把自己报成 Macintosh，靠触摸点数区分 */
      return navigator.maxTouchPoints > 1 ? 'ios' : 'mac';
    }
    if (/windows/.test(ua)) return 'windows';
    if (/linux|x11|cros/.test(ua)) return 'linux';

    /* UA 判断不出来时，再退回到 platform */
    if (/android/.test(plat)) return 'android';
    if (/ios|iphone|ipad/.test(plat)) return 'ios';
    if (/mac/.test(plat)) return navigator.maxTouchPoints > 1 ? 'ios' : 'mac';
    if (/win/.test(plat)) return 'windows';
    if (/linux/.test(plat)) return 'linux';
    return 'other';
  }

  function currentType() {
    var picked = document.querySelector('input[name="scType"]:checked');
    return picked ? picked.value : 'html';
  }

  /* 当前系统 + 当前格式用不了时，返回原因；能用则返回 null。
     网页里的提示条和下载前的拦截弹窗共用这一份判断，不会出现两处说法不一致。 */
  function unsupported() {
    var os = detectOS();

    if (os === 'android' || os === 'ios') {
      return {
        brief: '手机上做不出桌面快捷方式',
        title: '手机上做不出桌面快捷方式',
        body: '这个工具靠的是桌面系统「双击文件 → 交给默认程序打开」的机制。手机上的文件点击后由 App 接管，' +
          'iOS 和 Android 都不允许一个文件直接唤起浏览器打开网址，所以这两种格式在手机上双击都不会有任何反应。',
        ask: '手机上请改用浏览器菜单里的「添加到主屏幕」—— 那才是手机上的正确做法，效果还更好。'
      };
    }

    if (currentType() === 'url' && os !== 'windows') {
      return {
        brief: '.url 只有 Windows 认，在你系统上双击没反应',
        title: '.url 格式只有 Windows 认',
        body: '.url 是 Windows 专有的「Internet 快捷方式」格式（本质是个 INI 配置文件）。' +
          '你现在用的系统不是 Windows，双击这个文件不会有任何反应。',
        ask: '把格式改成 .html 就好 —— 它在 Windows、macOS、Linux 上都能用。'
      };
    }

    return null;
  }

  function updateWarn() {
    var box = $('scWarn');
    if (!box) return;

    /* 提示条只给一句短话做预警，完整原因留给弹窗，不在两处各说一遍 */
    var bad = unsupported();
    if (bad) { box.textContent = bad.brief; box.hidden = false; }
    else { box.textContent = ''; box.hidden = true; }
  }

  /* ---------- 拦截弹窗 ---------- */
  var pending = null;   /* 用户确认「仍要下载」时要下载的那份 */

  function showDialog(info) {
    var mask = $('scMask');
    if (!mask) return;
    if ($('scDlgTitle')) $('scDlgTitle').textContent = info.title;
    if ($('scDlgBody')) $('scDlgBody').textContent = info.body;
    if ($('scDlgAsk')) $('scDlgAsk').textContent = info.ask;
    mask.hidden = false;
    requestAnimationFrame(function () { mask.classList.add('is-show'); });
    if ($('scDlgCancel')) $('scDlgCancel').focus();
  }

  function hideDialog() {
    var mask = $('scMask');
    if (!mask) return;
    mask.classList.remove('is-show');
    window.setTimeout(function () { if (mask) mask.hidden = true; }, 200);
  }

  function build() {
    var url = cleanUrl($('scUrl') ? $('scUrl').value : '');
    if (!url || !/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(url)) return null;

    var name = nameOf(url, $('scName') ? $('scName').value : '');
    var icon = iconOf(url);
    var type = currentType();

    if (type === 'url') {
      return { type: 'url', url: url, name: name, file: safeName(name) + '.url', code: buildUrlFile(url, icon) };
    }
    return { type: 'html', url: url, name: name, file: safeName(name) + '.html', code: buildHtml(url, name) };
  }

  function renderPreview() {
    var box = $('scPreview');
    if (!box) return;
    var r = build();
    /* 还没填网址时给句话占位，别把整块留空 —— 让人知道这里会出东西 */
    box.textContent = r ? r.code
      : '还没有填网址 —— 上面填一个，这里会实时显示写进文件的完整内容。';
  }

  /* ---------- 从本站收录的站点里挑 ----------
     表单不预设任何内容，这里只是给个「不用手打」的入口：
     点一下填进表单，右边那个小按钮单独把网址复制到剪贴板。 */
  var PICKS = (function () {
    var out = [];
    var seen = {};

    function add(list, catName) {
      (list || []).forEach(function (s) {
        if (!s || !s.url || !s.name || seen[s.url]) return;
        seen[s.url] = true;
        out.push({ name: s.name, url: s.url, cat: catName || '' });
      });
    }

    (CFG.categories || []).forEach(function (c) { add(c.sites, c.name); });
    (CFG.index || []).forEach(function (s) { add([s], s.cat); });
    add(CFG.urls, '常见官网');
    return out;
  })();

  function pickHit(s, q) {
    if (!q) return true;
    return (s.name + ' ' + s.url + ' ' + s.cat).toLowerCase().indexOf(q) > -1;
  }

  function fillFrom(s) {
    if ($('scUrl')) $('scUrl').value = s.url;
    if ($('scName')) $('scName').value = s.name;
    lastAuto = s.name;                 /* 记住这个自动值，别被下一次输入覆盖掉 */
    renderPreview();
  }

  function renderPicks() {
    var box = $('scPickList');
    if (!box) return;

    var raw = $('scPickSearch') ? $('scPickSearch').value.trim().toLowerCase() : '';
    var hits = PICKS.filter(function (s) { return pickHit(s, raw); });
    var shown = hits.slice(0, raw ? 12 : 8);

    box.textContent = '';

    if (!shown.length) {
      var none = document.createElement('p');
      none.className = 'sc-picker-none';
      none.textContent = '本站没有收录和「' + raw + '」相关的站点 —— 直接在上面的网址框里填就行。';
      box.appendChild(none);
      return;
    }

    shown.forEach(function (s) {
      var row = document.createElement('div');
      row.className = 'sc-picker-item';
      row.title = '点击填入：' + s.name;

      var txt = document.createElement('button');
      txt.type = 'button';
      txt.className = 'sc-picker-name';
      var b = document.createElement('b');
      b.textContent = s.name;
      txt.appendChild(b);
      txt.appendChild(document.createTextNode(s.url.replace(/^https?:\/\//, '').replace(/\/$/, '')));
      txt.addEventListener('click', function () { fillFrom(s); });

      var cp = document.createElement('button');
      cp.type = 'button';
      cp.className = 'sc-picker-copy';
      cp.textContent = '复制网址';
      cp.addEventListener('click', function (e) {
        e.stopPropagation();
        copyText(s.url, '网址已复制');
      });

      row.appendChild(txt);
      row.appendChild(cp);
      box.appendChild(row);
    });

    if (hits.length > shown.length) {
      var more = document.createElement('p');
      more.className = 'sc-picker-more';
      more.textContent = '还有 ' + (hits.length - shown.length) + ' 个，继续输入可以缩小范围';
      box.appendChild(more);
    }
  }

  /* 名字框的自动值：用户手输过就别再覆盖他了 */
  var lastAuto = '';

  function autoName() {
    if (!$('scName') || !$('scUrl')) return;
    var cur = $('scName').value.trim();
    /* 只在「空着」或「还是上一次自动填的值」时更新，
       用户自己改过的内容一个字都不动 */
    if (cur && cur !== lastAuto) return;
    var guess = suggestName(cleanUrl($('scUrl').value));
    lastAuto = guess;
    $('scName').value = guess;
  }

  function init() {
    if (!$('scUrl')) return;

    /* 表单不预设内容 —— 网址得是用户自己给的（和二维码生成一个道理）。
       唯一例外：从别的页面带参数过来，比如 ?url=godotengine.org&name=Godot */
    try {
      var q = new URLSearchParams(location.search);
      if (q.get('url') && $('scUrl')) $('scUrl').value = q.get('url');
      if (q.get('name') && $('scName')) $('scName').value = q.get('name');
    } catch (e) { }

    renderPicks();

    /* 网址一动，名字跟着自动认一个（用户手改过就不再覆盖） */
    if ($('scUrl')) {
      $('scUrl').addEventListener('input', function () {
        autoName();
        renderPreview();
      });
    }
    if ($('scName')) {
      $('scName').addEventListener('input', renderPreview);
    }
    if ($('scPickSearch')) {
      $('scPickSearch').addEventListener('input', renderPicks);
    }
    document.querySelectorAll('input[name="scType"]').forEach(function (n) {
      n.addEventListener('change', function () { renderPreview(); updateWarn(); });
    });

    if ($('scMake')) {
      $('scMake').addEventListener('click', function () {
        var r = build();
        if (!r) {
          if (window.showToast) window.showToast('先填一个网址，比如 godotengine.org');
          if ($('scUrl')) $('scUrl').focus();
          return;
        }

        /* 当前系统用不了的格式：先不下载，弹窗把原因说清楚。
           用户确认「仍要下载」才放行（可能想下好再传给别的电脑）。 */
        var bad = unsupported();
        if (bad) { pending = r; showDialog(bad); return; }

        download(r.file, r.code);
        if (window.showToast) {
          window.showToast(r.type === 'url'
            ? '已下载 ' + r.file + ' —— 拖到桌面就能用'
            : '已下载 ' + r.file + ' —— 拖到桌面双击直达');
        }
      });
    }

    /* 弹窗上的两个按钮：「知道了」什么都不做，「仍要下载」才真的存下来 */
    if ($('scDlgAnyway')) {
      $('scDlgAnyway').addEventListener('click', function () {
        var r = pending || build();
        hideDialog();
        if (!r) return;
        download(r.file, r.code);
        if (window.showToast) {
          window.showToast('已下载 ' + r.file + ' —— 在你当前系统上打不开，可以传给别的电脑用');
        }
      });
    }
    if ($('scDlgCancel')) $('scDlgCancel').addEventListener('click', hideDialog);
    if ($('scMask')) {
      $('scMask').addEventListener('click', function (e) {
        if (e.target === $('scMask')) hideDialog();
      });
    }
    document.addEventListener('keydown', function (e) {
      var mask = $('scMask');
      if (e.key === 'Escape' && mask && !mask.hidden) hideDialog();
    });

    if ($('scCopy')) {
      $('scCopy').addEventListener('click', function () {
        var r = build();
        if (!r) {
          if (window.showToast) window.showToast('先填一个像样的网址');
          if ($('scUrl')) $('scUrl').focus();
          return;
        }
        copyText(r.code, '代码已复制');
      });
    }

    /* 带参数进来时同步一次自动名字；其余情况什么都不预填 */
    if ($('scUrl') && $('scUrl').value) autoName();
    renderPreview();
    updateWarn();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
