export function createUI(container, socket) {

    // Background colors (HSV), set to match playercharacter color
    let backgroundHue = 270; // Default hue
    const backgroundSaturation = 0.8;
    const backgroundValue = 0.9;

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

            // Track active inputs
            this.inputs = {
                up: false,
                down: false,
                left: false,
                right: false
            };
        }

        // -------------------------------------------------------------------------
        // INPUT LISTENERS (FIXED: uses pointer events = MUCH more reliable)
        // -------------------------------------------------------------------------
        listener() {

            const bindButton = (id, key) => {
                const el = document.getElementById(id);

                el.style.touchAction = "none";

                // PRESS
                el.addEventListener("pointerdown", (e) => {
                    e.preventDefault();

                    // Capture pointer (fixes multi-tap issue)
                    el.setPointerCapture(e.pointerId);

                    this.inputs[key] = true;

                    // VISUAL feedback (instant highlight)
                    el.style.filter = "brightness(1.8)";
                    el.style.transform = "scale(0.9)";
                    el.style.transform = "scale(0.9)";

                    // HAPTIC FEEDBACK (with fallback) (only on android)
                    if (navigator.vibrate) {
                        navigator.vibrate([10]);
                    }
                    else {
                        console.log("Vibration not supported on this device");
                    }
                });

                // RELEASE
                const release = (e) => {
                    this.inputs[key] = false;

                    el.style.filter = "brightness(1)";
                    el.style.transform = "scale(1)";

                    try {
                        el.releasePointerCapture(e.pointerId);
                    } catch {}
                };

                el.addEventListener("pointerup", release);
                el.addEventListener("pointercancel", release);
                el.addEventListener("pointerleave", release);
            };

            bindButton("btn-up", "up");
            bindButton("btn-down", "down");
            bindButton("btn-left", "left");
            bindButton("btn-right", "right");
        }

        // -------------------------------------------------------------------------
        // CORE INPUT LOGIC
        // -------------------------------------------------------------------------
        getInput() {

            let x = 0;
            let y = 0;

            if (this.inputs.left)  x -= 1;
            if (this.inputs.right) x += 1;
            if (this.inputs.up)    y -= 1;
            if (this.inputs.down)  y += 1;

            if (x === 0 && y === 0) {
                return { angle: 0, strength: 0 };
            }

            // Normalize (so diagonals aren't faster)
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;

            const angle = Math.atan2(y, x);

            // DEBUGG
            //console.log(this.inputs);

            return { angle, strength: 1 };
        }

        // -------------------------------------------------------------------------
        // VISUAL
        // -------------------------------------------------------------------------
        draw() {

            const size = 80;
            const cx = width / 2;
            const cy = height / 2;

            const drawBtn = (x, y, active) => {
                context.fillStyle = active ? "#aaaaaa" : "#555555";
                context.fillRect(x - size/2, y - size/2, size, size);
            };

            drawBtn(cx, cy - size, this.inputs.up);
            drawBtn(cx, cy + size, this.inputs.down);
            drawBtn(cx - size, cy, this.inputs.left);
            drawBtn(cx + size, cy, this.inputs.right);
        }

        update() {
            this.draw();
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
                    width: min(60vw, 96vw);
                    height: min(60vw, 96vw);

                    display:grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-template-rows: repeat(3, 1fr);
                    gap:3.7vw;

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
                "
            >
                Score: 0
            </div>
        </div>
        `;

    // -------------------------------------------------------------------------
    // SAFARI ZOOM FIX (must be inside same file as requested)
    // -------------------------------------------------------------------------

    document.getElementById("dPad-wrapper").style.background =  hsvToRgb(backgroundHue, backgroundSaturation, backgroundValue);
    
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
        btn.style.borderRadius = "7vw";
        btn.style.width = "100%";
        btn.style.height = "100%";
        btn.style.touchAction = "none";
        btn.style.transition = "all 0.1s ease";
        btn.style.boxShadow = "0 1.2vw 5vw rgba(0,0,0,0.3)";
        btn.style.backdropFilter = "blur(3vw)";
    });
    
        // Grid layout for d-pad buttons
    const dpadEl = document.getElementById("dpad");

    dpadEl.style.display = "grid";
    dpadEl.style.gridTemplateAreas = `
        ".    up    ."
        "left .   right"
        ".   down   ."
    `;
    dpadEl.style.gridTemplateColumns = "1fr 1fr 1fr";
    dpadEl.style.gridTemplateRows = "1fr 1fr 1fr";

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

    // CONTROLLER/INPUTS -------------------------------------------------------------------------
    const SEND_INTERVAL = 50; // 20 Hz
    let lastSend = 0;

    let lastAngle = 0;
    let lastStrength = 0;

    const ANGLE_EPSILON = 0.02;
    const STRENGTH_EPSILON = 0.02;

    let isStopped = true;
    let currentScore = 0;   // Track the current score to update the score display

    function sendInput() {

        if (socket.readyState !== WebSocket.OPEN) return;

        const now = performance.now();
        if (now - lastSend < SEND_INTERVAL) return;

        const input = dpad.getInput();

        // STOP
        if (input.strength === 0) {
            if (!isStopped) {
                socket.send(JSON.stringify({
                    type: "movement",
                    user: window.USER_ID,
                    angle: 0,
                    strength: 0
                }));
                isStopped = true;
            }
            return;
        }

        isStopped = false;

        // Always send while holding (DO NOT compare with lastAngle anymore)
        lastSend = now;

        socket.send(JSON.stringify({
            type: "movement",
            user: window.USER_ID,
            angle: input.angle,
            strength: input.strength
        }));
    }

    // Main loop to update the d-pad and send input
    function loop() {
        background();       // Clear the canvas with the background color
        //dpad.update();      // Update and draw the d-pad
        sendInput();        // Send the d-pad input to the server

        requestAnimationFrame(loop);    // Schedule the next frame
    }

    loop();
    
    return {

        onMessage(data) {

            // Set background hue based on server message
            if (data.type === "set_hue") {

                backgroundHue = parseInt(data.hue);

                // Clamp to valid HSV hue range
                if (backgroundHue < 0) backgroundHue = 0;
                if (backgroundHue > 360) backgroundHue = 360;

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
            clearInterval(loop);
            container.innerHTML = "";
        }
    };
}