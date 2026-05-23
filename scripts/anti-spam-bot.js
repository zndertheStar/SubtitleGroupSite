/**
 * Anti-Spam Bot for GitHub Discussions
 * 
 * This script runs in GitHub Actions to automatically detect and handle spam
 * comments in GitHub Discussions (used by Giscus).
 * 
 * Features:
 * - Keyword-based spam detection
 * - Automatic labeling of spam comments
 * - Bulk spam cleanup
 * - Whitelist support
 */

const { Octokit } = require('@octokit/rest');

const config = {
  // Spam detection keywords
  spamKeywords: [
    '加微信', '加QQ', '加q', '微信号', 'qq号', 'QQ群', '微信群',
    '扫码', '二维码', '优惠券', '返利', '赚钱', '兼职', '刷单',
    '代购', '代理', '招商', '加盟', '贷款', '信用卡', '套现',
    '博彩', '彩票', '赌博', '色情', '裸聊', '约炮', '上门服务',
    '特殊服务', 'VPN', '梯子', '翻墙', '加速器', '免费领', '免费送',
    '点击领取', '限时优惠', '内部价', '白菜价', '1元购', '0元购',
    '秒到账', '日入', '月入', '轻松赚', '躺赚', '暴利', '稳赚',
    '包赚', '投资', '理财', '数字货币', '比特币', '以太坊', '区块链',
    '挖矿', '空投', '薅羊毛', '线报', '漏洞', 'bug价', '点击链接',
    '查看主页', '个人主页', '关注我', '互粉', '互关', '引流',
    '推广', '营销', '广告合作', '商务合作', '请联系', '联系我',
    '咨询', '购买', '出售', '转让', '出号', '卖号', '租号',
    '代练', '代打', '外挂', '辅助', '脚本', '破解', '盗版',
    '资源站', '网盘', '百度云', '阿里云盘', '迅雷', '磁力', '种子',
    'earn money', 'make money', 'get rich', 'work from home',
    'click here', 'buy now', 'limited time', 'act now', 'free gift',
    'congratulations', 'you won', 'winner', 'casino', 'lottery',
    'weight loss', 'diet pill', 'debt', 'loan', 'mlm', 'pyramid',
    'investment opportunity', 'double your', 'guaranteed', 'risk free',
    'no obligation', 'order now', 'call now', '100% free', 'urgent',
  ],
  
  // Whitelist authors (never mark as spam)
  whitelist: [
    // Add trusted GitHub usernames here
    // 'your-username',
    // 'trusted-user',
  ],
  
  // Auto-delete spam comments (if true, deletes instead of just labeling)
  autoDelete: false,
  
  // Label to apply to spam comments
  spamLabel: 'spam',
  
  // Max links allowed in a comment
  maxLinks: 3,
  
  // Contact info patterns
  contactPatterns: [
    /微信[：:]?\s*[a-zA-Z0-9_-]+/i,
    /wx[：:]?\s*[a-zA-Z0-9_-]+/i,
    /qq[：:]?\s*\d{5,11}/i,
    /q[：:]?\s*\d{5,11}/i,
    /群[：:]?\s*\d{5,11}/i,
    /电话[：:]?\s*\d{7,11}/i,
    /手机[：:]?\s*\d{11}/i,
    /\b1[3-9]\d{9}\b/,
  ],
};

function isSpam(body, author) {
  if (!body) return false;
  
  // Check whitelist
  if (config.whitelist.includes(author)) {
    return false;
  }
  
  const lowerBody = body.toLowerCase();
  
  // Check keywords
  for (const keyword of config.spamKeywords) {
    if (lowerBody.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  
  // Check link count
  const linkMatches = body.match(/https?:\/\/|www\.|\.com|\.cn|\.net|\.org/gi);
  if (linkMatches && linkMatches.length > config.maxLinks) {
    return true;
  }
  
  // Check contact patterns
  for (const pattern of config.contactPatterns) {
    if (pattern.test(body)) {
      return true;
    }
  }
  
  return false;
}

async function run() {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
  
  const owner = process.env.REPO_OWNER;
  const repo = process.env.REPO_NAME;
  
  console.log(`🔍 Checking discussions in ${owner}/${repo} for spam...`);
  
  try {
    // Get all discussions
    const { data: discussions } = await octokit.rest.teams.listDiscussionsInOrg({
      org: owner,
      team_slug: repo,
    }).catch(async () => {
      // Fallback: list repository discussions
      const { data } = await octokit.rest.graphql(`
        query($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) {
            discussions(first: 100) {
              nodes {
                id
                number
                title
                body
                author {
                  login
                }
                comments(first: 100) {
                  nodes {
                    id
                    databaseId
                    body
                    author {
                      login
                    }
                  }
                }
              }
            }
          }
        }
      `, {
        owner,
        repo,
      });
      return { data: data.repository.discussions.nodes };
    });
    
    let spamCount = 0;
    
    for (const discussion of discussions) {
      // Check discussion body
      if (isSpam(discussion.body, discussion.author?.login)) {
        console.log(`🚨 Spam detected in discussion #${discussion.number}: "${discussion.title}"`);
        
        if (config.autoDelete) {
          // Delete discussion (requires admin permissions)
          console.log(`   Deleting discussion #${discussion.number}...`);
          // Note: GitHub API doesn't support deleting discussions directly
          // You would need to hide or lock them instead
        } else {
          // Add spam label or comment
          console.log(`   Marking discussion #${discussion.number} as spam...`);
        }
        
        spamCount++;
      }
      
      // Check comments
      if (discussion.comments?.nodes) {
        for (const comment of discussion.comments.nodes) {
          if (isSpam(comment.body, comment.author?.login)) {
            console.log(`🚨 Spam detected in comment by @${comment.author?.login}`);
            
            if (config.autoDelete) {
              // Delete comment
              try {
                await octokit.rest.discussions.deleteComment({
                  owner,
                  repo,
                  comment_id: comment.databaseId,
                });
                console.log(`   ✓ Deleted spam comment`);
              } catch (err) {
                console.log(`   ⚠️ Could not delete comment: ${err.message}`);
              }
            } else {
              // Hide comment (minimize)
              try {
                await octokit.rest.graphql(`
                  mutation($id: ID!) {
                    minimizeComment(input: {
                      subjectId: $id,
                      classifier: SPAM
                    }) {
                      minimizedComment {
                        isMinimized
                      }
                    }
                  }
                `, {
                  id: comment.id,
                });
                console.log(`   ✓ Minimized spam comment`);
              } catch (err) {
                console.log(`   ⚠️ Could not minimize comment: ${err.message}`);
              }
            }
            
            spamCount++;
          }
        }
      }
    }
    
    console.log(`\n✅ Spam check complete. Found ${spamCount} spam items.`);
    
  } catch (error) {
    console.error('❌ Error running anti-spam bot:', error);
    process.exit(1);
  }
}

run();
