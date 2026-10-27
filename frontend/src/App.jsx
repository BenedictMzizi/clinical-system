import { useState } from 'react';

import AppRoutes from './routes/AppRoutes';
import { AppWatermark } from './components/AppWatermark';
import { SplashScreen } from './components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="relative min-h-screen">
      <AppWatermark />

      <div className="relative z-10">
        <AppRoutes />
      </div>

      {showSplash && (
        <SplashScreen
          onFinish={() => setShowSplash(false)}
        />
      )}
    </div>
  );
}
