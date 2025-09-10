// Quran Data Loader - Handles loading complete Quran data via Tanzil API
// This file provides utilities to load and manage the complete Quran text

// Import surahs data for validation
import { surahs } from './surahs';

// Tanzil API configuration
const TANZIL_API_BASE = 'https://api.alquran.cloud/v1';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Cache for API responses
let quranData = null;
let isLoading = false;
let loadError = null;
let lastLoadTime = 0;

// Function to load Quran data from Tanzil API
export const loadQuranData = async () => {
  // Return cached data if still valid
  if (quranData && (Date.now() - lastLoadTime) < CACHE_DURATION) {
    return quranData;
  }

  if (isLoading) {
    // Wait for current loading to complete
    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (quranData) resolve(quranData);
        else if (loadError) resolve(null);
        else setTimeout(checkLoaded, 100);
      };
      checkLoaded();
    });
  }

  isLoading = true;
  loadError = null;

  try {
    console.log('🔄 Loading complete Quran data from Tanzil API...');
    
    // Load complete Quran from Tanzil API
    const response = await fetch(`${TANZIL_API_BASE}/quran/quran-uthmani`);
    
    if (!response.ok) {
      throw new Error(`Tanzil API error: ${response.status} ${response.statusText}`);
    }

    const apiData = await response.json();
    
    if (apiData.status !== 'OK') {
      throw new Error(`API returned error: ${apiData.message || 'Unknown error'}`);
    }

    // Convert API response to our format
    quranData = convertApiDataToOurFormat(apiData.data);
    lastLoadTime = Date.now();
    
    console.log('✅ Complete Quran data loaded successfully from Tanzil API');
    console.log(`📊 Loaded ${Object.keys(quranData).length} surahs`);
    
    return quranData;
  } catch (error) {
    console.warn('❌ Failed to load Quran data from Tanzil API:', error);
    loadError = error;
    
    // Fallback to sample data
    console.log('🔄 Falling back to sample data...');
    const sampleData = await loadSampleData();
    return sampleData;
  } finally {
    isLoading = false;
  }
};

// Convert Tanzil API response to our format
const convertApiDataToOurFormat = (apiData) => {
  const formattedData = {};
  
  apiData.surahs.forEach(surah => {
    const surahNumber = surah.number;
    formattedData[surahNumber] = {};
    
    surah.ayahs.forEach(ayah => {
      const ayahNumber = ayah.numberInSurah;
      const arabicText = ayah.text;
      formattedData[surahNumber][ayahNumber] = arabicText;
    });
  });
  
  return formattedData;
};

// Fallback to sample data if API is not available
const loadSampleData = async () => {
  try {
    const sampleModule = await import('./quranText');
    return sampleModule.quranText;
  } catch (error) {
    console.error('Failed to load sample data:', error);
    return {};
  }
};

// Get Arabic text for a specific ayah
export const getArabicText = async (surahNumber, ayahNumber) => {
  const data = await loadQuranData();
  if (!data) return null;
  
  const surah = data[surahNumber];
  if (!surah) return null;
  
  return surah[ayahNumber] || null;
};

// Get next N ayahs
export const getNextAyahs = async (surahNumber, startAyah, count = 3) => {
  const data = await loadQuranData();
  if (!data) return [];
  
  const surah = data[surahNumber];
  if (!surah) return [];
  
  const nextAyahs = [];
  for (let i = 0; i < count; i++) {
    const ayahNumber = startAyah + i;
    const text = surah[ayahNumber];
    
    if (text) {
      nextAyahs.push({
        ayah: ayahNumber,
        text: text,
        available: true
      });
    } else {
      // Check if we've reached the end of the surah
      const surahData = surahs.find(s => s.number === surahNumber);
      if (surahData && ayahNumber > surahData.ayahs) {
        nextAyahs.push({
          ayah: ayahNumber,
          text: `[End of ${surahData.name}]`,
          available: false
        });
      } else {
        nextAyahs.push({
          ayah: ayahNumber,
          text: `[Ayah ${ayahNumber} not available]`,
          available: false
        });
      }
    }
  }
  return nextAyahs;
};

// Check if ayah exists
export const ayahExists = async (surahNumber, ayahNumber) => {
  const data = await loadQuranData();
  if (!data) return false;
  
  const surah = data[surahNumber];
  return surah && surah[ayahNumber];
};

// Get all available ayahs for a surah
export const getSurahAyahs = async (surahNumber) => {
  const data = await loadQuranData();
  if (!data) return [];
  
  const surah = data[surahNumber];
  if (!surah) return [];
  
  return Object.keys(surah).map(ayah => parseInt(ayah)).sort((a, b) => a - b);
};

// Get statistics about loaded data
export const getDataStats = async () => {
  const data = await loadQuranData();
  if (!data) return { loaded: false, error: loadError, source: 'none' };
  
  const stats = {
    loaded: true,
    source: quranData ? 'tanzil_api' : 'sample_data',
    totalSurahs: Object.keys(data).length,
    totalAyahs: 0,
    surahs: {},
    cacheAge: quranData ? Math.round((Date.now() - lastLoadTime) / 1000 / 60) : 0, // minutes
    isCached: quranData && (Date.now() - lastLoadTime) < CACHE_DURATION
  };
  
  Object.keys(data).forEach(surahNum => {
    const surah = data[surahNum];
    const ayahCount = Object.keys(surah).length;
    stats.totalAyahs += ayahCount;
    stats.surahs[surahNum] = ayahCount;
  });
  
  return stats;
};
