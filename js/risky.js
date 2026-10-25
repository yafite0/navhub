/* ============================================================
   风险后缀拦截
   ------------------------------------------------------------
   用户从搜索框输入一个网址、准备跳转时，如果后缀属于
   「注册便宜、垃圾站和钓鱼站多」的那一批，先拦下来提醒，
   让用户自己决定要不要继续。

   只在「真的要跳转」那一刻检查 —— 输入框里还没确定、
   或者探测失败退化成搜索的情况，都不打扰。

   弹窗里不写「这个网站不安全」。我们没法验证具体站点，
   一刀切会误伤正常网站。只讲后缀本身的特点，剩下的交给用户判断。
   ============================================================ */
(function () {
  /* 这批后缀的共同点：注册门槛低、年费便宜，
     所以被批量建站、钓鱼、导流的用得比较多。
     不是「有这个后缀就一定坏」，只是「值得多看一眼」。 */
  var TLD_LIST = ['cc', 'top', 'xyz', 'click', 'icu', 'buzz', 'link', 'work', 'fit', 'rest'];

  /* 每个后缀一句实话，不吓人也不轻描淡写 */
  var TLD_NOTE = {
    cc: '注册便宜，被大量导流站和钓鱼站使用',
    top: '注册门槛很低，垃圾站点比较多',
    xyz: '年费便宜，被批量建站的用得很多',
    click: '注册成本低，常被用来做跳转站',
    icu: '刚开放不久，缺乏监管，风险站点较多',
    buzz: '注册便宜，垃圾内容站点集中',
    link: '常被用来做短链和跳转，来源难判断',
    work: '注册门槛低，正规站和垃圾站混杂',
    fit: '小众后缀，注册审核宽松',
    rest: '小众后缀，注册审核宽松'
  };

  /* 取出网址的后缀；命中风险列表就返回后缀名，否则空字符串 */
  window.riskyTld = function (url) {
    var host = '';
    try { host = new URL(url).hostname; } catch (e) { return ''; }

    var m = host.match(/\.([a-z]{2,})$/i);
    if (!m) return '';

    var tld = m[1].toLowerCase();
    return TLD_LIST.indexOf(tld) > -1 ? tld : '';
  };

  /* 弹窗。resolve(true) = 仍然前往，resolve(false) = 算了 */
  window.warnRisky = function (url, tld) {
    return new Promise(function (resolve) {
      var mask = document.createElement('div');
      mask.className = 'rk-mask';

      var box = document.createElement('div');
      box.className = 'rk-box';

      /* 右上角关闭 —— 关掉等于不访问 */
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'rk-x';
      x.setAttribute('aria-label', '关闭');
      x.innerHTML = '&times;';
      box.appendChild(x);

      var title = document.createElement('div');
      title.className = 'rk-title';
      title.textContent = '这个网址可能有风险';
      box.appendChild(title);

      var body = document.createElement('div');
      body.className = 'rk-body';

      var p1 = document.createElement('p');
      p1.textContent = '这个网址用的是 .' + tld + ' 后缀，' +
        (TLD_NOTE[tld] || '这类域名注册成本低，风险站点比较多') + '。';
      body.appendChild(p1);

      var p2 = document.createElement('p');
      p2.textContent = '不是所有 .' + tld + ' 网站都有问题，但我们没法替你验证这一个。' +
        '如果你不清楚这个链接是从哪来的，建议不要在上面输入账号密码或支付信息。';
      body.appendChild(p2);

      var code = document.createElement('code');
      code.className = 'rk-url';
      code.textContent = url;
      body.appendChild(code);

      box.appendChild(body);

      var row = document.createElement('div');
      row.className = 'rk-row';

      /* 绿色：不访问（安全的那一边，也放在默认焦点上） */
      var safe = document.createElement('button');
      safe.type = 'button';
      safe.className = 'rk-btn is-safe';
      safe.textContent = '取消访问';

      /* 红色：继续前往 */
      var goBtn = document.createElement('button');
      goBtn.type = 'button';
      goBtn.className = 'rk-btn is-risk';
      goBtn.textContent = '继续前往';

      row.appendChild(safe);
      row.appendChild(goBtn);
      box.appendChild(row);

      mask.appendChild(box);
      document.body.appendChild(mask);

      function close(go) {
        if (mask.parentNode) mask.parentNode.removeChild(mask);
        document.removeEventListener('keydown', onKey);
        resolve(!!go);
      }

      function onKey(e) {
        if (e.key === 'Escape') close(false);
      }

      x.addEventListener('click', function () { close(false); });
      safe.addEventListener('click', function () { close(false); });
      goBtn.addEventListener('click', function () { close(true); });
      mask.addEventListener('click', function (e) { if (e.target === mask) close(false); });
      document.addEventListener('keydown', onKey);

      setTimeout(function () { safe.focus(); }, 30);
    });
  };
})();
