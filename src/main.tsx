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
            
            try {
              const { reddit, ui } = context;
              
              // Log the current subreddit to debug
              const currentSubreddit = await reddit.getCurrentSubreddit();
              console.log('Current subreddit:', currentSubreddit);
              
              // First, check if the ThreadDefender subreddit exists/is accessible
              let targetSubreddit = 'ThreadDefender';
              try {
                const threadDefenderSubreddit = await reddit.getSubredditByName(targetSubreddit);
                console.log('ThreadDefender subreddit found:', threadDefenderSubreddit);
              } catch (subError) {
                console.error('Error accessing ThreadDefender subreddit:', subError);
                // If we can't access the target subreddit, post to the current one
                targetSubreddit = currentSubreddit.name;
                ui.showToast(`Cannot access r/ThreadDefender. Posting to r/${targetSubreddit} instead.`);
              }
              
              const postTitle = `Thread Defender Results - ${difficulty} Mode`;
              const postContent = `# Thread Defender Results 🎮\n\n` +
                `## Game Stats\n` +
                `- **Score:** ${score}\n` +
                `- **Difficulty:** ${difficulty}\n` +
                `- **Wave:** ${wave}\n\n` +
                `## Play Now!\n` +
                `Want to try your hand at defending threads? [Play Thread Defender](https://reddit.com/r/${currentSubreddit.name}/comments/${transmitterId})`;
              
              console.log('Attempting to create post with content:', {
                title: postTitle,
                content: postContent,
                targetSubreddit,
                transmitterId
              });
              
              // Try to create the post
              let post;
              try {
                console.log('Submitting post to subreddit:', targetSubreddit);
                post = await reddit.submitPost({
                  subredditName: targetSubreddit,
                  title: postTitle,
                  text: postContent
                });
                console.log('Post created successfully:', post);
              } catch (postError: any) {
                console.error('Failed to create post:', postError);
                console.error('Error details:', JSON.stringify(postError, null, 2));
                throw postError; // Re-throw to be caught by outer catch block
              }
              
              if (post) {
                console.log('Final post created:', post);
                // Show success message and provide link
                ui.showToast('Results posted successfully!');
                
                // Send confirmation back to the webview
                postMessage({
                  type: 'RESULTS_POST_CREATED',
                  payload: { 
                    success: true,
                    postUrl: post.url
                  }
                });
              } else {
                throw new Error('Post creation returned no result');
              }
            } catch (error: any) {
              console.error('Failed to create results post:', error);
              console.error('Error details:', JSON.stringify(error, null, 2));
              
              const errorMessage = error?.message || 'Unknown error';
              console.error('Error message:', errorMessage);
              
              context.ui.showToast(`Failed to post results: ${errorMessage}`);
              
              // Send error back to the webview
              postMessage({
                type: 'RESULTS_POST_CREATED',
                payload: {
                  success: false,
                  error: errorMessage
                }
              });
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
      console.error('Error setting up products:', error);
      context.ui.showToast({ text: "Failed to setup products" });
    }
  }
});

// Add test menu item for results post
Devvit.addMenuItem({
  label: 'Test Results Post',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const currentSubreddit = await reddit.getCurrentSubreddit();
    
    try {
      // Test if we can access the ThreadDefender subreddit
      try {
        const threadDefenderSub = await reddit.getSubredditByName('ThreadDefender');
        ui.showToast(`ThreadDefender subreddit exists: ${threadDefenderSub.name}`);
      } catch (error) {
        ui.showToast(`Cannot access ThreadDefender subreddit`);
      }
      
      // Test post to current subreddit
      const post = await reddit.submitPost({
        subredditName: currentSubreddit.name,
        title: 'Thread Defender - Test Post',
        text: '# This is a test post\nCreated to test the results posting functionality.'
      });
      
      ui.showToast('Test post created successfully!');
      ui.navigateTo(post.url);
    } catch (error: any) {
      console.error('Test post creation failed:', error);
      ui.showToast(`Test failed: ${error?.message || 'Unknown error'}`);
    }
  }
});

// Add debug menu item for testing post creation
Devvit.addMenuItem({
  label: 'Debug Thread Defender',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const currentSubreddit = await reddit.getCurrentSubreddit();
    
    try {
      console.log('Starting debug process...');
      console.log('Current subreddit:', currentSubreddit);
      
      // Test if we can access the ThreadDefender subreddit
      let targetSubreddit = 'ThreadDefender';
      try {
        const threadDefenderSub = await reddit.getSubredditByName(targetSubreddit);
        console.log('ThreadDefender subreddit found:', threadDefenderSub);
      } catch (error) {
        console.error('Error accessing ThreadDefender subreddit:', error);
        targetSubreddit = currentSubreddit.name;
        ui.showToast(`Cannot access r/ThreadDefender. Will test with r/${targetSubreddit}`);
      }
      
      // Create a test post with sample data
      const testData = {
        score: 1000,
        difficulty: 'Normal',
        transmitterId: 'test123',
        wave: 5
      };
      
      console.log('Creating test post with data:', testData);
      
      const postTitle = `Thread Defender Debug Test - ${testData.difficulty} Mode`;
      const postContent = `# Thread Defender Debug Test 🎮\n\n` +
        `## Test Data\n` +
        `- **Score:** ${testData.score}\n` +
        `- **Difficulty:** ${testData.difficulty}\n` +
        `- **Wave:** ${testData.wave}\n\n` +
        `## Debug Information\n` +
        `- Target Subreddit: r/${targetSubreddit}\n` +
        `- Current Subreddit: r/${currentSubreddit.name}\n` +
        `- Test ID: ${testData.transmitterId}`;
      
      console.log('Attempting to create debug post:', {
        title: postTitle,
        content: postContent,
        targetSubreddit
      });
      
      const post = await reddit.submitPost({
        subredditName: targetSubreddit,
        title: postTitle,
        text: postContent
      });
      
      console.log('Debug post created successfully:', post);
      ui.showToast('Debug post created successfully!');
      ui.navigateTo(post.url);
    } catch (error: any) {
      console.error('Debug post creation failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      ui.showToast(`Debug failed: ${error?.message || 'Unknown error'}`);
    }
  }
});

export default Devvit;
