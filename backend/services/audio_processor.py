import librosa
import numpy as np

def extract_features(filepath: str):
    try:
        y, sr = librosa.load(filepath, sr=22050, mono=True)
        duration = librosa.get_duration(y=y, sr=sr)
        
        y, _ = librosa.effects.trim(y, top_db=20)
        y = librosa.util.normalize(y)
        
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
        mfcc_mean = np.mean(mfcc.T, axis=0)
        
        spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        sc_mean = np.mean(spectral_contrast.T, axis=0)
        
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        chroma_mean = np.mean(chroma.T, axis=0)
        
        zcr = librosa.feature.zero_crossing_rate(y)
        zcr_mean = np.mean(zcr)
        
        features = np.concatenate([mfcc_mean, sc_mean, chroma_mean, [zcr_mean]])
        return features, duration
    except Exception as e:
        print(f"Error processing audio: {e}")
        return None, 0.0


def extract_features_from_bytes(audio_array, sr=22050):
    """Extract features from a raw audio numpy array (for real-time analysis)."""
    try:
        if len(audio_array) < 1024:
            return None
            
        # Ignore chunks that are basically silence or light background noise
        # This prevents normalizer from blowing up background static which the model sees as "Fake"
        if np.max(np.abs(audio_array)) < 0.02:
            return None
            
        # Trim silence
        y_trimmed, _ = librosa.effects.trim(audio_array, top_db=25)
        
        # Require enough actual non-silent audio (~0.1 seconds at least)
        if len(y_trimmed) < 2048:
            return None
            
        # Normalize
        y = librosa.util.normalize(y_trimmed)
        
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
        mfcc_mean = np.mean(mfcc.T, axis=0)
        
        spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        sc_mean = np.mean(spectral_contrast.T, axis=0)
        
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        chroma_mean = np.mean(chroma.T, axis=0)
        
        zcr = librosa.feature.zero_crossing_rate(y)
        zcr_mean = np.mean(zcr)
        
        features = np.concatenate([mfcc_mean, sc_mean, chroma_mean, [zcr_mean]])
        return features
    except Exception as e:
        print(f"Error processing audio bytes: {e}")
        return None
