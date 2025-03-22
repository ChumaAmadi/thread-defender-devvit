export type Page =
  | "home"
  | "pokemon";

export type WebviewToBlockMessage = { type: "INIT" } | {
  type: "GET_POKEMON_REQUEST";
  payload: { name: string };
};

export type BlocksToWebviewMessage = {
  type: "INIT_RESPONSE";
  payload: {
    postId: string;
  };
} | {
  type: "GET_POKEMON_RESPONSE";
  payload: { number: number; name: string; error?: string };
};

export type DevvitMessage = {
  type: "devvit-message";
  data: { message: BlocksToWebviewMessage };
};
