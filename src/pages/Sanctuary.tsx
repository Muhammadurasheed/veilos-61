
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import CreateSanctuary from '@/components/sanctuary/CreateSanctuary';
import SanctuarySpace from '@/components/sanctuary/SanctuarySpace';
import { Mic, Shield } from 'lucide-react';

const Sanctuary = () => {
  const { id, role } = useParams<{ id?: string; role?: string }>();
  const navigate = useNavigate();
  
  // If no ID, show creation form
  if (!id) {
    return (
      <Layout>
      <div className="container px-4 pt-6 mx-auto">
        <div className="flex flex-col items-center justify-center mb-8 space-y-4">
          <h1 className="text-3xl font-bold text-center">Create a Sanctuary Space</h1>
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate('/flagship-sanctuary')}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Mic className="h-4 w-4" />
              Live Audio Space
            </Button>
            <Button 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Anonymous Support
            </Button>
          </div>
        </div>
        <CreateSanctuary />
      </div>
      </Layout>
    );
  }
  
  // If ID exists, show the sanctuary space
  return (
    <Layout hideSidebar={true}>
      <div className="container px-4 pt-6 mx-auto">
        <SanctuarySpace isHost={role === 'host'} />
      </div>
    </Layout>
  );
};

export default Sanctuary;
