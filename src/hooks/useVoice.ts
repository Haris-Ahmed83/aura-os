import { useState, useCallback, useRef } from 'react';
import type { TaskColumns } from '../App';
import { toast } from 'sonner';

export function useVoice(
  setTasks: React.Dispatch<React.SetStateAction<TaskColumns>>
) {
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const handleVoiceMemo = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition not supported in your browser. Try Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
      setIsListening(false);
      setTasks(prev => ({
        ...prev,
        todo: [
          { id: Date.now().toString(), title: `🎤 ${transcript}`, type: 'Idea', color: 'blue' },
          ...prev.todo,
        ],
      }));
      toast.success(`Voice task added: "${transcript}"`);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [isListening, setTasks]);

  return {
    isListening,
    setIsListening,
    voiceTranscript,
    setVoiceTranscript,
    recognitionRef,
    handleVoiceMemo,
  };
}