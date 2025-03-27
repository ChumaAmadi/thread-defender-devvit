import React from 'react';
import { StarBackground } from '../components/StarBackground';
import { SpaceButton } from '../components/SpaceButton';
import { useSetPage } from '../hooks/usePage';

// Help sections data
const helpSections = [
  {
    title: "About Thread Defender",
    content: [
      "Thread Defender is a unique arcade shooter where you protect your thread from cosmic invaders! The game's difficulty scales based on the negativity and downvotes in the thread - more downvotes mean tougher enemies and greater challenges.",
      "Your mission is to defend the central obelisk while surviving increasingly difficult waves of enemies. The more negativity in the thread, the harder the enemies will be to defeat!"
    ]
  },
  {
    title: "Controls",
    content: [
      "🖱️ Move: Control your ship with mouse movement",
      "🔫 Shoot: Left-click to fire regular bullets",
      "💥 Special Attack: Right-click to use special weapons (limited ammo)",
      "🎯 Strategy: Stay close to the obelisk but keep moving to avoid enemy fire"
    ]
  },
  {
    title: "Power-ups",
    content: [
      "🛡️ Shield: Provides temporary invincibility",
      "🔥 Rapid Fire: Increases your firing rate",
      "⚡ Infinite Special: Unlimited special attacks for a short time",
      "💊 Health Pack: Restores 30% of obelisk health"
    ]
  },
  {
    title: "Shop & Upgrades",
    content: [
      "💰 Earn coins by destroying enemies and surviving waves",
      "🏪 Visit the shop to purchase power-ups and extra lives",
      "💎 Need more coins? Use the Get More Coins option in the shop",
      "📈 Strategic purchases can help you survive tougher waves"
    ]
  },
  {
    title: "Waves & Difficulty",
    content: [
      "🌊 Each wave brings stronger and more numerous enemies",
      "⚖️ Game difficulty scales with thread downvotes",
      "🎯 Special enemies appear in later waves",
      "💪 Survive longer to earn higher scores and more rewards"
    ]
  },
  {
    title: "Tips & Tricks",
    content: [
      "🎯 Use special attacks wisely - they're powerful but limited",
      "🛡️ Save power-ups for when you really need them",
      "💫 Keep moving to avoid enemy fire",
      "🏰 Don't stray too far from the obelisk - it needs your protection!"
    ]
  }
];

export default function HelpPage() {
  const setPage = useSetPage();

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-start overflow-y-auto p-4 bg-[#000022]">
      {/* Animated stars background */}
      <StarBackground />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between w-full mb-8">
          <h1 className="text-3xl font-bold text-white">HELP & INSTRUCTIONS</h1>
        </div>

        {/* Help sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
          {helpSections.map((section) => (
            <div
              key={section.title}
              className="bg-[#000033] rounded-lg p-6 border border-[#55ff55] border-opacity-20 hover:border-opacity-40 transition-all duration-200"
            >
              <h2 className="text-xl font-bold text-white mb-4">{section.title}</h2>
              <ul className="space-y-3">
                {section.content.map((item, index) => (
                  <li key={index} className="text-[#8ca0bd] leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
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
} 
