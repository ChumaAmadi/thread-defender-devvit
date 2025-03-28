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
      "⏸️ Pause: Click the pause button or press ESC",
      "🎯 Strategy: Stay close to the obelisk but keep moving to avoid enemy fire"
    ]
  },
  {
    title: "Enemy Types",
    content: [
      "🔴 Basic: Standard enemy with balanced stats",
      "⚡ Fast: Smaller and quicker, but less health",
      "🛡️ Tank: Large and tough, but moves slowly",
      "🎯 Hunter: Actively pursues your ship",
      "💣 Bomber: Explodes on death, damaging nearby enemies",
      "🔫 Sniper: Long-range attacks with high precision",
      "✨ Teleporter: Can teleport around the map",
      "🛡️ Shielded: Protected by a damage-reducing shield"
    ]
  },
  {
    title: "Health & Survival",
    content: [
      "❤️ Obelisk Health: Starts at 100%, game over if it reaches 0%",
      "💚 Wave Bonus: Gain 5% health after completing a wave",
      "🌟 Clear Bonus: Extra health when clearing all enemies",
      "🛡️ Shield Power-up: Reduces damage taken by 80%",
      "💊 Health Pack: Restores 30% of obelisk health",
      "⚔️ Enemy Damage: Varies by enemy type and difficulty"
    ]
  },
  {
    title: "Power-ups",
    content: [
      "🛡️ Shield: Reduces incoming damage by 80%",
      "🔥 Rapid Fire: Increases your firing rate",
      "⚡ Infinite Special: Unlimited special attacks for a short time",
      "💊 Health Pack: Restores 30% of obelisk health",
      "💫 Special Ammo: Occasionally replenishes over time"
    ]
  },
  {
    title: "Waves & Difficulty",
    content: [
      "🌊 Each wave lasts 30 seconds + 5 seconds per wave level",
      "📈 Enemy count increases: 2 base + 1 per 2 waves (max +8)",
      "⚖️ Three difficulty levels affect enemy stats:",
      "   Easy (0.7x): Slower, weaker enemies",
      "   Medium (1.5x): Balanced challenge",
      "   Hard (2.5x): Faster, stronger enemies",
      "🎯 Advanced enemy types appear in later waves"
    ]
  },
  {
    title: "Scoring & Strategy",
    content: [
      "💯 Score points by destroying enemies and surviving",
      "🎯 Special enemies give bonus points when destroyed",
      "🛡️ Use power-ups strategically for tough waves",
      "💫 Keep moving to avoid damage, but stay near the obelisk",
      "⚡ Save special attacks for emergency situations",
      "🏆 High scores are saved and displayed on the main menu"
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
