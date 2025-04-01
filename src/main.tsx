import { Devvit, useWebView } from '@devvit/public-api';
import { Preview } from './components/Preview.js';

// Import necessary files and define message types
// These types need to match what your webview expects
type BlocksToWebviewMessage = {
  type: 'INIT_RESPONSE' | 'PRODUCTS_DATA' | 'PAYMENT_COMPLETE';
  payload: any;
};

type WebviewToBlockMessage = {
  type: 'INIT' | 'webViewReady' | 'PURCHASE_REQUEST' | 'GAME_OVER';
  payload?: any;
};

// Configure Devvit with capabilities
Devvit.configure({
  redditAPI: true,
  http: true,
  redis: true,
  realtime: true
});

// Add a menu item to create the post
Devvit.addMenuItem({
  label: 'Create Thread Defender Post',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: 'Thread Defender',
      subredditName: subreddit.name,
      preview: <vstack padding="medium"><text>Loading Thread Defender...</text></vstack>,
    });
    ui.showToast({ text: 'Created Thread Defender post!' });
    ui.navigateTo(post.url);
  },
});

// Add the custom post type
Devvit.addCustomPostType({
  name: 'Experience Post',
  height: 'tall',
  render: (context) => {
    // Use the same WebView structure that worked before
    const { mount } = useWebView<WebviewToBlockMessage, BlocksToWebviewMessage>({
      url: 'index.html',
      onMessage: async (event, { postMessage }) => {
        console.log('Received message from webview:', event);
        
        // Handle different message types
        if (event.type === 'INIT') {
          // Get post data
          const post = await context.reddit.getPostById(context.postId!);
          const downvotes = Math.max(0, -(post?.score || 0));
          
          // Load mock products data (since we can't read from filesystem directly)
          const mockProducts = [
            {
              sku: "thread-defender-small_coins_100",
              displayName: "Small Coin Pack",
              description: "Get 100 coins to spend on items in the Thread Defender shop",
              price: 50,
              accountingType: "CONSUMABLE",
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
              accountingType: "CONSUMABLE",
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
              accountingType: "CONSUMABLE",
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
              accountingType: "CONSUMABLE",
              images: {
                icon: "coin_super.png"
              },
              metadata: {
                coinAmount: "1500"
              }
            }
          ];
          
          // Send initialization data
          postMessage({
            type: 'INIT_RESPONSE',
            payload: {
              postId: context.postId!,
              difficulty: 'medium',
              downvotes: downvotes,
              currentWave: 1,
              obeliskHealth: 100
            },
          });
          
          // Send products data
          postMessage({
            type: 'PRODUCTS_DATA',
            payload: {
              products: mockProducts
            }
          });
        } 
        // Handle purchase requests
        else if (event.type === 'PURCHASE_REQUEST' && event.payload?.sku) {
          try {
            const { sku } = event.payload;
            
            // For now, we'll simulate a successful payment
            // In production, you would use the payments API from Devvit
            
            // Send simulated payment result back to webview
            postMessage({
              type: 'PAYMENT_COMPLETE',
              payload: {
                sku: sku,
                success: true
              }
            });
          } catch (error) {
            console.error('Payment error:', error);
            
            // Send failure response
            postMessage({
              type: 'PAYMENT_COMPLETE',
              payload: {
                success: false,
                error: 'Payment processing failed'
              }
            });
          }
        }
        // Handle game over event
        else if (event.type === 'GAME_OVER') {
          const { score } = event.payload;
          console.log(`Game over with score: ${score}`);
          
          // Here you could update post metadata or Reddit stats if needed
          // For example, update a high score leaderboard
        }
        else if (event.type === 'webViewReady') {
          context.ui.showToast({ text: 'Thread Defender is ready!' });
        }
      },
    });

    // Return your enhanced UI
    return (
      <vstack 
        width="100%" 
        backgroundColor="#000022"
        padding="medium"
        cornerRadius="large"
        gap="medium"
        alignment="center"
      >
        {/* Game Title */}
        <text
          color="#ffffff"
          size="xlarge"
          weight="bold"
        >
          THREAD DEFENDER
        </text>
        
        {/* Tagline */}
        <text
          color="#8ca0bd"
          size="medium"
        >
          Protect your thread from cosmic invaders!
        </text>
        
        {/* Simple feature list */}
        <vstack
          gap="small"
          padding="medium"
          width="100%"
        >
          <text
            color="#55ff55"
            alignment="center"
          >
            • Defend the obelisk from waves of enemies
          </text>
          
          <text
            color="#55ff55"
            alignment="center"
          >
            • Survive increasingly difficult challenges
          </text>
          
          <text
            color="#55ff55"
            alignment="center"
          >
            • Compete for the highest score
          </text>
        </vstack>
        
        {/* Game launch button */}
        <button
          appearance="primary"
          onPress={mount}
          width="90%"
          size="large"
        >
          LAUNCH GAME
        </button>
      </vstack>
    );
  },
});

// We'll handle product registration through a menu item
Devvit.addMenuItem({
  label: 'Setup Coin Products',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    try {
      // This is a placeholder - in production you would register products through Devvit's UI
      context.ui.showToast({ text: "Products would be registered here in production" });
    } catch (error) {
      console.error('Error registering products:', error);
      context.ui.showToast({ text: "Error setting up products" });
    }
  }
});

export default Devvit;