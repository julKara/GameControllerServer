export function createUI(container, socket) {

    // container.innerHTML = `
    //     <div style="width:500px;height:500px;background:#ccc;border-radius:50%;position:relative;">
    //         <div id="stick" style="width:200px;height:200px;background:#333;border-radius:50%;position:absolute;left:75px;top:75px;"></div>
    //     </div>
    // `;

    // const stick = document.getElementById("stick");

    // let dragging = false;

    // stick.addEventListener("touchstart", () => dragging = true);
    // stick.addEventListener("touchend", () => {
    //     dragging = false;

    //     socket.send(JSON.stringify({
    //         type: "movement",
    //         x: 0,
    //         y: 0
    //     }));
    // });

    // stick.addEventListener("touchmove", (e) => {

    //     if (!dragging) return;

    //     const rect = stick.parentElement.getBoundingClientRect();

    //     let x = e.touches[0].clientX - rect.left - 100;
    //     let y = e.touches[0].clientY - rect.top - 100;

    //     x = Math.max(-75, Math.min(75, x));
    //     y = Math.max(-75, Math.min(75, y));

    //     stick.style.left = (x + 100 - 25) + "px";
    //     stick.style.top = (y + 100 - 25) + "px";

    //     socket.send(JSON.stringify({
    //         type: "movement",
    //         x: x / 75,
    //         y: -y / 75
    //     }));
    // });

    // return {
    //     destroy() {
    //         container.innerHTML = "";
    //     }
    // };

    // Main -------------------------------------------------------------------------

    // Create 2D canvas for joystick rendering
    const canvas = document.createElement("canvas"), context = canvas.getContext("2d");
    document.body.append(canvas);

    // Set canvas size to fill the window
    let width = canvas.width = innerWidth;
    let height = canvas.height = innerHeight;

    const FPS = 120; // Frames per second for rendering

    // Background design
    function background(){
        context.fillStyle = '#000';              // Light gray background
        context.fillRect(0, 0, width, height);     // Fill the entire canvas

    }

    setInterval(() => {
        background(); // Draw the background
        
    }, 1000/FPS);

    // Create joystick instance
    let joystick = new Joystick(200, 200, 50, 25); // x = 200, y = 200, radius = 50, handleRadius = 25

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

    class Joystick{
        constructor(x, y, radius, handleRadius){
            this.pos = new Vector2(x, y);
            this.origin = new Vector2(x, y);
            this.radius = radius;
            this.handleRadius = handleRadius;
            this.handleFriction = 0.5;
            this.ondrag = false;
            this.touchPos = new Vector2(0, 0);
            this.listener
        }

        // All listener functions for touch events
        listener(){

            // When start-touch
            addEventListener("touchstart", e => {
                //console.log(e.touches[0]);
                this.touchPos = new Vector2(e.touches[0].pageX, e.touches[0].pageY);    // Set touch position to the first touch point
                this.ondrag = true; // Start dragging
            });

            // When ending touch
            addEventListener("touchend", () => {
                this.ondrag = false;    // Stop dragging
            });

            // When moving touch
            addEventListener("touchmove", e => {
                this.touchPos = new Vector2(e.touches[0].pageX, e.touches[0].pageY);    // Update touch position
            });
        }

        draw(){
            // Draw joystick base


            // Draw joystick handle
        }
    }

    // Utility functions -------------------------------------------------------------------------
    // Function to draw a circle on the canvas
    function circle(pos, radius, color){
        context.beginPath();
        context.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        context.fillStyle = color;
        context.fill();
        context.closePath();
    }
}