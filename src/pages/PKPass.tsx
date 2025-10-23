import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Wallet } from 'lucide-react';

const PKPass = () => {
  const [passUrl, setPassUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Serve the .pkpass file directly from public folder
    const passUrl = '/halloween.pkpass';
    setPassUrl(passUrl);
    setLoading(false);
    
    // Automatically trigger download on mount
    window.location.href = passUrl;
  }, []);

  const handleDownload = () => {
    if (passUrl) {
      window.location.href = passUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Add to Apple Wallet
          </h1>
          <p className="text-gray-600">
            Your PortaPro pass is ready to be added to your Apple Wallet
          </p>
        </div>

        {loading ? (
          <div className="py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your pass...</p>
          </div>
        ) : passUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              If the download didn't start automatically, click below:
            </p>
            <Button 
              onClick={handleDownload}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Pass
            </Button>
            <p className="text-xs text-gray-400 mt-4">
              Compatible with iPhone, iPad, and macOS
            </p>
          </div>
        ) : (
          <div className="py-8">
            <p className="text-red-600">Failed to load wallet pass</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PKPass;
