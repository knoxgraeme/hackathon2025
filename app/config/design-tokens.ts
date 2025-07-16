export const designTokens = {
  colors: {
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      backgroundDark: 'rgba(0, 0, 0, 0.3)',
      border: 'rgba(255, 255, 255, 0.2)',
      borderDark: 'rgba(255, 255, 255, 0.1)',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    voice: {
      active: '#007AFF',
      inactive: '#8E8E93',
      waveform: '#34C759',
      pulse: '#5856D6',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      voice: 'linear-gradient(45deg, #007AFF, #5856D6)',
      dark: 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)',
    }
  },
  spacing: {
    touchTarget: '44px', // iOS minimum touch target
    voiceButton: '80px',
    cardPadding: '20px',
    safePadding: '16px',
  },
  blur: {
    glass: '20px',
    backdrop: '10px',
    heavy: '30px',
  },
  animation: {
    bounce: 'bounce 2s ease-in-out infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    slideUp: 'slideUp 0.3s ease-out',
  }
} 