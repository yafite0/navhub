/* ============================================================
   收藏网址
   ------------------------------------------------------------
   职责：
     1. 给「其他网页」页的每张卡片挂星标（★ / ☆）
     2. 收藏 / 取消收藏时弹一个对话框，让用户自己命名
        —— 名字只影响主页收藏栏的显示，最多 50 字
     3. 在主页搜索框下面渲染收藏栏，带站点图标，点了直接开

   数据存在 localStorage 的 navhub.favs：
     [{ url: 'https://7-zip.org/', name: '7-Zip' }, ...]
   ============================================================ */
(function () {
  var KEY = 'navhub.favs';
  var MAX_NAME = 50;

  /* ---------- 读写 ---------- */
  function read() {
    var a = [];
    try { a = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { a = []; }
    if (!Array.isArray(a)) a = [];
    return a.map(function (x) {
      if (typeof x === 'string') return { url: x, name: '' };
      return x && x.url ? x : null;
    }).filter(Boolean);
  }

  function write(a) {
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { }
    try { window.dispatchEvent(new CustomEvent('navhub:favchange')); } catch (e) { }
  }

  function indexOfUrl(url) {
    var a = read();
    for (var i = 0; i < a.length; i++) { if (a[i].url === url) return i; }
    return -1;
  }

  function has(url) { return indexOfUrl(url) > -1; }

  function nameOf(url) {
    var i = indexOfUrl(url);
    return i > -1 ? read()[i].name : '';
  }

  function add(url, name) {
    var a = read();
    var i = -1;
    for (var k = 0; k < a.length; k++) { if (a[k].url === url) { i = k; break; } }
    var obj = { url: url, name: String(name || url).slice(0, MAX_NAME) };
    if (i > -1) a[i] = obj; else a.push(obj);
    write(a);
  }

  function remove(url) {
    var a = read();
    for (var i = a.length - 1; i >= 0; i--) { if (a[i].url === url) a.splice(i, 1); }
    write(a);
  }

  function rename(url, name) {
    var a = read();
    for (var i = 0; i < a.length; i++) {
      if (a[i].url === url) { a[i].name = String(name || '').slice(0, MAX_NAME); break; }
    }
    write(a);
  }

  window.Favs = {
    all: read, has: has, nameOf: nameOf,
    add: add, remove: remove, rename: rename
  };

  /* ---------- 星标图标 ---------- */
  var PATH_STAR = 'M12 3.6l2.66 5.4 5.96.87-4.31 4.2 1.02 5.94L12 17.2l-5.33 2.81 1.02-5.94-4.31-4.2 5.96-.87z';

  function starSvg(filled) {
    return '<svg viewBox="0 0 24 24" width="19" height="19" ' +
      (filled ? 'fill="currentColor"' : 'fill="none"') +
      ' stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="' + PATH_STAR + '"/></svg>';
  }

  /* ============================================================
     命名对话框
     ------------------------------------------------------------
     返回 Promise<{ key, name }>：
       收藏时   key = 'ok' | null（取消）
       取消收藏 key = 'rename'（只改名称）| 'delete'（仍然删除）| null
     ============================================================ */
  function favDialog(cfg) {
    return new Promise(function (resolve) {
      var mask = document.createElement('div');
      mask.className = 'fd-mask';

      var box = document.createElement('div');
      box.className = 'fd-box';

      var title = document.createElement('div');
      title.className = 'fd-title';
      title.textContent = cfg.title;
      box.appendChild(title);

      if (cfg.hint) {
        var hint = document.createElement('p');
        hint.className = 'fd-hint';
        hint.textContent = cfg.hint;
        box.appendChild(hint);
      }

      var input = document.createElement('input');
      input.className = 'fd-input';
      input.type = 'text';
      input.maxLength = MAX_NAME;
      input.value = (cfg.name || '').slice(0, MAX_NAME);
      input.setAttribute('aria-label', '收藏名称');
      box.appendChild(input);

      var count = document.createElement('div');
      count.className = 'fd-count';
      box.appendChild(count);

      var suggests = (cfg.suggests || []).filter(function (x) { return x; });
      if (suggests.length) {
        var sug = document.createElement('div');
        sug.className = 'fd-sug';
        var label = document.createElement('span');
        label.className = 'fd-sug-label';
        label.textContent = '常用名：';
        sug.appendChild(label);
        suggests.slice(0, 3).forEach(function (s) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'fd-sug-btn';
          b.textContent = s;
          b.addEventListener('click', function () {
            input.value = String(s).slice(0, MAX_NAME);
            sync();
            input.focus();
          });
          sug.appendChild(b);
        });
        box.appendChild(sug);
      }

      var row = document.createElement('div');
      row.className = 'fd-row';
      (cfg.buttons || []).forEach(function (b) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fd-btn' + (b.primary ? ' is-primary' : '') + (b.danger ? ' is-danger' : '');
        btn.textContent = b.label;
        btn.addEventListener('click', function () {
          close(b.key === undefined ? 'ok' : b.key, input.value.trim());
        });
        row.appendChild(btn);
      });
      box.appendChild(row);

      mask.appendChild(box);
      document.body.appendChild(mask);

      function sync() {
        count.textContent = input.value.length + ' / ' + MAX_NAME;
      }

      function onKey(e) {
        if (e.key === 'Escape') close(null);
        else if (e.key === 'Enter' && document.activeElement === input) {
          var first = (cfg.buttons || [])[0];
          close(first ? (first.key === undefined ? 'ok' : first.key) : null, input.value.trim());
        }
      }

      function close(key, name) {
        if (mask.parentNode) mask.parentNode.removeChild(mask);
        document.removeEventListener('keydown', onKey);
        resolve({ key: key, name: name });
      }

      input.addEventListener('input', sync);
      document.addEventListener('keydown', onKey);
      mask.addEventListener('click', function (e) { if (e.target === mask) close(null); });

      sync();
      setTimeout(function () { input.focus(); input.select(); }, 30);
    });
  }

  /* ============================================================
     官网卡片上的星标
     ============================================================ */
  window.mountFav = function (card, url, name, suggests) {
    if (!card || !url) return;

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fav-btn';

    function paint() {
      var on = has(url);
      b.innerHTML = starSvg(on);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-label', on ? '取消收藏' : '收藏');
      b.title = on ? '已收藏（点击可改名或删除）' : '收藏到主页';
    }

    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (has(url)) {
        /* 已收藏：可以改名，也可以直接删 */
        favDialog({
          title: '已收藏',
          hint: '改个名字只影响主页收藏栏的显示；不想留了就点「仍然删除」。',
          name: nameOf(url) || name || url,
          suggests: suggests,
          buttons: [
            { key: 'rename', label: '保存名称', primary: true },
            { key: 'delete', label: '仍然删除', danger: true }
          ]
        }).then(function (r) {
          if (!r.key) return;
          if (r.key === 'delete') remove(url);
          else rename(url, r.name || name || url);
          paint();
        });
        return;
      }

      /* 未收藏：先让用户确认名字 */
      favDialog({
        title: '收藏到主页',
        hint: '名字只影响主页收藏栏里的显示，以后随时能改。',
        name: name || url,
        suggests: suggests,
        buttons: [
          { key: 'ok', label: '收藏', primary: true },
          { key: null, label: '取消' }
        ]
      }).then(function (r) {
        if (r.key !== 'ok') return;
        add(url, r.name || name || url);
        paint();
      });
    });

    paint();
    card.appendChild(b);
  };

  /* ============================================================
     主页收藏栏
     ============================================================ */
  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch (e) { return ''; }
  }

  /* 站点图标：先放名字首字，本地图标加载成功后再替换。
     反过来的写法（先塞 img、失败再退回首字）在图片被禁用、
     或者网络卡住不返回时，会一直空着 —— 先有字总比空着强。 */
  function buildChipIcon(item) {
    var wrap = document.createElement('span');
    wrap.className = 'fav-chip-ico is-text';

    var host = hostOf(item.url);
    var name = item.name || host || item.url;
    wrap.textContent = String(name).charAt(0).toUpperCase();

    if (!host) return wrap;

    var img = document.createElement('img');
    img.alt = '';
    img.addEventListener('load', function () {
      wrap.textContent = '';
      wrap.classList.remove('is-text');
      wrap.appendChild(img);
    });
    img.src = 'assets/icons/' + host + '.png';

    return wrap;
  }

  function renderBar() {
    var bar = document.getElementById('favBar');
    if (!bar) return;

    var list = read();
    bar.innerHTML = '';
    bar.classList.remove('is-open');
    bar.classList.toggle('is-empty', !list.length);
    bar.classList.toggle('has-items', !!list.length);

    /* 手机端的「更多」按钮挂在收藏框外面（bar.nextSibling），
       bar.innerHTML = '' 清不到它 —— 不手动删，每渲染一次就多一个。 */
    var stale = bar.parentNode ? bar.parentNode.querySelector('.fav-more') : null;
    if (stale && stale.parentNode) stale.parentNode.removeChild(stale);

    if (!list.length) {
      var tip = document.createElement('span');
      tip.className = 'fav-empty';
      tip.textContent = '还没有收藏 —— 在「其他网页」里点右上角的 ☆ 就能收到这里';
      bar.appendChild(tip);
      return;
    }

    list.forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'fav-chip';
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = item.name || item.url;

      a.appendChild(buildChipIcon(item));

      var n = document.createElement('span');
      n.className = 'fav-chip-name';
      n.textContent = item.name || hostOf(item.url) || item.url;
      a.appendChild(n);

      /* 移除：先弹对话框（可改名，也可真删） */
      var x = document.createElement('span');
      x.className = 'fav-chip-x';
      x.textContent = '×';
      x.title = '取消收藏';
      x.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        favDialog({
          title: '取消收藏',
          hint: '改个名字就会保留这一条；确定不要了再点「仍然删除」。',
          name: item.name || hostOf(item.url) || item.url,
          suggests: [item.name, hostOf(item.url)],
          buttons: [
            { key: 'rename', label: '保存名称', primary: true },
            { key: 'delete', label: '仍然删除', danger: true }
          ]
        }).then(function (r) {
          if (!r.key) return;
          if (r.key === 'delete') remove(item.url);
          else rename(item.url, r.name || item.name);
          renderBar();
        });
      });
      a.appendChild(x);

      bar.appendChild(a);
    });

    /* ---------- 「更多」按钮 ----------
       只在收藏真的装不下两行时才出现。判定方式是等一帧让布局稳定，
       比较 scrollHeight 和 clientHeight。
       用绝对定位是为了让它不参与 scrollHeight —— 否则自己把框撑高，
       永远判定不出「装不下」。 */
    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'fav-more';
    more.textContent = '更多';
    more.hidden = true;
    more.addEventListener('click', function (e) {
      e.preventDefault();
      var open = bar.classList.toggle('is-open');
      more.textContent = open ? '收起' : '更多';
    });

    /* 手机是竖排布局，按钮不缩在框里 —— 放到收藏框正下方，占满一行。
       桌面横排空间紧，继续留在框内右上角。 */
    var isMobile = window.matchMedia('(max-width: 600px)').matches;
    if (isMobile && bar.parentNode) {
      bar.parentNode.insertBefore(more, bar.nextSibling);
    } else {
      bar.appendChild(more);
    }

    /* 用 setTimeout 而不是 requestAnimationFrame：
       rAF 在无头浏览器的虚拟时钟下可能一直不回调，判断就永远不生效。
       32ms 足够让布局算完，肉眼也看不出来。 */
    window.setTimeout(function () {
      more.hidden = bar.scrollHeight <= bar.clientHeight + 2;
    }, 32);
  }

  function initBar() {
    var wrap = document.querySelector('.hero-block .search-wrap');
    if (!wrap || document.getElementById('favBar')) return;

    var bar = document.createElement('div');
    bar.id = 'favBar';
    bar.className = 'fav-bar';

    if (wrap.parentNode) wrap.parentNode.insertBefore(bar, wrap.nextSibling);
    renderBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBar);
  } else {
    initBar();
  }

  window.addEventListener('navhub:favchange', renderBar);
})();
