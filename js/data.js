/* ============================================================
 *  网站数据配置 —— 想加网站只需要改这一个文件
 * ------------------------------------------------------------
 *  【设计原则】
 *   主页只放"精挑细选"的站点：找起来麻烦、或者不太好找到官网入口的。
 *   大众都知道入口的网站（B站、淘宝等）不占主页位置，放在 index 里，
 *   搜索和「其他网页」页里仍然能找到，但主页不展示。
 *
 *  【分类结构】两层：groups（大类）→ categories（小类）→ sites（站点）
 *   小类用 group 字段指到大类，不是嵌套写的 —— 加小类只动一行。
 *   小类没写 group 时会自己单独成一组，所以老的扁平分类直接放进来也不会崩。
 *   小类的 id 是稳定标识（sites.html?cat=xxx 用的就是它），改名没事，改 id 会断链接。
 *
 *  【怎么加一个网站】往对应小类的 sites 数组加一项：
 *   {
 *     name:  'Steam',                      显示名字
 *     url:   'https://store.steampowered.com/',  官方网址
 *     short: '游戏最全、打折最狠',           卡片上的一句话
 *     key:   '蒸汽 游戏平台 买游戏',         搜索用的额外关键词
 *     shots: [{ src, t }],                  官网截图 2~3 张（介绍弹窗顶部，可全屏查看）
 *     shotUpdated: '2026-10-06',            截图更新日期
 *     intro: {
 *       tagline: '全球最大的 PC 游戏商城',    一句话定位
 *       pros:  ['优点 1', '优点 2'],         优点
 *       cons:  ['缺点 1', '缺点 2'],         缺点
 *       best:  '适合什么样的人用',            推荐人群
 *       tips:  '使用小提示（可省略）'
 *     }
 *   }
 *
 *  【怎么加一个小类】复制一整块 { id, group, name, icon, desc, sites } 改内容。
 *  【怎么加一个大类】往 groups 里加一项，再给相关小类写上 group。
 *  【图标】不用手动准备，会自动抓官网图标；抓不到就显示名字首字。
 * ============================================================ */

window.NAV_CONFIG = {
  siteName: '启航',
  subtitle: '精心挑过的网站导航',
  tip: '启航 · 精选网站导航',
  defaultCity: '北京',
  /* 网页最后更新时间（静态、手动维护）：格式 YYYY-MM-DD HH:MM，精确到分钟 */
  lastUpdated: '2026-10-07 17:30',
  notice: '内容在持续补充中 —— 每个分类只放真正值得收藏的官方站点',

  /* 顶栏「关于本站」弹窗里的文案，想改介绍就改这里 */
  about: {
    title: '关于本站',
    subtitle: '精选网站导航',
    lead: '这里不是"什么网站都往里塞"的导航站，只收录真正难找、值得收藏的官方网站。',
    items: [
      {
        t: '为什么做这个',
        d: '很多官网入口藏得比较深，搜索结果里还混着山寨站和广告站。这个页面把这些真正需要的官方地址整理到一起，点开就是官网，不用再一个个分辨真假。'
      },
      {
        t: '和别的导航站有什么不同',
        d: '一是只收录官方地址，不放山寨站和推广内容；二是精挑细选，主页只留真正难找的站点，大众网站不占位置；三是没有广告、没有追踪，也不需要注册登录。'
      },
      {
        t: '本网站由 DeepSeek 编写',
        d: '整站的代码、文案和界面都是和 DeepSeek 一起做出来的 —— 从页面结构、配色样式，到收录哪些网站、每个站点怎么写介绍、截图怎么处理，都是边聊边改出来的结果。站点还在继续更新，会按实际使用情况慢慢调整。'
      }
    ],
    tags: ['完全免费', '无广告', '不收集数据', '开源'],
    /* 弹窗里的署名行；留空则不显示这一行 */
    credit: '本网站由 DeepSeek 编写',
    github: 'https://github.com/yafite0/navhub',
    githubText: '在 GitHub 上查看源码',
    sponsor: 'https://afdian.com/a/L1295598306',
    sponsorText: '请我喝杯奶茶',
    note: '整站都是纯静态文件，托管在 GitHub Pages 上，没有后端、不会保存你输入的任何内容。'
  },

  /* ---------- 大类 ----------
     分类现在是两层：groups（大类）→ categories（小类）→ sites（站点）。
     小类用 group 字段指到自己所属的大类（要和下面的 id 对上）。

     要新开一个大类，就在这里加一项，再给相关小类写上 group；
     要往大类里加小类，就直接往 categories 里加，写上 group 即可。
     小类的 id 是稳定标识（sites.html?cat=xxx 用的就是它），改了会断链接。 */
  /* 【顺序就是主页的显示顺序，改这里就能调整大类的先后】 */
  groups: [
    {
      id: 'software',
      name: '常用软件',
      icon: '🧰',
      desc: '装机绕不开的那几类 —— 解压、剪视频、修图，只放官网下载入口'
    },
    {
      id: 'hardware',
      name: '显卡与驱动',
      icon: '🖥️',
      desc: '先认出自己是什么卡，再去对应官网下驱动'
    },
    {
      id: 'ai',
      name: 'AI 工具',
      icon: '🤖',
      desc: '对话、Agent、本地部署 —— 能用 AI 干活的地方都汇总在这一类'
    },
    {
      id: 'game',
      name: '游戏',
      icon: '🎮',
      desc: '从买游戏、做游戏，到做游戏要用到的各种工具，都收在这里'
    }
  ],

  /* 「完整索引」里的站点是按 cat 分组的，这张表说明每个分组属于哪个大类，
     让「其他网页」页也能按大类归位；没写在这里的分组会自己单独成组。
     左边是小类名（要和 categories 里的 name 完全一致才会合并），右边是大类 id。 */
  indexGroupOf: {
    '游戏平台': 'game',
    'AI 对话': 'ai',
    'AI Agent': 'ai'
  },

  /* ---------- 小类（分类） ---------- */
  categories: [
    {
      id: 'game-store',
      group: 'game',
      name: '游戏商城',
      icon: '🕹️',
      desc: '买 PC 游戏、领免费游戏、查手游的地方',
      sites: [
        {
          name: 'Steam',
          url: 'https://store.steampowered.com/',
          region: 'global',
          short: '游戏最全、打折最狠',
          key: '蒸汽 游戏平台 买游戏 正版游戏',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/steam-1.jpg', t: '商城首页' },
            { src: 'assets/shots/steam-2.jpg', t: '特惠打折页' },
            { src: 'assets/shots/steam-3.jpg', t: '热销商品榜' }
          ],
          icon: 'assets/icons/steam.png',
          intro: {
            tagline: '全球最大的 PC 游戏商城',
            pros: [
              '游戏数量最多，从最新 3A 大作到十几年前的老游戏几乎都能找到',
              '打折力度大，夏促冬促经常打到两三折，买完就是永久入库',
              '创意工坊（Mod）、云存档、好友联机这些配套功能做得最成熟',
              '支持支付宝和微信付款，不用信用卡也能买'
            ],
            cons: [
              '社区、好友、个人主页在国内网络下经常打不开（商店首页一般正常）',
              '买完还要装一个客户端才能玩，网页只能下单不能下游戏',
              '退款有门槛：买了 14 天内、且游玩时间不到 2 小时才能退'
            ],
            best: '想玩 3A 大作、或者想蹲打折囤游戏的人',
            tips: '国区属于低价区，同一款游戏往往比美区便宜不少；下单前可以先去网上比一下历史最低价再决定。'
          }
        },
        {
          name: 'Epic Games Store',
          alias: ['EGS'],
          url: 'https://store.epicgames.com/',
          region: 'global',
          short: '每周都能白领游戏',
          key: 'epic eg 平台 免费游戏 白嫖',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/epic-1.jpg', t: '商城首页' },
            { src: 'assets/shots/epic-2.jpg', t: '每周免费游戏' },
            { src: 'assets/shots/epic-3.jpg', t: '全部游戏' }
          ],
          icon: 'assets/icons/epic.png',
          intro: {
            tagline: '每周固定送游戏的商城',
            pros: [
              '每周都有免费游戏可以永久领取，一年下来能白拿几十款',
              '手握不少独占首发的大作，想玩新作有时只能来这儿',
              '国区定价有优势，还经常发面额不小的优惠券'
            ],
            cons: [
              '服务器在国内表现不稳定，下载速度时快时慢，偶尔要转很久圈',
              '网页和客户端加载速度不如 Steam 顺畅，用起来没那么"跟手"',
              '好友、成就、社区这些周边功能比较简陋，社交基本为零'
            ],
            best: '想白拿游戏、或者想省钱买新作的人',
            tips: '免费游戏必须"在活动期内手动点领取"，过期就真的没了，建议每周四晚上来看一眼。'
          }
        },
        {
          name: 'itch.io',
          url: 'https://itch.io/',
          region: 'global',
          short: '独立小游戏的宝库',
          key: '独立游戏 小游戏 免费游戏 开发者',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/itch-1.jpg', t: '首页' },
            { src: 'assets/shots/itch-2.jpg', t: '免费游戏' },
            { src: 'assets/shots/itch-3.jpg', t: '高分游戏' }
          ],
          icon: 'assets/icons/itch.png',
          intro: {
            tagline: '独立开发者的聚集地，小游戏特别多',
            pros: [
              '大量独立开发者的新奇小作品，很多是免费的，或者"随你给多少钱"',
              '上传游戏几乎没有门槛，所以能挖到别处根本没有的实验性作品',
              '可以直接给开发者打钱，而且不用注册就能下载免费游戏'
            ],
            cons: [
              '没有统一的客户端，游戏质量参差不齐，得自己慢慢淘',
              '大厂作品基本没有，想玩 3A 就别指望这里',
              '网站是全英文的，对不熟悉英文的人不太友好'
            ],
            best: '想找新奇小游戏、想支持独立开发者的人',
            tips: '首页 Browse 里可以按 "Free" 筛选免费游戏；不少游戏不用下载，直接在浏览器里就能玩。国内访问速度不太稳定，建议在网络状态好的时候打开。'
          }
        },
        {
          name: 'TapTap',
          url: 'https://www.taptap.cn/',
          region: 'cn',
          short: '在电脑上查手机游戏',
          key: 'taptap 手游 手机游戏 安卓游戏 手游商城 排行榜',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/taptap-1.jpg', t: '首页' },
            { src: 'assets/shots/taptap-2.jpg', t: '热门排行榜' },
            { src: 'assets/shots/taptap-3.jpg', t: '新品榜' }
          ],
          icon: 'assets/icons/taptap.png',
          intro: {
            tagline: '国内最大的手机游戏社区兼商城',
            pros: [
              '手机游戏资料最全，评分和评论都来自真实玩家，不容易被广告带偏',
              '网页版不用装任何东西，用电脑就能查游戏、看排行榜和攻略',
              '很多独立小团队的手游会在这儿首发，能挖到别处没有的冷门好游戏'
            ],
            cons: [
              '主打手机游戏，PC 单机大作基本没有，想买 3A 还得去 Steam',
              '网页版只能看和预约，真正下载安装还是得回到手机上的 App',
              '以国内能上架的作品为主，一部分海外手游在上面查不到'
            ],
            best: '想在电脑上查手游资料、看评分和排行榜的人',
            tips: '网页版适合先"做功课"，挑好游戏之后再回手机上装。想给游戏评分或者发帖讨论，需要注册账号。'
          }
        }
      ]
    },
    {
      id: 'game-engine',
      group: 'game',
      name: '游戏引擎',
      icon: '🧩',
      desc: '想做游戏从这儿开始 —— 三大主流引擎的官网',
      sites: [
        {
          name: 'Unreal Engine',
          alias: ['UE', '虚幻引擎'],
          url: 'https://www.unrealengine.com/zh-CN',
          region: 'global',
          short: '画面最强，3A 大厂在用',
          key: '虚幻引擎 虚幻 unreal ue ue5 epic 3a 大作 游戏开发 引擎',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/unreal-1.jpg', t: '官网首页' },
            { src: 'assets/shots/unreal-2.jpg', t: '下载页' },
            { src: 'assets/shots/unreal-3.jpg', t: '功能特性' }
          ],
          icon: 'assets/icons/unreal.png',
          intro: {
            tagline: '画面表现力最强的商业引擎',
            pros: [
              '画面效果公认最强，写实风格的 3A 大作和影视级实时渲染大多用它',
              '对个人和小团队基本免费，年收入不到 100 万美元时不用交分成',
              '自带蓝图可视化脚本，完全不会写代码也能做出能玩的游戏',
              '中文文档和教程齐全，国内有官方社区在维护'
            ],
            cons: [
              '对电脑要求高，引擎本体加缓存动辄上百 GB，老电脑很难跑得动',
              '想做复杂功能还是得会 C++，蓝图能做的东西有上限',
              '做手机小游戏属于"杀鸡用牛刀"，编译和打包都很慢'
            ],
            best: '想做写实风格项目、电脑配置还不错的人',
            tips: '个人使用完全免费，只有公司年收入超过 100 万美元才需要付 5% 分成。第一次安装建议先腾出 150GB 以上空间。'
          }
        },
        {
          name: 'Unity',
          url: 'https://unity.com/cn',
          region: 'global',
          short: '上手最容易，手游主力',
          key: 'unity 手游 引擎 游戏开发 移动游戏 独立游戏',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/unity-1.jpg', t: '中文官网首页' },
            { src: 'assets/shots/unity-2.jpg', t: '开发者社区' },
            { src: 'assets/shots/unity-3.jpg', t: '引擎介绍' }
          ],
          icon: 'assets/icons/unity.png',
          intro: {
            tagline: '用的人最多的通用游戏引擎',
            pros: [
              '学习资料最多的一个，B 站和 YouTube 上一搜一大把，新手最容易找到答案',
              '手游市场占用率第一，想靠做游戏找工作，岗位也是它最多',
              '支持的平台最广：手机、网页、PC、主机甚至小程序都能发布',
              '编辑器相对轻量，中低配电脑也跑得动'
            ],
            cons: [
              '2023 年临时改收费规则引发过争议，虽然最后撤回了，但商业政策存在不确定性',
              '默认画质不如虚幻，想做电影级画面要额外花很多功夫优化',
              '一部分功能被拆成付费订阅，免费版有所限制'
            ],
            best: '想快速做出手机游戏或小体量作品、预算有限的人',
            tips: '个人版免费，条件是年收入低于 20 万美元。如果只是好奇"做游戏是什么感觉"，从 Unity 入门通常比虚幻容易得多。'
          }
        },
        {
          name: 'Godot',
          url: 'https://godotengine.org/',
          region: 'global',
          short: '完全免费、体积超小',
          key: 'godot 开源 免费 2d 游戏引擎 独立游戏 轻量',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/godot-1.jpg', t: '官网首页' },
            { src: 'assets/shots/godot-2.jpg', t: '下载页' },
            { src: 'assets/shots/godot-3.jpg', t: '功能特性' }
          ],
          icon: 'assets/icons/godot.png',
          intro: {
            tagline: '完全开源免费的轻量级引擎',
            pros: [
              '真正完全免费开源（MIT 协议），没有任何收入门槛、分成或版税',
              '安装包只有几十 MB，下载完解压就能用，老电脑也带得动',
              '做 2D 游戏特别顺手，内置的 2D 工具比虚幻和 Unity 都更好用',
              '不用注册账号、不联网也能打开，没有任何数据上报'
            ],
            cons: [
              '3D 能力明显弱于前两个，大型 3D 项目不太适合',
              '中文资料相对少，遇到冷门问题往往只能翻英文文档',
              '商业公司用得少，会这个对找工作的帮助有限',
              '插件市场和现成素材的规模比前两个小很多'
            ],
            best: '想低成本入门做 2D 小游戏，或者看重开源自由的人',
            tips: '官网下载的是绿色版，解压即用。想试试效果，照着官方文档做一个"打砖块"小游戏，一小时就能跑起来。'
          }
        }
      ]
    },
    {
      id: 'ai-chat',
      group: 'ai',
      name: 'AI 对话',
      icon: '💬',
      desc: '打开网页就能直接聊，官网里也都能找到手机和电脑版',
      sites: [
        {
          name: 'DeepSeek',
          url: 'https://www.deepseek.com/',
          short: '免费、能深度思考',
          key: 'AI 对话 大模型 人工智能 深度求索 写代码 写作 深度思考',
          region: 'cn',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/deepseek-2.jpg', t: '官网首页' },
            { src: 'assets/shots/deepseek-1.jpg', t: '网页版登录界面' }
          ],
          icon: 'assets/icons/deepseek.com.png',
          intro: {
            tagline: '国产大模型里口碑最稳的一个',
            pros: [
              '对话和推理能力在国产模型里第一梯队，问复杂问题不容易答偏',
              '完全免费、不限次数，网页版不用装任何东西就能用',
              '「深度思考」模式会把推理过程摊开给你看，学东西时很好用',
              '支持上传文档、图片，长文总结和读表格都很在行'
            ],
            cons: [
              '高峰期（晚上、发新版时）偶尔会忙，需要重试几次',
              '生成图片、语音这些多模态能力比不过国外几家',
              '没有现成的手机客户端，手机上一般是通过网页或小程序用'
            ],
            best: '想免费用一个靠谱 AI 助手的人，尤其是拿它写东西、查资料、学知识',
            tips: '官网就是 chat.deepseek.com，认准这个域名 —— 搜索时经常能看到一堆"DeepSeek 官方下载站"，那些都不是官方的。'
          }
        },
        {
          name: '豆包',
          url: 'https://www.doubao.com/',
          short: '字节家的，功能全',
          key: 'AI 对话 人工智能 字节 doubao 写作 语音',
          region: 'cn',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/doubao-2.jpg', t: '网页版' }
          ],
          icon: 'assets/icons/doubao.com.png',
          intro: {
            tagline: '字节跳动出的全能型 AI 助手',
            pros: [
              '能聊、能写、能生成图片、能读文件，一个页面把常用功能都塞进去了',
              '手机 App 做得比较成熟，语音对话体验自然',
              '接入的东西多，找资讯、查天气这类日常问题回答得比较顺'
            ],
            cons: [
              '网页版在部分地区要求先登录才能用，打开会先看到登录提示',
              '回答风格偏"话多"，想要简洁结论需要自己催一下',
              '部分高级能力要会员'
            ],
            best: '想用一个什么都能干一点的 AI，或者习惯用手机语音对话的人',
            tips: '如果网页提示"受区域限制"，直接在手机上装官方 App 更稳。'
          }
        },
        {
          name: 'Kimi',
          url: 'https://www.kimi.com/',
          short: '读长文档特别强',
          key: 'AI 对话 长文本 读文档 人工智能 月之暗面 kimi',
          region: 'cn',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/kimi-1.jpg', t: '网页版首页' },
            { src: 'assets/shots/kimi-2.jpg', t: '对话界面' }
          ],
          icon: 'assets/icons/kimi.com.png',
          intro: {
            tagline: '主打"能读很长很长的文档"',
            pros: [
              '长文本处理是它的招牌，几十万字的报告、论文丢进去也能读完再答',
              '支持 PDF、Word、Excel 等多种格式，读完还能做总结和对比',
              '网页版和手机 App 同步，界面清爽没有太多广告'
            ],
            cons: [
              '纯聊天和推理能力比 DeepSeek 稍弱一点',
              '免费额度对超长文档有次数限制，重度使用需要付费',
              '生成图片这类多模态功能没有'
            ],
            best: '需要读长文档、整理资料、做文献总结的人',
            tips: '手里有一堆长 PDF 不知道从哪看起的时候，把它丢给 Kimi 让它先出个摘要，效率很高。'
          }
        },
        {
          name: '通义千问',
          alias: ['Qwen'],
          url: 'https://www.tongyi.com/',
          short: '阿里出品，家族很大',
          key: 'AI 对话 人工智能 qwen 阿里 通义 千问 写作',
          region: 'cn',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/tongyi-1.jpg', t: '官网首页' },
            { src: 'assets/shots/tongyi-2.jpg', t: '通义千问页面' }
          ],
          icon: 'assets/icons/tongyi.com.png',
          intro: {
            tagline: '阿里的大模型，功能铺得很广',
            pros: [
              '背后是通义系列全家桶，文生图、语音、翻译、代码各有专门入口',
              '和阿里系产品（比如钉钉、夸克）打通，办公场景顺手',
              '中文理解和公文、报告类写作比较稳'
            ],
            cons: [
              '产品线太多，第一次进去容易不知道该点哪个',
              '不同入口的模型版本不一样，效果参差不齐',
              '部分能力额度有限，用完要等或者开会员'
            ],
            best: '平时用阿里系办公工具、或者需要文生图和翻译一起搞定的人',
            tips: '只想聊天的话直接搜「通义千问」；想生成图片、做会议记录，去通义家族里找对应的那个入口。'
          }
        },
        {
          name: '腾讯元宝',
          url: 'https://yuanbao.tencent.com/',
          short: '能读公众号文章',
          key: 'AI 对话 人工智能 腾讯 yuanbao 元宝 公众号',
          region: 'cn',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/yuanbao-2.jpg', t: '对话界面' },
            { src: 'assets/shots/yuanbao-1.jpg', t: '官网首页' }
          ],
          icon: 'assets/icons/yuanbao.tencent.com.png',
          intro: {
            tagline: '腾讯的 AI 助手，和微信生态贴合',
            pros: [
              '能直接读取微信公众号文章的内容，看长文时很好用',
              '和腾讯文档、腾讯会议这些办公工具配合顺手',
              '背后接了混元和 DeepSeek 两个模型，可以自己切换'
            ],
            cons: [
              '整体能力中规中矩，没有特别突出的长板',
              '不少功能需要登录微信号才能用',
              '网页版界面偏工具化，第一眼不太直观'
            ],
            best: '经常看公众号长文、或者日常用腾讯办公产品的人',
            tips: '看到一篇很长的公众号文章不想细读，把链接丢给元宝让它总结，比手动滑省事。'
          }
        },
        {
          name: '文心一言',
          alias: ['ERNIE'],
          url: 'https://wenxin.baidu.com/',
          short: '百度出品，能画图做 PPT',
          key: 'AI 对话 人工智能 百度 ernie 文心 一言 画图 PPT',
          region: 'cn',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/wenxin-1.jpg', t: '网页版对话界面' },
            { src: 'assets/shots/wenxin-2.jpg', t: '文心官网' }
          ],
          icon: 'assets/icons/yiyan.baidu.com.png',
          intro: {
            tagline: '百度的大模型助手，工具给得比较全',
            pros: [
              '一个界面里就带了图片生成、帮我写作、PPT 生成等现成入口',
              '不用登录也能先试，门槛低',
              '中文语义理解好，写公文、做表格类任务比较顺手',
              '底层的文心大模型更新比较勤，能力一直在涨'
            ],
            cons: [
              '回答偶有"一本正经胡说"的情况，重要信息还是要自己核',
              '免费版的生成图片次数有限',
              '界面功能多，有时候要在几层菜单里找'
            ],
            best: '想在一个页面里把聊天、画图、写 PPT 都解决的人',
            tips: '官网是 yiyan.baidu.com。百度搜索"文心一言"时前排常混有第三方下载站，认准这个域名。'
          }
        }
      ]
    },
    {
      id: 'ai-agent',
      group: 'ai',
      name: 'AI Agent',
      icon: '🧠',
      desc: '不只是聊天 —— 能自己规划步骤、调用工具、把活干完',
      sites: [
        {
          name: 'CodeBuddy',
          url: 'https://www.codebuddy.ai/',
          short: '帮程序员写代码',
          key: 'AI 编程 代码助手 agent 智能体 写代码 codebuddy 腾讯',
          region: 'cn',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/codebuddy-2.jpg', t: '产品介绍页' },
            { src: 'assets/shots/codebuddy-1.jpg', t: '官网首页' }
          ],
          icon: 'assets/icons/codebuddy.ai.png',
          intro: {
            tagline: '面向写代码的 AI Agent',
            pros: [
              '不只是补全代码，能自己读整个项目、跨多个文件改代码',
              '能跑命令、看报错、自己回头修，一轮下来把功能做出来',
              '有 IDE 插件也有独立客户端，跟着现有开发习惯走',
              '中文提问支持得好，不用费劲翻译成英文'
            ],
            cons: [
              '主要面向开发者，不写代码的人用不上',
              '处理大项目时会比较吃机器性能',
              '复杂重构仍然需要人来把关，不能完全放手'
            ],
            best: '想用 AI 提效的程序员，或者拿它辅助写小项目的人',
            tips: '官网是 codebuddy.ai。搜索时容易碰到第三方"下载站"，认准这个域名。'
          }
        },
        {
          name: 'WorkBuddy',
          url: 'https://workbuddy.tencent.com/',
          short: '帮你把办公的活干完',
          key: 'AI 办公 agent 智能体 自动化 报告 PPT 腾讯 workbuddy',
          region: 'cn',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/workbuddy-1.jpg', t: '官网首页' }
          ],
          icon: 'assets/icons/workbuddy.tencent.com.png',
          intro: {
            tagline: '面向办公场景的 AI Agent',
            pros: [
              '把任务描述清楚就不用管了 —— 它会自己规划步骤、查资料、生成文件',
              '交付的是能直接用的成果（报告、表格、PPT），不是一段聊天记录',
              '和腾讯办公生态打通，写好的东西方便直接流转',
              '支持多个 Agent 并行干活，几件事能同时推进'
            ],
            cons: [
              '偏企业办公场景，个人日常用有点大材小用',
              '需要联网，部分任务依赖内部资料时效果才最好',
              '新东西迭代快，界面和入口可能会变'
            ],
            best: '需要经常做调研、写报告、整理资料的职场人',
            tips: '把要求一次说清楚（要什么结论、给谁看、多长），它一次能交出来的东西会好很多。'
          }
        },
        {
          name: 'DeepSeek Harness',
          alias: ['DSH'],
          url: 'https://www.deepseek.com/harness/',
          short: '开源 Agent，能装插件',
          key: 'AI agent 智能体 编程 插件 开源 deepseek harness dsh',
          region: 'cn',
          shotUpdated: '2026-10-06',
          shots: [
            { src: 'assets/shots/harness-1.jpg', t: '官网首页' }
          ],
          icon: 'assets/icons/deepseek.com.png',
          intro: {
            tagline: 'DeepSeek 开源出来的 Agent 框架',
            pros: [
              '完全开源，插件可以自己拼装，能按需扩展能力',
              '可以当编程 Agent 用，能理解需求并直接读写项目文件',
              '有 Windows / macOS 桌面端，也有命令行和网页端',
              '不绑死在某一家云服务上，能接自己的模型和工具'
            ],
            cons: [
              '偏进阶工具，不熟悉命令行和环境配置会有点陡',
              '插件生态还在早期，能直接用现成的东西不多',
              '版本迭代很快，接口和用法可能随时变'
            ],
            best: '喜欢折腾、想把 Agent 接到自己工作流里的开发者',
            tips: '官网入口在 deepseek.com/harness/。先在桌面端跑通一个简单任务，再考虑装插件。'
          }
        }
      ]
    },
    {
      id: 'ai-api',
      group: 'ai',
      name: 'API 提供商',
      icon: '🔌',
      desc: '想自己写程序调模型，就来这儿拿密钥 —— 聚合平台一个密钥能调好几家',
      sites: [
        {
          name: '硅基流动',
          alias: ['SiliconFlow'],
          url: 'https://siliconflow.cn/',
          short: '国内聚合平台，一个密钥调多数开源模型',
          key: 'siliconflow 硅基流动 api 聚合 开源模型 接口 密钥 中转',
          region: 'cn',
          shotUpdated: '2026-10-07',
          shots: [
            { src: 'assets/shots/siliconflow-1.jpg', t: '官网首页' },
            { src: 'assets/shots/siliconflow-2.jpg', t: '开发文档' }
          ],
          intro: {
            tagline: '国内的模型 API 聚合平台，一个密钥调多数开源模型',
            pros: [
              '一个密钥就能调 DeepSeek、Qwen、GLM 等一批开源模型，不用挨个平台注册',
              '国内服务器，不用折腾网络，调用速度稳定',
              '按量计费，新用户通常有赠送额度，试错成本低',
              '文档是中文的，接口兼容 OpenAI 格式，现有代码改个地址就能用'
            ],
            cons: [
              '主打开源模型，最新的闭源旗舰模型这里一般没有',
              '高峰期部分热门模型会排队，高并发场景要提前测',
              '模型上下架比较频繁，长期项目要注意别用被下线的型号'
            ],
            best: '想写个小程序调模型、又不想挨个平台注册的开发者',
            tips: '先在模型广场挑一个免费的试试，跑通了再充钱换大模型。接口地址和密钥在控制台里生成。'
          }
        },
        {
          name: 'DeepSeek 开放平台',
          url: 'https://platform.deepseek.com/',
          short: 'DeepSeek 官方的 API 控制台',
          key: 'deepseek api 开放平台 密钥 key 接口 充值 便宜',
          region: 'cn',
          shotUpdated: '2026-10-07',
          shots: [
            { src: 'assets/shots/deepseekapi-1.jpg', t: 'DeepSeek 官网' },
            { src: 'assets/shots/deepseekapi-2.jpg', t: 'API 文档' },
            { src: 'assets/shots/deepseekapi-3.jpg', t: '价格页' }
          ],
          intro: {
            tagline: 'DeepSeek 官方的 API 控制台，便宜是它最大的标签',
            pros: [
              '价格便宜得离谱，同样任务的花费常常只有国外模型的零头',
              '缓存命中还能再打折，反复处理同一份长文档时特别划算',
              '中文能力强，写中文内容、处理中文文档不用额外调教',
              '接口兼容 OpenAI 格式，把地址和密钥一换就能跑'
            ],
            cons: [
              '页面本身要登录才能看到内容，第一次进来会觉得有点空',
              '高峰期偶尔会限流，重要业务最好准备好备用渠道',
              '只有自家的模型，想对比别家的得另外去别处开账号'
            ],
            best: '预算有限、主要处理中文内容的个人开发者和中小团队',
            tips: '充值前先看看文档里的价格页，把「缓存命中」的用法搞清楚，能省不少钱。密钥只生成一次，记得立刻存好。'
          }
        }
      ]
    },
    {
      id: 'ai-local-chat',
      group: 'ai',
      name: '本地对话',
      icon: '💻',
      desc: '装在自己电脑上的对话客户端，记录留在本机，模型可以自己挑',
      sites: [
        {
          name: 'Chatbox',
          url: 'https://chatboxai.app/zh',
          short: '装机量最大的桌面客户端',
          key: 'chatbox 客户端 桌面 本地 对话 多模型 开源',
          region: 'global',
          shotUpdated: '2026-10-07',
          shots: [
            { src: 'assets/shots/chatbox-1.jpg', t: '官网首页' },
            { src: 'assets/shots/chatbox-2.jpg', t: '下载页' }
          ],
          intro: {
            tagline: '装机量最大的桌面 AI 客户端，装上就能换着模型聊',
            pros: [
              'Windows、macOS、Linux、手机都有，界面一致，换设备不用重新适应',
              '可以填任何兼容 OpenAI 格式的接口，国内的国外的都能接',
              '聊天记录存在本机，也可以让它连自己电脑上跑的本地模型',
              '免费版够用，没有强制登录，打开就能填密钥开始聊'
            ],
            cons: [
              '要自己准备 API 密钥，不像网页版那样注册完直接能用',
              '不带模型，模型的能力和费用取决于你接的是哪家',
              '高级功能（比如团队协作、云同步）要付费'
            ],
            best: '想在一个软件里同时用好几家模型、又不想被某个平台绑住的人',
            tips: '装好后在设置里选「OpenAI API 兼容」，把硅基流动或 DeepSeek 的地址和密钥填进去就能用了。'
          }
        },
        {
          name: 'SillyTavern',
          alias: ['酒馆'],
          url: 'https://sillytavern.app/',
          short: '角色扮演专用前端',
          key: 'sillytavern 酒馆 角色扮演 卡 前端 开源',
          region: 'global',
          shotUpdated: '2026-10-07',
          shots: [
            { src: 'assets/shots/sillytavern-1.jpg', t: '官网首页' },
            { src: 'assets/shots/sillytavern-2.jpg', t: '使用文档' }
          ],
          intro: {
            tagline: '专门做角色扮演和长对话的前端，圈内都叫它「酒馆」',
            pros: [
              '角色卡、世界书、记忆管理这些功能是别的客户端没有的',
              '可以调很多细节：发言顺序、上下文长度、预设提示词',
              '完全开源免费，接哪家的模型由你决定',
              '社区活跃，现成的角色卡和预设非常多'
            ],
            cons: [
              '要自己装（本地跑或者 Docker），不是装个 exe 就能用',
              '功能多、选项杂，第一眼看着会有点懵',
              '中文资料相对少，很多设置得看英文文档'
            ],
            best: '喜欢角色扮演、或者想把对话调得很细的人',
            tips: '官方文档里有详细的安装步骤。新手建议先用现成的预设，别一上来就自己调参数。'
          }
        }
      ]
    },
    {
      id: 'gpu-driver',
      group: 'hardware',
      name: '显卡与驱动',
      icon: '🖥️',
      desc: '先认出自己是什么卡，再去对应官网下驱动',
      /* 分类级的额外入口：会在分类标题下多渲染一个引导条 */
      tool: {
        href: 'tools.html?tool=specs',
        label: '先查查我是什么显卡',
        note: '在浏览器里直接读，不用装软件，也不会把信息传到任何地方'
      },
      sites: [
        {
          name: 'NVIDIA',
          alias: ['英伟达'],
          url: 'https://www.nvidia.cn/geforce/drivers/',
          short: 'N 卡驱动，RTX / GTX 都是它',
          key: 'nvidia 英伟达 n卡 显卡 驱动 下载 更新 geforce rtx gtx 自动检测',
          region: 'global',
          shotUpdated: '2026-10-07',
          shots: [
            { src: 'assets/shots/nvidia-drv.jpg', t: '驱动下载页' },
            { src: 'assets/shots/nvidia-home.jpg', t: '官网首页' },
            { src: 'assets/shots/nvidia-gpu.jpg', t: '显卡产品页' }
          ],
          icon: 'assets/icons/nvidia.com.png',
          intro: {
            tagline: 'N 卡（GeForce RTX / GTX）的驱动官网',
            pros: [
              '支持自动检测显卡型号，不用自己查配置就能找到对应驱动',
              '驱动分 Game Ready（玩游戏）和 Studio（剪辑设计）两条线，按用途挑',
              '官网直接下载，不会被捆绑装上一堆没用的软件',
              'CUDA、AI 相关的工具包也在这里，做深度学习的一并搞定'
            ],
            cons: [
              '驱动包体积大（通常五六百 MB），下载要等一会儿',
              '太老的显卡会停止驱动更新，只能下到某个历史版本',
              '第一次进页面会弹 Cookie 提示，要先点一下同意'
            ],
            best: '用 N 卡的人，尤其是刚装好机器需要打新驱动的',
            tips: '不知道自己是什么卡？按 Win+R 输入 dxdiag，在「显示」标签页就能看到显卡型号。驱动只从官网下，别用各种「驱动大师」——那类软件经常顺手装一堆用不着的东西。'
          }
        },
        {
          name: 'AMD',
          url: 'https://www.amd.com/zh-cn/support/download/drivers.html',
          short: 'A 卡与锐龙芯片组驱动',
          key: 'amd a卡 显卡 驱动 下载 更新 radeon 锐龙 ryzen 芯片组 自动检测',
          region: 'global',
          shotUpdated: '2026-10-07',
          shots: [
            { src: 'assets/shots/amd-drv.jpg', t: '驱动下载页' },
            { src: 'assets/shots/amd-home.jpg', t: '官网首页' },
            { src: 'assets/shots/amd-gpu.jpg', t: '显卡产品页' }
          ],
          icon: 'assets/icons/amd.com.png',
          intro: {
            tagline: 'A 卡（Radeon）和锐龙芯片组的驱动官网',
            pros: [
              '显卡驱动和主板芯片组驱动在同一个页面，装机时一次下全',
              '提供自动检测工具，装上就能识别型号并提示该更新哪个',
              'Windows 和 Linux 两条下载线都有，玩 Linux 的也能用',
              '老卡的支持周期比较长，几年前买的型号一般还能找到驱动'
            ],
            cons: [
              '国内访问不太稳定，有时候要刷新几次或者换个网络再试',
              '驱动更新比较勤，每次的安装包都不小',
              '老型号在页面上藏得比较深，得往下翻或者用搜索框找'
            ],
            best: '用 AMD 显卡，或者装了锐龙平台需要打芯片组驱动的人',
            tips: 'AMD 驱动分「推荐版（Recommended）」和「可选版（Optional）」两种，求稳就选推荐版，可选版是给想尝鲜的人试新功能的。'
          }
        },
        {
          name: 'Intel',
          alias: ['英特尔'],
          url: 'https://www.intel.cn/content/www/cn/zh/download-center/home.html',
          short: '核显与 Arc 独显驱动',
          key: 'intel 英特尔 核显 集显 arc 显卡 驱动 下载 更新 无线网卡 芯片组',
          region: 'global',
          shotUpdated: '2026-10-07',
          shots: [
            { src: 'assets/shots/intel-drv.jpg', t: '驱动下载中心' },
            { src: 'assets/shots/intel-home.jpg', t: '官网首页' },
            { src: 'assets/shots/intel-gpu.jpg', t: 'Arc 显卡产品页' }
          ],
          icon: 'assets/icons/intel.com.png',
          intro: {
            tagline: 'Intel 核显和 Arc 独显的驱动中心',
            pros: [
              '核显、Arc 独显、无线网卡、芯片组驱动全在同一个下载中心里',
              '有「自动更新工具」，装一次以后会主动提醒你该更新了',
              '核显驱动在这里更新最省事，比翻笔记本品牌官网快',
              '中文页面完整，按产品分类挑就行'
            ],
            cons: [
              '产品线太杂，第一次进去容易在「选择您的产品」里挑花眼',
              '一部分驱动要登录 Intel 账号才能下载',
              '笔记本厂商定制的驱动版本可能和官网不一样，装之前最好确认'
            ],
            best: '用 Intel 核显的轻薄本用户，或者用 Arc 独显的人',
            tips: '轻薄本要注意：有些品牌会锁驱动版本。如果官网的通用驱动装不上或者装完花屏，就回笔记本品牌的官网下定制版。'
          }
        }
      ]
    },
    {
      id: 'unzip',
      group: 'software',
      name: '解压压缩',
      icon: '📦',
      desc: '装完系统第一个要装的东西 —— 只从官网下，别用下载站里的捆绑版',
      sites: [
        {
          name: '7-Zip',
          alias: ['7z'],
          url: 'https://www.7-zip.org/',
          short: '最经典的开源压缩工具',
          key: '7zip 7-zip 压缩 解压 免费 开源 rar zip 极简',
          region: 'global',
          shotUpdated: '2026-10-07',
          shots: [
            { src: 'assets/shots/sevenzip-1.jpg', t: '官网首页' },
            { src: 'assets/shots/sevenzip-2.jpg', t: '下载页' }
          ],
          intro: {
            tagline: '最经典的开源压缩工具，装完就没它什么事了',
            pros: [
              '完全免费、开源，没有任何广告和捆绑',
              '压缩率通常比 WinRAR 还高一点，尤其是 7z 格式',
              '体积小、运行快，老电脑上也毫无压力',
              '官网干净，下载页清清楚楚列出各个版本'
            ],
            cons: [
              '界面是上世纪的风格，谈不上好看',
              '不能直接创建 rar 文件（rar 是收费格式，别人家也做不了）',
              '官网是英文的，且下载要自己根据系统位数挑安装包'
            ],
            best: '想要一个干净、免费、能一直用的解压软件的任何人',
            tips: '下载页里 64-bit Windows 选「x64」，32 位选「32-bit」。装的时候可以把「关联格式」全勾上，以后双击压缩包直接用它打开。'
          }
        },
        {
          name: 'WinRAR',
          alias: ['RAR'],
          url: 'https://www.winrar.com.cn/',
          short: '老牌，能一直试用',
          key: 'winrar rar 压缩 解压 试用 老牌',
          region: 'cn',
          shotUpdated: '2026-10-07',
          shots: [
            { src: 'assets/shots/winrar-1.jpg', t: '官网首页' },
            { src: 'assets/shots/winrar-2.jpg', t: '下载页' }
          ],
          intro: {
            tagline: '用了二十多年的老牌压缩软件，能一直试用下去',
            pros: [
              '界面是中文的，新手拿起来就会用',
              '能创建 rar 格式，接受 rar 文件时最省事',
              '有修复压缩包的功能，包损坏时能救回一部分',
              '中文官网的下载入口很清楚，不容易下错'
            ],
            cons: [
              '是商业软件，试用期过了会一直弹购买提示（但不影响使用）',
              '压缩率不如 7-Zip，速度也慢一些',
              '安装包体积明显比 7-Zip 大'
            ],
            best: '经常要处理 rar 文件、又想要中文界面的人',
            tips: '中文官网是代理商维护的，认准 winrar.com.cn。别在下载站下「破解版」，那类包是捆绑软件的重灾区。'
          }
        }
      ]
    },
    {
      id: 'video-edit',
      group: 'software',
      name: '视频剪辑',
      icon: '🎬',
      desc: '从手机剪到专业调色，还有转码和录屏的工具',
      sites: [
        {
          name: '剪映',
          alias: ['CapCut'],
          url: 'https://www.capcut.cn/',
          short: '上手最快，模板多',
          key: '剪映 capcut 剪辑 视频 抖音 模板 免费',
          region: 'cn',
          shotUpdated: '2026-10-07',
          shots: [
            { src: 'assets/shots/jianying-1.jpg', t: '官网首页' }
          ],
          intro: {
            tagline: '上手最快的剪辑软件，手机上也能剪',
            pros: [
              '操作逻辑和手机版一致，学会了在哪都能剪',
              '自带大量模板、转场和音乐，套一套就能出片',
              '自动字幕准确率不错，省掉大量打字时间',
              '基础功能免费，导出没有水印'
            ],
            cons: [
              '高级素材和部分特效要开会员',
              '导出画质和码率的可调项比专业软件少',
              '长视频、多轨道项目会比较卡'
            ],
            best: '做短视频、Vlog，想快速出片的人',
            tips: '手机版和电脑版是同一个账号，草稿能同步。想做长视频或者需要精确控制时，再考虑换 DaVinci。'
          }
        },
        {
          name: '必剪',
          alias: ['Bcut'],
          url: 'https://bcut.bilibili.cn/',
          short: 'B 站出的，投稿很顺',
          key: '必剪 bcut b站 哔哩哔哩 剪辑 视频 投稿',
          region: 'cn',
          shotUpdated: '2026-10-07',
          shots: [
            { src: 'assets/shots/bcut-1.jpg', t: '官网首页' }
          ],
          intro: {
            tagline: 'B 站官方出的剪辑软件，投稿是它最顺的地方',
            pros: [
              '和 B 站账号打通，剪完直接投稿，不用来回导出上传',
              '内置 B 站风格的素材、贴纸和梗，做二次元内容很顺手',
              '免费，没有水印',
              '有手机版，能云端同步草稿'
            ],
            cons: [
              '功能比剪映略少，尤其是商用向的模板',
              '主要面向 B 站，投别的平台要手动导文件',
              '更新节奏比剪映慢一些'
            ],
            best: '主要往 B 站投稿的 UP 主',
            tips: '如果只是想在 B 站更新，用它能省掉导出再上传这一整步。'
          }
        },
        {
          name: 'DaVinci Resolve',
          alias: ['达芬奇'],
          url: 'https://www.blackmagicdesign.com/products/davinciresolve',
          short: '专业调色，免费版就够用',
          key: '达芬奇 davinci resolve 调色 剪辑 专业 免费 黑魔法',
          region: 'global',
          shotUpdated: '2026-10-07',
          shots: [
            { src: 'assets/shots/davinci-1.jpg', t: '产品页' }
          ],
          intro: {
            tagline: '专业级剪辑调色软件，免费版的规格就顶得住商单',
            pros: [
              '调色是它的看家本领，好莱坞级别的项目也在用',
              '免费版几乎没有功能阉割，不是「体验版」那种',
              '剪辑、调色、特效、音频、交付全在一个软件里',
              '一次安装，Windows / macOS / Linux 都有'
            ],
            cons: [
              '对电脑配置要求高，显卡差或者内存小会很卡',
              '上手比剪映陡得多，得花时间学',
              '界面术语偏专业，第一次打开容易不知道从哪下手'
            ],
            best: '想认真做视频、对画质和调色有要求的人',
            tips: '官网下载页先看清楚是免费版（DaVinci Resolve）还是付费版（Studio）。免费版就能调用显卡加速，装完先在设置里确认下。'
          }
        }
      ]
    },
    {
      id: 'image-edit',
      group: 'software',
      name: '图像处理',
      icon: '🖼️',
      desc: '修图、画画、做设计的官网入口，免费开源和商业软件都有',
      sites: [
        {
          name: 'Photoshop',
          alias: ['PS'],
          url: 'https://www.adobe.com/products/photoshop.html',
          short: '行业标准，订阅制',
          key: 'ps photoshop adobe 修图 图像处理 订阅',
          region: 'global',
          shotUpdated: '2026-10-07',
          shots: [
            { src: 'assets/shots/photoshop-1.jpg', t: '产品页' }
          ],
          intro: {
            tagline: '图像处理的事实标准，几乎所有教程和素材都为它准备',
            pros: [
              '功能最全，别的软件做不了的效果基本都能在这儿实现',
              '全网教程和插件最多，遇到问题一搜就有答案',
              '和 Illustrator、After Effects 等 Adobe 软件配合得很顺',
              'AI 功能（生成式填充、创成式扩展）已经融进常规工作流'
            ],
            cons: [
              '订阅制，按月付费，不能买断',
              '安装包大、吃内存，老电脑跑起来吃力',
              '正版订阅在国内购买和续费都比较麻烦',
              '功能太多，新手一打开会不知道从哪开始'
            ],
            best: '做设计、修图当职业，或者需要和团队交换 PSD 文件的人',
            tips: '只是偶尔修修图的话，可以先用 Photopea（网页版，免费）顶着。真要长期做这行，再考虑订阅正版。'
          }
        }
      ]
    }
  ],

  /* ------------------------------------------------------------
   *  第二档 · 完整索引
   *  主页不展示，但会出现在「全部网站」页，并且带图标和一句话说明。
   *  收录标准：搜索它的名字时，前排常被广告、加速器或山寨站占掉，
   *  用户容易点错 —— 这类官网才值得专门列出来。
   *  region: 'cn' 国内站点（含国内镜像） / 'global' 国外站点
   * ------------------------------------------------------------ */
  index: [
    /* --- 下面这批来自「API 提供商 / 本地对话 / 解压压缩 / 视频剪辑 / 图像处理」，
           它们只在「其他网页」页和搜索里出现，不进主页精选。
           主页精选要够常用、并且配了官网截图和介绍才行。 --- */
    { name: '阿里云百炼', url: 'https://bailian.console.aliyun.com/', desc: '通义千问全系列，企业用得多', cat: 'API 提供商', region: 'cn', key: '阿里 百炼 通义千问 qwen api 密钥 大模型 接口' },
    { name: '火山方舟', url: 'https://www.volcengine.com/product/ark', desc: '字节的豆包大模型 API', cat: 'API 提供商', region: 'cn', key: '火山 方舟 字节 豆包 doubao api 密钥 大模型' },
    { name: '智谱 AI', alias: ['GLM'], url: 'https://open.bigmodel.cn/', desc: '清华系的 GLM 系列模型', cat: 'API 提供商', region: 'cn', key: '智谱 glm 清言 api 密钥 大模型 开放平台' },
    { name: '月之暗面', url: 'https://platform.moonshot.cn/', desc: 'Kimi 背后的模型 API', cat: 'API 提供商', region: 'cn', key: '月之暗面 moonshot kimi api 密钥 长文本 开放平台' },
    { name: '百度千帆', url: 'https://qianfan.cloud.baidu.com/', desc: '文心一言的开放平台', cat: 'API 提供商', region: 'cn', key: '百度 千帆 文心一言 ernie api 密钥 大模型' },
    { name: '腾讯混元', alias: ['Hunyuan'], url: 'https://cloud.tencent.com/product/hunyuan', desc: '腾讯自研的混元大模型', cat: 'API 提供商', region: 'cn', key: '腾讯 混元 hunyuan api 密钥 大模型 接口' },
    { name: 'OpenRouter', url: 'https://openrouter.ai/', desc: '一个密钥调遍各家主流模型', cat: 'API 提供商', region: 'global', key: 'openrouter 聚合 中转 api 多模型 密钥 比价' },
    { name: 'OpenAI Platform', url: 'https://platform.openai.com/', desc: 'GPT 系列的官方控制台', cat: 'API 提供商', region: 'global', key: 'openai gpt api 密钥 key 接口 官方' },
    { name: 'Anthropic Console', url: 'https://console.anthropic.com/', desc: 'Claude 系列的官方控制台', cat: 'API 提供商', region: 'global', key: 'anthropic claude api 密钥 key 接口 官方' },
    { name: 'Google AI Studio', alias: ['AI Studio'], url: 'https://aistudio.google.com/', desc: 'Gemini 的试验台，有免费额度', cat: 'API 提供商', region: 'global', key: 'google gemini aistudio api 密钥 免费 额度' },
    { name: 'Groq', url: 'https://groq.com/', desc: '出了名的快，跑开源模型', cat: 'API 提供商', region: 'global', key: 'groq 快 推理 api 开源模型 密钥' },
    { name: 'Mistral', url: 'https://console.mistral.ai/', desc: '欧洲的开源模型厂商', cat: 'API 提供商', region: 'global', key: 'mistral 法国 欧洲 开源模型 api 密钥' },

    { name: 'Cherry Studio', url: 'https://cherry-ai.com/', desc: '国产开源，功能给得很足', cat: '本地对话', region: 'cn', key: 'cherry studio 樱桃 客户端 国产 开源 多模型 知识库' },
    { name: 'LobeChat', url: 'https://lobehub.com/zh', desc: '界面最讲究的一个', cat: '本地对话', region: 'cn', key: 'lobe lobehub 客户端 网页 好看 插件 开源' },
    { name: 'NextChat', alias: ['ChatGPT-Next-Web'], url: 'https://nextchat.club/', desc: '轻量，一键就能部署', cat: '本地对话', region: 'cn', key: 'nextchat chatgpt-next-web 轻量 部署 客户端 开源' },
    { name: 'Open WebUI', url: 'https://openwebui.com/', desc: '自托管的 ChatGPT 替代品', cat: '本地对话', region: 'global', key: 'open webui 自托管 ollama 界面 开源 部署' },
    { name: 'Ollama', url: 'https://ollama.com/', desc: '一行命令跑本地模型', cat: '本地对话', region: 'global', key: 'ollama 本地 部署 跑模型 命令行 llama qwen 开源' },
    { name: 'LM Studio', url: 'https://lmstudio.ai/', desc: '带界面的本地模型运行器', cat: '本地对话', region: 'global', key: 'lm studio 本地 图形界面 跑模型 gguf 开源' },
    { name: 'AnythingLLM', url: 'https://anythingllm.com/', desc: '把自家文档喂给本地模型', cat: '本地对话', region: 'global', key: 'anythingllm 本地 知识库 文档 rag 离线 模型' },

    { name: 'NanaZip', url: 'https://github.com/M2Team/NanaZip', desc: '7-Zip 的 Windows 现代化版', cat: '解压压缩', region: 'global', key: 'nanazip 压缩 解压 7zip 现代 win11 国产 开源' },
    { name: 'Bandizip', url: 'https://www.bandisoft.com/bandizip/', desc: '自动识别编码，不乱码', cat: '解压压缩', region: 'global', key: 'bandizip 压缩 解压 乱码 编码 韩国 好用' },

    { name: 'OBS Studio', alias: ['OBS'], url: 'https://obsproject.com/', desc: '录屏和直播推流，不做剪辑', cat: '视频剪辑', region: 'global', key: 'obs 录屏 直播 推流 开源 免费 studio' },
    { name: 'HandBrake', url: 'https://handbrake.fr/', desc: '视频转码压缩专用', cat: '视频剪辑', region: 'global', key: 'handbrake 转码 压缩 格式转换 开源 视频' },
    { name: 'FFmpeg', url: 'https://ffmpeg.org/', desc: '命令行里的视频万金油', cat: '视频剪辑', region: 'global', key: 'ffmpeg 转码 命令行 音视频 处理 神器' },

    { name: 'GIMP', url: 'https://www.gimp.org/', desc: '免费开源的 Photoshop', cat: '图像处理', region: 'global', key: 'gimp 修图 ps 替代 开源 免费 图像处理' },
    { name: 'Krita', url: 'https://krita.org/', desc: '专为画画而生', cat: '图像处理', region: 'global', key: 'krita 绘画 插画 数位板 开源 免费 画图' },
    { name: 'Paint.NET', url: 'https://www.getpaint.net/', desc: '轻量，比画图好用得多', cat: '图像处理', region: 'global', key: 'paint.net 修图 轻量 windows 免费 图像' },
    { name: 'Affinity Photo', url: 'https://affinity.serif.com/zh-cn/photo/', desc: '买断制的修图软件', cat: '图像处理', region: 'global', key: 'affinity photo 买断 修图 ps 替代 便宜' },
    { name: 'Photopea', url: 'https://www.photopea.com/', desc: '网页版 PS，打开就能用', cat: '图像处理', region: 'global', key: 'photopea 网页 ps 在线 修图 免费 免安装 psd' },
    { name: 'Inkscape', url: 'https://inkscape.org/', desc: '开源的矢量图工具', cat: '图像处理', region: 'global', key: 'inkscape 矢量 svg 开源 免费 illustrator 替代' },
    { name: 'Figma', url: 'https://www.figma.com/', desc: '做界面设计的都在用', cat: '图像处理', region: 'global', key: 'figma ui 设计 界面 协作 原型 网页' },
    { name: 'Canva 可画', alias: ['可画'], url: 'https://www.canva.cn/', desc: '套模板就能出图', cat: '图像处理', region: 'cn', key: 'canva 可画 海报 模板 设计 在线 作图' },
    { name: '稿定设计', alias: ['稿定'], url: 'https://www.gaoding.com/', desc: '国内的在线设计工具', cat: '图像处理', region: 'cn', key: '稿定 设计 海报 抠图 模板 在线 国产' },
    { name: 'remove.bg', url: 'https://www.remove.bg/zh', desc: '一键抠图去背景', cat: '图像处理', region: 'global', key: '抠图 去背景 在线 免费 ai remove bg' },

    { name: 'WeGame', url: 'https://www.wegame.com.cn', desc: '腾讯的游戏平台', cat: '游戏平台', region: 'cn', key: 'wegame 腾讯游戏 英雄联盟 下载客户端 游戏大厅 LOL' },
    { name: 'GOG', url: 'https://www.gog.com', desc: '没有防盗版的游戏商城', cat: '游戏平台', region: 'global', key: 'gog 无drm 老游戏 经典游戏 波兰 单机' },
    { name: '杉果游戏', url: 'https://www.sonkwo.com', desc: '国内正版游戏商城', cat: '游戏平台', region: 'cn', key: '杉果 正版 折扣 国区 激活码' },
    { name: 'Humble Bundle', url: 'https://www.humblebundle.com', desc: '打包义卖，几块钱一堆游戏', cat: '游戏平台', region: 'global', key: 'humble 慈善包 打包 义卖 月包' },
    { name: '小黑盒', url: 'https://www.xiaoheihe.cn', desc: '游戏资讯与比价', cat: '游戏平台', region: 'cn', key: '小黑盒 比价 游戏资讯 社区 库存' },
    { name: 'Fanatical', url: 'https://www.fanatical.com', desc: '折扣游戏兑换码商城', cat: '游戏平台', region: 'global', key: 'fanatical 折扣 key 兑换码 steam key' },
    { name: 'Xbox 商店', url: 'https://www.xbox.com/zh-CN/', desc: 'PC Game Pass 订阅制', cat: '游戏平台', region: 'global', key: 'xbox 微软 主机 gamepass 会员 游戏下载 商店 xgp' },
    { name: 'PlayStation Store', url: 'https://store.playstation.com/zh-hans-cn/', desc: '索尼主机游戏商城', cat: '游戏平台', region: 'global', key: 'ps ps5 索尼 主机 游戏 商店 playstation' },
    { name: 'Nintendo eShop', url: 'https://www.nintendo.com/', desc: 'Switch 游戏商城', cat: '游戏平台', region: 'global', key: '任天堂 switch 塞尔达 马力欧 商店 主机 游戏' },
    { name: '暴雪战网', url: 'https://www.blizzard.com/zh-cn/', desc: '魔兽世界、守望先锋', cat: '游戏平台', region: 'global', key: 'battle.net 暴雪 魔兽 守望先锋 炉石传说 暗黑破坏神 下载' },
    { name: 'Ubisoft Connect', url: 'https://www.ubisoft.com/zh-cn/', desc: '育碧自家平台', cat: '游戏平台', region: 'global', key: '育碧 刺客信条 彩虹六号 孤岛惊魂 下载 uplay' },
    { name: 'EA App', url: 'https://www.ea.com/zh-cn', desc: 'EA 自家平台', cat: '游戏平台', region: 'global', key: 'ea fifa 战地 极品飞车 模拟人生 下载 origin' },

    /* 更多 Agent 工具：和主页那个「AI Agent」分类合并展示（cat 名字保持一致即可） */
    { name: 'TRAE', url: 'https://www.trae.com.cn/', desc: '字节的 AI 编程 IDE', cat: 'AI Agent', region: 'cn', key: 'AI 编程 ide 智能体 agent 写代码 字节 trae 自动补全' },
    { name: '通义灵码', url: 'https://lingma.aliyun.com/', desc: '阿里的编程助手', cat: 'AI Agent', region: 'cn', key: 'AI 编程 代码助手 agent 智能体 阿里 通义灵码 补全' },
    { name: '文心快码', alias: ['Comate'], url: 'https://comate.baidu.com/', desc: '百度的编程助手', cat: 'AI Agent', region: 'cn', key: 'AI 编程 代码助手 agent 智能体 百度 文心快码 comate' },
    { name: '扣子 Coze', alias: ['Coze'], url: 'https://coze.cn/', desc: '搭自己的 AI 智能体', cat: 'AI Agent', region: 'cn', key: 'AI agent 智能体 搭建 bot 工作流 字节 扣子 coze 自动化' },
    { name: 'Qoder', url: 'https://qoder.com/', desc: '阿里的 AI 原生 IDE', cat: 'AI Agent', region: 'cn', key: 'AI 编程 ide agent 智能体 阿里 qoder 原生' },
    { name: 'Cursor', url: 'https://cursor.com/', desc: '国外最火的 AI 编辑器', cat: 'AI Agent', region: 'global', key: 'AI 编程 编辑器 ide agent 智能体 cursor 补全' },
    { name: 'Manus', url: 'https://manus.im/', desc: '能自己干活的通用智能体', cat: 'AI Agent', region: 'global', key: 'AI agent 智能体 通用 自动化 任务 manus 自主' },
    { name: 'Claude Code', url: 'https://www.anthropic.com/claude-code', desc: 'Anthropic 的终端 Agent', cat: 'AI Agent', region: 'global', key: 'AI 编程 命令行 agent 智能体 claude code anthropic 终端 克劳德' },
    { name: 'OpenClaw', url: 'https://openclaw.ai/', desc: '能直接操作电脑的开源 Agent', cat: 'AI Agent', region: 'global', key: 'AI agent 智能体 开源 自动化 本地 电脑控制 openclaw 龙虾' },
    { name: 'GitHub Copilot', url: 'https://github.com/features/copilot', desc: 'GitHub 的编程助手', cat: 'AI Agent', region: 'global', key: 'AI 编程 代码补全 agent copilot github 智能体' },
    { name: 'Devin', url: 'https://devin.ai/', desc: '能自己写完一个项目的 Agent', cat: 'AI Agent', region: 'global', key: 'AI 编程 agent 智能体 自主 devin 工程师 全自动' },
    { name: 'Windsurf', url: 'https://windsurf.com/', desc: 'AI 原生的代码编辑器', cat: 'AI Agent', region: 'global', key: 'AI 编程 ide agent 智能体 编辑器 windsurf codeium' },
    { name: 'Cline', url: 'https://cline.bot/', desc: '装在编辑器里的开源 Agent', cat: 'AI Agent', region: 'global', key: 'AI 编程 agent 智能体 开源 插件 cline vscode' },
    { name: 'OpenHands', url: 'https://www.all-hands.dev/', desc: '开源的全能开发 Agent', cat: 'AI Agent', region: 'global', key: 'AI 编程 agent 智能体 开源 openhands 开发 自主' },

    /* 国外 AI 助手：官网主页地址，不是对话页 —— 和国内那几个一样，认准域名 */
    { name: 'ChatGPT', url: 'https://openai.com/', desc: 'OpenAI 的对话助手', cat: 'AI 对话', region: 'global', key: 'AI 对话 人工智能 openai 聊天 gpt chatgpt 写作' },
    { name: 'Gemini', url: 'https://gemini.google.com/', desc: 'Google 的 AI 助手', cat: 'AI 对话', region: 'global', key: 'AI 对话 人工智能 google 谷歌 gemini 多模态' },
    { name: 'Claude', url: 'https://claude.ai/', desc: 'Anthropic 的 AI 助手', cat: 'AI 对话', region: 'global', key: 'AI 对话 人工智能 anthropic 克劳德 claude 写作 长文' },
    { name: 'Grok', url: 'https://grok.com/', desc: 'xAI 的 AI 助手', cat: 'AI 对话', region: 'global', key: 'AI 对话 人工智能 xai 马斯克 grok 实时' },
    { name: 'Microsoft Copilot', url: 'https://copilot.microsoft.com/', desc: '微软的 AI 助手', cat: 'AI 对话', region: 'global', key: 'AI 对话 人工智能 微软 microsoft copilot bing 必应' },
    { name: 'Perplexity', url: 'https://www.perplexity.ai/', desc: '会给出处的 AI 搜索', cat: 'AI 对话', region: 'global', key: 'AI 搜索 问答 人工智能 perplexity 引用 来源 查资料' }
  ],

  /* ------------------------------------------------------------
   *  第三档 · 只保留网址
   *  这些站点的官网在搜索引擎里通常就排在第一，不需要我们教用户去哪儿；
   *  所以我们只留一个网址 + 关键词，不配图标、不写介绍。
   *  它们不会出现在「全部网站」页，只有当用户在搜索框里打出相关词
   *  （例如「网盘」「听歌」「买票」）时，才会作为搜索结果出现。
   * ------------------------------------------------------------ */
  urls: [
    /* 网盘 / 下载 */
    { name: '百度网盘', url: 'https://pan.baidu.com', key: '网盘 云盘 云存储 存文件 备份 分享 资源' },
    { name: '阿里云盘', url: 'https://www.alipan.com', key: '网盘 云盘 云存储 存文件 不限速 备份' },
    { name: '夸克网盘', url: 'https://pan.quark.cn', key: '网盘 云盘 云存储 存文件 夸克 备份' },
    { name: '腾讯微云', url: 'https://www.weiyun.com', key: '网盘 云盘 云存储 存文件 备份' },
    { name: '天翼云盘', url: 'https://cloud.189.cn', key: '网盘 云盘 云存储 电信 存文件' },
    { name: '115 网盘', url: 'https://115.com', key: '网盘 云盘 云存储 存文件 离线' },
    { name: '迅雷', url: 'https://www.xunlei.com', key: '下载 网盘 磁力 种子 bt 云盘 加速' },
    { name: '360 安全卫士', url: 'https://www.360.cn', key: '杀毒 安全 软件 下载 清理' },

    /* 视频 */
    { name: '哔哩哔哩', url: 'https://www.bilibili.com', key: 'B站 小破站 弹幕 看视频 追番 学习 动画' },
    { name: '腾讯视频', url: 'https://v.qq.com', key: '看剧 电视剧 综艺 电影 追剧 视频' },
    { name: '爱奇艺', url: 'https://www.iqiyi.com', key: '看剧 追剧 综艺 电影 视频 iqiyi 奇异果' },
    { name: '优酷', url: 'https://www.youku.com', key: '看剧 追剧 综艺 电影 视频 youku 土豆' },
    { name: '芒果TV', url: 'https://www.mgtv.com', key: '综艺 看剧 湖南卫视 视频 综艺节目' },
    { name: '抖音网页版', url: 'https://www.douyin.com', key: '短视频 刷视频 电脑刷抖音 douyin' },

    /* 音乐 */
    { name: 'QQ音乐', url: 'https://y.qq.com', key: '听歌 音乐 在线听歌 歌曲 歌单 腾讯音乐' },
    { name: '网易云音乐', url: 'https://music.163.com', key: '听歌 音乐 歌单 评论 网易云 歌曲' },
    { name: '酷狗音乐', url: 'https://www.kugou.com', key: '听歌 音乐 歌曲 kugou 在线听歌' },
    { name: '咪咕音乐', url: 'https://music.migu.cn', key: '听歌 音乐 正版曲库 移动 歌曲' },

    /* 学习 / 知识 */
    { name: '中国大学MOOC', url: 'https://www.icourse163.org', key: '网课 公开课 大学课程 学习 慕课 网易 自学' },
    { name: '学堂在线', url: 'https://www.xuetangx.com', key: '网课 在线课程 学习 清华 自学' },
    { name: '网易公开课', url: 'https://open.163.com', key: '公开课 讲座 纪录片 学习 自学' },
    { name: '知乎', url: 'https://www.zhihu.com', key: '问答 提问 回答 知识 社区 求助' },
    { name: '百度百科', url: 'https://baike.baidu.com', key: '百科 词条 资料 查资料 科普' },
    { name: '豆瓣', url: 'https://www.douban.com', key: '书影音 评分 影评 书评 打分 小组' },

    /* 购物 / 生活 */
    { name: '淘宝', url: 'https://www.taobao.com', key: '购物 买东西 网购 天猫 买' },
    { name: '京东', url: 'https://www.jd.com', key: '购物 买东西 网购 自营 快递 jd' },
    { name: '拼多多', url: 'https://www.pinduoduo.com', key: '购物 买东西 网购 拼团 pdd 便宜' },
    { name: '美团', url: 'https://www.meituan.com', key: '外卖 点餐 团购 本地生活 酒店 订餐' },
    { name: '饿了么', url: 'https://www.ele.me', key: '外卖 点餐 送餐 订餐' },
    { name: '闲鱼', url: 'https://www.goofish.com', key: '二手 转卖 卖东西 闲置 淘二手' },

    /* 社区 / 资讯 */
    { name: '微博', url: 'https://weibo.com', key: '热搜 热点 新闻 社交 微博 weibo' },
    { name: '小红书', url: 'https://www.xiaohongshu.com', key: '攻略 种草 笔记 生活 分享 旅游攻略' },
    { name: '百度贴吧', url: 'https://tieba.baidu.com', key: '社区 论坛 兴趣 贴吧 求助' },
    { name: 'IT之家', url: 'https://www.ithome.com', key: '科技 数码 资讯 新闻 手机' },
    { name: '少数派', url: 'https://sspai.com', key: '效率 软件 推荐 好物 数码 教程' },
    { name: '米游社', url: 'https://www.miyoushe.com', key: '米哈游 原神 崩坏 星穹铁道 游戏社区' },

    /* 办公 */
    { name: '腾讯文档', url: 'https://docs.qq.com', key: '在线文档 表格 协作 文档 办公' },
    { name: '金山文档', url: 'https://www.kdocs.cn', key: '在线文档 表格 协作 wps 办公' },
    { name: '石墨文档', url: 'https://shimo.im', key: '在线文档 协作 文档 办公' },

    /* 常用工具 */
    { name: '百度', url: 'https://www.baidu.com', key: '搜索 搜索引擎 查资料 百度一下' },
    { name: '必应搜索', url: 'https://cn.bing.com', key: '搜索 搜索引擎 国际 查资料 bing' },
    { name: '百度翻译', url: 'https://fanyi.baidu.com', key: '翻译 中英翻译 英文 翻中文 词典' },
    { name: '百度地图', url: 'https://map.baidu.com', key: '地图 导航 路线 查路 位置' },
    { name: '12306', url: 'https://www.12306.cn', key: '火车票 高铁票 买票 订票 铁路' }
  ]
};
