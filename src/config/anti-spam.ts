// 反垃圾广告配置
// 在这里添加广告关键词，匹配到的评论将被隐藏

export interface AntiSpamConfig {
  // 是否启用反垃圾
  enabled: boolean;
  // 关键词黑名单（支持正则表达式字符串）
  keywords: string[];
  // 重复内容阈值（相同内容出现次数超过此值视为广告）
  duplicateThreshold: number;
  // 链接数量阈值（评论中包含超过此数量的链接视为广告）
  maxLinks: number;
  // 举报后自动隐藏
  autoHideOnReport: boolean;
}

export const antiSpamConfig: AntiSpamConfig = {
  enabled: true,
  keywords: [
    // 常见广告关键词
    '加微信',
    '加QQ',
    '加q',
    '微信号',
    'qq号',
    'QQ群',
    '微信群',
    '扫码',
    '二维码',
    '优惠券',
    '返利',
    '赚钱',
    '兼职',
    '刷单',
    '代购',
    '代理',
    '招商',
    '加盟',
    '贷款',
    '信用卡',
    '套现',
    '博彩',
    '彩票',
    '赌博',
    '色情',
    '裸聊',
    '约炮',
    '上门服务',
    '特殊服务',
    'VPN',
    '梯子',
    '翻墙',
    '加速器',
    '免费领',
    '免费送',
    '点击领取',
    '限时优惠',
    '内部价',
    '白菜价',
    '1元购',
    '0元购',
    '秒到账',
    '日入',
    '月入',
    '轻松赚',
    '躺赚',
    '暴利',
    '稳赚',
    '包赚',
    '投资',
    '理财',
    '数字货币',
    '比特币',
    '以太坊',
    '区块链',
    '挖矿',
    '空投',
    '薅羊毛',
    '线报',
    '漏洞',
    'bug价',
    '点击链接',
    '查看主页',
    '个人主页',
    '关注我',
    '互粉',
    '互关',
    '引流',
    '推广',
    '营销',
    '广告合作',
    '商务合作',
    '请联系',
    '联系我',
    '咨询',
    '购买',
    '出售',
    '转让',
    '出号',
    '卖号',
    '租号',
    '代练',
    '代打',
    '外挂',
    '辅助',
    '脚本',
    '破解',
    '盗版',
    '资源站',
    '网盘',
    '百度云',
    '阿里云盘',
    '迅雷',
    '磁力',
    '种子',
    'torrent',
    // 英文广告
    'earn money',
    'make money',
    'get rich',
    'work from home',
    'click here',
    'buy now',
    'limited time',
    'act now',
    'free gift',
    'congratulations',
    'you won',
    'winner',
    'casino',
    'lottery',
    'viagra',
    'cialis',
    'weight loss',
    'diet pill',
    'debt',
    'loan',
    'credit card',
    'mlm',
    'pyramid',
    'investment opportunity',
    'double your',
    'guaranteed',
    'risk free',
    'no obligation',
    'order now',
    'call now',
    '100% free',
    'act immediately',
    'urgent',
    'hidden charges',
    'no experience',
    'no skill',
  ],
  duplicateThreshold: 3,
  maxLinks: 3,
  autoHideOnReport: true,
};

// 检测评论是否为广告
export function isSpam(content: string, author?: string): boolean {
  if (!antiSpamConfig.enabled) return false;
  
  const lowerContent = content.toLowerCase();
  
  // 检测关键词
  for (const keyword of antiSpamConfig.keywords) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  
  // 检测链接数量
  const linkMatches = content.match(/https?:\/\/|www\.|\.com|\.cn|\.net|\.org/gi);
  if (linkMatches && linkMatches.length > antiSpamConfig.maxLinks) {
    return true;
  }
  
  // 检测联系方式（微信、QQ等）
  const contactPatterns = [
    /微信[：:]?\s*[a-zA-Z0-9_-]+/i,
    /wx[：:]?\s*[a-zA-Z0-9_-]+/i,
    /qq[：:]?\s*\d{5,11}/i,
    /q[：:]?\s*\d{5,11}/i,
    /群[：:]?\s*\d{5,11}/i,
    /电话[：:]?\s*\d{7,11}/i,
    /手机[：:]?\s*\d{11}/i,
    /\b1[3-9]\d{9}\b/,
  ];
  
  for (const pattern of contactPatterns) {
    if (pattern.test(content)) {
      return true;
    }
  }
  
  return false;
}

// 过滤评论列表
export function filterComments<T extends { content: string; author?: string }>(
  comments: T[]
): T[] {
  return comments.filter(comment => !isSpam(comment.content, comment.author));
}

// 获取被过滤的原因
export function getSpamReason(content: string): string {
  const lowerContent = content.toLowerCase();
  
  for (const keyword of antiSpamConfig.keywords) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      return `包含敏感词: ${keyword}`;
    }
  }
  
  const linkMatches = content.match(/https?:\/\/|www\.|\.com|\.cn|\.net|\.org/gi);
  if (linkMatches && linkMatches.length > antiSpamConfig.maxLinks) {
    return `链接数量过多 (${linkMatches.length} 个)`;
  }
  
  return '疑似垃圾内容';
}
