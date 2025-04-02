import { Devvit } from '@devvit/public-api';

interface SpaceButtonProps {
  onClick: () => void;
  color?: 'blue' | 'purple' | 'green';
  children: string;
}

export const SpaceButton = Devvit.createComponent<SpaceButtonProps>(({ onClick, color = 'blue', children }) => {
  return (
    <button
      backgroundColor={color === 'blue' ? '#2563eb' : color === 'purple' ? '#9333ea' : '#16a34a'}
      onPress={onClick}
      padding="medium"
      cornerRadius="large"
    >
      <text color="#ffffff" fontWeight="bold">{children}</text>
    </button>
  );
}); 
