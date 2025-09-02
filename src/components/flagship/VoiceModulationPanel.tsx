import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Mic, Volume2, Wand2, Play, Pause, RefreshCw } from 'lucide-react';
import type { ElevenLabsVoice, ParticipantVoiceSettings } from '@/types/flagship-sanctuary';

interface VoiceModulationPanelProps {
  availableVoices: ElevenLabsVoice[];
  currentVoiceId?: string;
  currentSettings?: ParticipantVoiceSettings;
  isEnabled: boolean;
  onVoiceChange: (voiceId: string, settings?: ParticipantVoiceSettings) => Promise<void>;
  onToggleModulation: (enabled: boolean) => void;
  onPreviewVoice?: (voiceId: string) => Promise<void>;
}

export const VoiceModulationPanel: React.FC<VoiceModulationPanelProps> = ({
  availableVoices,
  currentVoiceId,
  currentSettings,
  isEnabled,
  onVoiceChange,
  onToggleModulation,
  onPreviewVoice
}) => {
  const { toast } = useToast();
  const [selectedVoice, setSelectedVoice] = useState(currentVoiceId || '');
  const [settings, setSettings] = useState<ParticipantVoiceSettings>(
    currentSettings || {
      voiceId: currentVoiceId || '',
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.5,
      useSpeakerBoost: true
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    if (currentVoiceId && currentVoiceId !== selectedVoice) {
      setSelectedVoice(currentVoiceId);
    }
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentVoiceId, currentSettings]);

  const handleVoiceChange = async (voiceId: string) => {
    setIsLoading(true);
    try {
      const newSettings = { ...settings, voiceId };
      await onVoiceChange(voiceId, newSettings);
      setSelectedVoice(voiceId);
      setSettings(newSettings);
      
      toast({
        title: "Voice Updated",
        description: `Switched to ${availableVoices.find(v => v.voiceId === voiceId)?.name || 'new voice'}`,
      });
    } catch (error) {
      toast({
        title: "Voice Change Failed",
        description: "Could not update voice. Using original voice.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = async (newSettings: Partial<ParticipantVoiceSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    if (selectedVoice && isEnabled) {
      try {
        await onVoiceChange(selectedVoice, updatedSettings);
      } catch (error) {
        console.error('Failed to update voice settings:', error);
      }
    }
  };

  const handlePreviewVoice = async (voiceId: string) => {
    if (!onPreviewVoice) return;
    
    setIsPreviewing(true);
    try {
      await onPreviewVoice(voiceId);
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Could not preview this voice",
        variant: "destructive"
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: ParticipantVoiceSettings = {
      voiceId: selectedVoice,
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.5,
      useSpeakerBoost: true
    };
    setSettings(defaultSettings);
    if (selectedVoice && isEnabled) {
      handleVoiceChange(selectedVoice);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wand2 className="h-5 w-5" />
            <span>Voice Modulation</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? "Active" : "Disabled"}
            </Badge>
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggleModulation}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Voice Style</label>
          <Select
            value={selectedVoice}
            onValueChange={handleVoiceChange}
            disabled={!isEnabled || isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a voice..." />
            </SelectTrigger>
            <SelectContent>
              {availableVoices.map((voice) => (
                <SelectItem key={voice.voiceId} value={voice.voiceId}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <span>{voice.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {voice.category}
                      </Badge>
                    </div>
                    {onPreviewVoice && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewVoice(voice.voiceId);
                        }}
                        disabled={isPreviewing}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Voice Settings */}
        {isEnabled && selectedVoice && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Advanced Settings</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={resetToDefaults}
                disabled={isLoading}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>

            {/* Stability */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Stability</label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(settings.stability * 100)}%
                </span>
              </div>
              <Slider
                value={[settings.stability]}
                onValueChange={([value]) => handleSettingsChange({ stability: value })}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Similarity Boost */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Similarity Boost</label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(settings.similarityBoost * 100)}%
                </span>
              </div>
              <Slider
                value={[settings.similarityBoost]}
                onValueChange={([value]) => handleSettingsChange({ similarityBoost: value })}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Style */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Style Enhancement</label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(settings.style * 100)}%
                </span>
              </div>
              <Slider
                value={[settings.style]}
                onValueChange={([value]) => handleSettingsChange({ style: value })}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Speaker Boost */}
            <div className="flex items-center justify-between">
              <label className="text-sm">Speaker Boost</label>
              <Switch
                checked={settings.useSpeakerBoost}
                onCheckedChange={(checked) => handleSettingsChange({ useSpeakerBoost: checked })}
              />
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {isEnabled ? (
            <>
              <Volume2 className="h-4 w-4 text-green-500" />
              <span>Voice modulation active</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              <span>Using original voice</span>
            </>
          )}
        </div>

        {isLoading && (
          <div className="text-center text-sm text-muted-foreground">
            Updating voice settings...
          </div>
        )}
      </CardContent>
    </Card>
  );
};