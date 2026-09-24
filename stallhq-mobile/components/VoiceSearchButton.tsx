import React, { useEffect, useRef, useState } from "react";
import { Pressable, Text, StyleSheet, Platform, View } from "react-native";
import { Colors, FontSize, Spacing, BorderRadius, useThemeStyles } from "../lib/theme";
import { Mic, MicOff } from "lucide-react-native";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";

interface Props {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
}

function messageForError(code: string): string {
  switch (code) {
    case "not-allowed":
      return "Microphone permission denied";
    case "no-speech":
    case "speech-timeout":
      return "Didn't catch that. Try again.";
    case "network":
      return "Voice search needs a network connection.";
    case "language-not-supported":
      return "Voice search isn't supported for this language.";
    case "busy":
      return "Voice search is busy. Try again in a moment.";
    default:
      return "Voice recognition failed. Try again.";
  }
}

/**
 * Voice search button.
 * Native: expo-speech-recognition. Web: browser SpeechRecognition API.
 */
export function VoiceSearchButton({ onResult, onError }: Props) {
  const styles = useThemeStyles(makeStyles);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === "web" && !("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setIsSupported(false);
    }
  }, []);

  // Native events — never fire on web (web drives state through the legacy API below).
  useSpeechRecognitionEvent("result", (e) => {
    const t = e.results?.[0]?.transcript;
    if (t) onResult(t);
  });
  useSpeechRecognitionEvent("end", () => setIsListening(false));
  useSpeechRecognitionEvent("error", (e) => {
    setIsListening(false);
    if (e.error === "aborted") return;
    onError?.(messageForError(e.error));
  });

  async function startNative() {
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        onError?.("Microphone permission denied");
        return;
      }
      ExpoSpeechRecognitionModule.start({ lang: "en-NG", interimResults: true });
      setIsListening(true);
    } catch {
      setIsListening(false);
      onError?.("Could not start voice recognition");
    }
  }

  function stopNative() {
    // stop() (vs abort()) asks the engine for a final result first.
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {}
    setIsListening(false);
  }

  function startWeb() {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        onError?.("Speech recognition not supported in this browser");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-NG"; // Nigerian English
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) onResult(transcript);
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        recognitionRef.current = null;
        onError?.(
          event.error === "not-allowed" ? "Microphone permission denied" : "Voice recognition failed. Try again."
        );
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
      onError?.("Could not start voice recognition");
    }
  }

  async function toggleListening() {
    if (Platform.OS === "web") {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
        setIsListening(false);
        return;
      }
      startWeb();
      return;
    }

    if (isListening) {
      stopNative();
      return;
    }
    await startNative();
  }

  if (!isSupported) return null;

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.btn, isListening && styles.btnActive]}
        onPress={toggleListening}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isListening ? "Stop voice search" : "Start voice search"}
        accessibilityState={{ selected: isListening }}
      >
        {isListening ? (
          <MicOff size={16} color="#fff" />
        ) : (
          <Mic size={16} color={Colors.textSecondary} />
        )}
      </Pressable>
      {isListening && (
        <Text style={styles.listeningText} numberOfLines={1}>
          Listening…
        </Text>
      )}
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  btnActive: {
    backgroundColor: Colors.red,
    borderColor: Colors.red,
  },
  listeningText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.red,
  },
});
