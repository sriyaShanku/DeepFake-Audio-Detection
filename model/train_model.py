import os
import argparse
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score, classification_report
import joblib

from preprocess_dataset import preprocess_audio, extract_features_from_array
from augment_noise import add_noise, time_stretch, pitch_shift

DATASET_DIR = '../dataset'
MODEL_SAVE_PATH = 'deepfake_model.pkl'
SCALER_SAVE_PATH = 'scaler.pkl'

SUPPORTED_EXTENSIONS = ('.wav', '.mp3', '.flac', '.ogg')

def gather_data():
    features_list = []
    labels_list = []
    classes = {'real': 0, 'fake': 1}
    
    for cls_name, cls_label in classes.items():
        cls_dir = os.path.join(DATASET_DIR, cls_name)
        if not os.path.exists(cls_dir):
            print(f"Directory not found: {cls_dir}")
            continue
            
        for filename in os.listdir(cls_dir):
            if not filename.lower().endswith(SUPPORTED_EXTENSIONS):
                print(f"  Skipping unsupported file: {filename}")
                continue
                
            filepath = os.path.join(cls_dir, filename)
            print(f"  Processing: {filepath}")
            y, sr = preprocess_audio(filepath)
            if y is not None and len(y) > 0:
                # Extract features from original
                features = extract_features_from_array(y, sr)
                features_list.append(features)
                labels_list.append(cls_label)
                
                # Augmentation 1: Add noise (always for small datasets)
                y_noisy = add_noise(y, noise_factor=0.005)
                features_list.append(extract_features_from_array(y_noisy, sr))
                labels_list.append(cls_label)
                
                # Augmentation 2: More noise
                y_noisy2 = add_noise(y, noise_factor=0.01)
                features_list.append(extract_features_from_array(y_noisy2, sr))
                labels_list.append(cls_label)
                
                # Augmentation 3: Time stretch slower
                try:
                    y_slow = time_stretch(y, rate=0.9)
                    features_list.append(extract_features_from_array(y_slow, sr))
                    labels_list.append(cls_label)
                except:
                    pass
                
                # Augmentation 4: Time stretch faster
                try:
                    y_fast = time_stretch(y, rate=1.1)
                    features_list.append(extract_features_from_array(y_fast, sr))
                    labels_list.append(cls_label)
                except:
                    pass
                
                # Augmentation 5: Pitch shift up
                try:
                    y_up = pitch_shift(y, sr, steps=2)
                    features_list.append(extract_features_from_array(y_up, sr))
                    labels_list.append(cls_label)
                except:
                    pass
                
                # Augmentation 6: Pitch shift down
                try:
                    y_down = pitch_shift(y, sr, steps=-2)
                    features_list.append(extract_features_from_array(y_down, sr))
                    labels_list.append(cls_label)
                except:
                    pass
                
                # Augmentation 7: Noise + pitch shift combined
                try:
                    y_combo = add_noise(pitch_shift(y, sr, steps=1), noise_factor=0.003)
                    features_list.append(extract_features_from_array(y_combo, sr))
                    labels_list.append(cls_label)
                except:
                    pass
            else:
                print(f"  WARNING: Failed to process {filepath}")
                    
    return np.array(features_list), np.array(labels_list)

def main(evaluate_only=False):
    print("=" * 60)
    print("Deepfake Audio Detection - Model Training")
    print("=" * 60)
    print("\nGathering data and extracting features...")
    X, y = gather_data()
    
    if len(X) < 4:
        print("\nERROR: Not enough data found! Need at least 4 samples.")
        print("Please add .wav or .mp3 files to dataset/real/ and dataset/fake/")
        return
    
    # Show class distribution
    unique, counts = np.unique(y, return_counts=True)
    print(f"\nExtracted features for {len(X)} samples (with augmentation).")
    for u, c in zip(unique, counts):
        label = "Real" if u == 0 else "Fake"
        print(f"  {label}: {c} samples")
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    if evaluate_only:
        if os.path.exists(MODEL_SAVE_PATH):
            clf = joblib.load(MODEL_SAVE_PATH)
            print("Loaded existing model for evaluation.")
        else:
            print("Error: No trained model found to evaluate.")
            return
    else:
        print("\nTraining Random Forest Classifier...")
        clf = RandomForestClassifier(
            n_estimators=300,
            max_depth=None,
            min_samples_split=2,
            min_samples_leaf=1,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )
        clf.fit(X_train_scaled, y_train)
    
    y_pred = clf.predict(X_test_scaled)
    y_pred_proba = clf.predict_proba(X_test_scaled)[:, 1] if hasattr(clf, "predict_proba") else y_pred
    
    print("\n" + "=" * 40)
    print("--- Evaluation Results ---")
    print("=" * 40)
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    if len(np.unique(y_test)) > 1:
        print(f"Precision: {precision_score(y_test, y_pred):.4f}")
        print(f"Recall: {recall_score(y_test, y_pred):.4f}")
        print(f"F1 Score: {f1_score(y_test, y_pred):.4f}")
        if hasattr(clf, "predict_proba"):
            print(f"ROC AUC: {roc_auc_score(y_test, y_pred_proba):.4f}")
    
    print("\nClassification Report:")
    target_names = ['Real', 'Fake']
    print(classification_report(y_test, y_pred, target_names=target_names))
    
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Cross validation
    if not evaluate_only and len(X) >= 10:
        print("\nCross-validation scores:")
        cv_folds = min(5, min(np.bincount(y)))
        if cv_folds >= 2:
            cv_scores = cross_val_score(clf, scaler.transform(X), y, cv=cv_folds, scoring='accuracy')
            print(f"  CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
    
    if not evaluate_only:
        joblib.dump(clf, MODEL_SAVE_PATH)
        joblib.dump(scaler, SCALER_SAVE_PATH)
        print(f"\nModel saved to {MODEL_SAVE_PATH}")
        print(f"Scaler saved to {SCALER_SAVE_PATH}")
        print("\nTraining complete!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--evaluate", action="store_true", help="Evaluate existing model")
    args = parser.parse_args()
    main(evaluate_only=args.evaluate)
