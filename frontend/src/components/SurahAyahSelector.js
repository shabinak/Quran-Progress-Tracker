import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { surahs } from '../data/surahs';

const SurahAyahSelector = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "Select memorization range",
  required = false 
}) => {
  const [startSurah, setStartSurah] = useState('');
  const [startAyah, setStartAyah] = useState('');
  const [endAyah, setEndAyah] = useState('');
  const [endSurah, setEndSurah] = useState('');
  const [isCrossSurah, setIsCrossSurah] = useState(false);

  // Parse existing value when value prop changes
  useEffect(() => {
    if (value) {
      // Try to parse new format: "Al-Baqarah Ayah 1-10" or "Al-Baqarah Ayah 1 - Al-Imran Ayah 10"
      const crossSurahMatch = value.match(/^(.+?)\s+Ayah\s+(\d+)\s+-\s+(.+?)\s+Ayah\s+(\d+)$/);
      if (crossSurahMatch) {
        // Cross-surah memorization: "Al-Baqarah Ayah 1 - Al-Imran Ayah 10"
        const [, startSurahName, start, endSurahName, end] = crossSurahMatch;
        const startSurahObj = surahs.find(s => s.name === startSurahName);
        const endSurahObj = surahs.find(s => s.name === endSurahName);
        if (startSurahObj && endSurahObj) {
          setStartSurah(startSurahObj.number.toString());
          setStartAyah(start);
          setEndAyah(end);
          setEndSurah(endSurahObj.number.toString());
          setIsCrossSurah(true);
        }
      } else {
        // Single surah memorization: "Al-Baqarah Ayah 1-10"
        const surahMatch = value.match(/^(.+?)\s+Ayah\s+(\d+)-(\d+)$/);
        if (surahMatch) {
          const [, surahName, start, end] = surahMatch;
          const surah = surahs.find(s => s.name === surahName);
          if (surah) {
            setStartSurah(surah.number.toString());
            setStartAyah(start);
            setEndAyah(end);
            setEndSurah('');
            setIsCrossSurah(false);
          }
        } else {
          // Fallback: try old format "Al-Baqarah 1-10" or "Al-Baqarah 1-10, Al-Imran"
          const parts = value.split(',');
          if (parts.length === 2) {
            // Cross-surah memorization (old format)
            const firstPart = parts[0].trim();
            const secondPart = parts[1].trim();
            
            const surahMatch = firstPart.match(/^(.+?)\s+(\d+)-(\d+)$/);
            if (surahMatch) {
              const [, surahName, start, end] = surahMatch;
              const surah = surahs.find(s => s.name === surahName);
              const endSurah = surahs.find(s => s.name === secondPart);
              if (surah && endSurah) {
                setStartSurah(surah.number.toString());
                setStartAyah(start);
                setEndAyah(end);
                setEndSurah(endSurah.number.toString());
                setIsCrossSurah(true);
              }
            }
          } else {
            // Single surah memorization (old format)
            const surahMatch = value.match(/^(.+?)\s+(\d+)-(\d+)$/);
            if (surahMatch) {
              const [, surahName, start, end] = surahMatch;
              const surah = surahs.find(s => s.name === surahName);
              if (surah) {
                setStartSurah(surah.number.toString());
                setStartAyah(start);
                setEndAyah(end);
                setEndSurah('');
                setIsCrossSurah(false);
              }
            }
          }
        }
      }
    } else {
      // Reset all fields when value is empty
      setStartSurah('');
      setStartAyah('');
      setEndAyah('');
      setEndSurah('');
      setIsCrossSurah(false);
    }
  }, [value]);

  // Memoize the formatted value to prevent unnecessary recalculations
  const formattedValue = useMemo(() => {
    if (!startSurah || !startAyah || !endAyah) return '';
    
    const surah = surahs.find(s => s.number === parseInt(startSurah));
    if (!surah) return '';
    
    if (isCrossSurah && endSurah) {
      const endSurahObj = surahs.find(s => s.number === parseInt(endSurah));
      if (endSurahObj) {
        return `${surah.name} Ayah ${startAyah} - ${endSurahObj.name} Ayah ${endAyah}`;
      }
    }
    return `${surah.name} Ayah ${startAyah}-${endAyah}`;
  }, [startSurah, startAyah, endAyah, endSurah, isCrossSurah]);

  // Update parent component when formatted value changes (with debounce)
  useEffect(() => {
    if (formattedValue !== value) {
      const timeoutId = setTimeout(() => {
        onChange(formattedValue);
      }, 100); // Small delay to prevent rapid updates
      
      return () => clearTimeout(timeoutId);
    }
  }, [formattedValue, value, onChange]);

  const handleStartSurahChange = useCallback((e) => {
    setStartSurah(e.target.value);
    setStartAyah('');
    setEndAyah('');
    setEndSurah('');
  }, []);

  const handleCrossSurahToggle = useCallback((e) => {
    setIsCrossSurah(e.target.checked);
    if (!e.target.checked) {
      setEndSurah('');
    }
  }, []);

  const getMaxAyahs = useCallback((surahNumber) => {
    const surah = surahs.find(s => s.number === parseInt(surahNumber));
    return surah ? surah.ayahs : 0;
  }, []);


  return (
    <div className="form-group">
      <label htmlFor={`${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {label} {required && '*'}
      </label>
      
      <div className="surah-selector-container">
        {/* Start Surah Selection */}
        <div className="surah-input-group">
          <select
            value={startSurah}
            onChange={handleStartSurahChange}
            required={required}
            className="surah-select"
          >
            <option value="">Select Surah</option>
            {surahs.map(surah => (
              <option key={surah.number} value={surah.number}>
                {surah.number}. {surah.name} ({surah.ayahs} ayahs)
              </option>
            ))}
          </select>
        </div>

        {/* Ayah Range Selection */}
        {startSurah && (
          <div className="ayah-range-group">
            <input
              type="number"
              placeholder="Start Ayah"
              value={startAyah}
              onChange={(e) => setStartAyah(e.target.value)}
              min="1"
              max={getMaxAyahs(startSurah)}
              className="ayah-input"
            />
            <span className="ayah-separator">to</span>
            <input
              type="number"
              placeholder="End Ayah"
              value={endAyah}
              onChange={(e) => setEndAyah(e.target.value)}
              min={startAyah || 1}
              max={getMaxAyahs(startSurah)}
              className="ayah-input"
            />
          </div>
        )}

        {/* Cross-Surah Option */}
        {startSurah && (
          <div className="cross-surah-option">
            <input
              type="checkbox"
              id={`cross-surah-${label.toLowerCase().replace(/\s+/g, '-')}`}
              checked={isCrossSurah}
              onChange={handleCrossSurahToggle}
              className="cross-surah-checkbox"
            />
            <label htmlFor={`cross-surah-${label.toLowerCase().replace(/\s+/g, '-')}`} className="cross-surah-label">
              Ends in next Surah
            </label>
          </div>
        )}

        {/* End Surah Selection (if cross-surah) */}
        {isCrossSurah && startSurah && (
          <div className="end-surah-group">
            <select
              value={endSurah}
              onChange={(e) => setEndSurah(e.target.value)}
              className="surah-select"
            >
              <option value="">Select End Surah</option>
              {surahs
                .filter(surah => surah.number > parseInt(startSurah))
                .map(surah => (
                  <option key={surah.number} value={surah.number}>
                    {surah.number}. {surah.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Preview */}
        {startSurah && startAyah && endAyah && (
          <div className="surah-preview">
            <strong>Preview:</strong> {value || 'Select options above'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurahAyahSelector;
