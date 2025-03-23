// Define all possible page names
export type Page = 'home' | 'game' | 'shop' | 'options' | 'help';

// Messages from webview to Devvit blocks
export type WebviewToBlockMessage = 
  | { type: "INIT" } 
  | { type: "GAME_READY" }
  | { type: "GAME_OVER"; payload: { score: number } };

// Messages from Devvit blocks to webview
export type BlocksToWebviewMessage = 
  | { type: "INIT_RESPONSE"; payload: { postId: string; difficulty: string } }
  | { type: "GAME_START"; payload: { wave: number; obeliskHealth: number } };

// Helper type for Devvit message wrapping
export type DevvitMessage = {
  type: "devvit-message";
  data: { message: BlocksToWebviewMessage };
};