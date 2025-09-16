import React, { useState, useEffect } from 'react';
import { surahs } from '../data/surahs';
import { juz } from '../data/juz';
import { getArabicText, getNextAyahs, ayahExists } from '../data/quranDataLoader';
import ApiStatus from '../components/ApiStatus';
import { quranAudioService, RECITERS } from '../services/quranAudioService';

const MemorizationTest = () => {
  const [testMode, setTestMode] = useState('surah'); // 'surah' or 'juz'
  const [selectedSurahs, setSelectedSurahs] = useState([]);
  const [selectedJuz, setSelectedJuz] = useState([]);
  const [currentAyah, setCurrentAyah] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [testHistory, setTestHistory] = useState([]);
  const [isTestActive, setIsTestActive] = useState(false);
  const [quranDataLoaded, setQuranDataLoaded] = useState(false);
  const [dataStats, setDataStats] = useState(null);
  const [currentArabicText, setCurrentArabicText] = useState('');
  const [nextAyahs, setNextAyahs] = useState([]);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Quran recitation state
  const [isRecitationPlaying, setIsRecitationPlaying] = useState(false);
  const [recitationLoading, setRecitationLoading] = useState(false);
  const [selectedReciter] = useState(RECITERS.HUSARY); // Fixed to Al-Husary only
  // const [availableReciters, setAvailableReciters] = useState([]); // Not needed anymore

  // Load Quran data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const { getDataStats } = await import('../data/quranDataLoader');
        const stats = await getDataStats();
        setDataStats(stats);
        setQuranDataLoaded(stats.loaded);
      } catch (error) {
        console.error('Failed to load Quran data:', error);
        setQuranDataLoaded(false);
      }
    };
    
    loadData();
    // No need to load reciters - using Al-Husary only
  }, []);

  // Generate random ayah based on selection
  const generateRandomAyah = async () => {
    let availableAyahs = [];

    if (testMode === 'surah' && selectedSurahs.length > 0) {
      for (const surahNumber of selectedSurahs) {
        const surah = surahs.find(s => s.number === surahNumber);
        if (surah) {
          for (let ayah = 1; ayah <= surah.ayahs; ayah++) {
            // Only include ayahs that have Arabic text available
            if (await ayahExists(surahNumber, ayah)) {
              availableAyahs.push({ surah: surahNumber, ayah });
            }
          }
        }
      }
    } else if (testMode === 'juz' && selectedJuz.length > 0) {
      for (const juzNumber of selectedJuz) {
        const juzData = juz.find(j => j.number === juzNumber);
        if (juzData) {
          // Generate ayahs for this juz
          if (juzData.startSurah === juzData.endSurah) {
            // Single surah juz
            for (let ayah = juzData.startAyah; ayah <= juzData.endAyah; ayah++) {
              if (await ayahExists(juzData.startSurah, ayah)) {
                availableAyahs.push({ surah: juzData.startSurah, ayah });
              }
            }
          } else {
            // Multi-surah juz - simplified for now
            for (let surah = juzData.startSurah; surah <= juzData.endSurah; surah++) {
              const surahData = surahs.find(s => s.number === surah);
              if (surahData) {
                const startAyah = surah === juzData.startSurah ? juzData.startAyah : 1;
                const endAyah = surah === juzData.endSurah ? juzData.endAyah : surahData.ayahs;
                for (let ayah = startAyah; ayah <= endAyah; ayah++) {
                  if (await ayahExists(surah, ayah)) {
                    availableAyahs.push({ surah, ayah });
                  }
                }
              }
            }
          }
        }
      }
    }

    if (availableAyahs.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableAyahs.length);
      return availableAyahs[randomIndex];
    }
    return null;
  };

  const startTest = async () => {
    if ((testMode === 'surah' && selectedSurahs.length === 0) || 
        (testMode === 'juz' && selectedJuz.length === 0)) {
      alert('Please select at least one ' + (testMode === 'surah' ? 'surah' : 'juz') + ' to test');
      return;
    }

    setIsTestActive(true);
    setShowAnswer(false);
    setTestHistory([]);
    await generateNewAyah();
  };

  const generateNewAyah = async () => {
    const newAyah = await generateRandomAyah();
    if (newAyah) {
      setCurrentAyah(newAyah);
      setShowAnswer(false);
      
      // Clear previous recording when moving to next question
      clearRecording();
      
      // Stop any playing recitation
      stopRecitation();
      
      // Load Arabic text and next ayahs
      try {
        const arabicText = await getArabicText(newAyah.surah, newAyah.ayah);
        const nextAyahsData = await getNextAyahs(newAyah.surah, newAyah.ayah + 1, 3);
        
        setCurrentArabicText(arabicText || '');
        setNextAyahs(nextAyahsData);
      } catch (error) {
        console.error('Error loading ayah data:', error);
        setCurrentArabicText('');
        setNextAyahs([]);
      }
    } else {
      alert('No ayahs available for the selected ' + testMode);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const markCorrect = async () => {
    if (currentAyah) {
      setTestHistory(prev => [...prev, { ...currentAyah, result: 'correct', timestamp: new Date() }]);
      await generateNewAyah();
    }
  };

  const markIncorrect = async () => {
    if (currentAyah) {
      setTestHistory(prev => [...prev, { ...currentAyah, result: 'incorrect', timestamp: new Date() }]);
      await generateNewAyah();
    }
  };

  const endTest = () => {
    setIsTestActive(false);
    setCurrentAyah(null);
    setShowAnswer(false);
    clearRecording();
    stopRecitation();
  };

  // Recording functions
  const startRecording = async () => {
    try {
      // Check if we're on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        alert('Recording is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not supported in this browser. Please use a modern browser.');
        return;
      }

      // Check if we're on HTTPS (required for media access)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        alert('Recording requires HTTPS. Please access this app through a secure connection.');
        return;
      }

      // Show mobile-specific instructions
      if (isMobile) {
        const proceed = window.confirm(
          '📱 Mobile Recording Instructions:\n\n' +
          '1. Make sure you allow microphone access when prompted\n' +
          '2. If recording doesn\'t start, check your browser settings\n' +
          '3. Some browsers may require you to tap the screen first\n\n' +
          'Continue with recording?'
        );
        if (!proceed) return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Check if MediaRecorder supports the audio format
      const options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp4';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'audio/wav';
        }
      }

      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        alert('Recording error occurred. Please try again.');
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      
      let errorMessage = 'Could not access microphone. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow microphone access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please connect a microphone.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Recording is not supported in this browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Microphone is being used by another application.';
      } else {
        errorMessage += 'Please check your browser settings and try again.';
      }
      
      alert(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (audioURL) {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      
      const audio = new Audio(audioURL);
      setCurrentAudio(audio);
      
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);
      
      audio.play();
    }
  };

  const pauseRecording = () => {
    if (currentAudio && isPlaying) {
      currentAudio.pause();
    }
  };

  const stopPlayback = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseRecording();
    } else {
      playRecording();
    }
  };

  const clearRecording = () => {
    // Stop any playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setIsRecording(false);
    setIsPlaying(false);
    if (mediaRecorder) {
      mediaRecorder.stream?.getTracks().forEach(track => track.stop());
    }
    setMediaRecorder(null);
  };

  // Quran recitation functions
  const playCurrentAyahRecitation = async () => {
    if (!currentAyah) return;

    setRecitationLoading(true);
    try {
      await quranAudioService.playAyah(
        currentAyah.surah,
        currentAyah.ayah,
        selectedReciter,
        {
          onPlay: (audioData) => {
            setIsRecitationPlaying(true);
            console.log('Playing recitation:', audioData);
          },
          onPause: () => setIsRecitationPlaying(false),
          onEnd: () => setIsRecitationPlaying(false),
          onError: (error, audioData) => {
            console.error('Recitation error:', error);
            setIsRecitationPlaying(false);
            
            // Provide more specific error messages
            let errorMessage = 'Unable to play recitation. ';
            if (error.message && error.message.includes('All audio URLs failed')) {
              errorMessage += 'Audio files are not available for this ayah with the selected reciter. Please try a different reciter.';
            } else if (error.message && error.message.includes('network')) {
              errorMessage += 'Please check your internet connection and try again.';
            } else {
              errorMessage += 'Please try again or select a different reciter.';
            }
            
            alert(errorMessage);
          }
        }
      );
    } catch (error) {
      console.error('Failed to play recitation:', error);
      
      let errorMessage = 'Failed to load recitation. ';
      if (navigator.onLine === false) {
        errorMessage += 'You appear to be offline. Please check your internet connection.';
      } else if (error.message && error.message.includes('All audio URLs failed')) {
        errorMessage += 'Audio is not available for this ayah. Please try a different reciter.';
      } else {
        errorMessage += 'Please check your internet connection and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setRecitationLoading(false);
    }
  };

  const stopRecitation = () => {
    quranAudioService.stopAudio();
    setIsRecitationPlaying(false);
  };

  const pauseRecitation = () => {
    quranAudioService.pauseAudio();
    setIsRecitationPlaying(false);
  };

  // const resumeRecitation = () => {
  //   quranAudioService.resumeAudio();
  //   setIsRecitationPlaying(true);
  // };

  const getSurahName = (surahNumber) => {
    const surah = surahs.find(s => s.number === surahNumber);
    return surah ? surah.name : `Surah ${surahNumber}`;
  };

  const getTestStats = () => {
    const total = testHistory.length;
    const correct = testHistory.filter(item => item.result === 'correct').length;
    const incorrect = testHistory.filter(item => item.result === 'incorrect').length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return { total, correct, incorrect, accuracy };
  };

  const stats = getTestStats();

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          .fade-in-up {
            animation: fadeInUp 0.6s ease-out;
          }
          
          .slide-in {
            animation: slideIn 0.4s ease-out;
          }
        `}
      </style>
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 0'
      }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header Section */}
        <div className="fade-in-up" style={{ 
          textAlign: 'center', 
          marginBottom: '40px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div>
              <h1 style={{ 
                margin: '0', 
                fontSize: '2.5rem', 
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'left'
              }}>
                🧠 Memorization Test
              </h1>
              <p style={{ 
                margin: '10px 0 0 0', 
                fontSize: '1.1rem', 
                color: '#666',
                textAlign: 'left'
              }}>
                Test your Quran memorization by recalling the next ayahs
              </p>
            </div>
            {isTestActive && (
              <div style={{ 
                display: 'flex', 
                gap: '15px', 
                alignItems: 'center',
                background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                padding: '12px 24px',
                borderRadius: '50px',
                boxShadow: '0 8px 20px rgba(255, 107, 107, 0.3)',
                animation: 'pulse 2s infinite'
              }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: 'white', 
                  borderRadius: '50%',
                  animation: 'blink 1s infinite'
                }}></div>
                <span style={{ 
                  color: 'white', 
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  Test Active
                </span>
                <button 
                  onClick={endTest} 
                  style={{ 
                    background: 'rgba(255,255,255,0.2)',
                    border: '2px solid white',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '25px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.color = '#ff6b6b';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.2)';
                    e.target.style.color = 'white';
                  }}
                >
                  End Test
                </button>
              </div>
            )}
          </div>

          {/* API Status Component */}
          <ApiStatus />
        </div>

        {!isTestActive ? (
        // Test Setup
        <div className="slide-in" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          marginBottom: '30px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ 
              margin: '0 0 10px 0', 
              fontSize: '2rem', 
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ⚙️ Test Setup
            </h2>
            <p style={{ color: '#666', fontSize: '1.1rem', margin: '0' }}>
              Configure your memorization test preferences
            </p>
          </div>
          
          {/* Test Mode Selection */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '1.2rem', 
              fontWeight: '600', 
              marginBottom: '15px',
              color: '#333'
            }}>
              Choose Test Mode
            </label>
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                cursor: 'pointer',
                padding: '15px 25px',
                borderRadius: '15px',
                border: testMode === 'surah' ? '3px solid #667eea' : '3px solid #e0e0e0',
                background: testMode === 'surah' ? 'linear-gradient(135deg, #667eea20, #764ba220)' : 'white',
                transition: 'all 0.3s ease',
                minWidth: '200px',
                justifyContent: 'center'
              }}>
                <input
                  type="radio"
                  name="testMode"
                  value="surah"
                  checked={testMode === 'surah'}
                  onChange={(e) => setTestMode(e.target.value)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600',
                  color: testMode === 'surah' ? '#667eea' : '#666'
                }}>
                  📖 Test by Surah
                </span>
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                cursor: 'pointer',
                padding: '15px 25px',
                borderRadius: '15px',
                border: testMode === 'juz' ? '3px solid #667eea' : '3px solid #e0e0e0',
                background: testMode === 'juz' ? 'linear-gradient(135deg, #667eea20, #764ba220)' : 'white',
                transition: 'all 0.3s ease',
                minWidth: '200px',
                justifyContent: 'center'
              }}>
                <input
                  type="radio"
                  name="testMode"
                  value="juz"
                  checked={testMode === 'juz'}
                  onChange={(e) => setTestMode(e.target.value)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600',
                  color: testMode === 'juz' ? '#667eea' : '#666'
                }}>
                  📚 Test by Juz
                </span>
              </label>
            </div>
          </div>

          {/* Selection Interface */}
          {testMode === 'surah' ? (
            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '1.2rem', 
                fontWeight: '600', 
                marginBottom: '15px',
                color: '#333'
              }}>
                📖 Select Surahs to Test
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                gap: '15px', 
                marginTop: '15px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '15px',
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '15px',
                border: '2px solid rgba(102, 126, 234, 0.1)'
              }}>
                {surahs.map(surah => (
                  <label key={surah.number} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    cursor: 'pointer',
                    padding: '15px 20px',
                    borderRadius: '12px',
                    background: selectedSurahs.includes(surah.number) 
                      ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                      : 'white',
                    border: selectedSurahs.includes(surah.number) 
                      ? 'none' 
                      : '2px solid #e0e0e0',
                    transition: 'all 0.3s ease',
                    boxShadow: selectedSurahs.includes(surah.number) 
                      ? '0 8px 20px rgba(102, 126, 234, 0.3)' 
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    transform: selectedSurahs.includes(surah.number) ? 'translateY(-2px)' : 'translateY(0)'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedSurahs.includes(surah.number)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSurahs(prev => [...prev, surah.number]);
                        } else {
                          setSelectedSurahs(prev => prev.filter(num => num !== surah.number));
                        }
                      }}
                      style={{ 
                        transform: 'scale(1.3)',
                        accentColor: '#667eea'
                      }}
                    />
                    <span style={{ 
                      fontSize: '15px',
                      fontWeight: '600',
                      color: selectedSurahs.includes(surah.number) ? 'white' : '#333'
                    }}>
                      {surah.number}. {surah.name} ({surah.ayahs} ayahs)
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '1.2rem', 
                fontWeight: '600', 
                marginBottom: '15px',
                color: '#333'
              }}>
                📚 Select Juz to Test
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                gap: '15px', 
                marginTop: '15px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '15px',
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '15px',
                border: '2px solid rgba(102, 126, 234, 0.1)'
              }}>
                {juz.map(juzItem => (
                  <label key={juzItem.number} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    cursor: 'pointer',
                    padding: '15px 20px',
                    borderRadius: '12px',
                    background: selectedJuz.includes(juzItem.number) 
                      ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                      : 'white',
                    border: selectedJuz.includes(juzItem.number) 
                      ? 'none' 
                      : '2px solid #e0e0e0',
                    transition: 'all 0.3s ease',
                    boxShadow: selectedJuz.includes(juzItem.number) 
                      ? '0 8px 20px rgba(102, 126, 234, 0.3)' 
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    transform: selectedJuz.includes(juzItem.number) ? 'translateY(-2px)' : 'translateY(0)'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedJuz.includes(juzItem.number)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJuz(prev => [...prev, juzItem.number]);
                        } else {
                          setSelectedJuz(prev => prev.filter(num => num !== juzItem.number));
                        }
                      }}
                      style={{ 
                        transform: 'scale(1.3)',
                        accentColor: '#667eea'
                      }}
                    />
                    <span style={{ 
                      fontSize: '15px',
                      fontWeight: '600',
                      color: selectedJuz.includes(juzItem.number) ? 'white' : '#333'
                    }}>
                      Juz {juzItem.number}: {juzItem.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ 
            textAlign: 'center', 
            marginTop: '30px',
            padding: '20px'
          }}>
            <button 
              onClick={startTest} 
              disabled={testMode === 'surah' ? selectedSurahs.length === 0 : selectedJuz.length === 0}
              style={{
                background: (testMode === 'surah' ? selectedSurahs.length === 0 : selectedJuz.length === 0)
                  ? 'linear-gradient(135deg, #ccc, #999)'
                  : 'linear-gradient(135deg, #4CAF50, #45a049)',
                color: 'white',
                border: 'none',
                padding: '15px 40px',
                fontSize: '1.2rem',
                fontWeight: '700',
                borderRadius: '50px',
                cursor: (testMode === 'surah' ? selectedSurahs.length === 0 : selectedJuz.length === 0) ? 'not-allowed' : 'pointer',
                boxShadow: (testMode === 'surah' ? selectedSurahs.length === 0 : selectedJuz.length === 0)
                  ? '0 4px 8px rgba(0,0,0,0.2)'
                  : '0 8px 20px rgba(76, 175, 80, 0.4)',
                transition: 'all 0.3s ease',
                transform: (testMode === 'surah' ? selectedSurahs.length === 0 : selectedJuz.length === 0) ? 'none' : 'translateY(-2px)',
                opacity: (testMode === 'surah' ? selectedSurahs.length === 0 : selectedJuz.length === 0) ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!(testMode === 'surah' ? selectedSurahs.length === 0 : selectedJuz.length === 0)) {
                  e.target.style.transform = 'translateY(-4px)';
                  e.target.style.boxShadow = '0 12px 25px rgba(76, 175, 80, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                if (!(testMode === 'surah' ? selectedSurahs.length === 0 : selectedJuz.length === 0)) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(76, 175, 80, 0.4)';
                }
              }}
            >
              🚀 Start Test
            </button>
            <p style={{ 
              margin: '15px 0 0 0', 
              color: '#666', 
              fontSize: '0.9rem' 
            }}>
              {testMode === 'surah' 
                ? `Selected ${selectedSurahs.length} surah${selectedSurahs.length !== 1 ? 's' : ''}`
                : `Selected ${selectedJuz.length} juz${selectedJuz.length !== 1 ? 'es' : ''}`
              }
            </p>
          </div>
        </div>
      ) : (
        // Active Test Interface
        <div>
          {/* Test Stats */}
          <div className="fade-in-up" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            marginBottom: '30px'
          }}>
            <h3 style={{ 
              textAlign: 'center', 
              margin: '0 0 25px 0', 
              fontSize: '1.8rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              📊 Test Progress
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '20px' 
            }}>
              <div style={{ 
                textAlign: 'center',
                padding: '20px',
                background: 'linear-gradient(135deg, #667eea20, #764ba220)',
                borderRadius: '15px',
                border: '2px solid rgba(102, 126, 234, 0.2)'
              }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 'bold', 
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '8px'
                }}>
                  {stats.total}
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  color: '#666',
                  fontWeight: '600'
                }}>
                  Total Tested
                </div>
              </div>
              <div style={{ 
                textAlign: 'center',
                padding: '20px',
                background: 'linear-gradient(135deg, #10B98120, #05966920)',
                borderRadius: '15px',
                border: '2px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 'bold', 
                  color: '#10B981',
                  marginBottom: '8px'
                }}>
                  {stats.correct}
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  color: '#666',
                  fontWeight: '600'
                }}>
                  Correct
                </div>
              </div>
              <div style={{ 
                textAlign: 'center',
                padding: '20px',
                background: 'linear-gradient(135deg, #EF444420, #DC262620)',
                borderRadius: '15px',
                border: '2px solid rgba(239, 68, 68, 0.2)'
              }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 'bold', 
                  color: '#EF4444',
                  marginBottom: '8px'
                }}>
                  {stats.incorrect}
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  color: '#666',
                  fontWeight: '600'
                }}>
                  Incorrect
                </div>
              </div>
              <div style={{ 
                textAlign: 'center',
                padding: '20px',
                background: 'linear-gradient(135deg, #3B82F620, #2563EB20)',
                borderRadius: '15px',
                border: '2px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 'bold', 
                  color: '#3B82F6',
                  marginBottom: '8px'
                }}>
                  {stats.accuracy}%
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  color: '#666',
                  fontWeight: '600'
                }}>
                  Accuracy
                </div>
              </div>
            </div>
          </div>

          {/* Current Ayah Display */}
          {currentAyah && (
            <div className="card" style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3>Current Test</h3>
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--text-light)', 
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: quranDataLoaded ? '#f0fdf4' : '#fef3c7',
                borderRadius: '8px',
                border: quranDataLoaded ? '1px solid #22c55e' : '1px solid #f59e0b'
              }}>
                {quranDataLoaded ? (
                  <>
                    {dataStats?.source === 'tanzil_api' ? (
                      <>
                        🌐 <strong>Tanzil API Connected!</strong> Complete Quran data loaded from Tanzil API.
                        {dataStats && (
                          <div style={{ marginTop: '5px', fontSize: '12px' }}>
                            📊 {dataStats.totalSurahs} surahs, {dataStats.totalAyahs} ayahs loaded
                            {dataStats.isCached && (
                              <span> • Cached {dataStats.cacheAge} minutes ago</span>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        ✅ <strong>Complete Quran Data Loaded!</strong> All 114 surahs with full Arabic text are available.
                        {dataStats && (
                          <div style={{ marginTop: '5px', fontSize: '12px' }}>
                            📊 {dataStats.totalSurahs} surahs, {dataStats.totalAyahs} ayahs loaded
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    📚 <strong>Sample Data Mode:</strong> Using limited sample data. Some ayahs may not be available.
                    <div style={{ marginTop: '5px', fontSize: '12px' }}>
                      🔄 Loading complete Quran data from Tanzil API...
                    </div>
                  </>
                )}
              </div>
              
              {/* Question - Current Ayah */}
              <div style={{ 
                fontSize: '18px', 
                marginBottom: '20px',
                padding: '20px',
                backgroundColor: 'var(--accent-purple)',
                borderRadius: '12px',
                border: '2px solid var(--primary-purple)'
              }}>
                <div style={{ marginBottom: '15px', fontWeight: '600', color: 'var(--primary-purple)' }}>
                  Question: {getSurahName(currentAyah.surah)} - Ayah {currentAyah.ayah}
                </div>
                <div style={{ 
                  fontSize: '28px', 
                  fontFamily: 'Amiri, Arial, sans-serif',
                  lineHeight: '2.5',
                  direction: 'rtl',
                  textAlign: 'right',
                  color: 'var(--text-dark)',
                  fontWeight: '500'
                }}>
                  {currentArabicText || 'Loading...'}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  marginTop: '10px',
                  color: 'var(--text-light)',
                  fontStyle: 'italic'
                }}>
                  What are the next 3 ayahs?
                </div>
              </div>

              {/* Recitation Section */}
              <div style={{ 
                marginBottom: '20px',
                padding: '20px',
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                borderRadius: '12px',
                border: '2px solid #0ea5e9',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#0ea5e9',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  🎵 Listen to Recitation
                </div>
                
                {/* Reciter Info - Show Al-Husary as default */}
                <div style={{ 
                  marginBottom: '15px',
                  fontSize: '14px',
                  color: '#0ea5e9',
                  fontWeight: '500'
                }}>
                  Reciter: Mahmoud Khalil Al-Husary
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  {!isRecitationPlaying ? (
                    <button 
                      onClick={playCurrentAyahRecitation}
                      disabled={recitationLoading}
                      style={{
                        background: recitationLoading 
                          ? 'linear-gradient(135deg, #94a3b8, #64748b)'
                          : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        borderRadius: '20px',
                        cursor: recitationLoading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: recitationLoading ? 0.7 : 1
                      }}
                      onMouseOver={(e) => {
                        if (!recitationLoading) {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 16px rgba(14, 165, 233, 0.4)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!recitationLoading) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.3)';
                        }
                      }}
                    >
                      {recitationLoading ? (
                        <>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            border: '2px solid transparent',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          ▶️ Play Recitation
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={pauseRecitation}
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: 'white',
                          border: 'none',
                          padding: '12px 20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                        }}
                      >
                        ⏸️ Pause
                      </button>
                      <button 
                        onClick={stopRecitation}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: 'white',
                          border: 'none',
                          padding: '12px 20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                        }}
                      >
                        ⏹️ Stop
                      </button>
                    </>
                  )}
                </div>

                {isRecitationPlaying && (
                  <div style={{ 
                    marginTop: '12px',
                    color: '#0ea5e9',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: '#0ea5e9', 
                      borderRadius: '50%',
                      animation: 'blink 1s infinite'
                    }}></div>
                    Playing recitation...
                  </div>
                )}
              </div>

              {/* Answer - Next 3 Ayahs */}
              {showAnswer && (
                <div style={{ 
                  fontSize: '18px', 
                  marginBottom: '20px',
                  padding: '20px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '12px',
                  border: '2px solid #0ea5e9'
                }}>
                  <div style={{ marginBottom: '15px', fontWeight: '600', color: '#0ea5e9' }}>
                    Answer: Next 3 Ayahs
                  </div>
                  {nextAyahs.map((ayah, index) => (
                    <div key={index} style={{ 
                      marginBottom: '15px',
                      padding: '15px',
                      backgroundColor: ayah.available ? 'white' : '#fef3c7',
                      borderRadius: '8px',
                      border: ayah.available ? '1px solid #e0f2fe' : '1px solid #f59e0b'
                    }}>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: ayah.available ? '#0ea5e9' : '#d97706',
                        marginBottom: '8px'
                      }}>
                        {getSurahName(currentAyah.surah)} - Ayah {ayah.ayah}
                        {!ayah.available && ' (Sample data limited)'}
                      </div>
                      <div style={{ 
                        fontSize: ayah.available ? '24px' : '16px', 
                        fontFamily: ayah.available ? 'Amiri, Arial, sans-serif' : 'Arial, sans-serif',
                        lineHeight: '2',
                        direction: ayah.available ? 'rtl' : 'ltr',
                        textAlign: ayah.available ? 'right' : 'left',
                        color: ayah.available ? 'var(--text-dark)' : '#92400e',
                        fontStyle: ayah.available ? 'normal' : 'italic'
                      }}>
                        {ayah.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recording Section */}
              <div style={{ 
                marginBottom: '30px',
                padding: '25px',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '15px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(102, 126, 234, 0.2)'
              }}>
                <h4 style={{ 
                  textAlign: 'center', 
                  margin: '0 0 20px 0', 
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  🎤 Record Your Recitation
                </h4>
                
                {/* Mobile Help Section */}
                {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
                  <div style={{
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    border: '2px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '15px',
                    marginBottom: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: '600', 
                      color: '#92400e',
                      marginBottom: '10px'
                    }}>
                      📱 Mobile Recording Tips
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: '#92400e',
                      lineHeight: '1.4'
                    }}>
                      • Allow microphone access when prompted<br/>
                      • Tap the screen before recording if needed<br/>
                      • Use Chrome or Safari for best results<br/>
                      • Make sure you're on a secure (HTTPS) connection
                    </div>
                  </div>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  gap: '15px', 
                  justifyContent: 'center', 
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                  {!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                      border: '2px solid #fca5a5',
                      borderRadius: '12px',
                      color: '#dc2626'
                    }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px' }}>
                        ⚠️ Recording Not Supported
                      </div>
                      <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                        Your browser doesn't support audio recording.<br/>
                        Please use Chrome, Firefox, or Safari for the best experience.
                      </div>
                    </div>
                  ) : !isRecording ? (
                    <button 
                      onClick={startRecording}
                      style={{
                        background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        boxShadow: '0 6px 15px rgba(255, 107, 107, 0.4)',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 20px rgba(255, 107, 107, 0.5)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 6px 15px rgba(255, 107, 107, 0.4)';
                      }}
                    >
                      🎤 Start Recording
                    </button>
                  ) : (
                    <button 
                      onClick={stopRecording}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        boxShadow: '0 6px 15px rgba(239, 68, 68, 0.4)',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        animation: 'pulse 1.5s infinite'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.5)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 6px 15px rgba(239, 68, 68, 0.4)';
                      }}
                    >
                      ⏹️ Stop Recording
                    </button>
                  )}
                  
                  {audioURL && (
                    <>
                      <button 
                        onClick={togglePlayPause}
                        style={{
                          background: isPlaying 
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                            : 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          fontSize: '1rem',
                          fontWeight: '600',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          boxShadow: isPlaying 
                            ? '0 6px 15px rgba(245, 158, 11, 0.4)' 
                            : '0 6px 15px rgba(16, 185, 129, 0.4)',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = isPlaying 
                            ? '0 8px 20px rgba(245, 158, 11, 0.5)' 
                            : '0 8px 20px rgba(16, 185, 129, 0.5)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = isPlaying 
                            ? '0 6px 15px rgba(245, 158, 11, 0.4)' 
                            : '0 6px 15px rgba(16, 185, 129, 0.4)';
                        }}
                      >
                        {isPlaying ? '⏸️ Pause' : '▶️ Play'} Recording
                      </button>
                      
                      <button 
                        onClick={stopPlayback}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          fontSize: '1rem',
                          fontWeight: '600',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          boxShadow: '0 6px 15px rgba(239, 68, 68, 0.4)',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.5)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 6px 15px rgba(239, 68, 68, 0.4)';
                        }}
                      >
                        ⏹️ Stop
                      </button>
                      
                      <button 
                        onClick={clearRecording}
                        style={{
                          background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          fontSize: '1rem',
                          fontWeight: '600',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          boxShadow: '0 6px 15px rgba(107, 114, 128, 0.4)',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 8px 20px rgba(107, 114, 128, 0.5)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 6px 15px rgba(107, 114, 128, 0.4)';
                        }}
                      >
                        🗑️ Clear
                      </button>
                    </>
                  )}
                </div>
                
                {isRecording && (
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '15px',
                    color: '#ef4444',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: '#ef4444', 
                      borderRadius: '50%',
                      animation: 'blink 1s infinite'
                    }}></div>
                    Recording in progress...
                  </div>
                )}
                
                {audioURL && !isRecording && (
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '15px',
                    color: isPlaying ? '#f59e0b' : '#10b981',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: isPlaying ? '#f59e0b' : '#10b981', 
                      borderRadius: '50%',
                      animation: isPlaying ? 'blink 1s infinite' : 'none'
                    }}></div>
                    {isPlaying ? 'Playing recording...' : 'Recording completed! You can play it back or clear it.'}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {!showAnswer ? (
                  <button onClick={toggleAnswer} className="btn btn-primary">
                    Show Answer
                  </button>
                ) : (
                  <>
                    <button onClick={markCorrect} className="btn btn-success">
                      ✓ Correct
                    </button>
                    <button onClick={markIncorrect} className="btn btn-danger">
                      ✗ Incorrect
                    </button>
                    <button onClick={generateNewAyah} className="btn btn-secondary">
                      Skip
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Test History */}
          {testHistory.length > 0 && (
            <div className="card">
              <h3>Recent Tests</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Surah</th>
                      <th>Ayah</th>
                      <th>Result</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testHistory.slice(-10).reverse().map((item, index) => (
                      <tr key={index}>
                        <td>{getSurahName(item.surah)}</td>
                        <td>{item.ayah}</td>
                        <td>
                          <span style={{
                            backgroundColor: item.result === 'correct' ? '#10B981' : '#EF4444',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {item.result === 'correct' ? 'Correct' : 'Incorrect'}
                          </span>
                        </td>
                        <td>{item.timestamp.toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
    </>
  );
};

export default MemorizationTest;
