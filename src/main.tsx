import { Devvit, useWebView } from '@devvit/public-api';
import { Preview } from './components/Preview.js';
import { useRef } from 'react';
import { SpaceButton } from './components/SpaceButton.js';

// Import necessary files and define message types
// These types need to match what your webview expects
type BlocksToWebviewMessage = {
  type: 'INIT_RESPONSE' | 'PRODUCTS_DATA' | 'PAYMENT_COMPLETE' | 'RESULTS_POST_CREATED';
  payload: any;
};

type WebviewToBlockMessage = {
  type: 'INIT' | 'PURCHASE_REQUEST' | 'GAME_OVER' | 'webViewReady' | 'CREATE_RESULTS_POST';
  payload: any;
};

type BlockToWebviewMessage = {
  type: 'INIT_RESPONSE' | 'PRODUCTS_DATA' | 'PAYMENT_COMPLETE' | 'RESULTS_POST_CREATED' | 'INIT_SUCCESS' | 'PURCHASE_SUCCESS' | 'GAME_OVER_RECEIVED' | 'webViewReadyReceived' | 'ERROR';
  payload: any;
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
    const postIdRef = useRef<string | null>(null);
    
    const { mount } = useWebView<WebviewToBlockMessage, BlocksToWebviewMessage>({
      url: 'index.html',
      onMessage: async (event, { postMessage }) => {
        console.log('Received message from webview:', event);
        
        try {
          if (event.type === 'INIT') {
            // Handle initialization
            const { postId } = event.payload;
            console.log('Initializing with postId:', postId);
            
            // Store the postId for later use
            postIdRef.current = postId;
            
            // Send success response
            postMessage({
              type: 'INIT_RESPONSE',
              payload: { postId }
            });
          }
          else if (event.type === 'PURCHASE_REQUEST') {
            // Handle purchase request
            const { productId } = event.payload;
            console.log('Processing purchase for product:', productId);
            
            // TODO: Implement actual purchase logic here
            // For now, just simulate a successful purchase
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Send success response
            postMessage({
              type: 'PAYMENT_COMPLETE',
              payload: { productId, success: true }
            });
          }
          else if (event.type === 'GAME_OVER') {
            // Handle game over event
            const { score } = event.payload;
            console.log('Game over! Final score:', score);
            
            // TODO: Implement game over logic (e.g., save high scores)
            
            // Send success response
            postMessage({
              type: 'RESULTS_POST_CREATED',
              payload: { success: true, score }
            });
          }
          else if (event.type === 'CREATE_RESULTS_POST') {
            const { score, difficulty, transmitterId, wave } = event.payload;
            console.log('Received CREATE_RESULTS_POST:', { score, difficulty, transmitterId, wave });
            
            const { reddit, ui } = context;
            const subreddit = await reddit.getCurrentSubreddit();
            
            const postTitle = `Thread Defender Results - ${difficulty} Mode`;
            const postContent = `# Thread Defender Results 🎮\n\n` +
              `## Game Stats\n` +
              `- **Score:** ${score}\n` +
              `- **Difficulty:** ${difficulty}\n` +
              `- **Wave:** ${wave}\n\n` +
              `## Play Now!\n` +
              `Want to try your hand at defending threads? [Play Thread Defender](https://reddit.com/r/ThreadDefender/comments/${transmitterId})`;
            
            try {
              console.log('Creating post in subreddit: ThreadDefender');
              const post = await reddit.submitPost({
                subredditName: 'ThreadDefender',
                title: postTitle,
                text: postContent
              });
              
              console.log('Post created successfully:', post);
              ui.showToast({ text: 'Results posted successfully!' });
            } catch (error) {
              console.error('Failed to create results post:', error);
              ui.showToast({ text: 'Failed to post results. Please try again.' });
            }
          }
          else if (event.type === 'webViewReady') {
            // Handle webview ready event
            console.log('Webview is ready');
            
            // Send success response
            postMessage({
              type: 'RESULTS_POST_CREATED',
              payload: { success: true }
            });
          }
          else {
            console.warn('Unknown message type:', event.type);
          }
        } catch (error) {
          console.error('Error handling message:', error);
          
          // Send error response
          postMessage({
            type: 'RESULTS_POST_CREATED',
            payload: {
              success: false,
              error: 'Failed to process message'
            }
          });
        }
      },
    });

    // Return your enhanced UI
    return (
      <vstack padding="medium" cornerRadius="large" backgroundColor="#000022">
        <text fontSize="xlarge" fontWeight="bold" color="#ffffff">THREAD DEFENDER</text>
        <spacer size="medium" />
        <text fontSize="large" color="#8ca0bd">Defend the obelisk from waves of enemies!</text>
        <spacer size="medium" />
        <text fontSize="large" color="#8ca0bd">Controls:</text>
        <text fontSize="large" color="#8ca0bd">• Move: Mouse</text>
        <text fontSize="large" color="#8ca0bd">• Shoot: Left Click</text>
        <text fontSize="large" color="#8ca0bd">• Special Attack: Right Click</text>
        <spacer size="medium" />
        <button onClick={mount} style={{backgroundColor: 'blue', color: 'white', padding: '10px 20px', borderRadius: '5px'}}>
          PLAY NOW
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
