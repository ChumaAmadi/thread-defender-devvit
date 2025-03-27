// Audio manager for handling game sounds and music
class AudioManager {
  private static instance: AudioManager;
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private music: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  private constructor() {
    // Initialize sound effects
    this.sounds = {
      shoot: new Audio('/sounds/shoot.mp3'),
      specialShoot: new Audio('/sounds/special-shoot.mp3'),
      explosion: new Audio('/sounds/explosion.mp3'),
      powerup: new Audio('/sounds/powerup.mp3'),
      gameOver: new Audio('/sounds/game-over.mp3'),
      waveStart: new Audio('/sounds/wave-start.mp3'),
      hit: new Audio('/sounds/hit.mp3'),
      shield: new Audio('/sounds/shield.mp3'),
      rapidFire: new Audio('/sounds/rapid-fire.mp3'),
      infiniteSpecial: new Audio('/sounds/infinite-special.mp3'),
      healthPack: new Audio('/sounds/health-pack.mp3')
    };

    // Initialize background music
    this.music = new Audio('/sounds/background-music.mp3');
    if (this.music) {
      this.music.loop = true;
      this.music.volume = this.volume * 0.5; // Music at half volume
    }

    // Set volume for all sounds
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public playSound(soundName: keyof typeof this.sounds): void {
    if (this.isMuted) return;
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0; // Reset to start
      sound.play().catch(error => console.log('Error playing sound:', error));
    }
  }

  public playMusic(): void {
    if (this.isMuted || !this.music) return;
    this.music.play().catch(error => console.log('Error playing music:', error));
  }

  public stopMusic(): void {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopMusic();
    } else {
      this.playMusic();
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update music volume
    if (this.music) {
      this.music.volume = this.volume * 0.5;
    }

    // Update sound effects volume
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }
}

export const audioManager = AudioManager.getInstance(); 
