import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
  language?: string;
  continuous?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscript,
  isRecording,
  onRecordingChange,
  language = 'en-US',
  continuous = true,
}) => {
  const [isSupported, setIsSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Voice recognition started');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
      }

      if (final) {
        onTranscript(final.trim());
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        toast({
          title: 'No speech detected',
          description: 'Please speak clearly into your microphone',
          variant: 'destructive',
        });
      } else if (event.error === 'not-allowed') {
        toast({
          title: 'Microphone access denied',
          description: 'Please allow microphone access to use voice input',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Recognition error',
          description: `Error: ${event.error}`,
          variant: 'destructive',
        });
      }
      
      onRecordingChange(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      console.log('Voice recognition ended');
      if (isRecording) {
        // Automatically restart if still recording
        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
          onRecordingChange(false);
        }
      }
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, isRecording, onTranscript, onRecordingChange, toast]);

  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    } else {
      try {
        recognitionRef.current.stop();
        setInterimTranscript('');
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
    }
  }, [isRecording]);

  const toggleRecording = () => {
    onRecordingChange(!isRecording);
  };

  if (!isSupported) {
    return (
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground text-center">
          Voice input is not supported in this browser
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={toggleRecording}
        variant={isRecording ? 'destructive' : 'outline'}
        className="w-full h-14 text-base"
        size="lg"
      >
        {isRecording ? (
          <>
            <Square className="h-5 w-5 mr-2" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="h-5 w-5 mr-2" />
            Start Voice Input
          </>
        )}
      </Button>

      {isRecording && (
        <Card className="p-4 bg-primary/5 border-primary/20 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium">Listening...</span>
          </div>
          {interimTranscript && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              {interimTranscript}
            </p>
          )}
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {isRecording 
          ? 'Speak clearly. Your words will appear in the text box above.'
          : 'Click the button to start dictating your notes'
        }
      </p>
    </div>
  );
};
