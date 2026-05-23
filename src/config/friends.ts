// 友站链接配置
// 在这里添加友站链接

export interface FriendLink {
  name: string;
  url: string;
  description?: string;
}

export const friendLinks: FriendLink[] = [
  {
    name: '示例友站',
    url: 'https://example.com',
    description: '这是一个示例友站',
  },
  // 在这里添加更多友站
  // {
  //   name: '友站名称',
  //   url: 'https://friend-site.com',
  //   description: '友站描述',
  // },
];
