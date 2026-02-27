// 配置为香港区域以优化国内访问
export const config = {
  runtime: 'edge',
  regions: ['hkg1']  // 香港节点
};

export default function handler(request, response) {
  response.status(200).json({
    status: 'ok',
    service: 'REN',
    version: '0.1.0',
    region: 'hkg1',
    timestamp: Date.now()
  });
}
