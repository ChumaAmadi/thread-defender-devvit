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
  private lastMusicPlayed: 'menu' | 'game' | 'none' = 'none';

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

    // Debug information - log the music files
    console.log("[AudioManager] Menu music source:", this.music.src);
    console.log("[AudioManager] Game music source:", this.gameMusic.src);

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
    
    // Preload audio files
    this.preloadAudio();
  }
  
  private preloadAudio(): void {
    // Preload all audio files to ensure they're ready to play
    console.log("[AudioManager] Preloading audio files...");
    
    // Load music files
    if (this.music) {
      this.music.load();
    }
    if (this.gameMusic) {
      this.gameMusic.load();
    }
    
    // Load sound effects
    Object.values(this.sounds).forEach(sound => {
      sound.load();
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
      clone.play().catch(e => console.error('[AudioManager] Error playing sound:', e));
    }
  }

  public playMenuMusic(): void {
    if (this._isMusicMuted || !this.music) return;
    
    console.log("[AudioManager] Playing menu music");
    
    // Check if menu music is already playing
    if (this.lastMusicPlayed === 'menu' && !this.music.paused) {
      console.log("[AudioManager] Menu music already playing");
      return;
    }
    
    // Stop game music if playing
    if (this.gameMusic) {
      this.gameMusic.pause();
      this.gameMusic.currentTime = 0;
    }
    
    // Start menu music
    this.music.currentTime = 0; // Start from the beginning
    const playPromise = this.music.play();
    
    // Handle play promise rejection (if autoplay is blocked)
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log("[AudioManager] Menu music started successfully");
        this.lastMusicPlayed = 'menu';
      }).catch(e => {
        console.error('[AudioManager] Error playing menu music:', e);
      });
    }
  }

  public playGameMusic(): void {
    if (this._isMusicMuted || !this.gameMusic) return;
    
    console.log("[AudioManager] Playing game music");
    
    // Check if game music is already playing
    if (this.lastMusicPlayed === 'game' && !this.gameMusic.paused) {
      console.log("[AudioManager] Game music already playing");
      return;
    }
    
    // Stop menu music if playing
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
    
    // Start game music
    this.gameMusic.currentTime = 0; // Start from the beginning
    const playPromise = this.gameMusic.play();
    
    // Handle play promise rejection (if autoplay is blocked)
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log("[AudioManager] Game music started successfully");
        this.lastMusicPlayed = 'game';
      }).catch(e => {
        console.error('[AudioManager] Error playing game music:', e);
      });
    }
  }

  public stopMusic(): void {
    console.log("[AudioManager] Stopping all music");
    
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
    if (this.gameMusic) {
      this.gameMusic.pause();
      this.gameMusic.currentTime = 0;
    }
    
    this.lastMusicPlayed = 'none';
  }

  public setSoundMute(muted: boolean): void {
    this.isSoundMuted = muted;
  }

  public setMusicMute(muted: boolean): void {
    this._isMusicMuted = muted;
    
    if (muted) {
      this.stopMusic();
    } else {
      // Resume the appropriate music
      if (this.lastMusicPlayed === 'game') {
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
  
  public getCurrentMusic(): string {
    return this.lastMusicPlayed;
  }
}

export const audioManager = AudioManager.getInstance();