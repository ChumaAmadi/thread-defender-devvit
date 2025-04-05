# Thread Defender

A Reddit arcade game built with Devvit where players defend their posts against waves of enemies representing downvotes. This project serves both as a playable game and as a comprehensive template for building React-based Devvit applications.

## Game Overview

Thread Defender transforms Reddit's voting system into an engaging arcade experience:

- **Dynamic Difficulty**: The game's difficulty scales based on the number of downvotes a post has received
- **Arcade-Style Gameplay**: Control your ship with the mouse, shoot with left-click, and use special attacks with right-click
- **Wave-Based Combat**: Face increasingly difficult waves of enemies
- **Power-ups System**: Collect and use power-ups to enhance your gameplay
- **High Score Tracking**: Compete for the highest score and share your results

### Enemy System

The game features various enemy types with unique behaviors:

- **Basic**: Standard enemies with balanced stats
- **Fast**: Quick but fragile enemies
- **Tank**: Slow-moving enemies with high health
- **Hunter**: Enemies that actively target the player
- **And More**: Additional enemy types with special abilities (teleporting, shields, etc.)

## Using This Template

This project is designed to serve as a comprehensive template for creating Devvit applications with webview integration. Here's how to use it:

### Prerequisites

- Node.js v22 or later
- A Reddit account with a subreddit you can use for development
- [Devvit CLI](https://developers.reddit.com/docs/getting-started#install-the-devvit-cli) installed globally

### Getting Started

1. Clone this repository:

   ```sh
   git clone https://github.com/yourusername/thread-defender.git
   cd thread-defender
   npm install
   ```

2. Create a development subreddit on Reddit.com if you don't already have one.

3. Update the configuration files:
   - In `package.json`: Update the `dev:devvit` script with your subreddit name
   - In `devvit.yaml`: Update the app name (must be 0-16 characters)

4. Upload your app:

   ```sh
   npm run upload
   ```

5. Start development:

   ```sh
   npm run dev
   ```

6. Create a post to test your app:
   - Go to your subreddit
   - Click the three dots menu
   - Select "Create Thread Defender Post"
   - Your game should appear in the post

### Project Structure

```
thread-defender/
├── game/                  # Webview React application
│   ├── components/        # UI components
│   ├── hooks/             # React hooks for game state
│   ├── pages/             # Game screens
│   ├── shared.ts          # Shared types and interfaces
│   ├── utils.ts           # Utility functions
│   └── App.tsx            # Main React component
├── src/                   # Devvit application
│   ├── components/        # Devvit UI components
│   ├── main.tsx           # Main Devvit entry point
│   └── constants.ts       # Configuration values
└── public/                # Static assets
```

### Key Components

- **Webview Integration**: The template shows how to properly integrate a React webview with Devvit
- **Messaging System**: Demonstrates bidirectional communication between Devvit and the webview
- **Custom Post Type**: Provides a custom post type implementation
- **Menu Items**: Shows how to create and handle menu items
- **State Management**: Implements state management in both Devvit and the webview

## Extending the Template

This template is structured to make it easy to extend with your own features. Here are some ways to customize it:

### Modify the Game

Look at the `game/` directory to understand the game's structure:

- `game/pages/`: Contains different screens (Home, Game, Shop, etc.)
- `game/components/`: Reusable UI components
- `game/hooks/`: State management and custom hooks

### Change the Devvit Integration

Examine `src/main.tsx` to understand how the Devvit app communicates with the webview:

- The `onMessage` handler processes messages from the webview
- Custom menu items can be added using `Devvit.addMenuItem`
- The custom post type is configured with `Devvit.addCustomPostType`

### Add New Features

Some ideas for extending the template:

- Add user authentication
- Implement a leaderboard system
- Create additional power-ups or enemies
- Add social sharing features
- Implement virtual currency and purchases

## Commands

- `npm run dev`: Start local development with hot reloading
- `npm run upload`: Upload a new version of your app
- `npm run vite`: Run just the React app locally for faster UI development

## Best Practices

- Keep game logic separated from UI components
- Use TypeScript interfaces for message types
- Handle errors gracefully in both the Devvit app and webview
- Implement responsive design for different screen sizes
- Test on both desktop and mobile browsers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

---

*This project is not affiliated with Reddit, Inc. Devvit is a platform provided by Reddit for third-party developers.*
