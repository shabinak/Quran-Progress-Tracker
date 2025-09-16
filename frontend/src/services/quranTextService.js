import axios from 'axios';

/**
 * Service for fetching Quranic text in Uthmani script
 * Uses Al Quran Cloud API for authentic Uthmani text
 */
class QuranTextService {
  constructor() {
    this.baseURL = 'https://api.alquran.cloud/v1';
    this.textCache = new Map();
    
    // Uthmani script edition from Al Quran Cloud
    this.uthmaniEdition = 'quran-uthmani'; // Official Uthmani script
  }

  /**
   * Get Uthmani text for a specific ayah
   * @param {number} surah - Surah number (1-114)
   * @param {number} ayah - Ayah number
   * @returns {Promise<Object>} Ayah data with Uthmani text
   */
  async getAyahUthmani(surah, ayah) {
    const cacheKey = `${surah}:${ayah}`;
    
    // Check cache first
    if (this.textCache.has(cacheKey)) {
      return this.textCache.get(cacheKey);
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/ayah/${surah}:${ayah}/${this.uthmaniEdition}`,
        { timeout: 10000 }
      );

      if (response.data && response.data.data) {
        const ayahData = {
          surah: response.data.data.surah.number,
          ayah: response.data.data.numberInSurah,
          text: response.data.data.text,
          surahName: response.data.data.surah.name,
          surahEnglishName: response.data.data.surah.englishName,
          juz: response.data.data.juz,
          page: response.data.data.page,
          hizbQuarter: response.data.data.hizbQuarter,
          sajda: response.data.data.sajda
        };

        // Cache the result
        this.textCache.set(cacheKey, ayahData);
        return ayahData;
      }
    } catch (error) {
      console.error(`Error fetching Uthmani text for ${surah}:${ayah}:`, error);
      
      // Fallback to local data if API fails
      return this.getFallbackAyah(surah, ayah);
    }

    return null;
  }

  /**
   * Get multiple ayahs in Uthmani script
   * @param {number} surah - Surah number
   * @param {number} startAyah - Starting ayah number
   * @param {number} count - Number of ayahs to fetch
   * @returns {Promise<Array>} Array of ayah data
   */
  async getMultipleAyahsUthmani(surah, startAyah, count = 4) {
    const promises = [];
    
    for (let i = 0; i < count; i++) {
      const ayahNum = startAyah + i;
      promises.push(this.getAyahUthmani(surah, ayahNum));
    }

    try {
      const results = await Promise.all(promises);
      return results.filter(result => result !== null);
    } catch (error) {
      console.error('Error fetching multiple ayahs:', error);
      return [];
    }
  }

  /**
   * Get a range of ayahs from the same surah or across surahs
   * @param {number} surah - Starting surah number
   * @param {number} ayah - Starting ayah number
   * @param {number} count - Number of ayahs to fetch
   * @returns {Promise<Array>} Array of ayah data
   */
  async getAyahRange(surah, ayah, count = 4) {
    const ayahs = [];
    let currentSurah = surah;
    let currentAyah = ayah;

    // Surah lengths (simplified list - in production you'd use complete data)
    const surahLengths = {
      1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
      11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
      21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
      31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
      41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
      51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
      61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
      71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
      81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
      91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
      101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
      111: 5, 112: 4, 113: 5, 114: 6
    };

    for (let i = 0; i < count; i++) {
      try {
        const ayahData = await this.getAyahUthmani(currentSurah, currentAyah);
        
        if (ayahData) {
          ayahs.push(ayahData);
        }
        
        // Move to next ayah
        currentAyah++;
        
        // Check if we've reached the end of current surah
        const surahLength = surahLengths[currentSurah];
        if (surahLength && currentAyah > surahLength) {
          // Move to next surah
          currentSurah++;
          currentAyah = 1;
          
          // Check if we've reached the end of Quran
          if (currentSurah > 114) break;
        }
      } catch (error) {
        console.error(`Error fetching ayah ${currentSurah}:${currentAyah}:`, error);
        // Continue to next ayah even if this one fails
        currentAyah++;
        
        // Check surah boundary
        const surahLength = surahLengths[currentSurah];
        if (surahLength && currentAyah > surahLength) {
          currentSurah++;
          currentAyah = 1;
          if (currentSurah > 114) break;
        }
      }
    }

    return ayahs;
  }

  /**
   * Fallback method using local data when API is unavailable
   */
  getFallbackAyah(surah, ayah) {
    // This would use your existing local Quran data
    // For now, return a placeholder
    return {
      surah: surah,
      ayah: ayah,
      text: 'النص غير متوفر حالياً', // "Text not available currently" in Arabic
      surahName: `Surah ${surah}`,
      surahEnglishName: `Surah ${surah}`,
      juz: 1,
      page: 1,
      hizbQuarter: 1,
      sajda: false,
      isLocal: true
    };
  }

  /**
   * Split Uthmani text into lines for mushaf layout
   * @param {string} text - Uthmani text
   * @param {number} maxWordsPerLine - Maximum words per line
   * @returns {Array<string>} Array of text lines
   */
  splitIntoLines(text, maxWordsPerLine = 10) {
    if (!text) return [];
    
    const words = text.trim().split(/\s+/);
    const lines = [];
    
    for (let i = 0; i < words.length; i += maxWordsPerLine) {
      const line = words.slice(i, i + maxWordsPerLine).join(' ');
      lines.push(line);
    }
    
    return lines;
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.textCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize() {
    return this.textCache.size;
  }
}

export const quranTextService = new QuranTextService();
export default quranTextService;
