import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { ArrowLeft, Heart, Users, Zap } from 'lucide-react';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const donationAmounts = [
  { amount: 0.01, label: '$0.01', description: 'Cost of 1 scan + outreach' },
  { amount: 0.10, label: '$0.10', description: '10 scans + outreach' },
  { amount: 1.00, label: '$1.00', description: '100+ analyses' },
  { amount: 5.00, label: '$5.00', description: 'Cover your usage' },
];

function CheckoutForm({ amount }: { amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/donate/success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || processing}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3"
      >
        {processing ? 'Processing...' : `Donate $${amount} to Community Fund`}
      </Button>
    </form>
  );
}

export default function Donate() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAmountSelect = async (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    await createPaymentIntent(amount);
  };

  const handleCustomAmount = async () => {
    const amount = parseFloat(customAmount);
    if (amount < 1) return;
    
    setSelectedAmount(amount);
    await createPaymentIntent(amount);
  };

  const createPaymentIntent = async (amount: number) => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/create-donation-intent', { amount });
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Failed to create payment intent:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <div className="flex-1 py-4 px-4">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to JobScans
            </Button>
          </Link>
          
          <Card className="bg-white/90 backdrop-blur border-sage-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-sage-800">
                Support the Community
              </CardTitle>
              <CardDescription className="text-lg text-sage-600">
                Keep AI-powered job analysis free and accessible for everyone
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Cost Transparency */}
        <Card className="bg-white/90 backdrop-blur border-sage-200 mb-8">
          <CardHeader>
            <CardTitle className="text-sage-800 text-center">Transparent Cost Breakdown</CardTitle>
            <CardDescription className="text-center">
              See exactly what your usage costs and support the service accordingly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-700 mb-2">$0.006</div>
                <div className="text-sm text-emerald-600 font-medium">Per Job Analysis</div>
                <div className="text-xs text-emerald-600 mt-1">Qwen2.5 7B via Together AI</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700 mb-2">$0.003</div>
                <div className="text-sm text-blue-600 font-medium">Per Outreach Message</div>
                <div className="text-xs text-blue-600 mt-1">AI-powered personalization</div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-stone-50 rounded-lg border border-stone-200 text-center">
              <p className="text-sm text-stone-600">
                <strong>Your Total Usage Cost:</strong> $0.009 per complete scan with outreach
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Donations help maintain free access for everyone while covering actual AI processing costs
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Impact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/80 border-sage-200">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold text-sage-800">Community Powered</h3>
              <p className="text-sm text-sage-600">Donations keep the service running for everyone</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 border-sage-200">
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-amber-600" />
              <h3 className="font-semibold text-sage-800">Direct Impact</h3>
              <p className="text-sm text-sage-600">Funds go directly to AI analysis costs</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 border-sage-200">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-rose-600" />
              <h3 className="font-semibold text-sage-800">No Ads</h3>
              <p className="text-sm text-sage-600">Community funding keeps the platform clean</p>
            </CardContent>
          </Card>
        </div>

        {/* Donation Form */}
        <Card className="bg-white/90 backdrop-blur border-sage-200">
          <CardHeader>
            <CardTitle className="text-sage-800">Choose Your Contribution</CardTitle>
            <CardDescription>
              Pay for your own usage or support others - every amount helps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset Amounts */}
            <div className="grid grid-cols-2 gap-4">
              {donationAmounts.map((preset) => (
                <Button
                  key={preset.amount}
                  variant={selectedAmount === preset.amount ? "default" : "outline"}
                  onClick={() => handleAmountSelect(preset.amount)}
                  disabled={loading}
                  className="h-auto p-4 flex flex-col items-center"
                >
                  <span className="text-lg font-bold">{preset.label}</span>
                  <span className="text-xs text-center opacity-80">
                    {preset.description}
                  </span>
                </Button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-sage-700">
                Or enter a custom amount:
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-600">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-3 py-2 border border-sage-300 rounded-md focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  />
                </div>
                <Button
                  onClick={handleCustomAmount}
                  disabled={!customAmount || parseFloat(customAmount) < 1 || loading}
                  variant="outline"
                >
                  Select
                </Button>
              </div>
            </div>

            {/* Payment Form */}
            {clientSecret && selectedAmount && (
              <div className="pt-6 border-t border-sage-200">
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#059669',
                      }
                    }
                  }}
                >
                  <CheckoutForm amount={selectedAmount} />
                </Elements>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transparency */}
        <Card className="mt-6 bg-sage-50/80 border-sage-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sage-800 mb-2">Transparent Usage</h3>
            <p className="text-sm text-sage-600 mb-2">
              All donations fund AI analysis costs directly. You can track fund usage in real-time on the main platform.
            </p>
            <p className="text-xs text-sage-500">
              Processed securely by Stripe. No recurring charges - each donation is one-time only.
            </p>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}