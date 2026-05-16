export function createUI(container, socket) {

    container.innerHTML = `
        <div id="mapWrapper"
            style="
                width:100vw;
                height:100vh;
                overflow:hidden;
                position:relative;
                background:black;
            "
        >
            <img
                id="mapImage"
                src="./maps/hideseek_map.png"
                style="
                    width:100%;
                    height:100%;
                    object-fit:contain;
                    touch-action:none;
                    user-select:none;
                "
            />

            <div id="playerMarker"
                style="
                    position:absolute;
                    width:20px;
                    height:20px;
                    border-radius:50%;
                    background:red;
                    transform:translate(-50%, -50%);
                    pointer-events:none;
                    left:50%;
                    top:50%;
                "
            ></div>
        </div>
    `;

    const mapImage = document.getElementById("mapImage");

    const marker = document.getElementById("playerMarker");

    function sendMove(u, v)
    {
        if (socket.readyState !== WebSocket.OPEN)
            return;

        socket.send(JSON.stringify({
            type: "map_move",
            user: window.USER_ID,
            u: u,
            v: v
        }));

        console.log("Sent move: ", u, ", ", v);
    }

    function handleTouch(clientX, clientY)
    {
        const rect = mapImage.getBoundingClientRect();

        let u = (clientX - rect.left) / rect.width;

        let v = (clientY - rect.top) / rect.height;

        // Clamp
        u = Math.max(0, Math.min(1, u));
        v = Math.max(0, Math.min(1, v));

        // Move marker visually
        marker.style.left = `${u * 100}%`;
        marker.style.top = `${v * 100}%`;

        // Send to Unreal
        sendMove(u, v);
    }

    mapImage.addEventListener("touchstart", e =>
    {
        e.preventDefault();

        const touch = e.touches[0];

        handleTouch(
            touch.clientX,
            touch.clientY
        );
    });

    mapImage.addEventListener("touchmove", e =>
    {
        e.preventDefault();

        const touch = e.touches[0];

        handleTouch(
            touch.clientX,
            touch.clientY
        );
    });

    mapImage.addEventListener("click", e =>
    {
        handleTouch(
            e.clientX,
            e.clientY
        );
    });

    return {

        onMessage(data)
        {
            // Set background hue based on server message
            if (data.type === "set_hue") {

                backgroundHue = parseInt(data.hue);

                // Clamp to valid HSV hue range
                if (backgroundHue < 0) backgroundHue = 0;
                if (backgroundHue > 360) backgroundHue = 360;

                console.log("Updated background hue:", backgroundHue);
            }
        },

        destroy()
        {
            container.innerHTML = "";
        }
    };
}