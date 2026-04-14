import * as Speech from "expo-speech";

export function speak(text: string) {
  Speech.stop(); // Stop previous utterance

  Speech.speak(text, {
    language: "en-US",
    pitch: 1,
    rate: 1,
  });
}
