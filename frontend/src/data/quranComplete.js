// Complete Quran text data structure
// This is a sample structure - in practice, you would load this from a JSON file

export const quranComplete = {
  // Structure: surahNumber: { ayahNumber: arabicText }
  1: {
    1: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    2: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    3: "الرَّحْمَٰنِ الرَّحِيمِ",
    4: "مَالِكِ يَوْمِ الدِّينِ",
    5: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    6: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
    7: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ"
  },
  // ... (all 114 surahs would go here)
};

// Helper functions for complete Quran
export const getCompleteArabicText = (surahNumber, ayahNumber) => {
  const surah = quranComplete[surahNumber];
  if (!surah) return null;
  return surah[ayahNumber] || null;
};

export const getCompleteNextAyahs = (surahNumber, startAyah, count = 3) => {
  const surah = quranComplete[surahNumber];
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

export const ayahExistsInComplete = (surahNumber, ayahNumber) => {
  const surah = quranComplete[surahNumber];
  return surah && surah[ayahNumber];
};
