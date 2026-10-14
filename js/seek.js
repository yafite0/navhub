/* ============================================================
   启航 · 搜索栏公用逻辑（主页与「其他网页」页共用）
   ------------------------------------------------------------
   两边共用的判断都放这，免得各写一套标准不一致：
     1. 判断用户敲进来的是「网址」还是「要搜的问题」
     2. 站内没有收录时，把活交回给搜索引擎
     3. 打开新标签页（顺带兜住移动端对 window.open 的拦截）

   注意这里**不做黑名单**：本站所有网址都是手工挑的，没有进来的口子，
   详见 README「收录标准」。
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.NAV_CONFIG || {};

  /* 搜索引擎可以在 data.js 里改。第一条是默认（回车就用它）。 */
  var ENGINES = CFG.searchEngines || [
    { name: '百度', url: 'https://www.baidu.com/s?wd=%s' },
    { name: '必应', url: 'https://www.bing.com/search?q=%s' }
  ];

  /* 顶级域名那一截：纯字母（com / cn / io / top…），或 punycode，或中文域名。
     用它是为了把「3.14」「1.2.3」这种带点但不是网址的东西排除掉 —— 
     老写法只看「有没有点」，输个小数就被当成网址跳到 3.14 去了。 */
  var TLD_RE = /^([a-z]{2,24}|xn--[a-z0-9-]+|[\u4e00-\u9fa5]+)$/i;

  function isUrl(t) {
    var s = String(t == null ? '' : t).trim();
    if (!s || /\s/.test(s)) return false;
    if (/^https?:\/\/[^\s]+$/i.test(s)) return true;

    /* 去掉协议头，只看主机部分 */
    var host = s.replace(/^https?:\/\//i, '').split('/')[0].split('?')[0].split('#')[0];
    host = host.split('@').pop().split(':')[0];          // 去掉可能的 user@ 和端口

    var parts = host.split('.');
    if (parts.length < 2) return false;                  // 没有点，肯定不是网址
    if (parts.some(function (p) { return p === ''; })) return false;   // a..b / a.b. 这类
    return TLD_RE.test(parts[parts.length - 1]);
  }

  /* 用户只输 www.baidu.com 或 baidu.com 时，补上协议头 */
  function normalize(t) {
    var s = String(t == null ? '' : t).trim();
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    return s;
  }

  function engineHref(engine, q) {
    return String(engine.url).replace('%s', encodeURIComponent(String(q == null ? '' : q)));
  }

  /* 打开新标签页。移动端对 window.open 的拦截比桌面严，
     被拦下来（返回 null）就退化成当前页跳转，至少能到。 */
  function open(url) {
    var w = null;
    try { w = window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) { w = null; }
    if (!w) location.href = url;
  }

  /* 取一个网址的主机名，去掉 www. ：用来判断「用户输的这个网址我们收没收录」 */
  function hostOf(url) {
    try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); }
    catch (e) { return ''; }
  }

  window.Seek = {
    isUrl: isUrl,
    normalize: normalize,
    engines: function () { return ENGINES; },
    engineHref: engineHref,
    open: open,
    hostOf: hostOf
  };
})();
