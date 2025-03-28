// Audio manager for handling game sounds and music
class AudioManager {
  private static instance: AudioManager;
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private music: HTMLAudioElement | null = null;
  private gameMusic: HTMLAudioElement | null = null;
  private isSoundMuted: boolean = false;
  private _isMusicMuted: boolean = false;
  private soundVolume: number = 0.2;
  private musicVolume: number = 0.4;

  private constructor() {
    // Initialize sound effects
    this.sounds = {
      shoot: new Audio('/sounds/shoot.mp3'),
      specialShoot: new Audio('/sounds/special-shoot.mp3'),
      explosion: new Audio('/sounds/explosion.mp3'),
      hit: new Audio('/sounds/hit.mp3'),
      gameOver: new Audio('/sounds/game-over.mp3'),
      waveStart: new Audio('/sounds/wave-start.mp3'),
    };

    // Initialize background music
    this.music = new Audio('/sounds/background-music.mp3');
    this.gameMusic = new Audio('/sounds/game-music.mp3');

    // Set up music looping
    if (this.music) {
      this.music.loop = true;
      this.music.volume = this.musicVolume;
    }
    if (this.gameMusic) {
      this.gameMusic.loop = true;
      this.gameMusic.volume = this.musicVolume;
    }

    // Set up sound effect volumes
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.soundVolume;
    });
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public playSound(soundName: string): void {
    if (this.isSoundMuted) return;

    const sound = this.sounds[soundName];
    if (sound) {
      // Create a clone for overlapping sounds
      const clone = sound.cloneNode() as HTMLAudioElement;
      clone.volume = this.soundVolume;
      clone.play().catch(e => console.error('Error playing sound:', e));
    }
  }

  public playMenuMusic(): void {
    if (this._isMusicMuted || !this.music) return;
    
    // Stop game music if playing
    if (this.gameMusic) {
      this.gameMusic.pause();
      this.gameMusic.currentTime = 0;
    }
    
    // Only start the music if it's not already playing
    if (this.music.paused) {
      this.music.currentTime = 0; // Start from the beginning
      this.music.play().catch(e => console.error('Error playing menu music:', e));
    }
  }

  public playGameMusic(): void {
    if (this._isMusicMuted || !this.gameMusic) return;
    
    // Stop menu music if playing
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
    
    // Only start the music if it's not already playing
    if (this.gameMusic.paused) {
      this.gameMusic.currentTime = 0; // Start from the beginning
      this.gameMusic.play().catch(e => console.error('Error playing game music:', e));
    }
  }

  public stopMusic(): void {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
    if (this.gameMusic) {
      this.gameMusic.pause();
      this.gameMusic.currentTime = 0;
    }
  }

  public setSoundMute(muted: boolean): void {
    this.isSoundMuted = muted;
  }

  public setMusicMute(muted: boolean): void {
    this._isMusicMuted = muted;
    
    if (muted) {
      this.stopMusic();
    } else {
      // Resume the appropriate music based on current page
      const currentPath = window.location.pathname;
      if (currentPath.includes('game')) {
        this.playGameMusic();
      } else {
        this.playMenuMusic();
      }
    }
  }

  public setSoundVolume(volume: number): void {
    this.soundVolume = volume;
    
    // Update sound effect volumes
    Object.values(this.sounds).forEach(sound => {
      sound.volume = volume;
    });
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = volume;
    
    // Update music volume
    if (this.music) {
      this.music.volume = volume;
    }
    if (this.gameMusic) {
      this.gameMusic.volume = volume;
    }
  }

  public isSoundsMuted(): boolean {
    return this.isSoundMuted;
  }

  public isMusicMuted(): boolean {
    return this._isMusicMuted;
  }

  public getSoundVolume(): number {
    return this.soundVolume;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }
}

export const audioManager = AudioManager.getInstance();