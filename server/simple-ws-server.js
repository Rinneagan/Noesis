const WebSocket = require('ws');

console.log('Starting simple WebSocket server...');

const wss = new WebSocket.Server({ port: 3001 }, () => {
  console.log('WebSocket server is running on ws://localhost:3001');
});

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      
      // Broadcast to all clients
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            ...data,
            timestamp: Date.now()
          }));
        }
      });
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    data: { message: 'Connected to attendance system' },
    timestamp: Date.now()
  }));
});

console.log('WebSocket server started successfully');
