import { WebviewToBlockMessage } from "./types/messages.js";
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for creating tailwind class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Send a message from the webview to Devvit blocks
 * @param event The message event to send
 */
export function sendToDevvit(event: WebviewToBlockMessage) {
  try {
    // Log the message being sent for debugging
    console.log('Sending message to Devvit:', event);
    
    // Send the message to the parent window
    window.parent?.postMessage(event, "*");
    
    // Also notify that the webview is ready on each message (for compatibility)
    if (event.type !== 'webViewReady') {
      console.log('Also sending webViewReady message');
      window.parent?.postMessage({ type: 'webViewReady' }, "*");
    }
  } catch (error) {
    console.error('Error sending message to Devvit:', error);
  }
}

/**
 * Creates a random ID string
 * @returns A random string ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Delay execution using a promise
 * @param ms Milliseconds to delay
 * @returns A promise that resolves after the specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp a number between a minimum and maximum value
 * @param value The value to clamp
 * @param min The minimum allowed value
 * @param max The maximum allowed value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
