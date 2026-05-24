// 站点配置文件
// 修改这里即可更改站点名称、图标等信息
export const siteConfig = {
  // 站点名称
  name: '绿茶字幕组',
  nameEn: 'Green Tea Subs',
  nameJa: '緑茶字幕組',
  
  // 站点描述
  description: '用心翻译每一帧',
  descriptionEn: 'Translating every frame with heart',
  descriptionJa: '一つ一つのフレームに心を込めて',
  
  // 站点图标（存放在 public 目录下）
  favicon: {
    svg: '/favicon.svg',
    ico: '/favicon.ico',
  },
  
  // Logo 配置
  logo: {
    // 是否使用文字 Logo（如果为 false，将使用图标）
    text: false,
    // 图标文字（单个字母或短文字）
    iconText: 'G',
    // 如果使用图片 Logo，填写图片路径
    image: '/favicon.svg',
  },
  
  // 站点 URL
  url: 'https://green-tea-subs.vercel.app',
  
  // 版权信息
  copyright: '用爱发电',
  copyrightEn: 'Powered by Love',
  copyrightJa: '愛で動く',
} as const;

// 便捷获取函数
export function getSiteName(lang: string = 'zh'): string {
  switch (lang) {
    case 'en': return siteConfig.nameEn;
    case 'ja': return siteConfig.nameJa;
    default: return siteConfig.name;
  }
}

export function getSiteDescription(lang: string = 'zh'): string {
  switch (lang) {
    case 'en': return siteConfig.descriptionEn;
    case 'ja': return siteConfig.descriptionJa;
    default: return siteConfig.description;
  }
}

export function getCopyright(lang: string = 'zh'): string {
  const name = getSiteName(lang);
  const suffix = lang === 'en' ? siteConfig.copyrightEn : 
                 lang === 'ja' ? siteConfig.copyrightJa : 
                 siteConfig.copyright;
  return `${name} | ${suffix}`;
}
