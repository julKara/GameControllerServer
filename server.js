

// node server.js in cmd to run server
// Ctrl + C to stop the server

// Simple WebSocket server for Unreal Engine communication
const WebSocket = require('ws');
const wss = new WebSocket.Server({
    port: 8080,
    host: "0.0.0.0" // Listen on all network interfaces to allow connections from other devices on the same network
});

// Some important variables to keep track of clients and Unreal connection
let unrealClient = null;    // Store Unreal Engine (host) client connection
let playerCounter  = 0;     // Counter to assign unique IDs to clients (players) as they connect

wss.on('connection', function connection(ws) {

    console.log("New connection");

    let clientId = null;
    let isUnreal = false;

    // Handle incoming messages from clients and Unreal
    ws.on('message', function incoming(message) {

        // Convert message to string and log it
        const msg = message.toString();
        console.log("Received:", msg);

        // Unreal (host)connected
        if (msg === "register:unreal") {

            unrealClient = ws;  // Store Unreal client connection
            clientId = "unrealClient";
            isUnreal = true;

            console.log("Unreal connected");

            return;
        }

        // Phone (player) connected
        if (msg === "register:phone") {

            playerCounter++;
            clientId = "player_" + playerCounter;

            console.log("Phone connected:", clientId);

            // Tell Unreal a player joined
            sendToUnreal("join:" + clientId);

            return;
        }

        // Forward gameplay messages
        if (clientId && !isUnreal) {
            sendToUnreal(msg + ":" + clientId);
        }

    });

    // Handle client disconnection
    ws.on('close', function () {

        // If Unreal disconnects, reset server state and disconnect all players
        if (isUnreal) {

            console.log("Unreal disconnected, resetting server...");

            // Reset server state
            unrealClient = null;
            playerCounter = 0;

            // Disconnect all players
            wss.clients.forEach(function each(client) {
                if (client !== ws) {
                    client.close();
                }
            });

            return;
        }

        // If a player disconnects, notify Unreal
        if (clientId) {

            console.log("Player disconnected:", clientId);

            sendToUnreal("leave:" + clientId);
        }

    });

});

// Send a message to Unreal Engine client
function sendToUnreal(message) {

    if (unrealClient && unrealClient.readyState === WebSocket.OPEN) {
        unrealClient.send(message);
    }

}