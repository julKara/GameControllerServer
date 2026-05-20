export function createUI(container, socket) {

    let zoom = 1.0;
    
    // Background colors (HSV), set to match playercharacter color
    let backgroundHue = 270; // Default hue
    const backgroundSaturation = 0.8;
    const backgroundValue = 0.9;
    
    container.innerHTML = `
        <div id="mapWrapper"
            style="
                width:100vw;
                height:100dvh;
                overflow:hidden;
                position:fixed;
                inset:0;
                background:black;
                touch-action:none;
            "
        >

            <div id="mapImage"
                style="
                    width:100%;
                    height:100%;
                    background-image:url('./ui/maps/hideseek_map.png');
                    background-size:100% 100%;
                    background-position:center;
                    background-repeat:no-repeat;
                    touch-action:none;
                "
            ></div>

            <div id="playerMarker"
                style="
                    position:absolute;
                    width:18px;
                    height:18px;
                    border-radius:50%;
                    background:red;
                    transform:translate(-50%, -50%);
                    pointer-events:none;
                    left:50%;
                    top:50%;
                    border:2px solid white;
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

    function handlePress(clientX, clientY)
    {
        const rect = mapImage.getBoundingClientRect();

        let u = (clientX - rect.left) / rect.width;

        let v = (clientY - rect.top) / rect.height;

        u = Math.max(0, Math.min(1, u));
        v = Math.max(0, Math.min(1, v));

        marker.style.left = `${u * 100}%`;
        marker.style.top = `${v * 100}%`;

        sendMove(u, v);
    }

    mapImage.addEventListener("touchstart", e =>
    {
        e.preventDefault();

        const touch = e.touches[0];

        handlePress(
            touch.clientX,
            touch.clientY
        );
    }, { passive:false });

    mapImage.addEventListener("click", e =>
    {
        handlePress(
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
            // if (data.type === "player_pos") {
            //     marker.style.left = `${data.u * 100}%`;
            //     marker.style.top = `${data.v * 100}%`;
            // }
        },

        destroy()
        {
            container.innerHTML = "";
        }
    };
}