export function createUI(container, socket) {

    container.innerHTML = `<h1>Waiting for game to start...</h1>`;

    return {
        onMessage(data) {
            // EMPTY (for now...)
        },
        destroy() {
            container.innerHTML = "";
        }
    };
}