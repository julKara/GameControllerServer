export function createUI(container, socket) {

    container.innerHTML = `
        <div style="width:500px;height:500px;background:#ccc;border-radius:50%;position:relative;">
            <div id="stick" style="width:200px;height:200px;background:#333;border-radius:50%;position:absolute;left:75px;top:75px;"></div>
        </div>
    `;

    const stick = document.getElementById("stick");

    let dragging = false;

    stick.addEventListener("touchstart", () => dragging = true);
    stick.addEventListener("touchend", () => {
        dragging = false;

        socket.send(JSON.stringify({
            type: "movement",
            x: 0,
            y: 0
        }));
    });

    stick.addEventListener("touchmove", (e) => {

        if (!dragging) return;

        const rect = stick.parentElement.getBoundingClientRect();

        let x = e.touches[0].clientX - rect.left - 100;
        let y = e.touches[0].clientY - rect.top - 100;

        x = Math.max(-75, Math.min(75, x));
        y = Math.max(-75, Math.min(75, y));

        stick.style.left = (x + 100 - 25) + "px";
        stick.style.top = (y + 100 - 25) + "px";

        socket.send(JSON.stringify({
            type: "movement",
            x: x / 75,
            y: -y / 75
        }));
    });

    return {
        destroy() {
            container.innerHTML = "";
        }
    };
}