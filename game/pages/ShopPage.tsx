import React, { useEffect, useState } from 'react';
import { StarBackground } from '../components/StarBackground';
import { SpaceButton } from '../components/SpaceButton';
import { useSetPage } from '../hooks/usePage';
import { PowerupType, powerupDurations } from '../game/powerups';
import { audioManager } from '../audio/audioManager';
import { sendToDevvit } from '../utils';

// Shop item interface
interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'life' | PowerupType;
  icon: string;
  color: string;
}

// Product interface (for payment)
interface Product {
  sku: string;
  displayName: string;
  description: string;
  price: number;
  images: {
    icon: string;
  };
  metadata: {
    coinAmount: string;
  };
}

// Default products
const DEFAULT_PRODUCTS: Product[] = [
  {
    sku: "thread-defender-small_coins_100",
    displayName: "Small Coin Pack",
    description: "Get 100 coins to spend on items in the Thread Defender shop",
    price: 50,
    images: {
      icon: "coin_small.png"
    },
    metadata: {
      coinAmount: "100"
    }
  },
  {
    sku: "thread-defender-medium_coins_250",
    displayName: "Medium Coin Pack",
    description: "Get 250 coins to spend on items in the Thread Defender shop",
    price: 100,
    images: {
      icon: "coin_medium.png"
    },
    metadata: {
      coinAmount: "250"
    }
  },
  {
    sku: "thread-defender-large_coins_600",
    displayName: "Large Coin Pack",
    description: "Get 600 coins to spend on items in the Thread Defender shop",
    price: 250,
    images: {
      icon: "coin_large.png"
    },
    metadata: {
      coinAmount: "600"
    }
  },
  {
    sku: "thread-defender-super_coins_1500",
    displayName: "Super Coin Pack",
    description: "Get 1500 coins to spend on items in the Thread Defender shop - best value!",
    price: 500,
    images: {
      icon: "coin_super.png"
    },
    metadata: {
      coinAmount: "1500"
    }
  }
];

// Shop items data
const shopItems: ShopItem[] = [
  {
    id: 'extra-life',
    name: 'Extra Life',
    description: 'Gives you one additional life when you die',
    price: 1000,
    type: 'life',
    icon: '❤️',
    color: 'red'
  },
  {
    id: 'shield',
    name: 'Shield Power-up',
    description: `Provides ${powerupDurations.shield / 1000}s of invincibility`,
    price: 800,
    type: 'shield',
    icon: '🛡️',
    color: 'blue'
  },
  {
    id: 'rapid-fire',
    name: 'Rapid Fire Power-up',
    description: `Increases fire rate for ${powerupDurations.rapidFire / 1000}s`,
    price: 600,
    type: 'rapidFire',
    icon: '🔥',
    color: 'orange'
  },
  {
    id: 'infinite-special',
    name: 'Infinite Special Power-up',
    description: `Unlimited special attacks for ${powerupDurations.infiniteSpecial / 1000}s`,
    price: 1200,
    type: 'infiniteSpecial',
    icon: '⚡',
    color: 'purple'
  },
  {
    id: 'health-pack',
    name: 'Health Pack',
    description: 'Instantly restores 30% of obelisk health',
    price: 500,
    type: 'healthPack',
    icon: '💊',
    color: 'green'
  }
];

const ShopPage: React.FC = () => {
  const setPage = useSetPage();
  const [coins, setCoins] = useState(() => {
    // Load coins from localStorage with fallback to 500
    const savedCoins = localStorage.getItem('threadDefenderCoins');
    return savedCoins ? parseInt(savedCoins, 10) : 500;
  });
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Save coins whenever they change
  useEffect(() => {
    localStorage.setItem('threadDefenderCoins', coins.toString());
  }, [coins]);

  // Play menu music when the shop page loads
  useEffect(() => {
    audioManager.playMenuMusic();
    
    // Request products from Devvit (but we'll use defaults anyway)
    sendToDevvit({
      type: 'INIT'
    });
  }, []);

  const handlePurchase = (item: ShopItem) => {
    if (coins >= item.price) {
      setCoins(coins - item.price);
      
      // Play purchase sound
      audioManager.playSound('purchase');
      
      // Show success message with a small timeout for better UX
      setTimeout(() => {
        // Show a success notification instead of an alert
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50 animate-fade-in-out';
        notification.textContent = `Purchased ${item.name}!`;
        document.body.appendChild(notification);
        
        // Remove notification after 2 seconds
        setTimeout(() => {
          notification.remove();
        }, 2000);
      }, 200);
    } else {
      // Not enough coins - show payment modal
      setShowPaymentModal(true);
    }
  };

  const handleGetMoreCoins = () => {
    // Show payment modal with default products
    setProducts(DEFAULT_PRODUCTS);
    setShowPaymentModal(true);
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setPaymentProcessing(false);
  };

  const initiatePayment = (product: Product) => {
    if (paymentProcessing) return;
    setPaymentProcessing(true);
    
    // Simplified payment processing - just show spinner for a moment
    setTimeout(() => {
      // Always succeed after 1 second
      const coinAmount = parseInt(product.metadata.coinAmount, 10);
      setCoins(prevCoins => prevCoins + coinAmount);
      
      // Play success sound
      audioManager.playSound('powerup');
      
      // Reset state and close modal
      setPaymentProcessing(false);
      setShowPaymentModal(false);

      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50 animate-fade-in-out';
      notification.textContent = `Added ${coinAmount} coins to your account!`;
      document.body.appendChild(notification);
      
      // Remove notification after 2 seconds
      setTimeout(() => {
        notification.remove();
      }, 2000);
    }, 1500); // Just show the spinner for 1.5 seconds
  };

  // Format Reddit Gold price
  const formatGoldPrice = (amount: number) => {
    return amount === 1 ? '1 Gold' : `${amount} Gold`;
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-start overflow-y-auto p-4 bg-[#000022]">
      {/* Animated stars background */}
      <StarBackground />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between w-full mb-8">
          <h1 className="text-3xl font-bold text-white">SHOP</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleGetMoreCoins}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-400 rounded-full text-white font-bold hover:from-green-500 hover:to-green-300 transition-all duration-200 flex items-center gap-2"
            >
              <span>💎</span>
              Get More Coins
            </button>
            <div className="flex items-center gap-2 bg-[#113355] bg-opacity-30 px-4 py-2 rounded-full border border-[#55ff55] border-opacity-30">
              <span className="text-[#55ff55]">💰</span>
              <span className="text-white font-bold">{coins}</span>
            </div>
          </div>
        </div>

        {/* Shop grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-8">
          {shopItems.map((item) => (
            <div
              key={item.id}
              className={`relative bg-[#000033] rounded-lg p-6 border-2 transition-all duration-200 ${
                selectedItem?.id === item.id
                  ? 'border-[#55ff55]'
                  : 'border-transparent hover:border-[#55ff55]'
              }`}
              onClick={() => setSelectedItem(item)}
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">{item.name}</h3>
                  <p className="text-[#55ff55] font-bold">{item.price} coins</p>
                </div>
              </div>
              <p className="text-[#8ca0bd] mb-4">{item.description}</p>
              <SpaceButton
                onClick={(e) => {
                  e.stopPropagation();
                  handlePurchase(item);
                }}
                color={item.color === 'red' ? 'blue' : item.color as any}
              >
                PURCHASE
              </SpaceButton>
            </div>
          ))}
        </div>

        {/* Back button */}
        <div className="mb-8 w-full max-w-xs">
          <SpaceButton onClick={() => setPage('home')} color="blue">
            BACK TO MENU
          </SpaceButton>
        </div>
      </div>

      {/* Payment Modal - REDUCED SIZE */}
      {showPaymentModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-70"
            onClick={handlePaymentModalClose}
          ></div>
          {/* Reduced size modal with max-width */}
          <div className="relative bg-[#000033] rounded-xl p-4 max-w-sm w-full z-50 border-2 border-[#55ff55]">
            <h2 className="text-xl font-bold text-white mb-2">Get More Coins</h2>
            <p className="text-[#8ca0bd] mb-4 text-sm">Purchase coins with Reddit Gold to buy items in the shop.</p>
            
            <div className="space-y-2 mb-4">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin mb-2 h-6 w-6 border-4 border-[#55ff55] border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-[#8ca0bd] text-sm">Loading available purchases...</p>
                </div>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <div 
                    key={product.sku}
                    className="bg-[#0a1025] rounded-lg p-3 flex justify-between items-center hover:bg-[#101942] cursor-pointer transition-colors duration-200"
                    onClick={() => initiatePayment(product)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💰</span>
                      <div>
                        <h3 className="text-white font-bold text-sm">{product.displayName}</h3>
                        <p className="text-[#8ca0bd] text-xs">{product.metadata.coinAmount} coins</p>
                      </div>
                    </div>
                    <div className="text-[#55ff55] font-bold text-sm">
                      {formatGoldPrice(product.price)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-[#8ca0bd] text-sm">No coin packages available.</p>
                </div>
              )}
            </div>
            
            {/* Payment processing overlay */}
            {paymentProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-xl">
                <div className="flex flex-col items-center">
                  <div className="animate-spin mb-2 h-8 w-8 border-4 border-[#55ff55] border-t-transparent rounded-full"></div>
                  <p className="text-white text-sm">Processing payment...</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={handlePaymentModalClose}
                className="px-4 py-1 bg-[#113355] text-white rounded-lg hover:bg-[#1a4a7a] transition-colors duration-200 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add this CSS for the notification animation */}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-20px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        .animate-fade-in-out {
          animation: fadeInOut 2s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ShopPage;