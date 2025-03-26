// File: game/types/shared.ts (update this path if yours is different)

// Define all possible page names
export type Page = 'home' | 'game' | 'shop' | 'options' | 'help';

// Messages from webview to Devvit blocks
export type WebviewToBlockMessage = 
  | { type: "INIT" } 
  | { type: "GAME_READY" }
  | { type: "webViewReady" }
  | { type: "GAME_OVER"; payload: { score: number } };

// Messages from Devvit blocks to webview
export type InitResponsePayload = {
  postId: string;
  difficulty: string;
  downvotes: number;
  currentWave: number;
  obeliskHealth: number;
};

export type GameStartPayload = {
  payload: any;
  wave: number;
  obeliskHealth: number;
};

export type BlocksToWebviewMessage = 
  | { type: 'INIT_RESPONSE'; payload: InitResponsePayload }
  | { type: 'GAME_START'; payload: GameStartPayload };

// Helper type for Devvit message wrapping
export type DevvitMessage = {
  type: 'devvit-message';
  data: {
    message: BlocksToWebviewMessage;
  };
};
