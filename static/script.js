document.addEventListener('DOMContentLoaded', () => {
    // ---------------- TEXT TO SPEECH ----------------
    const textInput = document.getElementById("textInput");
    const audioPlayer = document.getElementById("audioPlayer");

    window.generateAudio = async function() {
        console.log("Script loaded!");
        const text = textInput.value;

        if (!text.trim()) {
            alert("Please enter some text.");
            return;
        }

        try {
            const response = await fetch("/generate-audio", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ text: text })
            });

            if (!response.ok) {
                throw new Error("Request failed");
            }

            const data = await response.json();
            const audioUrl = data.audioFile || data.audio_url;
            audioPlayer.src = audioUrl;
            audioPlayer.classList.remove("hidden");
            audioPlayer.play();
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong!");
        }
    }

    // ---------------- ECHO BOT ----------------
    const startRecordingBtn = document.getElementById("startRecordingBtn");
    const stopRecordingBtn = document.getElementById("stopRecordingBtn");
    const recordedAudio = document.getElementById("recordedAudio");

    let mediaRecorder;
    let audioChunks = [];
    let mimeType;

    function getSupportedMimeType() {
        const types = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg",
        ];
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log(`Using supported MIME type: ${type}`);
                return type;
            }
        }
        return "audio/wav"; 
    }
    
    // Get the best supported MIME type
    mimeType = getSupportedMimeType();

    // Request microphone access and set up the MediaRecorder
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: mimeType });
    const audioUrl = URL.createObjectURL(audioBlob);
    recordedAudio.src = audioUrl;
    recordedAudio.classList.remove("hidden");

    // Prepare the audio file for upload
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const uploadStatus = document.getElementById("uploadStatus");
    if (uploadStatus) uploadStatus.textContent = "🔄 Transcribing...";

    try {
        // Send to new endpoint: /transcribe/file
        const response = await fetch("/transcribe/file", {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error(await response.text());

        const result = await response.json();
        console.log("Transcription result:", result);

        // Update status and transcript
        if (uploadStatus) {
            uploadStatus.textContent = "✅ Transcription complete";
        }

        const transcriptDiv = document.getElementById("transcript");
        if (transcriptDiv) {
            transcriptDiv.textContent = `Transcript:  ${result.transcription}`;
        }
    } catch (error) {
        console.error("Transcription failed:", error);
        if (uploadStatus) uploadStatus.textContent = "❌ Transcription failed";
    }

    audioChunks = [];
};


        }) 
        .catch(err => {
            console.error("Error accessing the microphone: ", err);
            // You can add an alert here if you want to notify the user
        });

    // Event listeners for the Echo Bot buttons
    if (startRecordingBtn && stopRecordingBtn) {
        startRecordingBtn.addEventListener('click', () => {
            if (mediaRecorder && mediaRecorder.state === 'inactive') {
                mediaRecorder.start();
                startRecordingBtn.disabled = true;
                stopRecordingBtn.disabled = false;
                recordedAudio.classList.add("hidden");
            }
        });

        stopRecordingBtn.addEventListener('click', () => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                startRecordingBtn.disabled = false;
                stopRecordingBtn.disabled = true;
            }
        });
    }
});