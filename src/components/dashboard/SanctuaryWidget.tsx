import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Plus, 
  MessageCircle, 
  Users, 
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SanctuaryDashboard } from '@/components/sanctuary/SanctuaryDashboard';

export const SanctuaryWidget = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              My Sanctuaries
            </div>
            <Link to="/my-sanctuaries">
              <Button size="sm" variant="outline">
                View All
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SanctuaryDashboard className="space-y-3" />
          
          <div className="mt-4 pt-4 border-t">
            <Link to="/sanctuary">
              <Button className="w-full" variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Create New Sanctuary
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};