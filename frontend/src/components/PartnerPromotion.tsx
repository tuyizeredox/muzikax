import React, { useState, useEffect } from 'react';

// Add fade-in animation styles
const fadeInStyle = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`;

// Inject styles
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = fadeInStyle;
  document.head.appendChild(styleSheet);
}

interface PartnerPromotionProps {
  variant?: 'button' | 'rewarded';
  buttonText?: string;
  rewardText?: string;
  showAfterVisits?: number; // Show after X visits
  autoHideTimeout?: number; // Auto hide after X seconds (0 to disable)
}

const PartnerPromotion: React.FC<PartnerPromotionProps> = ({
  variant = 'button',
  buttonText = '🎧 Support us – Download partner app',
  rewardText = 'Watch an ad / install app to get 30 minutes ad-free',
  showAfterVisits = 3,
  autoHideTimeout = 30
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Track user visits
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // For immediate testing, show the component
    if (showAfterVisits === 0) {
      setIsVisible(true);
      return;
    }
    
    const storedVisits = localStorage.getItem('muzikax_visit_count');
    const storedDismissed = localStorage.getItem('muzikax_promo_dismissed');
    const visits = storedVisits ? parseInt(storedVisits, 10) : 0;
    
    setVisitCount(visits);
    setIsDismissed(storedDismissed === 'true');
    
    // Only show if user has visited enough times and hasn't dismissed
    if (visits >= showAfterVisits && storedDismissed !== 'true') {
      setIsVisible(true);
    }
    
    // Increment visit count
    const newVisits = visits + 1;
    localStorage.setItem('muzikax_visit_count', newVisits.toString());
    
    // Auto-hide after timeout if specified
    if (autoHideTimeout > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoHideTimeout * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showAfterVisits, autoHideTimeout]);

  const handlePromotionClick = () => {
    if (typeof window !== 'undefined' && (window as any).partnerPromotion) {
      (window as any).partnerPromotion.openLink('muzikax_promo');
    } else {
      // Fallback if script isn't loaded
      if (typeof window !== 'undefined') {
        window.open('//djxh1.com/4/10541499?var=muzikax_fallback', '_blank');
      }
    }
    handleClose(); // Close after clicking
  };

  const handleRewardClick = () => {
    if (typeof window !== 'undefined' && (window as any).partnerPromotion) {
      (window as any).partnerPromotion.openLink('muzikax_rewarded');
    } else {
      // Fallback if script isn't loaded
      if (typeof window !== 'undefined') {
        window.open('//djxh1.com/4/10541499?var=muzikax_rewarded_fallback', '_blank');
      }
    }
    handleClose(); // Close after clicking
  };

  const handleClose = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('muzikax_promo_dismissed', 'true');
    }
  };

  const handleNeverShowAgain = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('muzikax_promo_dismissed', 'true');
      localStorage.setItem('muzikax_promo_never_show', 'true');
    }
  };

  // Don't render if dismissed permanently (except for testing)
  const neverShowAgain = typeof window !== 'undefined' && localStorage.getItem('muzikax_promo_never_show') === 'true';
  
  // For testing with showAfterVisits=0, ignore dismissal
  if (showAfterVisits === 0) {
    if (!isVisible) return null;
  } else {
    if (!isVisible || neverShowAgain || isDismissed) {
      return null;
    }
  }

  if (variant === 'rewarded') {
    return (
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-4 rounded-lg border border-purple-700 my-4 relative animate-fadeIn">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors"
          aria-label="Close promotion"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pr-8">
          <p className="text-white text-center md:text-left">
            {rewardText}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleRewardClick}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Watch & Get Reward
            </button>
            <button
              onClick={handleNeverShowAgain}
              className="text-gray-300 hover:text-white text-sm underline transition-colors"
            >
              Don't show again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-block relative animate-fadeIn">
      <button
        onClick={handlePromotionClick}
        className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        {buttonText}
      </button>
      <button
        onClick={handleNeverShowAgain}
        className="ml-2 text-gray-400 hover:text-white text-xs underline transition-colors"
      >
        Don't show again
      </button>
    </div>
  );
};

export default PartnerPromotion;