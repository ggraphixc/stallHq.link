import React, { useState, useEffect } from "react";
import { Pressable, Text, StyleSheet, Platform } from "react-native";
import { Colors, FontSize, Spacing, BorderRadius } from "../lib/theme";
import { Mic, MicOff } from "lucide-react-native";

interface Props {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
}

/**
 * Voice search button using Expo Speech recognition.
 * Falls back gracefully on platforms that don't support speech recognition.
 */
export function VoiceSearchButton({ onResult, onError }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if speech recognition is available
    if (Platform.OS === "web" && !("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setIsSupported(false);
    }
  }, []);

  async function toggleListening() {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (Platform.OS === "web") {
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
          onResult(transcript);
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.warn("[voice] recognition error:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed") {
            onError?.("Microphone permission denied");
          } else {
            onError?.("Voice recognition failed. Try again.");
          }
        };

        recognition.onend = () => setIsListening(false);

        recognition.start();
      } catch (err) {
        console.warn("[voice] init error:", err);
        setIsListening(false);
        onError?.("Could not start voice recognition");
      }
    } else {
      // On native, use expo-speech for text-to-speech (speech recognition requires native modules)
      // For now, show a message that voice search is coming soon on mobile
      onError?.("Voice search is available on web. Coming soon to mobile!");
    }
  }

  if (!isSupported) return null;

  return (
    <Pressable
      style={[styles.btn, isListening && styles.btnActive]}
      onPress={toggleListening}
    >
      {isListening ? (
        <MicOff size={16} color="#fff" />
      ) : (
        <Mic size={16} color={Colors.textSecondary} />
      )}
      {isListening && <Text style={styles.listeningText}>Listening...</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: "row",
    width: "auto",
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  listeningText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: "#fff",
  },
});
