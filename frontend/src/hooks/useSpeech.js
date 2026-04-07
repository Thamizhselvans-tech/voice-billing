import { useState, useRef, useCallback } from 'react';

export default function useSpeech() {
  const [transcript, setTranscript]   = useState('');
  const [interim,    setInterim]      = useState('');
  const [listening,  setListening]    = useState(false);
  const [error,      setError]        = useState('');
  const recogRef = useRef(null);

  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const start = useCallback(() => {
    if (!isSupported) { setError('Speech recognition not supported in this browser.'); return; }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = 'en-IN';
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart  = () => { setListening(true); setError(''); setInterim(''); };
    rec.onend    = () => { setListening(false); setInterim(''); };
    rec.onerror  = e  => { setListening(false); setError(e.error); };

    rec.onresult = e => {
      let fin = '', intr = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t;
        else intr += t;
      }
      if (fin) setTranscript(fin.trim());
      setInterim(intr);
    };

    recogRef.current = rec;
    rec.start();
  }, [isSupported]);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterim('');
    setError('');
  }, []);

  return { transcript, interim, listening, error, isSupported, start, stop, reset };
}
