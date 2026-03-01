const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

let clients = [];

server.on('connection', function connection(ws) {

    clients.push(ws);
    console.log("Client connected");

    ws.on('message', function incoming(message) {

        console.log("Received:", message.toString());

        // Send message to all other clients
        clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

});

// node server.js in cmd to run server
// Ctrl + C to stop the server