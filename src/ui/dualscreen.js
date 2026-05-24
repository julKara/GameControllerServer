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
                    position:absolute;
                    width:min(100vw, 100dvh);
                    height:min(100vw, 100dvh);
                    left:50%;
                    top:50%;
                    transform:translate(-50%, -50%);

                    background-image:url('./ui/maps/hideseek_map.png');
                    background-size:contain;
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

    // Convert HSV to RGB for background color
    function hsvToRgb(h, s, v) {
        let c = v * s;
        let x = c * (1 - Math.abs((h / 60) % 2 - 1));
        let m = v - c;

        let r = 0, g = 0, b = 0;

        if (h >= 0 && h < 60) {
            r = c; g = x; b = 0;
        }
        else if (h < 120) {
            r = x; g = c; b = 0;
        }
        else if (h < 180) {
            r = 0; g = c; b = x;
        }
        else if (h < 240) {
            r = 0; g = x; b = c;
        }
        else if (h < 300) {
            r = x; g = 0; b = c;
        }
        else {
            r = c; g = 0; b = x;
        }

        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);

        return `rgb(${r}, ${g}, ${b})`;
    } 
    marker.style.background =  hsvToRgb(backgroundHue, backgroundSaturation, backgroundValue);

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

        // Convert from rotated phone-map space
        // to Unreal world UV space
        const worldU = u;
        const worldV = 1.0 - v;

        // Visual marker stays in touch-space
        marker.style.left = `${u * 100}%`;
        marker.style.top = `${v * 100}%`;

        sendMove(worldU, worldV);
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
            // Set cursor hue based on server message
            if (data.type === "set_hue") {

                backgroundHue = parseInt(data.hue);

                // Clamp to valid HSV hue range
                if (backgroundHue < 0) backgroundHue = 0;
                if (backgroundHue > 359) backgroundHue = 359;

                marker.style.background = hsvToRgb(backgroundHue, backgroundSaturation, backgroundValue);

                console.log("Updated cursor hue:", backgroundHue);
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