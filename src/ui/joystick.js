export function createUI(container, socket) {

    container.innerHTML = `
        <h1>Joystick</h1>
        <button id="moveBtn">Move</button>
    `;

    const btn = document.getElementById("moveBtn");

    // When button is clicked, send random movement data to server
    btn.onclick = () => {

        socket.send(JSON.stringify({
            type: "movement",
            x: Math.random(),
            y: Math.random()
        }));

        console.log("Sent movement");
    };

    return {
        onMessage(data) {
            // Handle incoming data if needed
        },
        destroy() {
            container.innerHTML = "";
        }
    };
}