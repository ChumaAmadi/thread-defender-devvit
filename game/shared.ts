// File: game/shared.ts

// Define all possible page names
export type Page = 'home' | 'game' | 'shop' | 'options' | 'help';

// Messages from webview to Devvit blocks
export type WebviewToBlockMessage = 
  | { type: "INIT" } 
  | { type: "GAME_READY" }
  | { type: "webViewReady" }
  | { type: "GAME_OVER"; payload: { score: number } }
  | { type: "PURCHASE_REQUEST"; payload: { sku: string } };

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

export type ProductsDataPayload = {
  products: Array<{
    sku: string;
    displayName: string;
    description: string;
    price: number;
    images: {
      icon: string;
    };
    metadata: {
      coinAmount: string;
    };
  }>;
};

export type PaymentCompletePayload = {
  sku?: string;
  success: boolean;
  error?: string;
};

export type BlocksToWebviewMessage = 
  | { type: 'INIT_RESPONSE'; payload: InitResponsePayload }
  | { type: 'GAME_START'; payload: GameStartPayload }
  | { type: 'PRODUCTS_DATA'; payload: ProductsDataPayload }
  | { type: 'PAYMENT_COMPLETE'; payload: PaymentCompletePayload };

// Helper type for Devvit message wrapping
export type DevvitMessage = {
  type: 'devvit-message';
  data: {
    message: BlocksToWebviewMessage;
  };
};