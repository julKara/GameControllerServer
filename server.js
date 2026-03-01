
// Simple WebSocket server for Unreal Engine communication
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });   // Create WebSocket server on port 8080 (adjustable)

// Nr of connected clients
let clientCounter = 0;

// Handle new client connections
wss.on('connection', function connection(ws) {

    clientCounter++;
    const clientId = "player_" + clientCounter; // Assign a unique ID to each client

    console.log("Client connected:", clientId);

    // Tell Unreal a new player joined
    broadcast("join:" + clientId);

    // Handle incoming messages from clients and forward them to Unreal
    ws.on('message', function incoming(message) {
        console.log("Received:", message.toString());

        // Forward message but attach client ID
        broadcast(message.toString() + ":" + clientId);
    });

    // Handle client disconnection
    ws.on('close', function () {
        console.log("Client disconnected:", clientId);
        broadcast("leave:" + clientId);
    });
});


// Broadcast a message to all connected clients
function broadcast(message) {

    // Go through each client and send the message if the connection is open
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// node server.js in cmd to run server
// Ctrl + C to stop the server