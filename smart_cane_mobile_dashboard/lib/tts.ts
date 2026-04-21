// import * as Speech from "expo-speech";

// export function speak(text: string) {
//   Speech.stop(); // Stop previous utterance

//   Speech.speak(text, {
//     language: "en-US",
//     pitch: 1,
//     rate: 1,
//   });
// }

import * as Speech from "expo-speech";

export function speak(text: string) {
  try {
    // Synchronously stop the engine to clear the queue instantly
    // (No 'await' or 'isSpeakingAsync' checks needed)
    Speech.stop(); 

    Speech.speak(text, {
      language: "en-US",
      pitch: 1.0,
      rate: 1.15, // Keeping the faster tactical rate for quick feedback
    });
  } catch (err) {
    console.error("TTS Engine Error:", err);
  }
}