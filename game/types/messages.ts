export type WebviewToBlockMessage = {
  type: 'INIT' | 'PURCHASE_REQUEST' | 'GAME_OVER' | 'webViewReady' | 'CREATE_RESULTS_POST';
  payload: any;
}; 
