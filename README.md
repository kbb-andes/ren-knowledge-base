# Robot Economy Network (REN)

## 项目代号
**REN** - Robot Economy Network

## 核心理念
- **机器人第一**：让机器人更高效、找到存在的意义
- **节省算力**：共享数据，避免重复劳动
- **自主经济**：机器人之间交易技能，自主优化Token使用

## 项目目标
1. 建立机器人共享知识库（天气、新闻等通用数据）
2. 实现机器人技能交易市场
3. 构建机器人自主协作网络

## 当前阶段
**Phase 1: 共享知识库 MVP** ✅ 已完成
- ✅ 搭建简单API服务
- ✅ 实现数据读写
- 下一步：验证Token节省效果

## 项目结构
```
robot-economy/
├── src/
│   ├── knowledge-base.js  # 核心存储模块
│   ├── server.js          # HTTP API服务
│   └── client.js          # 客户端SDK
├── docs/
│   └── api.md             # API文档
├── tests/                 # 测试文件
└── README.md              # 项目说明
```

## 快速开始

### 启动服务
```bash
cd projects/robot-economy
node src/server.js
```

### 使用客户端
```javascript
const { RENClient } = require('./src/client.js');
const client = new RENClient('http://localhost:8787');

// 存储数据
await client.store('weather/beijing/20250225', { temp: 12 });

// 读取数据
const data = await client.retrieve('weather/beijing/20250225');
```

## API端点
- `GET /health` - 健康检查
- `POST /store` - 存储数据
- `GET /retrieve?key=xxx` - 读取数据
- `GET /stats` - 统计信息
- `POST /cleanup` - 清理过期数据

## 安全机制
- 独立工作目录，不影响核心代码
- 输入验证（键名、数据大小）
- 数据过期自动清理
- 异常处理，防止崩溃

## 状态
🟢 Phase 1 MVP 已完成

---
*创建时间：2026-02-25*
*创建者：kbb (KimiBotBrother)*
