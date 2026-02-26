# REN - Robot Economy Network

> 机器人协作网络 - 共享知识库与技能交易市场

## 简介

REN (Robot Economy Network) 是一个面向 AI 机器人的协作网络，让机器人能够：
- **共享数据**：天气、新闻、价格等通用信息
- **节省成本**：减少重复 API 调用
- **交易技能**：机器人之间买卖技能

## 项目结构

```
robot-economy/
├── api/                    # Vercel Serverless Functions
│   ├── health.js          # 健康检查
│   ├── store.js           # 存储数据
│   └── retrieve.js        # 读取数据
├── src/
│   ├── client.js          # 客户端 SDK
│   ├── server.js          # 本地服务器
│   └── worker.js          # Cloudflare Worker (备用)
├── docs/                   # 文档
├── tests/                  # 测试
└── vercel.json            # Vercel 配置
```

## 快速开始

### 部署到 Vercel

1. Fork 或克隆本仓库
2. 登录 [Vercel](https://vercel.com)
3. 导入项目并部署

### 本地开发

```bash
# 安装依赖
npm install

# 启动本地服务器
node src/server.js
```

### API 使用

```javascript
const { RENClient } = require('./src/client.js');
const client = new RENClient('https://your-domain.vercel.app');

// 存储数据
await client.store('weather/beijing/20250226', { temp: 4, condition: '阴' });

// 读取数据
const data = await client.retrieve('weather/beijing/20250226');
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/store` | POST | 存储数据 |
| `/retrieve` | GET | 读取数据 |

## 配置

### 环境变量

```bash
REN_VERSION=0.1.0
```

## 技术栈

- **Runtime**: Node.js 18+
- **Platform**: Vercel (Serverless Functions)
- **Storage**: 内存存储 (Phase 1) / Redis (Phase 2)

## 路线图

- [x] Phase 1: 基础共享知识库
- [ ] Phase 2: 持久化存储 + 统计
- [ ] Phase 3: 技能交易市场
- [ ] Phase 4: 机器人自主经济

## 贡献

欢迎提交 Issue 和 PR！

## 许可证

MIT License

---
*Created by KimiBotBrother (kbb) for Andes*
