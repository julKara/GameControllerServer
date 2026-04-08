export function createUI(container, socket) {
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------
    let pollActive = false;
    let hasAnswered = false;
    let choiceCount = 0;
    let answeredCount = 0;
    let totalPlayers = 0;

    let socketMessageHandler = null;

    // -------------------------------------------------------------------------
    // Styles
    // -------------------------------------------------------------------------
    const style = document.createElement("style");
    style.textContent = `
        html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100%;
            height: 100%;
            font-family: Arial, sans-serif;
            background: #111;
        }

        #poll-root {
            width: 100vw;
            height: 100vh;
            background: #111;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }

        .poll-grid {
            width: 100%;
            height: 100%;
            display: grid;
            gap: 10px;
            padding: 10px;
            box-sizing: border-box;
        }

        /* 2 choices = stacked fullscreen halves */
        .choices-2 {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 1fr;
        }

        /* 3 choices = top row 2, bottom row 1 full width */
        .choices-3 {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
        }

        /* 4 choices = 2x2 */
        .choices-4 {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
        }

        .poll-button {
            border: none;
            border-radius: 24px;
            font-size: clamp(2rem, 6vw, 4rem);
            font-weight: bold;
            color: white;
            width: 100%;
            height: 100%;
            cursor: pointer;
            touch-action: manipulation;
            transition: transform 0.08s ease, opacity 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-user-select: none;
        }

        .poll-button:active {
            transform: scale(0.97);
        }

        .choice-1 { background: #e53935; } /* red */
        .choice-2 { background: #1e88e5; } /* blue */
        .choice-3 { background: #43a047; } /* green */
        .choice-4 { background: #fbc02d; color: #111; } /* yellow */

        /* Make 3rd button span full width when there are 3 choices */
        .choices-3 .poll-button:nth-child(3) {
            grid-column: 1 / span 2;
        }

        .waiting-screen {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 40px;
            box-sizing: border-box;
            background: #111;
        }

        .waiting-title {
            font-size: clamp(2rem, 6vw, 4rem);
            font-weight: bold;
            margin-bottom: 24px;
        }

        .waiting-count {
            font-size: clamp(1.5rem, 4vw, 2.5rem);
            opacity: 0.9;
        }

        .idle-screen {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: clamp(1.5rem, 4vw, 2.5rem);
            color: rgba(255,255,255,0.7);
            text-align: center;
            padding: 40px;
            box-sizing: border-box;
        }
    `;
    document.head.appendChild(style);

    // -------------------------------------------------------------------------
    // Root UI
    // -------------------------------------------------------------------------
    container.innerHTML = `
        <div id="poll-root">
            <div class="idle-screen">Waiting for poll...</div>
        </div>
    `;

    const root = container.querySelector("#poll-root");

    // -------------------------------------------------------------------------
    // Render functions
    // -------------------------------------------------------------------------
    function renderIdle() {
        pollActive = false;
        hasAnswered = false;
        choiceCount = 0;

        root.innerHTML = `
            <div class="idle-screen">Waiting for poll...</div>
        `;
    }

    function renderPoll(choices) {
        pollActive = true;
        hasAnswered = false;
        choiceCount = choices;

        const safeChoices = [2, 3, 4].includes(choices) ? choices : 2;

        let buttonsHTML = "";

        for (let i = 1; i <= safeChoices; i++) {
            buttonsHTML += `
                <button class="poll-button choice-${i}" data-choice="${i}">
                    ${i}
                </button>
            `;
        }

        root.innerHTML = `
            <div class="poll-grid choices-${safeChoices}">
                ${buttonsHTML}
            </div>
        `;

        const buttons = root.querySelectorAll(".poll-button");
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                submitVote(parseInt(btn.dataset.choice));
            });

            btn.addEventListener("touchstart", (e) => {
                e.preventDefault();
                submitVote(parseInt(btn.dataset.choice));
            }, { passive: false });
        });
    }

    function renderWaiting() {
        root.innerHTML = `
            <div class="waiting-screen">
                <div class="waiting-title">Vote received!</div>
                <div class="waiting-count">${answeredCount} out of ${totalPlayers} people has answered</div>
            </div>
        `;
    }

    function updateWaitingCount() {
        if (!hasAnswered) return;

        const countEl = root.querySelector(".waiting-count");
        if (countEl) {
            countEl.textContent = `${answeredCount} out of ${totalPlayers} people has answered`;
        }
    }

    // -------------------------------------------------------------------------
    // Voting
    // -------------------------------------------------------------------------
    function submitVote(choiceIndex) {
        if (!pollActive || hasAnswered) return;
        if (socket.readyState !== WebSocket.OPEN) return;

        hasAnswered = true;

        socket.send(JSON.stringify({
            type: "vote",
            user: window.USER_ID,
            value: choiceIndex
        }));

        renderWaiting();
    }

    // -------------------------------------------------------------------------
    // Incoming server messages
    // -------------------------------------------------------------------------
    function handleServerMessage(event) {
        let data;

        try {
            data = JSON.parse(event.data);
        } catch (err) {
            return;
        }

        // Start a new poll
        if (data.type === "poll_start") {
            answeredCount = data.answered ?? 0;
            totalPlayers = data.total ?? 0;

            const choices = parseInt(data.choices);

            if ([2, 3, 4].includes(choices)) {
                renderPoll(choices);
            }
        }

        // Update answer count while poll is active
        else if (data.type === "poll_update") {
            answeredCount = data.answered ?? answeredCount;
            totalPlayers = data.total ?? totalPlayers;

            updateWaitingCount();
        }

        // End / clear the poll
        else if (data.type === "poll_end") {
            renderIdle();
        }
    }

    // -------------------------------------------------------------------------
    // Socket listener setup
    // -------------------------------------------------------------------------
    socketMessageHandler = handleServerMessage;
    socket.addEventListener("message", socketMessageHandler);

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------
    return {
        destroy() {
            socket.removeEventListener("message", socketMessageHandler);

            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }

            container.innerHTML = "";
        }
    };
}