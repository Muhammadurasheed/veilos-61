
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import CreateSanctuary from '@/components/sanctuary/CreateSanctuary';
import SanctuarySpace from '@/components/sanctuary/SanctuarySpace';

const Sanctuary = () => {
  const { id, role } = useParams<{ id?: string; role?: string }>();
  
  // If no ID, show creation form
  if (!id) {
    return (
      <Layout>
        <div className="container px-4 pt-6 mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Create a Sanctuary Space</h1>
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
