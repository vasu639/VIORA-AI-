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

export interface VoiceRecognizerOptions {
  onFinalChunk: (chunk: string) => void;
  onInterimText?: (interim: string) => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}

export interface VoiceRecognizerController {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

/**
 * Normalizes a word for comparison by trimming, lowercasing, and stripping punctuation.
 */
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, "");
}

/**
 * Comprehensive deduplication that removes:
 * 1. Immediate duplicate sentences
 * 2. Multi-word repeated phrases (length 10 down to 2)
 * 3. Immediate duplicate single words (e.g. "the the", "is is", "memory memory")
 */
export function deduplicateRepeatedText(rawText: string): string {
  if (!rawText || !rawText.trim()) return "";

  // 1. Remove duplicate consecutive sentences
  const sentences = rawText.split(/(?<=[.?!])\s+/);
  const dedupedSentences: string[] = [];
  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if (
      dedupedSentences.length > 0 &&
      normalizeWord(dedupedSentences[dedupedSentences.length - 1]) === normalizeWord(trimmed)
    ) {
      continue;
    }
    dedupedSentences.push(trimmed);
  }
  const cleanedText = dedupedSentences.join(" ");

  // 2. Remove repeated word sequences of length k = 10 down to 1
  const words = cleanedText.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return cleanedText.trim();

  let modified = true;
  let iterations = 0;

  while (modified && iterations < 10) {
    modified = false;
    iterations++;

    for (let k = Math.min(10, Math.floor(words.length / 2)); k >= 1; k--) {
      for (let i = 0; i <= words.length - 2 * k; i++) {
        let match = true;
        for (let j = 0; j < k; j++) {
          if (normalizeWord(words[i + j]) !== normalizeWord(words[i + k + j])) {
            match = false;
            break;
          }
        }

        if (match) {
          // Remove the duplicate phrase
          words.splice(i + k, k);
          modified = true;
          break; // re-evaluate array after splice
        }
      }
      if (modified) break;
    }
  }

  return words.join(" ");
}

// Alias for backwards compatibility
export const removeDuplicateWordsAndPhrases = deduplicateRepeatedText;

/**
 * Safely appends a new speech chunk to existing text:
 * - Detects and removes any boundary overlap between the end of existing and the start of newChunk
 * - Strips duplicate words/phrases
 * - Ensures proper sentence capitalization and spacing
 */
export function appendSpeechChunk(existingText: string, newChunk: string): string {
  const e = (existingText || "").trim();
  const n = (newChunk || "").trim();

  if (!e) return deduplicateRepeatedText(n);
  if (!n) return deduplicateRepeatedText(e);

  const eWords = e.split(/\s+/).filter(Boolean);
  const nWords = n.split(/\s+/).filter(Boolean);

  if (eWords.length === 0) return deduplicateRepeatedText(n);
  if (nWords.length === 0) return deduplicateRepeatedText(e);

  // Check overlap from max(eWords, nWords, 12) down to 1
  const maxOverlap = Math.min(eWords.length, nWords.length, 12);
  let bestOverlap = 0;

  for (let k = maxOverlap; k >= 1; k--) {
    const eSlice = eWords.slice(eWords.length - k);
    const nSlice = nWords.slice(0, k);

    let match = true;
    for (let j = 0; j < k; j++) {
      if (normalizeWord(eSlice[j]) !== normalizeWord(nSlice[j])) {
        match = false;
        break;
      }
    }

    if (match) {
      bestOverlap = k;
      break;
    }
  }

  let merged = "";
  if (bestOverlap > 0) {
    const remainder = nWords.slice(bestOverlap).join(" ");
    merged = remainder ? `${e} ${remainder}` : e;
  } else {
    merged = `${e} ${n}`;
  }

  return deduplicateRepeatedText(merged);
}

// Alias for backwards compatibility
export const stitchTranscripts = appendSpeechChunk;

/**
 * Creates an event.resultIndex-driven SpeechRecognition controller that completely
 * eliminates speech repetition, Chromium bug 40484311 duplicates, and runaway text length.
 */
export function createVoiceRecognizer(
  optionsOrTranscript: VoiceRecognizerOptions | ((result: VoiceTranscriptResult) => void),
  onEndCallback?: () => void,
  onErrorCallback?: (err: string) => void
): VoiceRecognizerController | null {
  if (typeof window === "undefined") return null;

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    return null;
  }

  // Normalize callbacks
  let onFinalChunk: (chunk: string) => void;
  let onInterimText: (interim: string) => void;
  let onEnd: () => void;
  let onError: (err: string) => void;

  if (typeof optionsOrTranscript === "function") {
    // Legacy transcript callback adapter
    let accumulatedFinal = "";
    onFinalChunk = (chunk: string) => {
      accumulatedFinal = appendSpeechChunk(accumulatedFinal, chunk);
      optionsOrTranscript({
        finalText: accumulatedFinal,
        interimText: "",
        combinedText: accumulatedFinal,
      });
    };
    onInterimText = (interim: string) => {
      const combined = appendSpeechChunk(accumulatedFinal, interim);
      optionsOrTranscript({
        finalText: accumulatedFinal,
        interimText: interim,
        combinedText: combined,
      });
    };
    onEnd = () => {
      if (onEndCallback) onEndCallback();
    };
    onError = (err: string) => {
      if (onErrorCallback) onErrorCallback(err);
    };
  } else {
    onFinalChunk = optionsOrTranscript.onFinalChunk;
    onInterimText = optionsOrTranscript.onInterimText || (() => {});
    onEnd = optionsOrTranscript.onEnd || onEndCallback || (() => {});
    onError = optionsOrTranscript.onError || onErrorCallback || (() => {});
  }

  try {
    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let isExplicitlyStopped = false;
    let currentInterim = "";
    let lastFinalizedChunk = "";

    recognition.onresult = (event: any) => {
      let interim = "";

      // CRITICAL: Iterate strictly from event.resultIndex to process ONLY newly received speech
      // This prevents Chromium from re-processing and re-appending previously received chunks.
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result && result[0]) {
          const piece = result[0].transcript.trim();
          if (piece) {
            if (result.isFinal) {
              const cleaned = deduplicateRepeatedText(piece);
              // Avoid duplicate delivery of identical final chunk
              if (cleaned && cleaned !== lastFinalizedChunk) {
                lastFinalizedChunk = cleaned;
                currentInterim = "";
                onFinalChunk(cleaned);
              }
            } else {
              interim += piece + " ";
            }
          }
        }
      }

      currentInterim = interim.trim();
      onInterimText(currentInterim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        return; // normal pause while thinking
      }
      console.warn("Speech recognition event:", event.error);
      if (onError) {
        onError(event.error);
      }
    };

    recognition.onend = () => {
      // If user paused and browser closed connection, auto-restart to keep mic active without duplication
      if (!isExplicitlyStopped) {
        try {
          recognition.start();
          return;
        } catch (restartErr) {
          // If restart fails (e.g. permission revoked), conclude cleanly
        }
      }

      // If there was any non-finalized interim text when stopping, finalize it now so no speech is lost
      if (currentInterim) {
        const cleaned = deduplicateRepeatedText(currentInterim);
        if (cleaned && cleaned !== lastFinalizedChunk) {
          onFinalChunk(cleaned);
        }
        currentInterim = "";
      }

      if (onEnd) {
        onEnd();
      }
    };

    return {
      start: () => {
        isExplicitlyStopped = false;
        currentInterim = "";
        lastFinalizedChunk = "";
        try {
          recognition.start();
        } catch (err) {
          console.warn("Recognition start note:", err);
        }
      },
      stop: () => {
        isExplicitlyStopped = true;
        // Finalize any pending interim text immediately
        if (currentInterim) {
          const cleaned = deduplicateRepeatedText(currentInterim);
          if (cleaned && cleaned !== lastFinalizedChunk) {
            onFinalChunk(cleaned);
          }
          currentInterim = "";
          onInterimText("");
        }
        try {
          recognition.stop();
        } catch (e) {}
        if (onEnd) {
          onEnd();
        }
      },
      abort: () => {
        isExplicitlyStopped = true;
        currentInterim = "";
        onInterimText("");
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
