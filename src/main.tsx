import { Devvit, useWebView } from '@devvit/public-api';

// Import necessary files and define message types
// These types need to match what your webview expects
type BlocksToWebviewMessage = {
  type: 'INIT_RESPONSE' | 'GET_POKEMON_RESPONSE';
  payload: any;
};

type WebviewToBlockMessage = {
  type: 'INIT' | 'GET_POKEMON_REQUEST' | 'webViewReady';
  payload?: any;
};

// Configure Devvit
Devvit.configure({
  redditAPI: true,
  http: true,
  redis: true,
  realtime: true,
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
  name: 'Experience Post', // Keep the same name that worked before
  height: 'tall',
  render: (context) => {
    // Use the same WebView structure that worked before
    const { mount } = useWebView<WebviewToBlockMessage, BlocksToWebviewMessage>({
      url: 'index.html', // Make sure this path is correct
      onMessage: async (event, { postMessage }) => {
        console.log('Received message', event);
        
        // Handle different message types
        if (event.type === 'INIT') {
          postMessage({
            type: 'INIT_RESPONSE',
            payload: {
              postId: context.postId!,
              difficulty: 'medium',
              currentWave: 1,
              obeliskHealth: 100
            },
          });
        } else if (event.type === 'webViewReady') {
          context.ui.showToast({ text: 'Thread Defender is ready!' });
          // You can add any game initialization code here
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

export default Devvit;