#!/usr/bin/env python3
"""
Script to download complete Quran data and convert it to the required JSON format.
This script will download the complete Quran text and save it in the correct format.
"""

import json
import requests
import os
from pathlib import Path

def download_quran_data():
    """Download complete Quran data from Tanzil API"""
    
    print("🔄 Downloading complete Quran data...")
    
    # Tanzil API endpoint for complete Quran
    api_url = "https://api.alquran.cloud/v1/quran/quran-uthmani"
    
    try:
        response = requests.get(api_url, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('status') != 'OK':
            raise Exception(f"API returned error: {data.get('message', 'Unknown error')}")
        
        quran_data = data['data']
        
        # Convert to our format: {surahNumber: {ayahNumber: arabicText}}
        formatted_data = {}
        
        for surah in quran_data['surahs']:
            surah_number = surah['number']
            formatted_data[str(surah_number)] = {}
            
            for ayah in surah['ayahs']:
                ayah_number = ayah['numberInSurah']
                arabic_text = ayah['text']
                formatted_data[str(surah_number)][str(ayah_number)] = arabic_text
        
        # Save to file
        output_path = Path("frontend/public/data/quran-complete.json")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(formatted_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Complete Quran data saved to: {output_path}")
        print(f"📊 Total surahs: {len(formatted_data)}")
        
        # Count total ayahs
        total_ayahs = sum(len(surah) for surah in formatted_data.values())
        print(f"📊 Total ayahs: {total_ayahs}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def download_alternative_source():
    """Alternative method using GitHub repository"""
    
    print("🔄 Trying alternative source...")
    
    try:
        # Download from GitHub repository
        url = "https://raw.githubusercontent.com/CheeseWithSauce/TheHolyQuranJSONFormat/main/quran.json"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # Convert to our format
        formatted_data = {}
        
        for verse in data:
            surah_num = str(verse['surah'])
            ayah_num = str(verse['ayah'])
            arabic_text = verse['text']
            
            if surah_num not in formatted_data:
                formatted_data[surah_num] = {}
            
            formatted_data[surah_num][ayah_num] = arabic_text
        
        # Save to file
        output_path = Path("frontend/public/data/quran-complete.json")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(formatted_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Complete Quran data saved to: {output_path}")
        print(f"📊 Total surahs: {len(formatted_data)}")
        
        # Count total ayahs
        total_ayahs = sum(len(surah) for surah in formatted_data.values())
        print(f"📊 Total ayahs: {total_ayahs}")
        
        return True
        
    except Exception as e:
        print(f"❌ Alternative source failed: {e}")
        return False

if __name__ == "__main__":
    print("🕌 Quran Data Downloader")
    print("=" * 50)
    
    # Try primary source first
    if download_quran_data():
        print("\n🎉 Successfully downloaded complete Quran data!")
    else:
        print("\n🔄 Primary source failed, trying alternative...")
        if download_alternative_source():
            print("\n🎉 Successfully downloaded complete Quran data from alternative source!")
        else:
            print("\n❌ Failed to download complete Quran data from all sources.")
            print("💡 You can manually download the data and place it in frontend/public/data/quran-complete.json")
            print("📚 Recommended sources:")
            print("   - https://github.com/CheeseWithSauce/TheHolyQuranJSONFormat")
            print("   - https://tanzil.net/download/")
    
    print("\n📝 Next steps:")
    print("1. Run this script: python download_quran_data.py")
    print("2. Update your MemorizationTest component to use the new data loader")
    print("3. Test the application with complete Quran data")
