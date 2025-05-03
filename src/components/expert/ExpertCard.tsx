
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Expert } from "@/types";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExpertCardProps {
  expert: Expert;
}

const ExpertCard = ({ expert }: ExpertCardProps) => {
  const getVerificationBadge = () => {
    switch (expert.verificationLevel) {
      case 'platinum':
        return <Badge className="bg-veilo-gold-dark text-white">Platinum Verified</Badge>;
      case 'gold':
        return <Badge className="bg-veilo-gold text-white">Gold Verified</Badge>;
      case 'blue':
        return <Badge className="bg-veilo-blue text-white">Verified</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Card className="h-full glass card-hover">
      <CardContent className="pt-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-14 w-14 border-2 border-veilo-blue-light">
              <AvatarImage src={expert.avatarUrl} alt={expert.name} />
              <AvatarFallback className="bg-veilo-gold-light text-veilo-gold-dark">
                {expert.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-semibold text-veilo-blue-dark">{expert.name}</h3>
              <p className="text-sm text-gray-500">{expert.specialization}</p>
            </div>
          </div>
          
          {getVerificationBadge()}
        </div>
        
        <p className="text-sm text-gray-700 mb-4 flex-grow">{expert.bio}</p>
        
        <div className="space-y-3 mt-auto">
          <div className="flex flex-wrap gap-1">
            {expert.topicsHelped.slice(0, 3).map((topic, index) => (
              <Badge key={index} variant="outline" className="bg-veilo-blue-light bg-opacity-30 border-none text-veilo-blue-dark">
                {topic}
              </Badge>
            ))}
            {expert.topicsHelped.length > 3 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="bg-veilo-blue-light bg-opacity-30 border-none text-veilo-blue-dark cursor-help">
                      +{expert.topicsHelped.length - 3}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      {expert.topicsHelped.slice(3).join(', ')}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-veilo-green-dark font-medium">
              {expert.pricingModel}
            </div>
            
            <div className="flex items-center">
              <div className="text-yellow-500 mr-1">★</div>
              <span className="text-sm font-medium">{expert.rating.toFixed(1)}</span>
            </div>
          </div>
          
          <Link to={`/beacons/${expert.id}`}>
            <Button className="w-full bg-white border border-veilo-blue text-veilo-blue hover:bg-veilo-blue hover:text-white transition-colors">
              Connect
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpertCard;
