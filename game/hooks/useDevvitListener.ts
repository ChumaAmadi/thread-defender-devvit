import { useEffect, useState } from 'react';
import { BlocksToWebviewMessage } from '../shared';

type MessagePayload<T> = Extract<BlocksToWebviewMessage, { type: T }>['payload'];

/**
 * Hook to listen for messages from Devvit
 * @param messageType The type of message to listen for
 * @returns The payload of the last message of the specified type, or undefined if none received
 */
export function useDevvitListener<T extends BlocksToWebviewMessage['type']>(
  eventType: T
): MessagePayload<T> | undefined {
  const [data, setData] = useState<MessagePayload<T> | undefined>(undefined);

  useEffect(() => {
    // Handler for messages from Devvit
    const messageHandler = (event: MessageEvent) => {
      try {
        if (event.data?.type === eventType) {
          setData(event.data.payload);
          return;
        }

        if (event.data?.type === 'devvit-message' && event.data.data?.message?.type === eventType) {
          setData(event.data.data.message.payload);
          return;
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    // Register event listener
    window.addEventListener('message', messageHandler);
    
    // Log that we're listening for messages
    console.log(`Listening for Devvit messages of type: ${eventType}`);
    
    // Cleanup function to remove listener
    return () => {
      window.removeEventListener('message', messageHandler);
      console.log(`Stopped listening for Devvit messages of type: ${eventType}`);
    };
  }, [eventType]);

  return data;
}