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

    // Function to draw a circle on the canvas
    function circle(pos, radius, color){
        context.beginPath();
        context.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        context.fillStyle = color;
        context.fill();
        context.closePath();
    }

    class DPad {
        
        constructor(socket) {
            this.socket = socket;

            // Track which buttons are currently pressed
            this.inputs = {
                up: false,
                down: false,
                left: false,
                right: false
            };
        }

        // -------------------------------------------------------------------------
        // INPUT LISTENERS (touch buttons instead of dragging)
        // -------------------------------------------------------------------------
        listener() {

            // Helper to bind both touchstart + touchend
            const bindButton = (id, key) => {
                const el = document.getElementById(id);

                // Press
                el.addEventListener("touchstart", (e) => {
                    e.preventDefault();
                    this.inputs[key] = true;
                }, { passive: false });

                // Release
                el.addEventListener("touchend", (e) => {
                    e.preventDefault();
                    this.inputs[key] = false;
                }, { passive: false });

                // Safety: if finger slides off
                el.addEventListener("touchcancel", () => {
                    this.inputs[key] = false;
                });
            };

            bindButton("btn-up", "up");
            bindButton("btn-down", "down");
            bindButton("btn-left", "left");
            bindButton("btn-right", "right");
        }

        // -------------------------------------------------------------------------
        // CORE: Convert button states → angle + strength
        // -------------------------------------------------------------------------
        getInput() {

            let x = 0;
            let y = 0;

            // Build direction vector from button states
            if (this.inputs.left)  x -= 1;
            if (this.inputs.right) x += 1;
            if (this.inputs.up)    y -= 1; // up = negative Y
            if (this.inputs.down)  y += 1;

            // No input → stop
            if (x === 0 && y === 0) {
                return { angle: 0, strength: 0 };
            }

            // Normalize diagonal movement so speed is consistent
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;

            // Angle logic
            const angle = Math.atan2(y, x);

            // D-pad = constant strength
            return { angle, strength: 1 };
        }

        // -------------------------------------------------------------------------
        // VISUAL (optional but nice)
        // -------------------------------------------------------------------------
        draw() {

            const size = 80;
            const centerX = width / 2;
            const centerY = height / 2;

            // Helper to draw a button
            const drawBtn = (x, y, active) => {
                context.fillStyle = active ? "#aaaaaa" : "#555555";
                context.fillRect(x - size/2, y - size/2, size, size);
            };

            // Draw 4 buttons
            drawBtn(centerX, centerY - size, this.inputs.up);
            drawBtn(centerX, centerY + size, this.inputs.down);
            drawBtn(centerX - size, centerY, this.inputs.left);
            drawBtn(centerX + size, centerY, this.inputs.right);
        }

        update() {
            this.draw();
        }
    }

        // Main -------------------------------------------------------------------------

    container.innerHTML = `
        <div id="dPad-wrapper"
            style="
                position: relative;
                width: 100vw;
                height: 100vh;
                overflow: hidden;
            "
        >

            <!-- D-PAD BUTTONS -->
            <div id="btn-up" style="position:absolute; left:50%; top:30%; width:80px; height:80px; transform:translate(-50%,-50%);"></div>
            <div id="btn-down" style="position:absolute; left:50%; top:70%; width:80px; height:80px; transform:translate(-50%,-50%);"></div>
            <div id="btn-left" style="position:absolute; left:30%; top:50%; width:80px; height:80px; transform:translate(-50%,-50%);"></div>
            <div id="btn-right" style="position:absolute; left:70%; top:50%; width:80px; height:80px; transform:translate(-50%,-50%);"></div>

            <!-- SCORE -->
            <div id="scoreText"
                style="
                    position: absolute;
                    bottom: 40px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: white;
                    font-size: 42px;
                    font-family: Arial, sans-serif;
                    font-weight: bold;
                    text-shadow: 0 0 10px rgba(0,0,0,0.5);
                    z-index: 10;
                    user-select: none;
                "
            >
                Score: 0
            </div>
        </div>
        `;

    const canvas = document.createElement("canvas"), context = canvas.getContext("2d");
    document.getElementById("dPad-wrapper").appendChild(canvas);

    let width, height;

    let dpad = new DPad(socket); // Create a neew d-pad instance

    function resizeCanvas() {
        width = canvas.width = innerWidth;
        height = canvas.height = innerHeight;

        dpad.origin = new Vector2(width / 2, height / 2);
    }

    resizeCanvas();
    addEventListener("resize", resizeCanvas);
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

        context.fillStyle = color;
        context.fillRect(0, 0, width, height);
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

        // HARD STOP
        if (input.strength < 0.05) {
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

        // Only send if changed
        if (
            Math.abs(input.angle - lastAngle) < ANGLE_EPSILON &&
            Math.abs(input.strength - lastStrength) < STRENGTH_EPSILON
        ) {
            return;
        }

        lastSend = now;
        lastAngle = input.angle;
        lastStrength = input.strength;

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
        dpad.update();      // Update and draw the d-pad
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