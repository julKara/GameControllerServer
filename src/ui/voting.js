export function createUI(container, socket) {

    // Typical yes/no button
    container.innerHTML = `
        <h1>Poll</h1>
        <button id="yes">Yes</button>
        <button id="no">No</button>
    `;

    document.getElementById("yes").onclick = () => {
        socket.send(JSON.stringify({ type: "vote", value: "yes" }));
    };

    document.getElementById("no").onclick = () => {
        socket.send(JSON.stringify({ type: "vote", value: "no" }));
    };

    return {
        destroy() {
            container.innerHTML = "";
        }
    };
}