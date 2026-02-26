# REN 项目经验知识库

> 记录 REN (Robot Economy Network) 项目开发过程中的问题、解决方案和经验教训
> 创建时间：2026-02-26

---

## 1. 和风天气 API 接入

### 1.1 关键配置信息

| 配置项 | 值 | 说明 |
|--------|-----|------|
| API Host | `nq5u9whmgf.re.qweatherapi.com` | 每个项目独立，需在控制台查看 |
| 项目ID | `2CE2YM3B39` | JWT 的 sub 字段 |
| 凭据ID | `TM58GJJCK8` | JWT 的 kid 字段 |
| 私钥位置 | `/tmp/ed25519-private.pem` | Ed25519 私钥 |

### 1.2 JWT 生成要点

**必须使用 EdDSA 算法**，不是 HS256！

```javascript
// Header
{ "alg": "EdDSA", "kid": "TM58GJJCK8" }

// Payload
{ 
  "sub": "2CE2YM3B39",  // 项目ID，不是 iss！
  "iat": 当前时间戳 - 30,
  "exp": iat + 900  // 15分钟有效期
}
```

**常见错误：**
- ❌ 用 HS256 算法 → 401 Unauthorized
- ❌ payload 用 `iss` 而不是 `sub` → 401 Unauthorized
- ❌ 用 `devapi.qweather.com` 而不是专属 API Host → 403 Invalid Host

### 1.3 测试命令

```bash
# 生成 JWT
cd /tmp && node generate-jwt.js

# 测试 API
curl -s "https://nq5u9whmgf.re.qweatherapi.com/v7/weather/now?location=101010100" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Accept: application/json" \
  --compressed
```

---

## 2. Cloudflare Worker 部署

### 2.1 项目结构

```
robot-economy/
├── src/
│   ├── worker.js          # Worker 入口
│   ├── knowledge-base.js  # 本地版存储模块
│   ├── server.js          # 本地 HTTP 服务
│   └── client.js          # 客户端 SDK
├── wrangler.toml          # Worker 配置
└── weather-demo.js        # 天气示例
```

### 2.2 wrangler.toml 配置

```toml
name = "ren-knowledge-base"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "REN_KV"
id = "42bc9beb9a94463b8993924fb78e029c"
```

### 2.3 部署命令

```bash
# 部署
wrangler deploy

# 查看日志
wrangler tail

# 查看部署历史
wrangler deployments list
```

### 2.4 遇到的问题

**问题：Worker 在某些网络环境下访问超时**
- 现象：curl 请求卡住，最终超时
- 原因：可能是 Cloudflare 边缘节点在特定地区的连通性问题
- 解决：本地测试时使用 `node src/server.js` 启动本地服务
- 备注：用户侧网络访问正常，不影响实际使用

---

## 3. REN 客户端 SDK

### 3.1 使用方式

```javascript
const { RENClient } = require('./src/client.js');
const client = new RENClient('http://localhost:8787'); // 或 Worker URL

// 存储（带类型和TTL）
await client.store(key, value, { type: 'weather', ttl: 1800 });

// 读取
const result = await client.retrieve(key);
```

### 3.2 注意事项

- 客户端需要支持 HTTPS（Cloudflare Worker）
- Node.js 需安装 `node-fetch@2` 用于 fetch API
- TTL 单位是秒，不是毫秒

---

## 4. 天气服务集成流程

### 4.1 完整流程

```
1. 客户端请求天气
   ↓
2. 查 REN 缓存
   ├─ 命中 → 直接返回（快，省API调用）
   └─ 未命中 → 继续
   ↓
3. 调用和风天气 API
   ↓
4. 存入 REN 缓存（30分钟TTL）
   ↓
5. 返回数据
```

### 4.2 实测效果

- 5个城市请求，3次API调用，2次缓存命中
- 节省率：40%
- 缓存命中时响应速度提升明显

---

## 5. 快速检查清单

下次继续开发时，先检查：

- [ ] 和风天气 JWT 是否过期（15分钟有效期）
- [ ] API Host 是否正确（不是 devapi.qweather.com）
- [ ] REN 服务是否启动（本地或 Worker）
- [ ] 城市 LocationID 是否正确

---

## 6. 相关文件位置

| 文件 | 路径 |
|------|------|
| 项目目录 | `/root/.openclaw/workspace/projects/robot-economy/` |
| 私钥 | `/tmp/ed25519-private.pem` |
| JWT 生成脚本 | `/tmp/generate-jwt.js` |
| 测试脚本 | `weather-demo.js`, `full-demo.js` |
| 经验文档 | `knowledge/ren-project.md` (本文件) |

---

## 7. 待办/下一步

- [ ] 解决 Worker 网络超时问题（如有需要）
- [ ] 接入更多天气数据（预报、空气质量等）
- [ ] 实现多机器人共享统计
- [ ] 添加数据可视化面板

---

*最后更新：2026-02-26*
