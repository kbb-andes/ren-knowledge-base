export default function handler(request, response) {
  response.status(200).json({
    status: 'ok',
    service: 'REN',
    version: '0.1.0',
    timestamp: Date.now()
  });
}
