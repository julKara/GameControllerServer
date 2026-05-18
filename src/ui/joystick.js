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

    class Joystick{
        constructor(x, y, radius, handleRadius, socket){
            this.pos = new Vector2(x, y);
            this.origin = new Vector2(x, y);
            this.radius = radius;
            this.handleRadius = handleRadius;
            this.handleFriction = 0.2; // Friction for the joystick handle when returning to the origin
            this.ondrag = false;
            this.touchPos = new Vector2(0, 0);
            this.socket = socket;
        }

        // All listener functions for touch events
        listener(){

            // When start-touch
            canvas.addEventListener("touchstart", e => {
                //console.log(e.touches[0]);
                e.preventDefault();
                this.touchPos = new Vector2(e.touches[0].pageX, e.touches[0].pageY);    // Set touch position to the first touch point
                this.ondrag = true; // Start dragging
            }, { passive: false });

            // When ending touch
            canvas.addEventListener("touchend", e => {
                e.preventDefault();
                this.ondrag = false;
            }, { passive: false });

            // When moving touch
            canvas.addEventListener("touchmove", e => {
                e.preventDefault();
                this.touchPos = new Vector2(e.touches[0].pageX, e.touches[0].pageY);    // Update touch position
            }, { passive: false });
        }
        
        // Calculate the angle and strength of the joystick based on its current position relative to the origin
        getInput() {
            const diff = this.pos.sub(this.origin);

            const distance = diff.mag();

            const DEADZONE = 0.1; // Minimum strength to consider as input (10% of the radius)
            let strength = Math.min(distance / this.radius, 1);
            if (strength < DEADZONE) strength = 0;

            const angle = Math.atan2(diff.y, diff.x); // radians (-π -> π)

            return {angle, strength};
        }
        
        // Reposition the joystick handle based on the current touch position and whether it's being dragged
        reposistion(){
            if(this.ondrag == false){
                //console.log("Received touch end event");  // Debug log
                this.pos = this.pos.add(this.origin.sub(this.pos).mult(this.handleFriction)); // Move the joystick handle back to the origin with friction
            } else {
                //console.log("Received touch move event");  // Debug log
                const diff = this.touchPos.sub(this.origin); // Get the difference between the touch position and the joystick origin
                const maxDiff = Math.min(diff.mag(), this.radius); // Limit the difference to the joystick radius (alt: subtract the radius from the difference and use that as the new difference, but this is simpler)
                this.pos = this.origin.add(diff.normalize().mult(maxDiff)); // Move the joystick handle to the touch position, limited by the radius
            }
        }

        draw(){

            //console.log("Draw");  // Debug log

            // Draw joystick base
            circle(this.origin, this.radius, '#707070'); // Base color


            // Draw joystick handle
            circle(this.pos, this.handleRadius, '#3d3d3d'); // Handle color
        }

        update(){
            this.reposistion(); // Update the joystick handle position
            this.draw(); // Draw the joystick
        }
    }

    // Main -------------------------------------------------------------------------

    container.innerHTML = `
        <div id="joystick-wrapper"
            style="
                position: relative;
                width: 100vw;
                height: 100vh;
                overflow: hidden;
            "
        >
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
                    text-shadow: 0 0 3vw rgba(0,0,0,0.5);
                    z-index: 10;
                    user-select: none;
                "
            >
                Score: 0
            </div>
        </div>
    `;

    const canvas = document.createElement("canvas"), context = canvas.getContext("2d");
    document.getElementById("joystick-wrapper").appendChild(canvas);

    let width, height;

    let joystick = new Joystick(0, 0, 110, 50, socket); // Create a joystick with a radius of 110 and a handle radius of 50

    function resizeCanvas() {
        width = canvas.width = innerWidth;
        height = canvas.height = innerHeight;

        joystick.origin = new Vector2(width / 2, height / 2);
    }

    resizeCanvas();
    addEventListener("resize", resizeCanvas);
    joystick.listener(); // Start listening for touch events

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

        const input = joystick.getInput();

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

    // Main loop to update the joystick and send input
    function loop() {
        background();       // Clear the canvas with the background color
        joystick.update();  // Update and draw the joystick
        sendInput();        // Send the joystick input to the server

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