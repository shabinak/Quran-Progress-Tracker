import axios from 'axios';

// Quran.com API base URL
const QURAN_API_BASE = 'https://api.quran.com/api/v4';

// Popular recitation IDs from Quran.com API
export const RECITERS = {
  MISHARY_RASHID: 7, // Mishary Rashid Alafasy
  ABDUL_BASIT: 1, // Abdul Basit Abdul Samad
  MAHER_AL_MUAIQLY: 5, // Maher Al Muaiqly
  SUDAIS: 12, // Abdul Rahman Al-Sudais
  HUSARY: 2, // Mahmoud Khalil Al-Husary
  MINSHAWI: 3, // Mohamed Siddiq Al-Minshawi
  GHAMDI: 9, // Saad Al Ghamdi
};

// Default reciter (Mahmoud Khalil Al-Husary)
const DEFAULT_RECITER_ID = RECITERS.HUSARY;

class QuranAudioService {
  constructor() {
    this.audioCache = new Map();
    this.currentAudio = null;
    this.isPlaying = false;
  }

  /**
   * Get available reciters from Quran.com API
   */
  async getReciters() {
    try {
      const response = await axios.get(`${QURAN_API_BASE}/resources/recitations`);
      return response.data.recitations || [];
    } catch (error) {
      console.error('Error fetching reciters:', error);
      return [];
    }
  }

  /**
   * Get audio URL for a specific ayah
   * @param {number} surah - Surah number (1-114)
   * @param {number} ayah - Ayah number
   * @param {number} reciterId - Reciter ID (optional, defaults to Al-Husary)
   */
  async getAyahAudio(surah, ayah, reciterId = DEFAULT_RECITER_ID) {
    const ayahKey = `${surah}:${ayah}`;
    const cacheKey = `${reciterId}-${ayahKey}`;
    
    // Check cache first
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey);
    }

    // For Al-Husary, use direct reliable URLs (skip API for better reliability)
    const fallbackUrls = [
      // EveryAyah.com - Al-Husary (most reliable source)
      `https://www.everyayah.com/data/Husary_128kbps/${surah.toString().padStart(3, '0')}${ayah.toString().padStart(3, '0')}.mp3`,
      // Alternative EveryAyah source  
      `https://everyayah.com/data/Husary_64kbps/${surah.toString().padStart(3, '0')}${ayah.toString().padStart(3, '0')}.mp3`,
      // GlobalQuran.com
      `https://globalquran.com/audio/husary/${surah.toString().padStart(3, '0')}${ayah.toString().padStart(3, '0')}.mp3`,
      // Islamic Network CDN
      `https://cdn.islamic.network/quran/audio/128/ar.husary/${surah}/${ayah}.mp3`
    ];
    
    console.log(`Getting audio for ${ayahKey}, trying URLs:`, fallbackUrls);
    
    const audioData = {
      url: fallbackUrls[0], // Use first URL
      fallbackUrls: fallbackUrls,
      ayahKey: ayahKey,
      reciterId: reciterId,
      format: 'mp3',
      isDirect: true
    };

    // Cache the result
    this.audioCache.set(cacheKey, audioData);
    return audioData;
  }

  /**
   * Play audio for a specific ayah
   * @param {number} surah - Surah number
   * @param {number} ayah - Ayah number
   * @param {number} reciterId - Reciter ID (optional)
   * @param {function} onPlay - Callback when audio starts playing
   * @param {function} onPause - Callback when audio is paused
   * @param {function} onEnd - Callback when audio ends
   * @param {function} onError - Callback when audio encounters error
   */
  async playAyah(surah, ayah, reciterId = DEFAULT_RECITER_ID, callbacks = {}) {
    try {
      // Stop any currently playing audio
      this.stopAudio();

      // Get audio data
      const audioData = await this.getAyahAudio(surah, ayah, reciterId);
      
      // Try to play audio with fallback support
      await this.tryPlayAudio(audioData, callbacks);
      
      return audioData;
    } catch (error) {
      console.error('Error playing ayah audio:', error);
      if (callbacks.onError) callbacks.onError(error);
      throw error;
    }
  }

  /**
   * Try to play audio with fallback URLs
   */
  async tryPlayAudio(audioData, callbacks = {}, urlIndex = 0) {
    const urls = audioData.fallbackUrls || [audioData.url];
    const currentUrl = urls[urlIndex];

    if (!currentUrl) {
      throw new Error('No more audio URLs to try');
    }

    return new Promise((resolve, reject) => {
      // Create new audio element
      this.currentAudio = new Audio(currentUrl);
      
      // Set up event listeners
      this.currentAudio.onplay = () => {
        this.isPlaying = true;
        if (callbacks.onPlay) callbacks.onPlay(audioData);
        resolve(audioData);
      };

      this.currentAudio.onpause = () => {
        this.isPlaying = false;
        if (callbacks.onPause) callbacks.onPause(audioData);
      };

      this.currentAudio.onended = () => {
        this.isPlaying = false;
        if (callbacks.onEnd) callbacks.onEnd(audioData);
      };

      this.currentAudio.onerror = async (error) => {
        console.warn(`Audio URL failed: ${currentUrl}`, error);
        console.log(`Error details:`, {
          url: currentUrl,
          urlIndex: urlIndex,
          totalUrls: urls.length,
          errorType: error.type || 'unknown'
        });
        
        // Try next URL if available
        if (urlIndex < urls.length - 1) {
          console.log(`Trying fallback URL ${urlIndex + 1}/${urls.length - 1}: ${urls[urlIndex + 1]}`);
          try {
            await this.tryPlayAudio(audioData, callbacks, urlIndex + 1);
            resolve(audioData);
          } catch (fallbackError) {
            reject(fallbackError);
          }
        } else {
          this.isPlaying = false;
          console.error('All audio URLs failed:', urls);
          if (callbacks.onError) callbacks.onError(error, audioData);
          reject(new Error('All audio URLs failed to load'));
        }
      };

      // Start playing
      console.log(`Attempting to play: ${currentUrl}`);
      this.currentAudio.play().catch(error => {
        console.error('Play failed for URL:', currentUrl, error);
        this.currentAudio.onerror(error);
      });
    });
  }

  /**
   * Pause currently playing audio
   */
  pauseAudio() {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
    }
  }

  /**
   * Resume paused audio
   */
  resumeAudio() {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play();
    }
  }

  /**
   * Stop and reset current audio
   */
  stopAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.isPlaying = false;
    }
  }

  /**
   * Get current playback state
   */
  getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      hasAudio: !!this.currentAudio,
      currentTime: this.currentAudio ? this.currentAudio.currentTime : 0,
      duration: this.currentAudio ? this.currentAudio.duration : 0
    };
  }

  /**
   * Clear audio cache
   */
  clearCache() {
    this.audioCache.clear();
  }

  /**
   * Preload audio for multiple ayahs (for better performance)
   * @param {Array} ayahs - Array of {surah, ayah} objects
   * @param {number} reciterId - Reciter ID
   */
  async preloadAyahs(ayahs, reciterId = DEFAULT_RECITER_ID) {
    const promises = ayahs.map(({ surah, ayah }) => 
      this.getAyahAudio(surah, ayah, reciterId).catch(error => {
        console.warn(`Failed to preload ${surah}:${ayah}`, error);
        return null;
      })
    );

    try {
      await Promise.all(promises);
      console.log(`Preloaded ${ayahs.length} ayah audio files`);
    } catch (error) {
      console.error('Error preloading ayahs:', error);
    }
  }
}

// Create and export singleton instance
export const quranAudioService = new QuranAudioService();
export default quranAudioService;
