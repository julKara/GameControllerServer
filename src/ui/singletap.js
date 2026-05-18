export function createUI(container, socket) {

    // =========================================================
    // Background hue system
    // =========================================================

    let backgroundHue = 270;

    const backgroundSaturation = 0.8;
    const backgroundValue = 0.9;

    let currentScore = 0;

    // =========================================================
    // HTML
    // =========================================================

    container.innerHTML = `
        <div id="tap-wrapper"
            style="
                width:100vw;
                height:100vh;
                overflow:hidden;
                touch-action:none;
                user-select:none;
                position:relative;
            "
        >

            <div id="tapText"
                style="
                    position:absolute;
                    top:50%;
                    left:50%;
                    transform:translate(-50%, -50%);
                    color:white;
                    font-size:72px;
                    font-family:Arial;
                    font-weight:bold;
                    opacity:0.85;
                    pointer-events:none;
                "
            >
                TAP
            </div>

            <div id="scoreText"
                style="
                    position:absolute;
                    bottom:40px;
                    left:50%;
                    transform:translateX(-50%);
                    color:white;
                    font-size:42px;
                    font-family:Arial;
                    font-weight:bold;
                "
            >
                Score: 0
            </div>

        </div>
    `;



    // =========================================================
    // Canvas
    // =========================================================

    const canvas = document.createElement("canvas");

    const context = canvas.getContext("2d");

    document.getElementById("tap-wrapper").appendChild(canvas);

    let width;
    let height;

    function resizeCanvas() {

        width = canvas.width = innerWidth;
        height = canvas.height = innerHeight;
    }

    resizeCanvas();

    addEventListener("resize", resizeCanvas);


    // HSV helper
    function hsvToRgb(h, s, v) {

        let c = v * s;
        let x = c * (1 - Math.abs((h / 60) % 2 - 1));
        let m = v - c;

        let r = 0;
        let g = 0;
        let b = 0;

        if (h < 60) {
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

    // =========================================================
    // Background rendering
    // =========================================================
    function background() {

        const color = hsvToRgb(
            backgroundHue,
            backgroundSaturation,
            backgroundValue
        );

        context.fillStyle = color;

        context.fillRect(0, 0, width, height);
    }

    // =========================================================
    // Score UI
    // =========================================================
    function updateScoreDisplay() {

        const scoreText =
            document.getElementById("scoreText");

        if (!scoreText) return;

        scoreText.innerText =
            `Score: ${currentScore}`;
    }

    // =========================================================
    // Tap Input
    // =========================================================
    function sendTap() {

        if (socket.readyState !== WebSocket.OPEN)
        {
            return;
        }

        socket.send(JSON.stringify({
            type: "tap",
            user: window.USER_ID
        }));
    }

    // Use touchstart ONLY as impulses
    canvas.addEventListener("touchstart", e => {

        e.preventDefault();

        sendTap();

    }, { passive:false });

    // =========================================================
    // Main loop
    // =========================================================
    function loop() {

        background();

        requestAnimationFrame(loop);
    }

    loop();

    // =========================================================
    // Incoming messages
    // =========================================================
    return {

        onMessage(data) {

            // Set hue
            if (data.type === "set_hue") {

                backgroundHue = parseInt(data.hue);

                backgroundHue =
                    Math.max(
                        0,
                        Math.min(360, backgroundHue)
                    );
            }

            // Score update
            if (data.type === "score_update") {

                currentScore =
                    parseInt(data.input);

                updateScoreDisplay();
            }
        },

        destroy() {

            container.innerHTML = "";
        }
    };
}