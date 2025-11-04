import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VoiceRecorder } from '@/components/shared/VoiceRecorder';

interface VoiceNoteInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

export const VoiceNoteInput: React.FC<VoiceNoteInputProps> = ({
  value,
  onChange,
  label = 'Notes',
  placeholder = 'Type or speak your notes...',
  rows = 6,
  maxLength = 1000,
}) => {
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        className="resize-none"
      />
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{value.length} / {maxLength} characters</span>
      </div>

      {/* Voice Input */}
      <Card className="p-3 bg-muted/30">
        <VoiceRecorder
          isRecording={isVoiceRecording}
          onRecordingChange={setIsVoiceRecording}
          onTranscript={(text) => {
            const newText = value ? `${value} ${text}` : text;
            onChange(newText.slice(0, maxLength));
          }}
        />
      </Card>
    </div>
  );
};
