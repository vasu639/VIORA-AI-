/**
 * Voice capabilities: Web SpeechSynthesis & SpeechRecognition
 * (Robust Continuous Dictation & Natural Articulation)
 */

export function speakQuestion(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel(); // stop anything already playing
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Pick a natural, clear voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Natural") ||
        v.name.includes("Google") ||
        v.name.includes("Samantha") ||
        v.name.includes("Daniel"))
  );
  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

export interface VoiceTranscriptResult {
  finalText: string;
  interimText: string;
  combinedText: string;
}

export interface VoiceRecognizerController {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

/**
 * Creates a SpeechRecognition instance that guarantees NO repeated words
 * or exploding text duplication when in continuous dictation mode.
 */
export function createVoiceRecognizer(
  onTranscript: (result: VoiceTranscriptResult) => void,
  onEndCallback?: () => void,
  onErrorCallback?: (err: string) => void
): VoiceRecognizerController | null {
  if (typeof window === "undefined") return null;

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    return null;
  }

  try {
    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let isExplicitlyStopped = false;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      // In Web Speech API with continuous=true, event.results contains the entire list
      // of speech chunks recognized during this active session.
      // Iterating from 0 to results.length ensures we get the EXACT current state,
      // never appending stale chunks to an already-accumulated state.
      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item && item[0]) {
          const piece = item[0].transcript;
          if (item.isFinal) {
            finalTranscript += piece + " ";
          } else {
            interimTranscript += piece;
          }
        }
      }

      const cleanFinal = finalTranscript.trim();
      const cleanInterim = interimTranscript.trim();
      const combined = (cleanFinal + " " + cleanInterim).replace(/\s+/g, " ").trim();

      onTranscript({
        finalText: cleanFinal,
        interimText: cleanInterim,
        combinedText: combined,
      });
    };

    recognition.onerror = (event: any) => {
      // "no-speech" is common when user pauses to think; not a fatal error
      if (event.error === "no-speech") {
        return;
      }
      console.warn("Speech recognition event:", event.error);
      if (onErrorCallback) {
        onErrorCallback(event.error);
      }
    };

    recognition.onend = () => {
      if (!isExplicitlyStopped && onEndCallback) {
        onEndCallback();
      }
    };

    return {
      start: () => {
        isExplicitlyStopped = false;
        try {
          recognition.start();
        } catch (err) {
          console.warn("Recognition already started or error:", err);
        }
      },
      stop: () => {
        isExplicitlyStopped = true;
        try {
          recognition.stop();
        } catch (e) {}
        if (onEndCallback) {
          onEndCallback();
        }
      },
      abort: () => {
        isExplicitlyStopped = true;
        try {
          recognition.abort();
        } catch (e) {}
      },
    };
  } catch (err) {
    console.warn("Could not instantiate SpeechRecognition:", err);
    return null;
  }
}
