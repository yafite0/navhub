/* ============================================================
   翻译助手 —— 不调用任何接口，只做「带你去」和「帮你复制」
   ============================================================ */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  /* ---------- 站点列表 ---------- */
  /* 只收录提供网页版翻译的站点 */
  var WEB_LIST = [
    { n: '百度翻译', url: 'https://fanyi.baidu.com/', note: '国内直接访问' },
    { n: '有道翻译', url: 'https://fanyi.youdao.com/', note: '国内直接访问' },
    { n: '必应翻译', url: 'https://www.bing.com/translator', note: '微软出品' },
    { n: '腾讯翻译君', url: 'https://fanyi.qq.com/', note: '国内直接访问' },
    { n: '搜狗翻译', url: 'https://fanyi.sogou.com/', note: '国内直接访问' },
    { n: '彩云小译', url: 'https://fanyi.caiyunapp.com/', note: '中英日韩互译' },
    { n: 'Google 翻译', url: 'https://translate.google.com/', note: '访问可能不稳定' },
    { n: 'DeepL', url: 'https://www.deepl.com/translator', note: '访问可能不稳定' }
  ];

  /* 只收录能直接在网页里对话的 AI */
  var AI_LIST = [
    { n: 'DeepSeek', url: 'https://chat.deepseek.com/', note: '国内直接访问' },
    { n: '豆包', url: 'https://www.doubao.com/chat/', note: '国内直接访问' },
    { n: 'Kimi', url: 'https://www.kimi.com/', note: '国内直接访问' },
    { n: '通义千问', url: 'https://www.tongyi.com/', note: '国内直接访问', icon: 'assets/icons/qwen.png' },
    { n: '腾讯元宝', url: 'https://yuanbao.tencent.com/', note: '国内直接访问' },
    { n: '文心一言', url: 'https://yiyan.baidu.com/', note: '国内直接访问' },
    { n: '智谱清言', url: 'https://chatglm.cn/', note: '国内直接访问' },
    { n: '讯飞星火', url: 'https://xinghuo.xfyun.cn/', note: '国内直接访问' },
    { n: 'ChatGPT', url: 'https://chatgpt.com/', note: '访问可能不稳定' },
    { n: 'Claude', url: 'https://claude.ai/new', note: '访问可能不稳定' },
    { n: 'Gemini', url: 'https://gemini.google.com/app', note: '访问可能不稳定' }
  ];

  var LANGS = ['中文', '繁体中文', '英文', '日语', '韩语', '法语', '德语',
    '西班牙语', '俄语', '葡萄牙语', '意大利语', '阿拉伯语', '泰语', '越南语'];

  var TONES = ['自然口语', '严肃书面'];

  var state = { a: '英文', b: '中文', tone: '自然口语' };

  /* ---------- 提示词 ----------
     三条配合使用：先用「双向翻译规则」在新会话里约定好，
     之后想改语言/语气，再单独发对应的那条修改提示词。 */
  var PROMPTS = [
    {
      id: 'rules',
      name: '双向翻译规则',
      tag: '新会话首次使用',
      tip: function () {
        return '<strong>在新会话开始时发一次就够了</strong>，AI 回复「确认」规则就生效，<em>不需要重复发送</em>。' +
          '之后想换语言或语气，请选另外两条提示词。';
      },
      build: function (s) {
        return [
          '你是一名双向翻译助手。后续我发送消息时，请按以下规则处理。',
          '',
          '变量（下面三项都是变量，我会用单独的提示词来修改它们的取值）：',
          '- 语言A（对方语言，也就是需要翻译的语言）：' + s.a,
          '- 语言B（我的语言，也就是翻译完成的目标语言）：' + s.b,
          '- 语气风格：' + s.tone,
          '',
          '关于变量：目前的取值是 {{语言A}}=' + s.a + '，{{语言B}}=' + s.b + '，{{语气风格}}=' + s.tone + '。',
          '切换语言时只改变量的取值，规则本身不变。例如英译中就是 {{语言A}}=英文、{{语言B}}=中文；日译中就是 {{语言A}}=日文、{{语言B}}=中文。',
          '我之后可能会单独发一条消息来更换变量（例如「把语言A更换为日文」「把语气风格更换为严肃书面」），',
          '收到这类消息时，只更新对应的那一个变量，其他规则保持不动。',
          '',
          '',
          '规则：',
          '1. 我后续发送的无标记正文视为待翻译内容。',
          '2. 若待翻译内容为语言A，则翻译成语言B；若为语言B，则翻译成语言A。',
          '3. 圆括号（）内通常是情景说明、对方回复、我想表达的意思等，不翻译，只用于理解。若括号内也要翻译，需要等待用户明确说明。',
          '4. 语言A→语言B：不必过多解释，给出译文，并给出完整回译对照：将译文再回译为语言B。回译可调整句型和逻辑，但意思须一致，便于用户确认。',
          '5. 语言B→语言A：给出译文，并给出完整回译对照：将译文再回译为语言B。',
          '6. 每次翻译都必须包含完整回译对照。',
          '7. 回复尽量精简，不说无关话语。译文需符合' + s.tone + '。',
          '8. 若无法判断语言或翻译方向，先简短询问。',
          '9. 理解后只回复“确认”，然后等待用户发送需求。'
        ].join('\n');
      }
    },
    {
      id: 'lang',
      name: '更换翻译语言',
      tag: '想改语言时发',
      tip: function (s) {
        return '已经约定好规则之后，想把翻译语言换成别的，就发这一条。' +
          '语言取自上面的选择器：语言A = <em>' + s.a + '</em>，语言B = <em>' + s.b + '</em>。' +
          '<br>它只是改规则，不会重置前面的约定，可以和第一条配合着用。';
      },
      build: function (s) {
        return '请帮我更换一下翻译的语言，把语言A更换为' + s.a + '，把语言B更换为' + s.b + '。';
      }
    },
    {
      id: 'tone',
      name: '更换语气风格',
      tag: '想改语气时发',
      tip: function (s) {
        return '已经约定好规则之后，想换个语气说话就发这一条。' +
          '当前选的语气是 <em>' + s.tone + '</em>。';
      },
      build: function (s) {
        return '请帮我更换一下语气风格，把语气风格更换为' + s.tone + '。';
      }
    }
  ];

  var ICON_COLORS = [
    ['#4D6BFE', '#7B9BFF'], ['#2E9BFF', '#68C4FF'], ['#6C5CE7', '#A29BFE'],
    ['#00B4A6', '#4FE0C8'], ['#F2994A', '#F7C06B'], ['#EB5757', '#FF8A80'],
    ['#0EA5E9', '#54C8F5'], ['#8B5CF6', '#C4A2FF'], ['#10B981', '#5FE0B0']
  ];

  var promptEl;
  var currentId = 'rules';
  /* 本次打开页面后是否已经复制过提示词（手动复制、或点 AI 按钮自动复制都算）。
     没复制过说明用户还在设定初始语言，这时候不自动跳转到「更换」类提示词。 */
  var hasCopied = false;

  function currentPrompt() {
    for (var i = 0; i < PROMPTS.length; i++) {
      if (PROMPTS[i].id === currentId) return PROMPTS[i];
    }
    return PROMPTS[0];
  }

  /* ---------- 小工具 ---------- */
  function toast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add('is-show'); });
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(function () {
      t.classList.remove('is-show');
      window.setTimeout(function () { t.hidden = true; }, 260);
    }, 2400);
  }

  function hashOf(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
    return h;
  }

  /* 图标：本地文件优先 → 在线 favicon → 名字首字 */
  function buildIcon(name, url, custom) {
    var box = document.createElement('span');
    box.className = 'tr-item-ico';
    var pair = ICON_COLORS[hashOf(name) % ICON_COLORS.length];
    box.style.background = 'linear-gradient(135deg,' + pair[0] + ',' + pair[1] + ')';
    box.textContent = (name.replace(/^[\s\W]+/, '')[0] || '?').toUpperCase();

    var host = '';
    try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { }
    if (!host && !custom) return box;

    var chain = [];
    if (custom) chain.push(custom);
    if (host) {
      chain.push('assets/icons/' + host + '.png');
      chain.push('https://www.google.com/s2/favicons?sz=128&domain=' + host);
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

  function copyText(txt) {
    return new Promise(function (resolve) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { resolve(true); },
          function () { resolve(fallbackCopy(txt)); });
      } else {
        resolve(fallbackCopy(txt));
      }
    });
  }

  function fallbackCopy(txt) {
    try {
      var ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.setAttribute('readonly', 'readonly');
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  /* ---------- 提示词渲染 ---------- */
  function updateCount() {
    var el = $('promptCount');
    if (el) el.textContent = '共 ' + promptEl.value.length + ' 字符';
  }

  /* 两种语言一样时：禁用复制、给出红色警告（因为翻译没有方向） */
  function updateConflict() {
    var same = state.a === state.b;
    var btn = $('copyPrompt');
    if (btn) btn.disabled = same;

    var warn = $('promptWarn');
    if (warn) {
      warn.hidden = !same;
      if (same) {
        warn.textContent = '⚠ 语言A 和语言B 都是「' + state.a + '」，没有翻译方向，请确认一下翻译的目标';
      }
    }

    var list = document.querySelectorAll('#aiList button');
    for (var i = 0; i < list.length; i++) list[i].disabled = same;
  }

  function rebuildPrompt() {
    promptEl.value = currentPrompt().build(state);
    updateCount();
    updateConflict();
    renderTip();
  }

  /* 换语言/语气时只更新相关那几处，用户手写的内容保留 */
  function patchPrompt() {
    var p = currentPrompt();
    var t = promptEl.value;

    if (p.id === 'rules') {
      t = t.replace(/(语言A（[^）]*）：)[^（\s]+/, '$1' + state.a);
      t = t.replace(/(语言B（[^）]*）：)[^（\s]+/, '$1' + state.b);
      t = t.replace(/(语气风格：)[^（\n]+/, '$1' + state.tone);
      t = t.replace(/(译文需符合)[^。\n]+/, '$1' + state.tone);
      if (t.indexOf(state.a) === -1 || t.indexOf(state.b) === -1) t = p.build(state);
    } else if (p.id === 'lang') {
      t = t.replace(/(把语言A更换为)[^，,。\n]+/, '$1' + state.a);
      t = t.replace(/(把语言B更换为)[^，,。\n]+/, '$1' + state.b);
      if (t.indexOf(state.a) === -1 || t.indexOf(state.b) === -1) t = p.build(state);
    } else if (p.id === 'tone') {
      t = t.replace(/(把语气风格更换为)[^。\n]+/, '$1' + state.tone);
      if (t.indexOf(state.tone) === -1) t = p.build(state);
    }

    promptEl.value = t;
    updateCount();
    updateConflict();
    renderTip();
  }

  /* 改语言/语气时自动切到对应的「更换」提示词；「双向翻译规则」不参与跳转。
     但只有在已经复制过提示词之后才跳 —— 还没复制说明用户还在设定初始语言。 */
  function gotoPrompt(id) {
    if (!hasCopied) {
      rebuildPrompt();
      return;
    }
    var changed = currentId !== id;
    currentId = id;
    if (changed) renderPromptList();
    rebuildPrompt();
  }

  function renderPromptList() {
    var box = $('promptList');
    if (!box) return;
    box.textContent = '';

    PROMPTS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tr-prompt-item' + (p.id === currentId ? ' is-active' : '');
      b.setAttribute('aria-pressed', p.id === currentId ? 'true' : 'false');

      var name = document.createElement('b');
      name.textContent = p.name;
      var tag = document.createElement('span');
      tag.textContent = p.tag;
      b.appendChild(name);
      b.appendChild(tag);

      b.addEventListener('click', function () {
        if (p.id === currentId) return;
        currentId = p.id;
        renderPromptList();
        rebuildPrompt();
      });
      box.appendChild(b);
    });
  }

  function renderTip() {
    var box = $('promptTip');
    if (!box) return;
    box.innerHTML = currentPrompt().tip(state);
  }

  /* 让右侧 AI 列表和左侧提示词区一样高，超出部分在框内滚动 */
  function syncPanelHeight() {
    var left = document.querySelector('.tr-panel-left');
    var right = document.querySelector('.tr-panel-right');
    if (!left || !right) return;
    if (window.innerWidth <= 1180) {
      right.style.maxHeight = '';
      return;
    }
    var h = left.offsetHeight;
    if (h > 240) right.style.maxHeight = h + 'px';
  }

  /* ---------- 列表 ---------- */
  function fillList(box, list, onPick) {
    if (!box) return;
    box.textContent = '';
    list.forEach(function (item) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tr-item';
      b.title = item.url;
      b.appendChild(buildIcon(item.n, item.url, item.icon));

      var txt = document.createElement('span');
      txt.className = 'tr-item-text';
      var name = document.createElement('b');
      name.textContent = item.n;
      var note = document.createElement('span');
      note.textContent = item.note;
      txt.appendChild(name);
      txt.appendChild(note);
      b.appendChild(txt);

      b.addEventListener('click', function () { onPick(item); });
      box.appendChild(b);
    });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    promptEl = $('prompt');
    if (!promptEl) return;

    /* 主题 */
    (function () {
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
    })();

    /* 语言下拉 */
    var selA = $('langA'), selB = $('langB'), selTone = $('tone');
    LANGS.forEach(function (l) {
      var o1 = document.createElement('option'); o1.value = l; o1.textContent = l; selA.appendChild(o1);
      var o2 = document.createElement('option'); o2.value = l; o2.textContent = l; selB.appendChild(o2);
    });
    TONES.forEach(function (v) {
      var o = document.createElement('option'); o.value = v; o.textContent = v; selTone.appendChild(o);
    });
    selA.value = state.a;
    selB.value = state.b;
    selTone.value = state.tone;

    selA.addEventListener('change', function () {
      state.a = selA.value;
      gotoPrompt('lang');
    });
    selB.addEventListener('change', function () {
      state.b = selB.value;
      gotoPrompt('lang');
    });
    selTone.addEventListener('change', function () {
      state.tone = selTone.value;
      gotoPrompt('tone');
    });

    $('langSwap').addEventListener('click', function () {
      var t = state.a;
      state.a = state.b;
      state.b = t;
      selA.value = state.a;
      selB.value = state.b;
      gotoPrompt('lang');
      toast('已互换：' + state.a + ' ⇄ ' + state.b);
    });

    promptEl.addEventListener('input', updateCount);

    $('copyPrompt').addEventListener('click', function () {
      /* 点过复制就说明用户已经进入「使用这条提示词」的阶段，
         之后切换语言/语气才需要自动跳到对应的「更换」提示词。
         这里不等 Promise：某些浏览器下剪贴板写入会一直挂起，等它就永远不生效。 */
      hasCopied = true;
      copyText(promptEl.value).then(function (ok) {
        toast(ok ? '提示词已复制到剪贴板' : '复制失败，请手动全选复制');
      });
    });

    $('resetPrompt').addEventListener('click', function () {
      rebuildPrompt();
      toast('已恢复默认提示词');
    });

    fillList($('webList'), WEB_LIST, function (item) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    });

    fillList($('aiList'), AI_LIST, function (item) {
      /* 复制必须在点击的这一刻发起，否则会被浏览器拦；先复制再开新页 */
      hasCopied = true;
      var p = copyText(promptEl.value);
      window.open(item.url, '_blank', 'noopener,noreferrer');
      p.then(function (ok) {
        toast(ok ? '提示词已复制，到 ' + item.n + ' 直接粘贴就行'
          : '自动复制没成功，请回来点一下「复制这条提示词」');
      });
    });

    renderPromptList();
    rebuildPrompt();

    /* 左侧高度一变就同步右侧滚动框 */
    syncPanelHeight();
    window.addEventListener('resize', syncPanelHeight);
    if (window.ResizeObserver) {
      try {
        new ResizeObserver(syncPanelHeight).observe(document.querySelector('.tr-panel-left'));
      } catch (e) { }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
