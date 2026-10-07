/* ============================================================
   查看我的电脑配置
   —— 全部靠浏览器自己读，不联网、不上传。
   —— 注意：浏览器对硬件信息做了限制，能读到的很有限，
      拿不到的东西（CPU 具体型号、硬盘、主板）不要假装能拿到，
      要在页面上如实说明，并给出系统自带工具的查看方式。
   ============================================================ */
(function () {
  'use strict';

  var panel = document.querySelector('[data-tool-panel="specs"]');
  if (!panel) return;

  function $(id) { return document.getElementById(id); }

  /* ---------- 显卡厂商 → 对应驱动官网 ---------- */
  var VENDORS = [
    {
      k: 'nvidia', name: 'NVIDIA',
      re: /nvidia|geforce|\brtx\b|\bgtx\b|\bmx\d|quadro|tesla/i,
      site: 'https://www.nvidia.cn/geforce/drivers/',
      siteName: 'NVIDIA 驱动下载'
    },
    {
      k: 'amd', name: 'AMD',
      re: /radeon|\bamd\b|advanced micro devices|\bati\b|vega/i,
      site: 'https://www.amd.com/zh-cn/support/download/drivers.html',
      siteName: 'AMD 驱动下载'
    },
    {
      k: 'intel', name: 'Intel',
      re: /intel|\barc\b|iris|\buhd\b|\bhd graphics\b/i,
      site: 'https://www.intel.cn/content/www/cn/zh/download-center/home.html',
      siteName: 'Intel 驱动下载中心'
    },
    {
      k: 'apple', name: 'Apple',
      re: /apple|\bm[1-4]\b|metal renderer/i,
      site: '',
      siteName: ''
    },
    {
      k: 'qualcomm', name: 'Qualcomm',
      re: /adreno|qualcomm|snapdragon/i,
      site: '',
      siteName: ''
    },
    {
      k: 'arm', name: 'ARM',
      re: /\bmali\b|immortalis|arm limited/i,
      site: '',
      siteName: ''
    }
  ];

  /* 软件渲染：说明没真正拿到显卡，多半是虚拟机或驱动没装好 */
  var SOFTWARE = /swiftshader|llvmpipe|microsoft basic|basic render|software rasterizer|mesa offscreen|vmware|virtualbox|parallels/i;
  /* 浏览器故意模糊掉的值（火狐开了防追踪、部分隐私模式下会返回） */
  var BLURRED = /^(mozilla|webkit|unknown|generic renderer|generic|)$/i;

  function cleanRenderer(raw) {
    var s = String(raw || '');

    /* Chrome / Edge 在 Windows 上给的是 ANGLE 包装格式：
       ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0, D3D11)
       只要中间那段的显卡名。 */
    var m = s.match(/^ANGLE\s*\(([\s\S]*)\)\s*$/i);
    if (m) {
      var parts = m[1].split(',').map(function (x) { return x.trim(); });
      var keep = parts.filter(function (p) {
        if (!p) return false;
        if (/^(direct3d|d3d|opengl|opengl es|metal|vulkan|angle)/i.test(p)) return false;
        if (/^(unspecified|unknown|version|\d+(\.\d+)*)$/i.test(p)) return false;
        if (/^vs_\d|^ps_\d|^gl_/i.test(p)) return false;
        return true;
      });
      /* 去重：厂商名既单独出现、又拼在型号前面时只留一条 */
      if (keep.length > 1) {
        var a = keep[0].toLowerCase(), b = keep[1].toLowerCase();
        if (b.indexOf(a) === 0) keep = keep.slice(1);
      }
      if (keep.length) s = keep.join(' ');
    }

    s = s.replace(/ANGLE Metal Renderer:\s*/i, '')
      .replace(/\(R\)|\(TM\)/gi, '')
      /* 显卡名后面常跟着 PCI 设备号，像 GeForce RTX 3060 Ti (0x00002489)，
         这东西对用户没意义，去掉 */
      .replace(/\s*\(\s*0x[0-9a-f]+\s*\)/gi, '')
      .replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}[^)]*\)/gi, '')
      .replace(/Direct3D\s*\d+/gi, ' ')
      .replace(/vs_\d+_\d+\s+ps_\d+_\d+/gi, ' ')
      .replace(/OpenGL Engine/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s,·-]+|[\s,·-]+$/g, '')
      .trim();

    return s;
  }

  /* ---------- 读显卡 ---------- */
  function readGPU() {
    var renderer = '', vendor = '';
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) {
        return { name: '', brand: '', note: '当前浏览器没启用 WebGL，读不到显卡信息' };
      }
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
        vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || '';
      }
      if (!renderer) renderer = gl.getParameter(gl.RENDERER) || '';

      /* 释放掉临时上下文，别占着显存 */
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    } catch (e) {
      return { name: '', brand: '', note: '当前浏览器不允许读取显卡信息' };
    }

    var name = cleanRenderer(renderer);
    var hay = renderer + ' ' + vendor + ' ' + name;

    if (!name || BLURRED.test(name)) {
      return {
        name: '',
        brand: '',
        note: '浏览器把它模糊掉了（多为开启了隐私保护或防追踪），认不出具体型号'
      };
    }

    var hit = null;
    for (var i = 0; i < VENDORS.length; i++) {
      if (VENDORS[i].re.test(hay)) { hit = VENDORS[i]; break; }
    }

    if (SOFTWARE.test(hay)) {
      return {
        name: name,
        brand: hit ? hit.name : '',
        note: '这是<b>软件模拟的显卡</b>，不是真实硬件 —— 常见于虚拟机、远程桌面，或者驱动没装好',
        soft: true
      };
    }

    return {
      name: name,
      brand: hit ? hit.name : '',
      vendor: hit
    };
  }

  /* ---------- 操作系统 ---------- */
  function readOS() {
    var ua = navigator.userAgent || '';
    var uad = navigator.userAgentData || null;
    var plat = (uad && uad.platform) || '';
    var ver = '';

    if (!plat) {
      if (/Windows NT 10\.0/i.test(ua)) plat = 'Windows';
      else if (/Windows NT 6\.3/i.test(ua)) plat = 'Windows';
      else if (/Mac OS X/i.test(ua)) plat = 'macOS';
      else if (/Android/i.test(ua)) plat = 'Android';
      else if (/iPhone|iPad|iPod/i.test(ua)) plat = 'iOS';
      else if (/CrOS/i.test(ua)) plat = 'Chrome OS';
      else if (/Linux/i.test(ua)) plat = 'Linux';
    }

    if (plat === 'Windows' || /Windows/i.test(ua)) {
      /* 微软的版本号映射：13 以上是 Windows 11，10.x 是 Windows 10 */
      var m = ua.match(/Windows NT (\d+\.\d+)/);
      plat = 'Windows';
      ver = m ? ('NT ' + m[1]) : '';
      if (m && m[1] === '10.0') ver = '10 / 11';
      var pv = (/Windows/.test((uad && uad.platform) || '') ? '' : '');
      if (pv) ver = pv;
    } else if (plat === 'macOS') {
      var mm = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
      if (mm) ver = mm[1].replace(/_/g, '.');
      plat = 'macOS';
    }

    /* UA-CH 能给出更准的版本（Windows 11 会是 13 以上） */
    var p = Promise.resolve('');
    if (uad && uad.getHighEntropyValues) {
      p = uad.getHighEntropyValues(['platformVersion']).then(function (v) {
        return (v && v.platformVersion) || '';
      }).catch(function () { return ''; });
    }

    return p.then(function (pv) {
      if (pv && /Windows/i.test(plat + ' ' + ((uad && uad.platform) || ''))) {
        var major = parseInt(String(pv).split('.')[0], 10);
        if (!isNaN(major)) ver = major >= 13 ? '11' : '10';
      }
      return { name: plat || '未知', ver: ver };
    });
  }

  /* ---------- 浏览器 ---------- */
  function readBrowser() {
    var ua = navigator.userAgent || '';
    var m;
    /* 只留主版本号，完整号太长也没人看（Chrome 141.0.7390.55 → Chrome 141） */
    function major(v) { return String(v).split('.')[0]; }
    if ((m = ua.match(/Edg(?:e|A|iOS)?\/([\d.]+)/))) return { name: 'Edge', ver: major(m[1]) };
    if ((m = ua.match(/OPR\/([\d.]+)/))) return { name: 'Opera', ver: major(m[1]) };
    if ((m = ua.match(/Firefox\/([\d.]+)/))) return { name: 'Firefox', ver: major(m[1]) };
    if ((m = ua.match(/Chrome\/([\d.]+)/))) return { name: 'Chrome', ver: major(m[1]) };
    if ((m = ua.match(/Version\/([\d.]+).*Safari/))) return { name: 'Safari', ver: major(m[1]) };
    return { name: '未知浏览器', ver: '' };
  }

  /* ---------- 内存 ---------- */
  function readMemory() {
    var gb = navigator.deviceMemory;
    if (typeof gb !== 'number' || !gb) {
      return { text: '浏览器未提供', sub: 'Firefox、Safari 都不开放这一项' };
    }
    if (gb >= 8) {
      return { text: '8 GB 或更多', sub: '浏览器最多只报到 8，实际可能更大' };
    }
    return { text: gb + ' GB', sub: '浏览器按档位上报，不是精确值' };
  }

  /* ---------- 屏幕 ---------- */
  function readScreen() {
    var w = screen.width, h = screen.height, dpr = window.devicePixelRatio || 1;
    var pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    var sub = dpr !== 1
      ? '物理分辨率约 ' + pw + ' × ' + ph + '（系统缩放 ' + Math.round(dpr * 100) + '%）'
      : '系统缩放 100%';
    return {
      text: w + ' × ' + h,
      sub: sub + ' · ' + (screen.colorDepth || 24) + ' 位色',
      w: w, h: h, dpr: dpr
    };
  }

  /* ---------- 网络 ---------- */
  function readNet() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return '';
    var map = { 'slow-2g': '很慢（2G）', '2g': '2G', '3g': '3G', '4g': '4G' };
    var t = map[c.effectiveType] || '';
    return t;
  }

  /* ---------- 汇总 ---------- */
  function collect() {
    var gpu = readGPU();
    var osP = readOS();

    return osP.then(function (os) {
      var mem = readMemory();
      var scr = readScreen();
      var br = readBrowser();
      var cores = navigator.hardwareConcurrency || 0;
      var tz = '';
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { }

      return {
        gpu: gpu,
        os: os,
        mem: mem,
        screen: scr,
        browser: br,
        cores: cores,
        tz: tz,
        lang: navigator.language || '',
        net: readNet(),
        touched: !!navigator.maxTouchPoints,
        mobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '')
      };
    });
  }

  /* ---------- 渲染 ---------- */
  function makeRow(label, value, sub, tone) {
    var row = document.createElement('div');
    row.className = 'spec-row' + (tone ? ' is-' + tone : '');

    var l = document.createElement('span');
    l.className = 'spec-key';
    l.textContent = label;
    row.appendChild(l);

    var v = document.createElement('div');
    v.className = 'spec-val';
    var b = document.createElement('b');
    b.textContent = value;
    v.appendChild(b);
    if (sub) {
      var s = document.createElement('small');
      s.textContent = sub;
      v.appendChild(s);
    }
    row.appendChild(v);
    return row;
  }

  var lastText = '';

  function render(d) {
    var gpuEl = $('specGpu');
    var subEl = $('specGpuSub');
    var drvEl = $('specDrv');
    var listEl = $('specList');

    /* 显卡是主角：单独放在顶部大字区 */
    if (gpuEl) {
      gpuEl.textContent = d.gpu.name || '没读到';
      gpuEl.classList.toggle('is-unknown', !d.gpu.name);
    }
    if (subEl) {
      if (d.gpu.note) subEl.innerHTML = d.gpu.note;
      else if (d.gpu.brand) subEl.textContent = d.gpu.brand;
      else subEl.textContent = '没认出厂牌，可以拿上面的型号名去官网搜';
    }

    if (drvEl) {
      var v = d.gpu.vendor;
      var txt = $('specDrvTxt');
      if (v && v.site) {
        drvEl.href = v.site;
        drvEl.hidden = false;
        if (txt) txt.textContent = '去 ' + v.name + ' 官网下载驱动';
      } else if (v && v.k === 'apple') {
        drvEl.href = 'https://support.apple.com/zh-cn/102662';
        drvEl.hidden = false;
        if (txt) txt.textContent = 'Apple 显卡驱动随系统更新';
      } else {
        drvEl.hidden = true;
      }
    }

    if (!listEl) return;
    listEl.textContent = '';

    var coreSub = d.cores ? '线程数（浏览器只能读到这个）' : '浏览器未提供';
    listEl.appendChild(makeRow('处理器', d.cores ? d.cores + ' 个逻辑核心' : '浏览器未提供', coreSub));
    listEl.appendChild(makeRow('内存', d.mem.text, d.mem.sub));
    listEl.appendChild(makeRow('操作系统', d.os.name + (d.os.ver ? ' ' + d.os.ver : ''), ''));
    listEl.appendChild(makeRow('屏幕', d.screen.text, d.screen.sub));

    listEl.appendChild(makeRow('设备类型',
      d.mobile ? '移动设备' : '桌面设备',
      d.touched ? '支持触屏' : '鼠标 / 键盘操作'));

    listEl.appendChild(makeRow('浏览器', d.browser.name + (d.browser.ver ? ' ' + d.browser.ver : ''), ''));
    listEl.appendChild(makeRow('语言 / 时区',
      (d.lang || '未知') + (d.tz ? ' · ' + d.tz : ''),
      d.net ? '当前网络：' + d.net : ''));

    /* 复制用的纯文本 */
    var lines = [
      '电脑配置（浏览器检测）',
      '',
      '显卡：' + (d.gpu.name || '未读到') + (d.gpu.brand ? '（' + d.gpu.brand + '）' : ''),
      '处理器：' + (d.cores ? d.cores + ' 个逻辑核心' : '未提供'),
      '内存：' + d.mem.text,
      '操作系统：' + d.os.name + (d.os.ver ? ' ' + d.os.ver : ''),
      '屏幕：' + d.screen.text + '（' + d.screen.sub + '）',
      '浏览器：' + d.browser.name + (d.browser.ver ? ' ' + d.browser.ver : ''),
      '语言时区：' + (d.lang || '-') + (d.tz ? ' / ' + d.tz : '')
    ];
    if (d.net) lines.push('网络：' + d.net);
    lines.push('', '检测时间：' + new Date().toLocaleString('zh-CN'));
    lines.push('说明：浏览器能读到的信息有限，CPU 具体型号、硬盘容量、主板型号需用系统自带工具查看。');
    lastText = lines.join('\n');
  }

  function run() {
    var gpuEl = $('specGpu');
    var subEl = $('specGpuSub');
    var listEl = $('specList');
    if (gpuEl) { gpuEl.textContent = '检测中…'; gpuEl.classList.remove('is-unknown'); }
    if (subEl) subEl.textContent = '';
    if (listEl) listEl.textContent = '';

    collect().then(render).catch(function () {
      if (gpuEl) gpuEl.textContent = '检测失败';
      if (subEl) subEl.textContent = '浏览器拒绝了这次读取，可以换个浏览器再试';
    });
  }

  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(txt).then(function () { return true; })
        .catch(function () { return fallbackCopy(txt); });
    }
    return Promise.resolve(fallbackCopy(txt));
  }

  function fallbackCopy(txt) {
    try {
      var ta = document.createElement('textarea');
      ta.value = txt;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function init() {
    /* 已经进入这个工具页时才检测，省得在别的工具里白跑一趟 */
    function maybe() {
      var p = new URLSearchParams(location.search).get('tool');
      if (p === 'specs') run();
    }

    maybe();
    window.addEventListener('popstate', maybe);

    var again = $('specAgain');
    if (again) again.addEventListener('click', function () { run(); });

    var cp = $('specCopy');
    if (cp) {
      cp.addEventListener('click', function () {
        if (!lastText) return;
        copyText(lastText).then(function (ok) {
          if (window.showToast) window.showToast(ok ? '配置信息已复制' : '复制失败，请手动选中复制');
        });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
