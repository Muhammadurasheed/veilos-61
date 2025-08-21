import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, MessageSquare, Calendar } from 'lucide-react';

interface ExpertProfileActionsProps {
  expertId: string;
  expertName: string;
  isOnline: boolean;
}

const ExpertProfileActions = ({ expertId, expertName, isOnline }: ExpertProfileActionsProps) => {
  const navigate = useNavigate();

  const handleVoiceCall = () => {
    navigate(`/call/${expertId}/voice`);
  };

  const handleVideoCall = () => {
    navigate(`/call/${expertId}/video`);
  };

  const handleChat = () => {
    navigate(`/chat/${expertId}`);
  };

  const handleBookSession = () => {
    navigate(`/sessions/book/${expertId}`);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        onClick={handleChat}
        className="flex items-center gap-2"
        disabled={!isOnline}
      >
        <MessageSquare className="h-4 w-4" />
        Chat Now
      </Button>
      
      <Button
        onClick={handleVoiceCall}
        variant="outline"
        className="flex items-center gap-2"
        disabled={!isOnline}
      >
        <Phone className="h-4 w-4" />
        Voice Call
      </Button>
      
      <Button
        onClick={handleVideoCall}
        variant="outline"
        className="flex items-center gap-2"
        disabled={!isOnline}
      >
        <Video className="h-4 w-4" />
        Video Call
      </Button>
      
      <Button
        onClick={handleBookSession}
        variant="secondary"
        className="flex items-center gap-2"
      >
        <Calendar className="h-4 w-4" />
        Book Session
      </Button>
    </div>
  );
};

export default ExpertProfileActions;