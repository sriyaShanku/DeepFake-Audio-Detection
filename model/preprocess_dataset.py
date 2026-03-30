import librosa
import numpy as np

def extract_features_from_array(y, sr):
    # Step 4: Extract MFCC (40 coefficients)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    mfcc_mean = np.mean(mfcc.T, axis=0)
    
    # Step 5: Spectral contrast
    spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    sc_mean = np.mean(spectral_contrast.T, axis=0)
    
    # Step 6: Chroma features
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    chroma_mean = np.mean(chroma.T, axis=0)
    
    # Step 7: Zero Crossing Rate
    zcr = librosa.feature.zero_crossing_rate(y)
    zcr_mean = np.mean(zcr)
    
    # Step 8: Concatenate all features
    features = np.concatenate([mfcc_mean, sc_mean, chroma_mean, [zcr_mean]])
    return features

def preprocess_audio(filepath):
    try:
        # Step 1: Load audio
        y, sr = librosa.load(filepath, sr=22050, mono=True)
        # Step 2: Noise reduction (trim silence)
        y, _ = librosa.effects.trim(y, top_db=20)
        # Step 3: Normalize amplitude
        y = librosa.util.normalize(y)
        return y, sr
    except Exception as e:
        print(f"Error preprocessing {filepath}: {e}")
        return None, None
