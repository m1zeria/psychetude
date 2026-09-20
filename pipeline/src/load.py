"""Phase 1 — load raw EEG, filter, epoch into time windows."""
from pathlib import Path

import mne


def load_raw(raw_path: Path) -> mne.io.BaseRaw:
    """Load a pre-saved MNE file (e.g. .fif) or download via mne.datasets."""
    return mne.io.read_raw_fif(raw_path, preload=True)


def preprocess(raw: mne.io.BaseRaw, cfg: dict) -> mne.io.BaseRaw:
    """Apply notch and band-pass filters, then resample."""
    pre = cfg["preprocessing"]

    raw = raw.copy()

    notch_freq = pre.get("notch_freq")
    notch_q = pre.get("notch_q")
    if notch_freq is not None:
        notch_width = float(notch_freq) / float(notch_q) if notch_q else None
        raw.notch_filter(
            freqs=notch_freq,
            notch_widths=notch_width,
            verbose=False,
        )

    raw.filter(
        l_freq=pre["l_freq"],
        h_freq=pre["h_freq"],
        fir_design="firwin",
        verbose=False,
    )
    if pre.get("resample_hz") and raw.info["sfreq"] != pre["resample_hz"]:
        raw.resample(pre["resample_hz"], verbose=False)

    return raw


def epoch(raw: mne.io.BaseRaw, cfg: dict):
    """Slice into fixed-length overlapping windows across the whole recording."""
    pre = cfg["preprocessing"]
    win = pre["window_seconds"]
    step = win * (1 - pre["overlap"])

    sfreq = raw.info["sfreq"]
    n_samples = raw.n_times
    win_samples = int(win * sfreq)
    step_samples = int(step * sfreq)

    if win_samples <= 0 or step_samples <= 0:
        raise ValueError("window_seconds and overlap produce an invalid window/step")

    # pre-allocate: fetch entire signal once to avoid repeated get_data() calls
    data = raw.get_data()  # shape: (n_channels, n_samples)

    windows = []
    for start in range(0, n_samples - win_samples + 1, step_samples):
        # slice views instead of copying
        window_data = data[:, start:start + win_samples]
        windows.append(
            {
                "start_sample": start,
                "start_sec": start / sfreq,
                "data": window_data,
            }
        )
    return windows
