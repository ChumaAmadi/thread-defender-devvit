import React, { useEffect } from 'react';
import { StarBackground } from '../components/StarBackground';
import { SpaceButton } from '../components/SpaceButton';
import { useSetPage } from '../hooks/usePage';
import { PowerupType, powerupDurations } from '../game/powerups';
import { audioManager } from '../audio/audioManager';

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
  const [coins, setCoins] = React.useState(5000); // Starting coins
  const [selectedItem, setSelectedItem] = React.useState<ShopItem | null>(null);

  // Play menu music when the shop page loads
  useEffect(() => {
    audioManager.playMenuMusic();
  }, []);

  const handlePurchase = (item: ShopItem) => {
    if (coins >= item.price) {
      setCoins(coins - item.price);
      // Here you would typically save the purchase to persistent storage
      // and apply the item's effect when needed
      alert(`Purchased ${item.name}!`);
    } else {
      alert('Not enough coins!');
    }
  };

  const handleGetMoreCoins = () => {
    // This would typically integrate with a payment system
    alert('Microtransaction feature coming soon!');
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
    </div>
  );
};

export default ShopPage;