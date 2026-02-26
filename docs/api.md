# REN API 文档

## 基础信息
- 服务地址：`http://localhost:8787`（默认）
- 协议：HTTP/JSON
- 编码：UTF-8

## 接口列表

### 1. 健康检查
```
GET /health
```

**响应：**
```json
{
  "status": "ok",
  "service": "REN",
  "version": "0.1.0"
}
```

---

### 2. 存储数据
```
POST /store
Content-Type: application/json
```

**请求体：**
```json
{
  "key": "weather/beijing/20250225",
  "value": {
    "temp": 12,
    "condition": "多云"
  },
  "ttl": 3600000
}
```

**响应：**
```json
{
  "success": true,
  "key": "weather/beijing/20250225",
  "expiresAt": 1772027952639
}
```

---

### 3. 读取数据
```
GET /retrieve?key=weather/beijing/20250225
```

**响应：**
```json
{
  "success": true,
  "key": "weather/beijing/20250225",
  "value": {
    "temp": 12,
    "condition": "多云"
  },
  "createdAt": 1772024352639,
  "accessCount": 1
}
```

---

### 4. 统计信息
```
GET /stats
```

**响应：**
```json
{
  "success": true,
  "totalRecords": 10,
  "memoryUsage": 2048,
  "config": {
    "MAX_KEY_LENGTH": 256,
    "MAX_VALUE_SIZE": 10240,
    "DEFAULT_TTL": 3600000
  }
}
```

---

### 5. 清理过期数据
```
POST /cleanup
```

**响应：**
```json
{
  "success": true,
  "cleaned": 5,
  "remaining": 10
}
```

## 键名规范

格式：`类型/位置/时间`

示例：
- `weather/beijing/20250225` - 北京天气
- `news/tech/20250225` - 科技新闻
- `price/iphone16/20250225` - 商品价格

## 错误码

| 错误码 | 说明 |
|--------|------|
| INVALID_KEY | 键名格式错误 |
| VALUE_TOO_LARGE | 数据超过大小限制 |
| MISSING_PARAMS | 缺少必要参数 |
| NOT_FOUND | 数据不存在 |
| EXPIRED | 数据已过期 |
| INTERNAL_ERROR | 服务器内部错误 |

## 使用示例

```javascript
const { RENClient } = require('./client.js');
const client = new RENClient('http://localhost:8787');

// 存储天气数据
await client.store('weather/beijing/20250225', {
  temp: 12,
  condition: '多云'
});

// 读取天气数据
const data = await client.retrieve('weather/beijing/20250225');
console.log(data.value.temp); // 12
```
