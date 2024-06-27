const URL = "https://teachablemachine.withgoogle.com/models/ZQkUdVmIA/";
let model, webcam, maxPredictions;
let currentLetter = 'A';
let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let alphabetIndex = 0;
let detectionTimer = null;
let lastDetectionTime = 0;
let detectionDuration = 0;

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    const flip = true;
    webcam = new tmImage.Webcam(200, 200, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    updateLetterDisplay();
    startChat();

    // Enable input field and send button
    document.getElementById("user-input").disabled = false;
    document.querySelector("#input-container button").disabled = false;
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const prediction = await model.predict(webcam.canvas);
    let highestProbability = 0;
    let predictedClass = null;

    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highestProbability) {
            highestProbability = prediction[i].probability;
            predictedClass = prediction[i].className;
        }
    }

    const now = Date.now();

    if (predictedClass === currentLetter && highestProbability > 0.2) {
        if (lastDetectionTime === 0) {
            lastDetectionTime = now;
        }
        detectionDuration = now - lastDetectionTime;

        if (detectionDuration >= 500) {
            document.getElementById("letter-display").style.color = "green";
            if (!detectionTimer) {
                detectionTimer = setTimeout(() => {
                    nextLetter();
                    lastDetectionTime = 0;
                    detectionDuration = 0;
                    detectionTimer = null;
                }, 500);
            }
        }
    } else {
        lastDetectionTime = 0;
        detectionDuration = 0;
        clearTimeout(detectionTimer);
        detectionTimer = null;
        document.getElementById("letter-display").style.color = "black";
    }
}

function updateLetterDisplay() {
    document.getElementById("letter-display").textContent = currentLetter;
    document.getElementById("letter-display").style.color = "black";
}

function nextLetter() {
    let previousLetter = currentLetter;
    alphabetIndex++;
    if (alphabetIndex >= alphabet.length) {
        addMessageToChat("Congratulations! You've completed the alphabet!", 'bot');
        return;
    }
    currentLetter = alphabet[alphabetIndex];
    updateLetterDisplay();
    sendAutomaticMessage(`User has correctly signed the letter ${previousLetter}. Moving to the next letter: ${currentLetter}`);
}

function skipLetter() {
    let previousLetter = currentLetter;
    alphabetIndex++;
    if (alphabetIndex >= alphabet.length) {
        addMessageToChat("Congratulations! You've completed the alphabet!", 'bot');
        return;
    }
    currentLetter = alphabet[alphabetIndex];
    updateLetterDisplay();
    sendAutomaticMessage(`User has skipped the letter ${previousLetter}. Moving to the next letter: ${currentLetter}`);
}

function startChat() {
    sendAutomaticMessage("Let's start learning sign language!");
}

function sendAutomaticMessage(message) {
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            currentLetter: currentLetter
        }),
    })
    .then(response => response.json())
    .then(data => {
        addMessageToChat(data.response, 'bot');
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function sendMessage() {
    const userInput = document.getElementById("user-input");
    const message = userInput.value.trim();
    if (message === "") return;

    addMessageToChat(message, 'user');

    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            currentLetter: currentLetter
        }),
    })
    .then(response => response.json())
    .then(data => {
        addMessageToChat(data.response, 'bot');
    })
    .catch((error) => {
        console.error('Error:', error);
    });

    userInput.value = "";
}

function addMessageToChat(message, sender) {
    const chatContainer = document.getElementById("chat-container");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender + "-message");
    messageElement.textContent = message;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

document.getElementById("user-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// Add click event listener to the send button
document.querySelector("#input-container button").addEventListener("click", sendMessage);
