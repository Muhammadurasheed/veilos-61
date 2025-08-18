import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Settings, 
  Mic, 
  Volume2, 
  Shield, 
  Headphones,
  Speaker,
  Waves
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

interface SanctuaryAudioSettingsProps {
  currentVolume: number;
  onVolumeChange: (volume: number) => void;
  onDeviceChange?: (deviceId: string, type: 'input' | 'output') => void;
  onToggleNoiseSupression?: (enabled: boolean) => void;
  onToggleEchoCancel?: (enabled: boolean) => void;
}

const SanctuaryAudioSettings = ({
  currentVolume,
  onVolumeChange,
  onDeviceChange,
  onToggleNoiseSupression,
  onToggleEchoCancel
}: SanctuaryAudioSettingsProps) => {
  const { toast } = useToast();
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState<string>('');
  const [selectedOutputDevice, setSelectedOutputDevice] = useState<string>('');
  const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState(true);
  const [echoCancelEnabled, setEchoCancelEnabled] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [micSensitivity, setMicSensitivity] = useState([70]);
  const [isTestingAudio, setIsTestingAudio] = useState(false);

  // Load available audio devices
  useEffect(() => {
    const loadAudioDevices = async () => {
      try {
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDeviceList: AudioDevice[] = devices
          .filter(device => device.kind === 'audioinput' || device.kind === 'audiooutput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `${device.kind === 'audioinput' ? 'Microphone' : 'Speaker'} ${device.deviceId.slice(0, 4)}`,
            kind: device.kind as 'audioinput' | 'audiooutput'
          }));

        setAudioDevices(audioDeviceList);

        // Set default devices
        const defaultInput = audioDeviceList.find(d => d.kind === 'audioinput');
        const defaultOutput = audioDeviceList.find(d => d.kind === 'audiooutput');
        
        if (defaultInput) setSelectedInputDevice(defaultInput.deviceId);
        if (defaultOutput) setSelectedOutputDevice(defaultOutput.deviceId);

      } catch (error) {
        console.error('Failed to load audio devices:', error);
        toast({
          title: "Audio Device Error",
          description: "Unable to access audio devices. Please check permissions.",
          variant: "destructive"
        });
      }
    };

    loadAudioDevices();
  }, [toast]);

  const handleInputDeviceChange = (deviceId: string) => {
    setSelectedInputDevice(deviceId);
    onDeviceChange?.(deviceId, 'input');
    toast({
      title: "Input Device Changed",
      description: "Microphone device updated successfully"
    });
  };

  const handleOutputDeviceChange = (deviceId: string) => {
    setSelectedOutputDevice(deviceId);
    onDeviceChange?.(deviceId, 'output');
    toast({
      title: "Output Device Changed",
      description: "Speaker device updated successfully"
    });
  };

  const handleNoiseSuppressionToggle = (enabled: boolean) => {
    setNoiseSuppressionEnabled(enabled);
    onToggleNoiseSupression?.(enabled);
    toast({
      title: enabled ? "Noise Suppression Enabled" : "Noise Suppression Disabled",
      description: enabled ? "Background noise will be reduced" : "Background noise filtering disabled"
    });
  };

  const handleEchoCancelToggle = (enabled: boolean) => {
    setEchoCancelEnabled(enabled);
    onToggleEchoCancel?.(enabled);
    toast({
      title: enabled ? "Echo Cancellation Enabled" : "Echo Cancellation Disabled",
      description: enabled ? "Echo and feedback will be reduced" : "Echo cancellation disabled"
    });
  };

  const testAudioOutput = async () => {
    setIsTestingAudio(true);
    try {
      // Create a simple audio test tone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
        setIsTestingAudio(false);
      }, 1000);

      toast({
        title: "Audio Test",
        description: "Playing test tone for 1 second"
      });
    } catch (error) {
      setIsTestingAudio(false);
      toast({
        title: "Audio Test Failed",
        description: "Unable to play test audio",
        variant: "destructive"
      });
    }
  };

  const inputDevices = audioDevices.filter(d => d.kind === 'audioinput');
  const outputDevices = audioDevices.filter(d => d.kind === 'audiooutput');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Audio Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Headphones className="h-5 w-5 mr-2" />
            Audio Settings
          </DialogTitle>
          <DialogDescription>
            Customize your audio experience in the sanctuary
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Volume Control */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Volume2 className="h-4 w-4 mr-2" />
                Volume Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Master Volume</Label>
                  <Badge variant="outline">{currentVolume}%</Badge>
                </div>
                <Slider
                  value={[currentVolume]}
                  onValueChange={(value) => onVolumeChange(value[0])}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Microphone Sensitivity</Label>
                  <Badge variant="outline">{micSensitivity[0]}%</Badge>
                </div>
                <Slider
                  value={micSensitivity}
                  onValueChange={setMicSensitivity}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Audio Devices */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Speaker className="h-4 w-4 mr-2" />
                Audio Devices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Device */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Mic className="h-3 w-3 mr-1" />
                  Microphone
                </Label>
                <select
                  className="w-full p-2 border rounded-md text-sm"
                  value={selectedInputDevice}
                  onChange={(e) => handleInputDeviceChange(e.target.value)}
                >
                  {inputDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Output Device */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Speaker className="h-3 w-3 mr-1" />
                  Speaker
                </Label>
                <select
                  className="w-full p-2 border rounded-md text-sm"
                  value={selectedOutputDevice}
                  onChange={(e) => handleOutputDeviceChange(e.target.value)}
                >
                  {outputDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={testAudioOutput}
                disabled={isTestingAudio}
                className="w-full"
              >
                <Waves className="h-4 w-4 mr-2" />
                {isTestingAudio ? 'Testing...' : 'Test Audio'}
              </Button>
            </CardContent>
          </Card>

          {/* Audio Enhancement */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Audio Enhancement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="noise-suppression" className="text-sm">
                  Noise Suppression
                </Label>
                <Switch
                  id="noise-suppression"
                  checked={noiseSuppressionEnabled}
                  onCheckedChange={handleNoiseSuppressionToggle}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="echo-cancel" className="text-sm">
                  Echo Cancellation
                </Label>
                <Switch
                  id="echo-cancel"
                  checked={echoCancelEnabled}
                  onCheckedChange={handleEchoCancelToggle}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-gain" className="text-sm">
                  Auto Gain Control
                </Label>
                <Switch
                  id="auto-gain"
                  checked={autoGainControl}
                  onCheckedChange={setAutoGainControl}
                />
              </div>
            </CardContent>
          </Card>

          {/* Audio Quality Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="text-xs text-blue-700 space-y-1">
                <p className="font-medium">Audio Quality Tips:</p>
                <ul className="space-y-1 ml-2">
                  <li>• Use headphones to prevent echo</li>
                  <li>• Find a quiet environment</li>
                  <li>• Keep microphone close but not too close</li>
                  <li>• Test your audio before joining sessions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SanctuaryAudioSettings;