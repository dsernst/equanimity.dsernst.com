export function speakLabel(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.5
  utterance.volume = 0.75
  window.speechSynthesis.speak(utterance)
}
