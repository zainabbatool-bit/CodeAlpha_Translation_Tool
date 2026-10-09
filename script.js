const API_URL = "http://127.0.0.1:5000";

const sourceLang = document.getElementById("sourceLang");
const targetLang = document.getElementById("targetLang");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const charCount = document.getElementById("charCount");
const translateBtn = document.getElementById("translateBtn");
const message = document.getElementById("message");

// 1. Page khulte hi languages load karo
async function loadLanguages() {
  try {
    const response = await fetch(`${API_URL}/languages`);
    const languages = await response.json();

    sourceLang.innerHTML = "";
    targetLang.innerHTML = "";

    for (const [code, name] of Object.entries(languages)) {
      sourceLang.add(new Option(name, code));
      targetLang.add(new Option(name, code));
    }

    // Default: English -> Urdu
    sourceLang.value = "en";
    targetLang.value = "ur";
  } catch (error) {
    showMessage("Could not connect to the server. Is the backend running?");
  }
}

// 2. Characters count karo
inputText.addEventListener("input", () => {
  charCount.textContent = `${inputText.value.length} / 500`;
});

// 3. Translate button
translateBtn.addEventListener("click", async () => {
  const text = inputText.value.trim();

  if (!text) {
    showMessage("Please enter some text.");
    return;
  }

  if (sourceLang.value === targetLang.value) {
    showMessage("Source and target languages are the same.");
    return;
  }

  showMessage("");
  translateBtn.disabled = true;
  translateBtn.textContent = "Translating...";

  try {
    const response = await fetch(`${API_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text,
        source: sourceLang.value,
        target: targetLang.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "Something went wrong.");
    } else {
      outputText.textContent = data.translated;
      outputText.classList.remove("placeholder");
    }
  } catch (error) {
    showMessage("Could not connect to the server. Is the backend running?");
  } finally {
    translateBtn.disabled = false;
    translateBtn.textContent = "Translate";
  }
});

function showMessage(text) {
  message.textContent = text;
}

loadLanguages();
// ===== Phase 5: Copy, Speak, Swap =====

const copyBtn = document.getElementById("copyBtn");
const speakBtn = document.getElementById("speakBtn");
const swapBtn = document.getElementById("swapBtn");

const PLACEHOLDER_TEXT = "Translation will appear here";

// Speech ke liye full language codes
const SPEECH_CODES = {
  en: "en-US",
  ur: "ur-PK",
  ar: "ar-SA",
  hi: "hi-IN",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  it: "it-IT",
  pt: "pt-PT",
  ru: "ru-RU",
  tr: "tr-TR",
  "zh-CN": "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
};

function hasTranslation() {
  const text = outputText.textContent.trim();
  return text !== "" && text !== PLACEHOLDER_TEXT;
}

// 1. Copy button
copyBtn.addEventListener("click", async () => {
  if (!hasTranslation()) {
    showMessage("Nothing to copy yet. Translate something first.");
    return;
  }

  showMessage("");
  const text = outputText.textContent;

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // Purane browsers ke liye backup tareeqa
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
  }

  copyBtn.textContent = "Copied!";
  setTimeout(() => {
    copyBtn.textContent = "Copy";
  }, 1500);
});

// 2. Speak button (Text-to-Speech)
speakBtn.addEventListener("click", () => {
  if (!hasTranslation()) {
    showMessage("Nothing to speak yet. Translate something first.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    showMessage("Your browser does not support text-to-speech.");
    return;
  }

  showMessage("");
  window.speechSynthesis.cancel(); // pehli awaaz band karo

  const utterance = new SpeechSynthesisUtterance(outputText.textContent);
  utterance.lang = SPEECH_CODES[targetLang.value] || targetLang.value;
  window.speechSynthesis.speak(utterance);
});

// 3. Swap button
swapBtn.addEventListener("click", () => {
  const tempLang = sourceLang.value;
  sourceLang.value = targetLang.value;
  targetLang.value = tempLang;

  // Agar translation maujood hai to text bhi swap karo
  if (hasTranslation()) {
    inputText.value = outputText.textContent;
    outputText.textContent = PLACEHOLDER_TEXT;
    charCount.textContent = `${inputText.value.length} / 500`;
  }

  showMessage("");
});