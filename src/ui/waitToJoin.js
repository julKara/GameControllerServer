export function createUI(container, socket) {

    container.innerHTML = `<h1>Cannot join right now...</h1>`;

    return {
        onMessage(data) {
            // EMPTY (for now...)
        },
        destroy() {
            container.innerHTML = "";
        }
    };
}