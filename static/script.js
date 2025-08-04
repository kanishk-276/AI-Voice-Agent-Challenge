async function generateAudio() {
  console.log("Script loaded!");

  const text = document.getElementById("textInput").value;
  const audioPlayer = document.getElementById("audioPlayer");

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
    audioPlayer.style.display = "block";
    audioPlayer.play();
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong!");
  }
}
