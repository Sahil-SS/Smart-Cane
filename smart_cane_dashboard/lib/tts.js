export function speak(text) {
  if (!("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.lang = "en-US";

  window.speechSynthesis.cancel(); // stop previous
  window.speechSynthesis.speak(utterance);
}
