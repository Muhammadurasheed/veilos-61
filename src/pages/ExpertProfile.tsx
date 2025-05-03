
import { useParams, Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/layout/Layout';
import { useVeiloData } from '@/contexts/VeiloDataContext';

const ExpertProfile = () => {
  const { expertId } = useParams<{ expertId: string }>();
  const { experts } = useVeiloData();
  
  const expert = experts.find(e => e.id === expertId);
  
  if (!expert) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Expert not found</h1>
          <p className="mb-8">The expert you're looking for doesn't exist or has been removed.</p>
          <Link to="/beacons">
            <Button>Back to Beacons</Button>
          </Link>
        </div>
      </Layout>
    );
  }
  
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
    <Layout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/beacons" className="inline-flex items-center text-veilo-blue hover:text-veilo-blue-dark mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Beacons
          </Link>
          
          <Card className="mb-8 glass">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 flex flex-col items-center text-center">
                  <Avatar className="h-36 w-36 mb-4 border-4 border-veilo-blue-light">
                    <AvatarImage src={expert.avatarUrl} alt={expert.name} />
                    <AvatarFallback className="text-2xl bg-veilo-gold-light text-veilo-gold-dark">
                      {expert.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h1 className="text-2xl font-bold text-veilo-blue-dark mb-1">{expert.name}</h1>
                  <p className="text-gray-500 mb-2">{expert.specialization}</p>
                  
                  <div className="mb-4">{getVerificationBadge()}</div>
                  
                  <div className="flex items-center justify-center mb-6">
                    <span className="text-yellow-500 mr-1">★</span>
                    <span className="font-medium">{expert.rating.toFixed(1)}</span>
                  </div>
                  
                  <Button className="w-full mb-2 bg-veilo-blue hover:bg-veilo-blue-dark text-white">
                    Request Private Session
                  </Button>
                  
                  <p className="text-sm text-veilo-green-dark font-medium">
                    {expert.pricingModel}
                  </p>
                </div>
                
                <div className="md:w-2/3">
                  <h2 className="text-xl font-semibold mb-3 text-veilo-blue-dark">About</h2>
                  <p className="text-gray-700 mb-6">{expert.bio}</p>
                  
                  <h2 className="text-xl font-semibold mb-3 text-veilo-blue-dark">Areas of Expertise</h2>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {expert.topicsHelped.map((topic, index) => (
                      <Badge key={index} className="bg-veilo-blue-light bg-opacity-40 text-veilo-blue-dark border-none">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <h2 className="text-2xl font-bold mb-4 text-veilo-blue-dark">Testimonials</h2>
          
          {expert.testimonials.length > 0 ? (
            <div className="space-y-4">
              {expert.testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="glass">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10 mt-1">
                        <AvatarImage src={`/avatars/avatar-${testimonial.user.avatarIndex}.svg`} alt={testimonial.user.alias} />
                        <AvatarFallback className="bg-veilo-blue-light text-veilo-blue-dark">
                          {testimonial.user.alias.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <p className="font-medium text-gray-700 mb-1">{testimonial.user.alias}</p>
                        <p className="text-gray-600">{testimonial.text}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center p-6">
              <p className="text-gray-500">No testimonials yet.</p>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExpertProfile;
