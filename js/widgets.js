/* ============================================================
   启航 · 常用网站导航  —  小工具
   时钟问候 / 天气 / 单位换算 / 汇率 / 字数与费用
   ============================================================ */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  /* ============================================================
     1. 时钟 + 日期 + 问候语
     ============================================================ */
  function initClock() {
    var greetText = $('greetText'), dateText = $('dateText'), clockText = $('clockText');
    if (!clockText) return;

    var WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function greet(h) {
      if (h < 5) return '夜深了';
      if (h < 9) return '早上好';
      if (h < 12) return '上午好';
      if (h < 14) return '中午好';
      if (h < 18) return '下午好';
      if (h < 23) return '晚上好';
      return '夜深了';
    }

    function tick() {
      var d = new Date();
      if (clockText) clockText.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
      if (dateText) dateText.textContent = d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · ' + WEEK[d.getDay()];
      if (greetText) greetText.textContent = greet(d.getHours());
    }
    tick();
    window.setInterval(tick, 1000);
  }

  /* ============================================================
     2. 天气卡片（Open-Meteo 免费接口，无需密钥）
     ============================================================ */
  /* 全国省级行政区，按国家行政区划分为：
     4 个直辖市、23 个省、5 个自治区、2 个特别行政区。
     只存名称，坐标在选中时通过 Open-Meteo 地理编码接口获取并缓存在本机。 */
  var PROVINCE_GROUPS = [
    {
      g: '热门城市',
      items: [
        {
          n: '热门城市',
          c: ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '重庆',
            '武汉', '西安', '长沙', '天津', '苏州', '郑州', '青岛', '厦门', '香港', '台北']
        }
      ]
    },
    {
      g: '直辖市',
      items: [
        { n: '北京', c: ['北京'] },
        { n: '天津', c: ['天津'] },
        { n: '上海', c: ['上海'] },
        { n: '重庆', c: ['重庆'] }
      ]
    },
    {
      g: '省',
      items: [
        { n: '河北', c: ['石家庄', '唐山', '秦皇岛', '邯郸', '邢台', '保定', '张家口', '承德', '沧州', '廊坊', '衡水'] },
        { n: '山西', c: ['太原', '大同', '阳泉', '长治', '晋城', '朔州', '晋中', '运城', '忻州', '临汾', '吕梁'] },
        { n: '辽宁', c: ['沈阳', '大连', '鞍山', '抚顺', '本溪', '丹东', '锦州', '营口', '阜新', '辽阳', '盘锦', '铁岭', '朝阳', '葫芦岛'] },
        { n: '吉林', c: ['长春', '吉林', '四平', '辽源', '通化', '白山', '松原', '白城'] },
        { n: '黑龙江', c: ['哈尔滨', '齐齐哈尔', '鸡西', '鹤岗', '双鸭山', '大庆', '伊春', '佳木斯', '七台河', '牡丹江', '黑河', '绥化'] },
        { n: '江苏', c: ['南京', '无锡', '徐州', '常州', '苏州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁'] },
        { n: '浙江', c: ['杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水'] },
        { n: '安徽', c: ['合肥', '芜湖', '蚌埠', '淮南', '马鞍山', '淮北', '铜陵', '安庆', '黄山', '滁州', '阜阳', '宿州', '六安', '亳州', '池州', '宣城'] },
        { n: '福建', c: ['福州', '厦门', '莆田', '三明', '泉州', '漳州', '南平', '龙岩', '宁德'] },
        { n: '江西', c: ['南昌', '景德镇', '萍乡', '九江', '新余', '鹰潭', '赣州', '吉安', '宜春', '抚州', '上饶'] },
        { n: '山东', c: ['济南', '青岛', '淄博', '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海', '日照', '临沂', '德州', '聊城', '滨州', '菏泽'] },
        { n: '河南', c: ['郑州', '开封', '洛阳', '平顶山', '安阳', '鹤壁', '新乡', '焦作', '濮阳', '许昌', '漯河', '三门峡', '南阳', '商丘', '信阳', '周口', '驻马店'] },
        { n: '湖北', c: ['武汉', '黄石', '十堰', '宜昌', '襄阳', '鄂州', '荆门', '孝感', '荆州', '黄冈', '咸宁', '随州'] },
        { n: '湖南', c: ['长沙', '株洲', '湘潭', '衡阳', '邵阳', '岳阳', '常德', '张家界', '益阳', '郴州', '永州', '怀化', '娄底'] },
        { n: '广东', c: ['广州', '深圳', '珠海', '汕头', '佛山', '韶关', '湛江', '肇庆', '江门', '茂名', '惠州', '梅州', '汕尾', '河源', '阳江', '清远', '东莞', '中山', '潮州', '揭阳', '云浮'] },
        { n: '海南', c: ['海口', '三亚', '三沙', '儋州'] },
        { n: '四川', c: ['成都', '自贡', '攀枝花', '泸州', '德阳', '绵阳', '广元', '遂宁', '内江', '乐山', '南充', '眉山', '宜宾', '广安', '达州', '雅安', '巴中', '资阳'] },
        { n: '贵州', c: ['贵阳', '六盘水', '遵义', '安顺', '毕节', '铜仁'] },
        { n: '云南', c: ['昆明', '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧'] },
        { n: '陕西', c: ['西安', '铜川', '宝鸡', '咸阳', '渭南', '延安', '汉中', '榆林', '安康', '商洛'] },
        { n: '甘肃', c: ['兰州', '嘉峪关', '金昌', '白银', '天水', '武威', '张掖', '平凉', '酒泉', '庆阳', '定西', '陇南'] },
        { n: '青海', c: ['西宁', '海东'] },
        { n: '台湾', c: ['台北', '新北', '桃园', '台中', '台南', '高雄', '基隆', '新竹'] }
      ]
    },
    {
      g: '自治区',
      items: [
        { n: '内蒙古', c: ['呼和浩特', '包头', '乌海', '赤峰', '通辽', '鄂尔多斯', '呼伦贝尔', '巴彦淖尔', '乌兰察布'] },
        { n: '广西', c: ['南宁', '柳州', '桂林', '梧州', '北海', '防城港', '钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左'] },
        { n: '西藏', c: ['拉萨', '日喀则', '昌都', '林芝', '山南', '那曲'] },
        { n: '宁夏', c: ['银川', '石嘴山', '吴忠', '固原', '中卫'] },
        { n: '新疆', c: ['乌鲁木齐', '克拉玛依', '吐鲁番', '哈密', '昌吉', '阿克苏', '喀什', '和田', '伊宁'] }
      ]
    },
    {
      g: '特别行政区',
      items: [
        { n: '香港', c: ['香港'] },
        { n: '澳门', c: ['澳门'] }
      ]
    }
  ];

  /* 展平成一维列表，方便索引和查找 */
  var PROVINCES = [];
  PROVINCE_GROUPS.forEach(function (grp, gi) {
    grp.items.forEach(function (p) {
      p.group = grp.g;
      p.groupIndex = gi;
      p.idx = PROVINCES.length;
      PROVINCES.push(p);
    });
  });

  /* 城市拼音（用空格分音节），用于拼音全拼和首字母搜索：
     「klmy」「kelamayi」「克拉」都能搜到「克拉玛依」 */
  var CITY_PINYIN = {
    '北京': 'bei jing', '天津': 'tian jin', '上海': 'shang hai', '重庆': 'chong qing',

    '石家庄': 'shi jia zhuang', '唐山': 'tang shan', '秦皇岛': 'qin huang dao', '邯郸': 'han dan',
    '邢台': 'xing tai', '保定': 'bao ding', '张家口': 'zhang jia kou', '承德': 'cheng de',
    '沧州': 'cang zhou', '廊坊': 'lang fang', '衡水': 'heng shui',

    '太原': 'tai yuan', '大同': 'da tong', '阳泉': 'yang quan', '长治': 'chang zhi',
    '晋城': 'jin cheng', '朔州': 'shuo zhou', '晋中': 'jin zhong', '运城': 'yun cheng',
    '忻州': 'xin zhou', '临汾': 'lin fen', '吕梁': 'lv liang',

    '沈阳': 'shen yang', '大连': 'da lian', '鞍山': 'an shan', '抚顺': 'fu shun',
    '本溪': 'ben xi', '丹东': 'dan dong', '锦州': 'jin zhou', '营口': 'ying kou',
    '阜新': 'fu xin', '辽阳': 'liao yang', '盘锦': 'pan jin', '铁岭': 'tie ling',
    '朝阳': 'chao yang', '葫芦岛': 'hu lu dao',

    '长春': 'chang chun', '吉林': 'ji lin', '四平': 'si ping', '辽源': 'liao yuan',
    '通化': 'tong hua', '白山': 'bai shan', '松原': 'song yuan', '白城': 'bai cheng',

    '哈尔滨': 'ha er bin', '齐齐哈尔': 'qi qi ha er', '鸡西': 'ji xi', '鹤岗': 'he gang',
    '双鸭山': 'shuang ya shan', '大庆': 'da qing', '伊春': 'yi chun', '佳木斯': 'jia mu si',
    '七台河': 'qi tai he', '牡丹江': 'mu dan jiang', '黑河': 'hei he', '绥化': 'sui hua',

    '南京': 'nan jing', '无锡': 'wu xi', '徐州': 'xu zhou', '常州': 'chang zhou',
    '苏州': 'su zhou', '南通': 'nan tong', '连云港': 'lian yun gang', '淮安': 'huai an',
    '盐城': 'yan cheng', '扬州': 'yang zhou', '镇江': 'zhen jiang', '泰州': 'tai zhou', '宿迁': 'su qian',

    '杭州': 'hang zhou', '宁波': 'ning bo', '温州': 'wen zhou', '嘉兴': 'jia xing',
    '湖州': 'hu zhou', '绍兴': 'shao xing', '金华': 'jin hua', '衢州': 'qu zhou',
    '舟山': 'zhou shan', '台州': 'tai zhou', '丽水': 'li shui',

    '合肥': 'he fei', '芜湖': 'wu hu', '蚌埠': 'beng bu', '淮南': 'huai nan',
    '马鞍山': 'ma an shan', '淮北': 'huai bei', '铜陵': 'tong ling', '安庆': 'an qing',
    '黄山': 'huang shan', '滁州': 'chu zhou', '阜阳': 'fu yang', '宿州': 'su zhou',
    '六安': 'lu an', '亳州': 'bo zhou', '池州': 'chi zhou', '宣城': 'xuan cheng',

    '福州': 'fu zhou', '厦门': 'xia men', '莆田': 'pu tian', '三明': 'san ming',
    '泉州': 'quan zhou', '漳州': 'zhang zhou', '南平': 'nan ping', '龙岩': 'long yan', '宁德': 'ning de',

    '南昌': 'nan chang', '景德镇': 'jing de zhen', '萍乡': 'ping xiang', '九江': 'jiu jiang',
    '新余': 'xin yu', '鹰潭': 'ying tan', '赣州': 'gan zhou', '吉安': 'ji an',
    '宜春': 'yi chun', '抚州': 'fu zhou', '上饶': 'shang rao',

    '济南': 'ji nan', '青岛': 'qing dao', '淄博': 'zi bo', '枣庄': 'zao zhuang',
    '东营': 'dong ying', '烟台': 'yan tai', '潍坊': 'wei fang', '济宁': 'ji ning',
    '泰安': 'tai an', '威海': 'wei hai', '日照': 'ri zhao', '临沂': 'lin yi',
    '德州': 'de zhou', '聊城': 'liao cheng', '滨州': 'bin zhou', '菏泽': 'he ze',

    '郑州': 'zheng zhou', '开封': 'kai feng', '洛阳': 'luo yang', '平顶山': 'ping ding shan',
    '安阳': 'an yang', '鹤壁': 'he bi', '新乡': 'xin xiang', '焦作': 'jiao zuo',
    '濮阳': 'pu yang', '许昌': 'xu chang', '漯河': 'luo he', '三门峡': 'san men xia',
    '南阳': 'nan yang', '商丘': 'shang qiu', '信阳': 'xin yang', '周口': 'zhou kou', '驻马店': 'zhu ma dian',

    '武汉': 'wu han', '黄石': 'huang shi', '十堰': 'shi yan', '宜昌': 'yi chang',
    '襄阳': 'xiang yang', '鄂州': 'e zhou', '荆门': 'jing men', '孝感': 'xiao gan',
    '荆州': 'jing zhou', '黄冈': 'huang gang', '咸宁': 'xian ning', '随州': 'sui zhou',

    '长沙': 'chang sha', '株洲': 'zhu zhou', '湘潭': 'xiang tan', '衡阳': 'heng yang',
    '邵阳': 'shao yang', '岳阳': 'yue yang', '常德': 'chang de', '张家界': 'zhang jia jie',
    '益阳': 'yi yang', '郴州': 'chen zhou', '永州': 'yong zhou', '怀化': 'huai hua', '娄底': 'lou di',

    '广州': 'guang zhou', '深圳': 'shen zhen', '珠海': 'zhu hai', '汕头': 'shan tou',
    '佛山': 'fo shan', '韶关': 'shao guan', '湛江': 'zhan jiang', '肇庆': 'zhao qing',
    '江门': 'jiang men', '茂名': 'mao ming', '惠州': 'hui zhou', '梅州': 'mei zhou',
    '汕尾': 'shan wei', '河源': 'he yuan', '阳江': 'yang jiang', '清远': 'qing yuan',
    '东莞': 'dong guan', '中山': 'zhong shan', '潮州': 'chao zhou', '揭阳': 'jie yang', '云浮': 'yun fu',

    '海口': 'hai kou', '三亚': 'san ya', '三沙': 'san sha', '儋州': 'dan zhou',

    '成都': 'cheng du', '自贡': 'zi gong', '攀枝花': 'pan zhi hua', '泸州': 'lu zhou',
    '德阳': 'de yang', '绵阳': 'mian yang', '广元': 'guang yuan', '遂宁': 'sui ning',
    '内江': 'nei jiang', '乐山': 'le shan', '南充': 'nan chong', '眉山': 'mei shan',
    '宜宾': 'yi bin', '广安': 'guang an', '达州': 'da zhou', '雅安': 'ya an',
    '巴中': 'ba zhong', '资阳': 'zi yang',

    '贵阳': 'gui yang', '六盘水': 'liu pan shui', '遵义': 'zun yi', '安顺': 'an shun',
    '毕节': 'bi jie', '铜仁': 'tong ren',

    '昆明': 'kun ming', '曲靖': 'qu jing', '玉溪': 'yu xi', '保山': 'bao shan',
    '昭通': 'zhao tong', '丽江': 'li jiang', '普洱': 'pu er', '临沧': 'lin cang',

    '西安': 'xi an', '铜川': 'tong chuan', '宝鸡': 'bao ji', '咸阳': 'xian yang',
    '渭南': 'wei nan', '延安': 'yan an', '汉中': 'han zhong', '榆林': 'yu lin',
    '安康': 'an kang', '商洛': 'shang luo',

    '兰州': 'lan zhou', '嘉峪关': 'jia yu guan', '金昌': 'jin chang', '白银': 'bai yin',
    '天水': 'tian shui', '武威': 'wu wei', '张掖': 'zhang ye', '平凉': 'ping liang',
    '酒泉': 'jiu quan', '庆阳': 'qing yang', '定西': 'ding xi', '陇南': 'long nan',

    '西宁': 'xi ning', '海东': 'hai dong',

    '台北': 'tai bei', '新北': 'xin bei', '桃园': 'tao yuan', '台中': 'tai zhong',
    '台南': 'tai nan', '高雄': 'gao xiong', '基隆': 'ji long', '新竹': 'xin zhu',

    '呼和浩特': 'hu he hao te', '包头': 'bao tou', '乌海': 'wu hai', '赤峰': 'chi feng',
    '通辽': 'tong liao', '鄂尔多斯': 'e er duo si', '呼伦贝尔': 'hu lun bei er',
    '巴彦淖尔': 'ba yan nao er', '乌兰察布': 'wu lan cha bu',

    '南宁': 'nan ning', '柳州': 'liu zhou', '桂林': 'gui lin', '梧州': 'wu zhou',
    '北海': 'bei hai', '防城港': 'fang cheng gang', '钦州': 'qin zhou', '贵港': 'gui gang',
    '玉林': 'yu lin', '百色': 'bai se', '贺州': 'he zhou', '河池': 'he chi',
    '来宾': 'lai bin', '崇左': 'chong zuo',

    '拉萨': 'la sa', '日喀则': 'ri ka ze', '昌都': 'chang du', '林芝': 'lin zhi',
    '山南': 'shan nan', '那曲': 'na qu',

    '银川': 'yin chuan', '石嘴山': 'shi zui shan', '吴忠': 'wu zhong', '固原': 'gu yuan', '中卫': 'zhong wei',

    '乌鲁木齐': 'wu lu mu qi', '克拉玛依': 'ke la ma yi', '吐鲁番': 'tu lu fan', '哈密': 'ha mi',
    '昌吉': 'chang ji', '阿克苏': 'a ke su', '喀什': 'ka shi', '和田': 'he tian', '伊宁': 'yi ning',

    '香港': 'xiang gang', '澳门': 'ao men'
  };

  var WMO = {
    0: ['晴', '☀️'], 1: ['大部晴朗', '🌤️'], 2: ['局部多云', '⛅'], 3: ['阴天', '☁️'],
    45: ['有雾', '🌫️'], 48: ['雾凇', '🌫️'],
    51: ['小毛毛雨', '🌦️'], 53: ['毛毛雨', '🌦️'], 55: ['大毛毛雨', '🌦️'],
    56: ['冻毛毛雨', '🌧️'], 57: ['冻毛毛雨', '🌧️'],
    61: ['小雨', '🌦️'], 63: ['中雨', '🌧️'], 65: ['大雨', '🌧️'],
    66: ['冻雨', '🌧️'], 67: ['冻雨', '🌧️'],
    71: ['小雪', '🌨️'], 73: ['中雪', '🌨️'], 75: ['大雪', '❄️'], 77: ['雪粒', '🌨️'],
    80: ['阵雨', '🌦️'], 81: ['强阵雨', '🌧️'], 82: ['暴雨', '⛈️'],
    85: ['阵雪', '🌨️'], 86: ['强阵雪', '❄️'],
    95: ['雷阵雨', '⛈️'], 96: ['雷阵雨伴冰雹', '⛈️'], 99: ['强雷暴冰雹', '⛈️']
  };

  function initWeather() {
    var card = $('weatherCard'), cityBtn = $('cityBtn'), cityNameEl = $('cityName');
    if (!card || !cityBtn || !cityNameEl) return;

    var picker = $('cpMask'), provBox = $('cpProvinces'), cityBox = $('cpCities'), searchInput = $('citySearch');

    var current = null;
    var activeProv = 0;
    var openGroup = 0;      // 当前展开的省份分组（手风琴：同时只展开一个）
    var geoCache = {};
    try { geoCache = JSON.parse(store('navhub.geo') || '{}') || {}; } catch (e) { geoCache = {}; }

    function saveGeo() { store('navhub.geo', JSON.stringify(geoCache)); }
    function toast(msg) { if (window.showToast) window.showToast(msg); }

    function fetchJSON(url, timeout) {
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = window.setTimeout(function () { if (ctrl) ctrl.abort(); }, timeout || 9000);
      return fetch(url, ctrl ? { signal: ctrl.signal } : undefined).then(function (r) {
        return r.json();
      }).then(function (d) {
        window.clearTimeout(timer);
        return d;
      }, function (e) {
        window.clearTimeout(timer);
        throw e;
      });
    }

    function mk(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    }

    /* ---- 取天气 ---- */
    function paint(data) {
      var cur = data.current || {};
      var daily = data.daily || {};
      var info = WMO[cur.weather_code] || ['—', '🌡️'];
      $('weatherIcon').textContent = info[1];
      $('weatherTemp').textContent = Math.round(cur.temperature_2m);
      $('weatherDesc').textContent = info[0] + ' · 体感 ' + Math.round(cur.apparent_temperature) + '°';
      $('weatherHigh').textContent = Math.round((daily.temperature_2m_max || [])[0]);
      $('weatherLow').textContent = Math.round((daily.temperature_2m_min || [])[0]);
      $('weatherHum').textContent = Math.round(cur.relative_humidity_2m);
      card.title = current.name + ' · 数据来源 Open-Meteo';
    }

    function showWeatherError(msg) {
      $('weatherIcon').textContent = '📡';
      $('weatherTemp').textContent = '--';
      $('weatherDesc').textContent = msg;
    }

    function loadWeather(city) {
      current = city;
      cityNameEl.textContent = city.name;
      store('navhub.city', JSON.stringify(city));
      $('weatherDesc').textContent = '正在获取天气…';

      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + city.lat + '&longitude=' + city.lon +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code' +
        '&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1';

      fetchJSON(url, 9000).then(function (data) {
        if (!data || !data.current) throw new Error('bad data');
        paint(data);
      }).catch(function () {
        showWeatherError('天气暂时取不到，联网后再试一次');
      });
    }

    /* ---- 城市名 → 坐标（Open-Meteo 地理编码，结果缓存在本机） ---- */
    function geocode(name) {
      if (geoCache[name] && geoCache[name].lat) return Promise.resolve(geoCache[name]);
      var url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(name) +
        '&count=5&language=zh&format=json';
      return fetchJSON(url, 8000).then(function (d) {
        var list = (d && d.results) || [];
        if (!list.length) return null;
        var hit = list.filter(function (x) { return x.country_code === 'CN'; })[0] || list[0];
        var out = { name: name, lat: hit.latitude, lon: hit.longitude };
        geoCache[name] = out;
        saveGeo();
        return out;
      });
    }

    function selectCity(name) {
      closePicker();
      cityNameEl.textContent = name;
      $('weatherDesc').textContent = '正在获取天气…';
      geocode(name).then(function (c) {
        if (!c) { showWeatherError('没找到「' + name + '」，换个名字试试'); return; }
        loadWeather(c);
      }).catch(function () {
        showWeatherError('网络不通，暂时取不到天气');
      });
    }

    /* ---- 城市选择面板 ---- */
    /* 手风琴：同时只展开一个分组，点标题切换。
       「热门城市」这种只有一项的分组，点标题就等于选中它自己。 */
    function renderProvinces() {
      if (!provBox) return;
      provBox.textContent = '';

      PROVINCE_GROUPS.forEach(function (grp, gi) {
        var isOpen = gi === openGroup;
        var single = grp.items.length === 1 && grp.items[0].n === grp.g;
        var sole = single ? grp.items[0] : null;
        var isActive = single && sole.idx === activeProv;

        var head = mk('button', 'cp-group' + (isOpen ? ' is-open' : '') + (isActive ? ' is-active' : ''), '');
        head.type = 'button';
        head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        head.innerHTML = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" ' +
          'stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg><span></span>';
        head.lastChild.textContent = grp.g;
        head.addEventListener('click', function () {
          if (searchInput) searchInput.value = '';
          if (single) {
            openGroup = gi;
            activeProv = sole.idx;
            renderProvinces();
            renderCities();
            return;
          }
          openGroup = isOpen ? -1 : gi;
          renderProvinces();
        });
        provBox.appendChild(head);

        if (single || !isOpen) return;

        grp.items.slice().sort(function (a, b) {
          return a.n.localeCompare(b.n, 'zh-CN');       // 省份按拼音排序
        }).forEach(function (p) {
          var b = mk('button', 'cp-prov' + (p.idx === activeProv ? ' is-active' : ''), p.n);
          b.type = 'button';
          b.addEventListener('click', function () {
            activeProv = p.idx;
            openGroup = p.groupIndex;
            if (searchInput) searchInput.value = '';
            renderProvinces();
            renderCities();
          });
          provBox.appendChild(b);
        });
      });
    }

    function renderCities() {
      if (!cityBox) return;
      cityBox.textContent = '';
      var p = PROVINCES[activeProv];
      if (!p) return;
      p.c.slice().sort(function (a, b) {
        return a.localeCompare(b, 'zh-CN');           // 城市按拼音排序
      }).forEach(function (name) {
        var b = mk('button', 'cp-city' + (current && current.name === name ? ' is-active' : ''), name);
        b.type = 'button';
        b.addEventListener('click', function () { selectCity(name); });
        cityBox.appendChild(b);
      });
    }

    /* 本地匹配：中文包含 + 拼音全拼 + 拼音首字母 + 省份名
       「克拉」「ke la」「klmy」「kelamayi」都能搜到「克拉玛依」 */
    function matchLocalCities(q) {
      var ql = q.toLowerCase();
      var compact = ql.replace(/\s/g, '');
      var out = [];

      PROVINCES.forEach(function (p) {
        if (p.group === '热门城市') return;      // 热门只是快捷入口，结果里显示真实省份
        var provHit = p.n.indexOf(q) > -1;
        p.c.forEach(function (name) {
          var py = CITY_PINYIN[name] || '';
          var pyCompact = py.replace(/\s/g, '');
          var initials = py.split(' ').map(function (s) { return s.charAt(0); }).join('');
          var level = 0;

          if (name === q) level = 5;
          else if (name.indexOf(q) === 0) level = 4;
          else if (name.indexOf(q) > -1) level = 3;
          else if (pyCompact && compact && pyCompact.indexOf(compact) === 0) level = 3;
          else if (pyCompact && compact && pyCompact.indexOf(compact) > -1) level = 2;
          else if (initials && compact.length > 1 && initials.indexOf(compact) > -1) level = 1;

          if (level === 0 && provHit) level = 2;

          if (level > 0) {
            out.push({ name: name, province: p.n, group: p.group, level: level, len: name.length });
          }
        });
      });

      out.sort(function (a, b) {
        return b.level - a.level || a.name.localeCompare(b.name, 'zh-CN');   // 同级按拼音排序
      });
      return out.slice(0, 40);
    }

    function renderHits(list) {
      if (!cityBox) return;
      cityBox.textContent = '';
      if (!list.length) {
        cityBox.appendChild(mk('div', 'cp-empty', '没找到这个城市，换个写法试试'));
        return;
      }
      list.forEach(function (hit) {
        var b = mk('button', 'cp-hit', '');
        b.type = 'button';
        b.appendChild(mk('b', null, hit.name));
        b.appendChild(mk('span', null, hit.group && hit.group !== hit.province
          ? hit.province + ' · ' + hit.group
          : hit.province));
        b.addEventListener('click', function () { selectCity(hit.name); });
        cityBox.appendChild(b);
      });
    }

    /* 本地列表里没有时，再去官方地理编码接口兜底：
       只要真正的城市（PPL 开头），机场、行政区这类一律不要 */
    function remoteSearch(q) {
      fetchJSON('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) +
        '&count=30&language=zh&format=json', 8000)
        .then(function (d) {
          var list = ((d && d.results) || []).filter(function (x) {
            return x.country_code === 'CN' && /^PPL/.test(x.feature_code || '');
          });
          if (!list.length) { renderHits([]); return; }
          cityBox.textContent = '';
          list.slice(0, 20).forEach(function (x) {
            var b = mk('button', 'cp-hit', '');
            b.type = 'button';
            b.appendChild(mk('b', null, x.name));
            b.appendChild(mk('span', null, x.admin1 || ''));
            b.addEventListener('click', function () {
              var c = { name: x.name, lat: x.latitude, lon: x.longitude };
              geoCache[x.name] = c;
              saveGeo();
              closePicker();
              loadWeather(c);
            });
            cityBox.appendChild(b);
          });
        })
        .catch(function () {
          cityBox.textContent = '';
          cityBox.appendChild(mk('div', 'cp-empty', '搜索失败，请检查网络'));
        });
    }

    var searchTimer = null;
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q = searchInput.value.trim();
        window.clearTimeout(searchTimer);
        if (!q) { renderCities(); return; }
        searchTimer = window.setTimeout(function () {
          if (!cityBox) return;
          var local = matchLocalCities(q);
          if (local.length) { renderHits(local); return; }
          cityBox.textContent = '';
          cityBox.appendChild(mk('div', 'cp-empty', '搜索中…'));
          remoteSearch(q);
        }, 240);
      });
    }

    function openPicker() {
      if (!picker) return;
      if (current) {
        for (var i = 0; i < PROVINCES.length; i++) {
          if (PROVINCES[i].c.indexOf(current.name) > -1) {
            activeProv = i;
            openGroup = PROVINCES[i].groupIndex;
            break;
          }
        }
      }
      if (searchInput) searchInput.value = '';
      renderProvinces();
      renderCities();
      picker.hidden = false;
      cityBtn.setAttribute('aria-expanded', 'true');
      window.setTimeout(function () { if (searchInput) searchInput.focus(); }, 40);
    }

    function closePicker() {
      if (!picker || picker.hidden) return;
      picker.hidden = true;
      cityBtn.setAttribute('aria-expanded', 'false');
    }

    cityBtn.addEventListener('click', openPicker);
    if ($('cpClose')) $('cpClose').addEventListener('click', closePicker);
    if (picker) picker.addEventListener('click', function (e) { if (e.target === picker) closePicker(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && picker && !picker.hidden) closePicker();
    });

    /* ---- 精确定位（需要浏览器授权，且必须是 https / localhost） ---- */
    if ($('cpLocate')) {
      $('cpLocate').addEventListener('click', function () {
        if (!navigator.geolocation) { toast('当前浏览器不支持精确定位，请手动选择城市'); return; }
        toast('正在获取你的位置…');
        navigator.geolocation.getCurrentPosition(function (pos) {
          closePicker();
          loadWeather({ name: '我的位置', lat: pos.coords.latitude, lon: pos.coords.longitude });
          fetchJSON('https://ipwho.is/', 5000).then(function (d) {
            if (d && d.city && current && current.name === '我的位置') {
              current.name = d.city;
              cityNameEl.textContent = d.city;
              store('navhub.city', JSON.stringify(current));
            }
          }).catch(function () { });
        }, function (err) {
          toast(err && err.code === 1 ? '定位权限被拒绝了，可以手动选城市' : '定位失败，请手动选城市');
        }, { timeout: 9000, maximumAge: 600000 });
      });
    }

    /* ---- 首屏：优先上次选的城市，其次网络定位，最后退回默认城市 ---- */
    var ipDone = false;

    function locateByIP() {
      return fetchJSON('https://ipwho.is/', 5000).then(function (d) {
        if (!d || d.success === false || !d.latitude) throw new Error('no ip');
        ipDone = true;
        loadWeather({ name: d.city || '当前位置', lat: d.latitude, lon: d.longitude });
      });
    }

    var saved = null;
    try { saved = JSON.parse(store('navhub.city') || 'null'); } catch (e) { saved = null; }

    if (saved && saved.lat) {
      loadWeather(saved);
    } else {
      var def = (window.NAV_CONFIG && window.NAV_CONFIG.defaultCity) || '北京';
      cityNameEl.textContent = def;
      geocode(def).then(function (c) {
        if (ipDone) return;                       // 已经按网络定位好了，就别覆盖
        loadWeather(c || { name: def, lat: 39.9042, lon: 116.4074 });
      }).catch(function () {
        if (!ipDone) loadWeather({ name: def, lat: 39.9042, lon: 116.4074 });
      });
      locateByIP().catch(function () { });        // 定位不到就保持默认城市
    }
  }

  /* ============================================================
     2.5 最后更新时间（静态值，在 js/data.js 的 lastUpdated 里手动维护）
     ============================================================ */
  function timeAgoText(date) {
    var diff = Date.now() - date.getTime();
    if (diff < 0) return '刚刚';
    var min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return min + ' 分钟前';
    var hour = Math.floor(min / 60);
    if (hour < 24) return hour + ' 小时前';
    var day = Math.floor(hour / 24);
    if (day < 7) return day + ' 天前';
    var week = Math.floor(day / 7);
    if (week < 5) return week + ' 周前';
    var month = Math.floor(day / 30);
    if (month < 12) return month + ' 个月前';
    return Math.floor(day / 365) + ' 年前';
  }

  function initUpdated() {
    var box = $('updatedBox'), out = $('updatedText');
    if (!box || !out) return;

    var raw = String((window.NAV_CONFIG && window.NAV_CONFIG.lastUpdated) || '').trim();
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})/.exec(raw);
    if (!m) return;

    var date = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    if (isNaN(date.getTime())) return;

    var stamp = m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2) +
      ' ' + ('0' + m[4]).slice(-2) + ':' + m[5];

    function render() {
      out.textContent = '最后更新 ' + stamp + '（' + timeAgoText(date) + '）';
    }

    render();
    box.hidden = false;
    window.setInterval(render, 60000);
  }

  /* ============================================================
     3. 单位换算
     ============================================================ */
  var UNIT_CATS = [
    {
      id: 'length', name: '长度', base: 'm', units: [
        { k: 'mm', n: '毫米', f: 0.001 }, { k: 'cm', n: '厘米', f: 0.01 }, { k: 'm', n: '米', f: 1 },
        { k: 'km', n: '千米', f: 1000 }, { k: 'in', n: '英寸', f: 0.0254 }, { k: 'ft', n: '英尺', f: 0.3048 },
        { k: 'yd', n: '码', f: 0.9144 }, { k: 'mi', n: '英里', f: 1609.344 }, { k: 'nmi', n: '海里', f: 1852 }
      ]
    },
    {
      id: 'weight', name: '重量', base: 'kg', units: [
        { k: 'mg', n: '毫克', f: 0.000001 }, { k: 'g', n: '克', f: 0.001 }, { k: 'kg', n: '千克', f: 1 },
        { k: 't', n: '吨', f: 1000 }, { k: 'jin', n: '斤', f: 0.5 }, { k: 'liang', n: '两', f: 0.05 },
        { k: 'lb', n: '磅', f: 0.45359237 }, { k: 'oz', n: '盎司', f: 0.028349523 }
      ]
    },
    {
      id: 'area', name: '面积', base: 'm2', units: [
        { k: 'cm2', n: '平方厘米', f: 0.0001 }, { k: 'm2', n: '平方米', f: 1 }, { k: 'km2', n: '平方千米', f: 1000000 },
        { k: 'ha', n: '公顷', f: 10000 }, { k: 'mu', n: '亩', f: 666.6667 },
        { k: 'ft2', n: '平方英尺', f: 0.09290304 }
      ]
    },
    {
      id: 'volume', name: '体积', base: 'L', units: [
        { k: 'ml', n: '毫升', f: 0.001 }, { k: 'l', n: '升', f: 1 }, { k: 'm3', n: '立方米', f: 1000 },
        { k: 'gal', n: '加仑(美)', f: 3.785411784 }, { k: 'cup', n: '杯(美)', f: 0.2365882 }
      ]
    },
    {
      id: 'temp', name: '温度', special: 'temp', units: [
        { k: 'c', n: '摄氏度 ℃' }, { k: 'f', n: '华氏度 ℉' }, { k: 'k', n: '开尔文 K' }
      ]
    },
    {
      id: 'speed', name: '速度', base: 'ms', units: [
        { k: 'ms', n: '米/秒', f: 1 }, { k: 'kmh', n: '千米/时', f: 0.2777778 },
        { k: 'mph', n: '英里/时', f: 0.44704 }, { k: 'knot', n: '节', f: 0.5144444 }
      ]
    },
    {
      id: 'data', name: '数据', base: 'MB', units: [
        { k: 'b', n: '字节 B', f: 1 / 1048576 }, { k: 'kb', n: 'KB', f: 1 / 1024 },
        { k: 'mb', n: 'MB', f: 1 }, { k: 'gb', n: 'GB', f: 1024 }, { k: 'tb', n: 'TB', f: 1048576 }
      ]
    },
    {
      id: 'time', name: '时间', base: 's', units: [
        { k: 's', n: '秒', f: 1 }, { k: 'min', n: '分钟', f: 60 }, { k: 'h', n: '小时', f: 3600 },
        { k: 'd', n: '天', f: 86400 }, { k: 'w', n: '周', f: 604800 }, { k: 'mon', n: '月(30天)', f: 2592000 }
      ]
    }
  ];

  function toBase(cat, key, v) {
    if (cat.special === 'temp') {
      if (key === 'f') return (v - 32) * 5 / 9;
      if (key === 'k') return v - 273.15;
      return v;
    }
    var u = cat.units.filter(function (x) { return x.k === key; })[0];
    return v * (u ? u.f : 1);
  }

  function fromBase(cat, key, b) {
    if (cat.special === 'temp') {
      if (key === 'f') return b * 9 / 5 + 32;
      if (key === 'k') return b + 273.15;
      return b;
    }
    var u = cat.units.filter(function (x) { return x.k === key; })[0];
    return b / (u ? u.f : 1);
  }

  function fmt(n) {
    if (!isFinite(n)) return '';
    var abs = Math.abs(n);
    if (abs === 0) return '0';
    if (abs >= 1e9 || abs < 1e-6) return n.toExponential(4);
    var r = Number(n.toFixed(6));
    return String(r);
  }

  function initConverter() {
    var catBox = $('unitCats');
    var fromInput = $('unitFrom'), toInput = $('unitTo');
    var fromSel = $('unitFromSel'), toSel = $('unitToSel');
    if (!catBox || !fromInput) return;

    var active = UNIT_CATS[0];

    function fillUnits() {
      fromSel.textContent = '';
      toSel.textContent = '';
      active.units.forEach(function (u) {
        var a = document.createElement('option'); a.value = u.k; a.textContent = u.n; fromSel.appendChild(a);
        var b = document.createElement('option'); b.value = u.k; b.textContent = u.n; toSel.appendChild(b);
      });
      fromSel.value = active.units[0].k;
      toSel.value = active.units[Math.min(1, active.units.length - 1)].k;
    }

    function renderCats() {
      catBox.textContent = '';
      UNIT_CATS.forEach(function (c, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'unit-cat' + (i === 0 ? ' is-active' : '');
        b.textContent = c.name;
        b.addEventListener('click', function () {
          active = c;
          Array.prototype.forEach.call(catBox.children, function (n) { n.classList.remove('is-active'); });
          b.classList.add('is-active');
          fillUnits();
          compute('from');
        });
        catBox.appendChild(b);
      });
    }

    function compute(origin) {
      var v = parseFloat(origin === 'from' ? fromInput.value : toInput.value);
      if (isNaN(v)) {
        (origin === 'from' ? toInput : fromInput).value = '';
        updateNote();
        return;
      }
      var base = toBase(active, origin === 'from' ? fromSel.value : toSel.value, v);
      var out = fromBase(active, origin === 'from' ? toSel.value : fromSel.value, base);
      (origin === 'from' ? toInput : fromInput).value = fmt(out);
      updateNote();
    }

    function updateNote() {
      var a = fromSel.options[fromSel.selectedIndex], b = toSel.options[toSel.selectedIndex];
      var note = $('unitNote');
      if (!a || !b) return;
      var one = fromBase(active, toSel.value, toBase(active, fromSel.value, 1));
      note.textContent = '1 ' + a.textContent + ' = ' + fmt(one) + ' ' + b.textContent;
    }

    fromInput.addEventListener('input', function () { compute('from'); });
    toInput.addEventListener('input', function () { compute('to'); });
    fromSel.addEventListener('change', function () { compute('from'); });
    toSel.addEventListener('change', function () { compute('from'); });

    $('unitSwap').addEventListener('click', function () {
      var t = fromSel.value; fromSel.value = toSel.value; toSel.value = t;
      compute('from');
    });

    renderCats();
    fillUnits();
    compute('from');
  }

  /* ============================================================
     4. 汇率换算（open.er-api.com，免费无需密钥）
     ============================================================ */
  /* 常用货币。open.er-api.com 一共提供 160 多种，这里挑的是日常换算会用到的一批，
     想再加就往下续一行即可（代码用接口返回的 key 匹配）。 */
  var CURRENCIES = [
    { k: 'CNY', n: '人民币 ¥' }, { k: 'USD', n: '美元 $' }, { k: 'EUR', n: '欧元 €' },
    { k: 'JPY', n: '日元 ¥' }, { k: 'GBP', n: '英镑 £' }, { k: 'HKD', n: '港币 HK$' },
    { k: 'TWD', n: '新台币 NT$' }, { k: 'MOP', n: '澳门元 MOP$' }, { k: 'KRW', n: '韩元 ₩' },
    { k: 'SGD', n: '新加坡元' }, { k: 'MYR', n: '马来西亚林吉特' }, { k: 'THB', n: '泰铢' },
    { k: 'IDR', n: '印尼盾' }, { k: 'PHP', n: '菲律宾比索' }, { k: 'VND', n: '越南盾' },
    { k: 'INR', n: '印度卢比' }, { k: 'PKR', n: '巴基斯坦卢比' }, { k: 'BDT', n: '孟加拉塔卡' },
    { k: 'LKR', n: '斯里兰卡卢比' }, { k: 'NPR', n: '尼泊尔卢比' },
    { k: 'AUD', n: '澳元' }, { k: 'NZD', n: '新西兰元' }, { k: 'CAD', n: '加元' },
    { k: 'MXN', n: '墨西哥比索' }, { k: 'BRL', n: '巴西雷亚尔' }, { k: 'ARS', n: '阿根廷比索' },
    { k: 'CLP', n: '智利比索' }, { k: 'PEN', n: '秘鲁索尔' }, { k: 'COP', n: '哥伦比亚比索' },
    { k: 'RUB', n: '俄罗斯卢布' }, { k: 'UAH', n: '乌克兰格里夫纳' }, { k: 'KZT', n: '哈萨克斯坦坚戈' },
    { k: 'TRY', n: '土耳其里拉' }, { k: 'CHF', n: '瑞士法郎' }, { k: 'SEK', n: '瑞典克朗' },
    { k: 'NOK', n: '挪威克朗' }, { k: 'DKK', n: '丹麦克朗' }, { k: 'ISK', n: '冰岛克朗' },
    { k: 'PLN', n: '波兰兹罗提' }, { k: 'CZK', n: '捷克克朗' }, { k: 'HUF', n: '匈牙利福林' },
    { k: 'RON', n: '罗马尼亚列伊' }, { k: 'BGN', n: '保加利亚列弗' },
    { k: 'ZAR', n: '南非兰特' }, { k: 'EGP', n: '埃及镑' }, { k: 'NGN', n: '尼日利亚奈拉' },
    { k: 'KES', n: '肯尼亚先令' }, { k: 'MAD', n: '摩洛哥迪拉姆' },
    { k: 'AED', n: '阿联酋迪拉姆' }, { k: 'SAR', n: '沙特里亚尔' }, { k: 'QAR', n: '卡塔尔里亚尔' },
    { k: 'KWD', n: '科威特第纳尔' }, { k: 'BHD', n: '巴林第纳尔' }, { k: 'OMR', n: '阿曼里亚尔' },
    { k: 'ILS', n: '以色列新谢克尔' }, { k: 'JOD', n: '约旦第纳尔' }, { k: 'IRR', n: '伊朗里亚尔' }
  ];

  function initFx() {
    var fromInput = $('fxFrom'), toInput = $('fxTo');
    var fromSel = $('fxFromSel'), toSel = $('fxToSel');
    if (!fromInput || !fromSel) return;

    CURRENCIES.forEach(function (c) {
      var a = document.createElement('option'); a.value = c.k; a.textContent = c.n; fromSel.appendChild(a);
      var b = document.createElement('option'); b.value = c.k; b.textContent = c.n; toSel.appendChild(b);
    });
    fromSel.value = 'CNY';
    toSel.value = 'USD';

    var rates = null;      // 相对基准 CNY
    var rateTime = '';
    var pending = null;

    function setNote(msg) { var n = $('fxNote'); if (n) n.textContent = msg; }

    /* 数据来源说明里的「上次获取」时间戳 */
    function stampUpdated(at) {
      var el = $('fxUpdated');
      if (!el) return;
      var d = new Date(at);
      function p2(n) { return n < 10 ? '0' + n : '' + n; }
      el.textContent = '本机上次获取：' + d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
        ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) +
        (rateTime ? '　·　接口公布：' + rateTime : '');
    }

    function cached() {
      var raw = store('navhub.rates');
      if (!raw) return null;
      try {
        var o = JSON.parse(raw);
        if (o && o.rates && Date.now() - o.at < 6 * 3600 * 1000) return o;
      } catch (e) { }
      return null;
    }

    function loadRates() {
      var c = cached();
      if (c) {
        rates = c.rates; rateTime = c.time;
        stampUpdated(c.at);
        compute('from'); renderQuick();
        return;
      }

      setNote('正在获取最新汇率…');
      fetch('https://open.er-api.com/v6/latest/CNY')
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d || !d.rates) throw new Error('bad');
          rates = d.rates;
          rateTime = d.time_last_update_utc ? String(d.time_last_update_utc).slice(0, 16) : '';
          store('navhub.rates', JSON.stringify({ rates: rates, time: rateTime, at: Date.now() }));
          stampUpdated(Date.now());
          compute('from');
          renderQuick();
        })
        .catch(function () {
          setNote('暂时取不到汇率，请检查网络后刷新页面');
          var el = $('fxUpdated');
          if (el && el.textContent.indexOf('本机上次获取') < 0) {
            el.textContent = '本机上次获取：还没有成功获取过（请检查网络）';
          }
        });
    }

    function rateOf(k) { return rates ? rates[k] : null; }

    /* 两个框都能直接输入：谁被改，就以谁为「源」换算到另一边。
       源/目标汇率必须跟着 origin 走 —— 否则从右边输入时会错用左边的汇率，
       算出来的两个数字互相矛盾（改动前就是这个问题）。 */
    function compute(origin) {
      if (!rates) return;
      var f = fromSel.value, t = toSel.value;
      var rf = rateOf(f), rt = rateOf(t);
      if (!rf || !rt) return;

      var fromEl = origin === 'from' ? fromInput : toInput;
      var toEl = origin === 'from' ? toInput : fromInput;
      var srcRate = origin === 'from' ? rf : rt;
      var dstRate = origin === 'from' ? rt : rf;

      var v = parseFloat(fromEl.value);
      if (isNaN(v)) { toEl.value = ''; updateNote(); return; }

      toEl.value = fmt(Number((v / srcRate * dstRate).toFixed(4)));
      updateNote();
    }

    /* 基准汇率说明行：写清换算关系、数据来源与更新时间 */
    function updateNote() {
      var f = fromSel.value, t = toSel.value;
      var rf = rateOf(f), rt = rateOf(t);
      if (!rf || !rt) return;
      setNote('1 ' + f + ' ≈ ' + fmt(Number((rt / rf).toFixed(4))) + ' ' + t +
        (rateTime ? ' · 更新于 ' + rateTime : '') + ' · 来源 open.er-api.com');
    }

    function renderQuick() {
      var box = $('fxQuick');
      if (!box || !rates) return;
      box.textContent = '';
      ['USD', 'JPY', 'HKD', 'EUR'].forEach(function (k) {
        var r = rateOf(k);
        if (!r) return;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'fx-chip';
        b.innerHTML = '1 CNY' + '<b>' + fmt(Number(r.toFixed(4))) + ' ' + k + '</b>';
        b.addEventListener('click', function () {
          fromSel.value = 'CNY';
          toSel.value = k;
          compute('from');
        });
        box.appendChild(b);
      });
    }

    fromInput.addEventListener('input', function () { compute('from'); });
    toInput.addEventListener('input', function () { compute('to'); });
    fromSel.addEventListener('change', function () { compute('from'); });
    toSel.addEventListener('change', function () { compute('from'); });
    $('fxSwap').addEventListener('click', function () {
      var t = fromSel.value; fromSel.value = toSel.value; toSel.value = t;
      compute('from');
    });

    var tabs = $('convTabs');
    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('.tab');
        if (!btn) return;
        Array.prototype.forEach.call(tabs.children, function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var name = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.toggle('is-active', p.getAttribute('data-panel') === name);
        });
        if (name === 'fx') loadRates();
      });
    }

    var warm = cached();
    if (warm) { rates = warm.rates; rateTime = warm.time; }
    compute('from');
    renderQuick();
  }

  /* ============================================================
     5. 便签 · 待办（保存在本机浏览器里）
     ============================================================ */
  function initTodos() {
    var list = $('todoList'), input = $('todoInput'), form = $('todoForm');
    if (!list || !form) return;

    var todos = [];
    try { todos = JSON.parse(store('navhub.todos') || '[]') || []; } catch (e) { todos = []; }
    if (!Array.isArray(todos)) todos = [];

    function save() { store('navhub.todos', JSON.stringify(todos)); }

    function render() {
      list.textContent = '';
      todos.forEach(function (t, i) {
        var li = document.createElement('li');
        li.className = 'todo-item' + (t.done ? ' is-done' : '');

        var check = document.createElement('button');
        check.type = 'button';
        check.className = 'todo-check';
        check.textContent = '✓';
        check.setAttribute('aria-label', t.done ? '标记为未完成' : '标记为完成');
        check.addEventListener('click', function () {
          t.done = !t.done; save(); render();
        });

        var span = document.createElement('span');
        span.className = 'todo-text';
        span.textContent = t.text;

        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'todo-del';
        del.textContent = '×';
        del.setAttribute('aria-label', '删除');
        del.addEventListener('click', function () {
          todos.splice(i, 1); save(); render();
        });

        li.appendChild(check);
        li.appendChild(span);
        li.appendChild(del);
        list.appendChild(li);
      });

      var left = todos.filter(function (t) { return !t.done; }).length;
      $('todoEmpty').hidden = todos.length > 0;
      $('todoStat').textContent = left ? left + ' 项未完成' : (todos.length ? '全部完成啦 🎉' : '0 项未完成');
      $('todoBadge').textContent = todos.length + ' 条';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      todos.unshift({ text: v, done: false, at: Date.now() });
      input.value = '';
      save();
      render();
      if (window.showToast) window.showToast('已添加：' + v);
    });

    $('todoClear').addEventListener('click', function () {
      var before = todos.length;
      todos = todos.filter(function (t) { return !t.done; });
      save();
      render();
      if (window.showToast) {
        window.showToast(before === todos.length ? '还没有已完成的事项' : '已清除 ' + (before - todos.length) + ' 条');
      }
    });

    render();
  }

  /* ============================================================
     6. 字数统计 / Token 预估 / 费用计算
     ============================================================ */
  var TK_MODELS = [
    {
      k: 'deepseek', n: 'DeepSeek', short: 'DeepSeek',
      han: 0.6, latin: 0.30, digit: 0.30, punct: 0.6,
      site: 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing'
    },
    {
      k: 'qwen', n: '通义千问 / Qwen', short: '通义',
      han: 0.7, latin: 0.30, digit: 0.30, punct: 0.6,
      site: 'https://help.aliyun.com/zh/model-studio/models'
    },
    {
      k: 'glm', n: '智谱 GLM 等国产模型', short: '智谱',
      han: 0.8, latin: 0.30, digit: 0.30, punct: 0.6,
      site: 'https://open.bigmodel.cn/pricing'
    },
    {
      k: 'openai', n: 'OpenAI GPT 系列', short: 'OpenAI',
      han: 1.5, latin: 0.25, digit: 0.30, punct: 0.5,
      site: 'https://platform.openai.com/docs/pricing'
    },
    {
      k: 'claude', n: 'Anthropic Claude', short: 'Claude',
      han: 1.2, latin: 0.25, digit: 0.30, punct: 0.5,
      site: 'https://www.anthropic.com/pricing'
    },
    {
      k: 'general', n: '通用（中英混合）', short: '通用',
      han: 1.0, latin: 0.28, digit: 0.30, punct: 0.55, site: ''
    }
  ];

  /* DeepSeek 公开价格参考值（元 / 百万 token），价格会变动，请以官网为准 */
  var DEEPSEEK_REF = { cache: 0.2, input: 2, output: 3 };

  var RE_HAN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g;
  var RE_WORD = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;
  var RE_LATIN = /[A-Za-z]/g;
  var RE_DIGIT = /[0-9]/g;
  var RE_SPACE = /\s/g;

  var RE_PUNCT = (function () {
    try { return new RegExp('[\\p{P}\\p{S}]', 'gu'); }
    catch (e) {
      return /[!-\/:-@\[-`{-~\u2010-\u205e\u3000-\u303f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]/g;
    }
  })();

  function analyzeText(src) {
    var s = src || '';
    var noSpace = s.replace(RE_SPACE, '');
    return {
      chars: s.length,
      withPunct: noSpace.length,
      noPunct: noSpace.replace(RE_PUNCT, '').length,
      han: (s.match(RE_HAN) || []).length,
      words: (s.match(RE_WORD) || []).length,
      lines: s.length ? s.split('\n').length : 0
    };
  }

  /* 按字符类型加权估算：误差约 ±15%，只用于估算用量和花费 */
  function estimateTokens(src, model) {
    var s = src || '';
    var m = model || TK_MODELS[0];
    var han = (s.match(RE_HAN) || []).length;
    var latin = (s.match(RE_LATIN) || []).length;
    var digit = (s.match(RE_DIGIT) || []).length;
    var space = (s.match(RE_SPACE) || []).length;
    var punct = Math.max(0, s.length - han - latin - digit - space);
    return Math.max(0, Math.round(han * m.han + latin * m.latin + digit * m.digit + punct * m.punct));
  }

  function initCounter() {
    var text = $('cntText');
    if (!text) return;

    var modelSel = $('tkModel');
    (TK_MODELS || []).forEach(function (m) {
      var o = document.createElement('option');
      o.value = m.k;
      o.textContent = m.n;
      modelSel.appendChild(o);
    });
    modelSel.value = 'deepseek';

    $('prCache').value = DEEPSEEK_REF.cache;
    $('prIn').value = DEEPSEEK_REF.input;
    $('prOut').value = DEEPSEEK_REF.output;

    var manualIn = false;

    function numOf(el) {
      var v = parseFloat(el.value);
      return isNaN(v) ? 0 : v;
    }

    function money(n) {
      if (!isFinite(n)) return '—';
      var s;
      if (n === 0) s = '0';
      else if (n < 0.0001) s = n.toExponential(2);
      else if (n < 0.01) s = n.toFixed(5);
      else if (n < 1) s = n.toFixed(4);
      else s = n.toFixed(2);
      return '¥ ' + s;
    }

    function currentModel() {
      return TK_MODELS.filter(function (m) { return m.k === modelSel.value; })[0] || TK_MODELS[0];
    }

    /* 「核对官方价格」的链接和按钮文案跟着所选模型走 */
    function updatePriceLink() {
      var link = $('priceLink');
      if (!link) return;
      var m = currentModel();
      if (m.site) {
        link.href = m.site;
        link.textContent = '核对 ' + m.short + ' 官方价格 ↗';
        link.hidden = false;
      } else {
        link.hidden = true;
      }
      var preset = $('pricePreset');
      if (preset) preset.textContent = m.k === 'deepseek' ? '填入 DeepSeek 参考价' : '参考价请手动填写';
    }

    function updateCost() {
      var inTk = Math.max(0, numOf($('tkIn')));
      var cacheTk = Math.min(Math.max(0, numOf($('tkCache'))), inTk);
      var outTk = Math.max(0, numOf($('tkOut')));

      var pCache = Math.max(0, numOf($('prCache')));
      var pIn = Math.max(0, numOf($('prIn')));
      var pOut = Math.max(0, numOf($('prOut')));

      var miss = Math.max(0, inTk - cacheTk);
      var cIn = miss / 1e6 * pIn;
      var cCache = cacheTk / 1e6 * pCache;
      var cOut = outTk / 1e6 * pOut;
      var hasPrice = pIn > 0 || pCache > 0 || pOut > 0;

      $('costIn').textContent = hasPrice ? money(cIn) : '—';
      $('costCache').textContent = hasPrice ? money(cCache) : '—';
      $('costOut').textContent = hasPrice ? money(cOut) : '—';
      $('costSum').textContent = hasPrice ? money(cIn + cCache + cOut) : '—';
    }

    function refresh() {
      var r = analyzeText(text.value);
      $('statAll').textContent = r.withPunct.toLocaleString();
      $('statNoPunct').textContent = r.noPunct.toLocaleString();
      $('statHan').textContent = r.han.toLocaleString();
      $('statWord').textContent = r.words.toLocaleString();
      $('statChar').textContent = r.chars.toLocaleString();
      $('statLine').textContent = r.lines.toLocaleString();
      $('cntBadge').textContent = r.withPunct.toLocaleString() + ' 字';

      var tk = estimateTokens(text.value, currentModel());
      $('tkNum').textContent = tk.toLocaleString();
      $('tkNote').textContent = '按字符类型加权估算，不代表官方分词结果，通常误差在 15% 以内。';

      if (!manualIn) $('tkIn').value = tk;
      updateCost();
    }

    text.addEventListener('input', refresh);
    modelSel.addEventListener('change', function () {
      updatePriceLink();
      refresh();
    });

    $('tkIn').addEventListener('input', function () {
      manualIn = $('tkIn').value.trim() !== '';
      updateCost();
    });
    ['tkCache', 'tkOut', 'prCache', 'prIn', 'prOut'].forEach(function (id) {
      $(id).addEventListener('input', updateCost);
    });

    $('cntCopy').addEventListener('click', function () {
      if (!text.value) { if (window.showToast) window.showToast('还没有内容'); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text.value).then(function () {
          if (window.showToast) window.showToast('已复制到剪贴板');
        }, function () { manualCopy(); });
      } else {
        manualCopy();
      }
    });

    function manualCopy() {
      text.focus();
      text.select();
      try {
        document.execCommand('copy');
        if (window.showToast) window.showToast('已复制到剪贴板');
      } catch (e) {
        if (window.showToast) window.showToast('复制失败，请手动选中后复制');
      }
    }

    $('cntClear').addEventListener('click', function () {
      text.value = '';
      manualIn = false;
      $('tkCache').value = '';
      $('tkOut').value = '';
      refresh();
      text.focus();
    });

    $('pricePreset').addEventListener('click', function () {
      var m = currentModel();
      if (m.k === 'deepseek') {
        $('prCache').value = DEEPSEEK_REF.cache;
        $('prIn').value = DEEPSEEK_REF.input;
        $('prOut').value = DEEPSEEK_REF.output;
        updateCost();
        if (window.showToast) window.showToast('已填入 DeepSeek 参考价，请到官网核对');
      } else if (m.site) {
        if (window.showToast) window.showToast(m.short + ' 没有内置参考价，请点右侧链接去官网查看');
      }
    });

    updatePriceLink();
    refresh();
  }

  /* ---------- 启动 ---------- */
  function boot() {
    initClock();
    initUpdated();
    initWeather();
    initConverter();
    initFx();
    initTodos();
    initCounter();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
