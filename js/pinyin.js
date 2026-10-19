/* ============================================================
   精简拼音表
   ------------------------------------------------------------
   只收录本站 144 个站点名里出现过的 149 个汉字 —— 不是通用拼音库。

   为什么需要它：搜「爱」的时候，用户期望连网址里带 ai 的站也列出来
   （爱奇艺 → iqiyi.com 里没有 ai，但很多站是「拼音域名」）。
   中文查询直接去匹配 ASCII 网址永远匹配不上，得先把字转成拼音。

   这一版只做「全拼 → 用于匹配网址」，不做多音字纠错、不做声调。
   站点名要是以后加了很多新字，把新字补进 TABLE 就行。
   ============================================================ */
(function () {
  'use strict';

  var TABLE = {
    '豆': 'dou', '包': 'bao', '通': 'tong', '义': 'yi', '千': 'qian',
    '问': 'wen', '腾': 'teng', '讯': 'xun', '元': 'yuan', '宝': 'bao',
    '文': 'wen', '心': 'xin', '一': 'yi', '言': 'yan', '硅': 'gui',
    '基': 'ji', '流': 'liu', '动': 'dong', '开': 'kai', '放': 'fang',
    '平': 'ping', '台': 'tai', '剪': 'jian', '映': 'ying', '必': 'bi',
    '阿': 'a', '里': 'li', '云': 'yun', '百': 'bai', '炼': 'lian',
    '火': 'huo', '山': 'shan', '方': 'fang', '舟': 'zhou', '智': 'zhi',
    '谱': 'pu', '月': 'yue', '之': 'zhi', '暗': 'an', '面': 'mian',
    '度': 'du', '帆': 'fan', '混': 'hun', '可': 'ke', '画': 'hua',
    '稿': 'gao', '定': 'ding', '设': 'she', '计': 'ji', '翻': 'fan',
    '译': 'yi', '有': 'you', '道': 'dao', '应': 'ying', '君': 'jun',
    '搜': 'sou', '狗': 'gou', '彩': 'cai', '小': 'xiao', '杉': 'shan',
    '果': 'guo', '游': 'you', '戏': 'xi', '黑': 'hei', '盒': 'he',
    '商': 'shang', '店': 'dian', '暴': 'bao', '雪': 'xue', '战': 'zhan',
    '网': 'wang', '灵': 'ling', '码': 'ma', '快': 'kuai', '扣': 'kou',
    '子': 'zi', '盘': 'pan', '夸': 'kua', '克': 'ke', '微': 'wei',
    '天': 'tian', '翼': 'yi', '迅': 'xun', '雷': 'lei', '安': 'an',
    '全': 'quan', '卫': 'wei', '士': 'shi', '哔': 'bi', '哩': 'li',
    '视': 'shi', '频': 'pin', '爱': 'ai', '奇': 'qi', '艺': 'yi',
    '优': 'you', '酷': 'ku', '芒': 'mang', '抖': 'dou', '音': 'yin',
    '页': 'ye', '版': 'ban', '乐': 'le', '易': 'yi', '咪': 'mi',
    '咕': 'gu', '中': 'zhong', '国': 'guo', '大': 'da', '学': 'xue',
    '堂': 'tang', '在': 'zai', '线': 'xian', '公': 'gong', '课': 'ke',
    '知': 'zhi', '乎': 'hu', '科': 'ke', '瓣': 'ban', '淘': 'tao',
    '京': 'jing', '东': 'dong', '拼': 'pin', '多': 'duo', '美': 'mei',
    '团': 'tuan', '饿': 'e', '了': 'le', '么': 'me', '闲': 'xian',
    '鱼': 'yu', '博': 'bo', '红': 'hong', '书': 'shu', '贴': 'tie',
    '吧': 'ba', '家': 'jia', '少': 'shao', '数': 'shu', '派': 'pai',
    '米': 'mi', '社': 'she', '档': 'dang', '金': 'jin', '石': 'shi',
    '墨': 'mo', '索': 'suo', '地': 'di', '图': 'tu'
  };

  /* 整个字符串转全拼。认不出的字原样留着 ——
     宁可匹配不上，也别瞎拼出一个错误的拼音。 */
  function toPinyin(str) {
    var out = '';
    String(str == null ? '' : str).split('').forEach(function (ch) {
      out += (TABLE[ch] || ch);
    });
    return out;
  }

  /* 首字母串：搜「dby」想找「豆包」这种。 */
  function toInitials(str) {
    var out = '';
    String(str == null ? '' : str).split('').forEach(function (ch) {
      var p = TABLE[ch];
      out += p ? p.charAt(0) : ch;
    });
    return out;
  }

  window.PinyinLite = { toPinyin: toPinyin, toInitials: toInitials };
})();
