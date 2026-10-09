import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

MYMEMORY_URL = "https://api.mymemory.translated.net/get"
MYMEMORY_EMAIL = os.getenv("MYMEMORY_EMAIL")

LANGUAGES = {
    "en": "English",
    "ur": "Urdu",
    "ar": "Arabic",
    "hi": "Hindi",
    "fr": "French",
    "de": "German",
    "es": "Spanish",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "tr": "Turkish",
    "zh-CN": "Chinese (Simplified)",
    "ja": "Japanese",
    "ko": "Korean",
}

   # Kuch languages ke liye MyMemory ko full code chahiye
MYMEMORY_CODES = {
    "ko": "ko-KR",
    "ja": "ja-JP",
}


def translate_with_mymemory(text, source, target):
    """Is function mein sirf API ka kaam hai.
    Baad mein Google ya Microsoft lagana ho to sirf yehi function badlega."""
    src = MYMEMORY_CODES.get(source, source)
    tgt = MYMEMORY_CODES.get(target, target)

    params = {"q": text, "langpair": f"{src}|{tgt}"}
    if MYMEMORY_EMAIL:
        params["de"] = MYMEMORY_EMAIL

    response = requests.get(MYMEMORY_URL, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    if data.get("responseStatus") != 200:
        raise ValueError(data.get("responseDetails", "Translation failed"))

    translated = data["responseData"]["translatedText"]

    # Agar API ne wahi text wapas kar diya to translation nahi hui
    if len(text.split()) > 1 and translated.strip().lower() == text.strip().lower():
        raise ValueError(
            "Translation not available for this text. Try a clearer sentence."
        )

    return translated



@app.route("/languages", methods=["GET"])
def get_languages():
    return jsonify(LANGUAGES)


@app.route("/translate", methods=["POST"])
def translate():
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    source = body.get("source")
    target = body.get("target")

    if not text:
        return jsonify({"error": "Please enter some text."}), 400
    if len(text) > 500:
        return jsonify({"error": "Text is too long (max 500 characters)."}), 400
    if source not in LANGUAGES or target not in LANGUAGES:
        return jsonify({"error": "Invalid language selected."}), 400
    if source == target:
        return jsonify({"error": "Source and target languages are the same."}), 400

    try:
        translated = translate_with_mymemory(text, source, target)
        return jsonify({"translated": translated})
    except requests.exceptions.RequestException:
        return jsonify({"error": "Could not reach the translation service."}), 502
    except ValueError as e:
        return jsonify({"error": str(e)}), 502


if __name__ == "__main__":
    app.run(debug=True)