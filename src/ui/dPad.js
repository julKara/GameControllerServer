export function createUI(container, socket) {

    // Background colors (HSV), set to match playercharacter color
    let backgroundHue = 270; // Default hue
    const backgroundSaturation = 0.8;
    const backgroundValue = 0.9;

    // Distance moved per tap
    const TAP_DISTANCE = 0.90;  // [0,1] range representing percentage of max speed

    // Classes -------------------------------------------------------------------------
    class Vector2{
        constructor(x, y){
            this.x = x;
            this.y = y;
        }
        add(vector){
            return new Vector2(this.x + vector.x, this.y + vector.y);
        }
        sub(vector){
            return new Vector2(this.x - vector.x, this.y - vector.y);
        }
        mult(n){
            return new Vector2(this.x * n, this.y * n);
        }
        div(n){
            return new Vector2(this.x / n, this.y / n);
        }
        mag(){
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
        normalize(){
            return this.mag() === 0 ? new Vector2(0, 0) : this.div(this.mag());
        }
    }

    // -------------------------------------------------------------------------
    // D-PAD CLASS
    // -------------------------------------------------------------------------
    class DPad {

    constructor(socket) {

        this.socket = socket;
    }

    listener() {

        const bindButton = (id, x, y) => {

            const el = document.getElementById(id);

            el.style.touchAction = "none";

            el.addEventListener("pointerdown", (e) => {

                e.preventDefault();

                // Visual feedback
                el.style.filter = "brightness(1.8)";
                el.style.transform = "scale(0.92)";

                // Haptic
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }

                // Send single movement packet
                this.sendTapMovement(x, y);

                // Release visual shortly after tap
                setTimeout(() => {
                    el.style.filter = "brightness(1)";
                    el.style.transform = "scale(1)";
                }, 80);
            });
        };

        bindButton("btn-up", 0, -1);
        bindButton("btn-down", 0, 1);
        bindButton("btn-left", -1, 0);
        bindButton("btn-right", 1, 0);
    }

    sendTapMovement(x, y) {

        if (socket.readyState !== WebSocket.OPEN) {
            return;
        }

        // Normalize diagonal movement
        const length = Math.sqrt(x * x + y * y);

        if (length > 0) {
            x /= length;
            y /= length;
        }

        // Adjustable movement distance
        x *= TAP_DISTANCE;
        y *= TAP_DISTANCE;

        socket.send(JSON.stringify({
            type: "movement",
            user: window.USER_ID,
            x: x,
            y: y
        }));
    }
}

    // Main -------------------------------------------------------------------------

    container.innerHTML = `
        <div id="dPad-wrapper"
            style="
                position: fixed;
                inset: 0;
                overflow: hidden;
                touch-action: manipulation;
            "
        >

            <!-- D-PAD -->
            <div id="dpad"
                style="
                    position:absolute;
                    left:50%;
                    top:50%;
                    transform:translate(-50%,-50%);
                    width: 100vw;
                    height: 100vh;  

                    display:grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-template-rows: repeat(3, 1fr);
                    gap:0vw;
                    padding: 4vw;
                    box-sizing: border-box;

                    z-index:10;
                "
            >

                <div></div>
                <div id="btn-up" class="dpad-btn"></div>
                <div></div>

                <div id="btn-left" class="dpad-btn"></div>
                <div></div>
                <div id="btn-right" class="dpad-btn"></div>

                <div></div>
                <div id="btn-down" class="dpad-btn"></div>
                <div></div>

            </div>

            <div id="scoreText"
                style="
                    position: absolute;
                    bottom: 10vh;
                    left: 50%;
                    transform: translateX(-50%);
                    color: white;
                    font-size: 42px;
                    font-weight: bold;
                    z-index: 10;

                    pointer-events: none;
                    user-select: none;
                "
            >
                Score: 0
            </div>
        </div>
        `;

    // -------------------------------------------------------------------------
    // SAFARI ZOOM FIX
    // -------------------------------------------------------------------------

    document.getElementById("dPad-wrapper").style.backgroundColor =  hsvToRgb(backgroundHue, backgroundSaturation, backgroundValue);
    
    let lastTouchEnd = 0;

    // Prevent double-tap zoom
    document.addEventListener("touchend", function (event) {
        const now = Date.now();

        if (now - lastTouchEnd <= 300) {
            event.preventDefault(); // BLOCK zoom
        }

        lastTouchEnd = now;
    }, { passive: false });


    // Prevent pinch zoom (Safari gesture)
    document.addEventListener("gesturestart", function (e) {
        e.preventDefault();
    }, { passive: false });

    document.querySelectorAll(".dpad-btn").forEach(btn => {

        btn.style.borderRadius = "5vw";

        btn.style.width = "100%";
        btn.style.height = "100%";

        btn.style.minWidth = "28vw";
        btn.style.minHeight = "28vw";

        btn.style.touchAction = "none";
        btn.style.transition = "all 0.08s ease";

        btn.style.boxShadow = "0 1vw 4vw rgba(0,0,0,0.25)";
        btn.style.backdropFilter = "blur(2vw)";
    });
    
    // Grid layout for d-pad buttons
    const dpadEl = document.getElementById("dpad");

    dpadEl.style.display = "grid";
    dpadEl.style.gridTemplateAreas = `
        ".    up    ."
        "left .   right"
        ".   down   ."
    `;
    dpadEl.style.gridTemplateColumns = "1fr 1.2fr 1fr";
    dpadEl.style.gridTemplateRows = "1fr 1.2fr 1fr";

    document.getElementById("btn-up").style.background = "rgba(0, 200, 255, 0.6)";
    document.getElementById("btn-down").style.background = "rgba(255, 80, 80, 0.6)";
    document.getElementById("btn-left").style.background = "rgba(255, 200, 0, 0.6)";
    document.getElementById("btn-right").style.background = "rgba(100, 255, 100, 0.6)";

    //const canvas = document.createElement("canvas"), context = canvas.getContext("2d");
    // canvas.style.position = "absolute";
    // canvas.style.top = "0";
    // canvas.style.left = "0";
    // canvas.style.zIndex = "0";   // behind buttons
    // canvas.style.pointerEvents = "none"; // allows touches to pass through

    // document.getElementById("dPad-wrapper").appendChild(canvas);

    let width, height;

    let dpad = new DPad(socket); // Create a neew d-pad instance

    // function resizeCanvas() {
    //     width = canvas.width = innerWidth;
    //     height = canvas.height = innerHeight;

    //     dpad.origin = new Vector2(width / 2, height / 2);
    // }

    // resizeCanvas();
    //addEventListener("resize", resizeCanvas);
    dpad.listener(); // Start listening for touch events

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
    
    // Background design
    function background(){

        const color = hsvToRgb(backgroundHue, backgroundSaturation, backgroundValue);

        const wrapper = document.getElementById("dPad-wrapper");

        if (!wrapper) return; // (important for Safari)

        wrapper.style.background = color;
    }

    // Score display
    function updateScoreDisplay() {

        const scoreText = document.getElementById("scoreText");

        if (!scoreText) return;

        scoreText.innerText = `Score: ${currentScore}`;
    }

    // CONTROLLER / INPUTS --------------------------------------------------

    function sendInput() {

        // Check socket
        if (socket.readyState !== WebSocket.OPEN) {
            return;
        }

        const input = dpad.getInput();

        const angle = input.angle;
        const strength = input.strength;

        const x = Math.cos(angle) * strength;
        const y = Math.sin(angle) * strength;

        // Send packet
        socket.send(JSON.stringify({
            type: "movement",
            user: window.USER_ID,
            x: x,
            y: y
        }));
    }

    // function loop() {

    //     //background();

    //     animationFrameId = requestAnimationFrame(loop);
    // }

    // // Start render loop
    // loop();
    
    return {

        onMessage(data) {

            // Set background hue based on server message
            if (data.type === "set_hue") {

                backgroundHue = parseInt(data.hue);

                if (backgroundHue < 0) backgroundHue = 0;
                if (backgroundHue > 360) backgroundHue = 360;

                const wrapper = document.getElementById("dPad-wrapper");

                if (wrapper) {
                    wrapper.style.backgroundColor =
                        hsvToRgb(backgroundHue, backgroundSaturation, backgroundValue);
                }

                console.log("Updated background hue:", backgroundHue);
            }
            // Update score on server message
            if (data.type === "score_update") {

                currentScore = parseInt(data.input);

                updateScoreDisplay();

                console.log("Updated score:", currentScore);
            }
        },

        destroy() {

            container.innerHTML = "";
        }
    };
}