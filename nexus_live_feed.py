"""Streamlit client for the Auris Unified Interface V4 backend."""

from pathlib import Path
from typing import Any, Dict

import requests
import streamlit as st

BACKEND_DEFAULT = "http://localhost:8080"
POLL_DEFAULT = 5

st.set_page_config(page_title="Nexus Live Feed", page_icon="🌀", layout="wide")

AUREON_STYLE = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Orbitron:wght@500;700&display=swap');

:root {
    --aureon-neon: #66f8ff;
    --aureon-indigo: #5f2cff;
    --aureon-void: #080d1a;
    --aureon-surge: #f9b938;
}

[data-testid="stAppViewContainer"] > .main {
    background: radial-gradient(circle at 20% 20%, rgba(102, 248, 255, 0.08), transparent 45%),
                radial-gradient(circle at 80% 10%, rgba(95, 44, 255, 0.12), transparent 50%),
                linear-gradient(135deg, rgba(8, 13, 26, 0.98), rgba(8, 13, 26, 0.92));
    color: #f4f7ff;
    min-height: 100vh;
}

.nexus-crest {
    display: flex;
    justify-content: center;
    margin: 0.5rem 0 1.75rem;
}

.nexus-crest svg {
    width: min(320px, 60vw);
    height: auto;
    filter: drop-shadow(0 0 24px rgba(102, 248, 255, 0.45))
            drop-shadow(0 0 36px rgba(249, 185, 56, 0.25));
}

.nexus-crest svg text {
    font-family: 'Orbitron', 'Segoe UI', sans-serif;
}

.nexus-crest svg textPath {
    text-transform: uppercase;
}

[data-testid="stSidebar"] {
    background: linear-gradient(180deg, rgba(95, 44, 255, 0.45), rgba(8, 13, 26, 0.92));
    border-right: 1px solid rgba(102, 248, 255, 0.2);
}

h1, h2, h3, h4 {
    color: #e4e8ff;
    text-shadow: 0 0 18px rgba(102, 248, 255, 0.35);
}

[data-testid="stMetric"] {
    background: linear-gradient(145deg, rgba(95, 44, 255, 0.25), rgba(8, 13, 26, 0.6));
    border: 1px solid rgba(102, 248, 255, 0.25);
    border-radius: 1rem;
    box-shadow: 0 0 25px rgba(95, 44, 255, 0.35);
    padding: 0.9rem 1.2rem;
}

[data-testid="stMetricValue"] {
    color: var(--aureon-neon) !important;
    font-weight: 700;
    text-shadow: 0 0 20px rgba(102, 248, 255, 0.7);
}

[data-testid="stMetricDelta"] {
    color: rgba(249, 185, 56, 0.95) !important;
}

.aureon-panel {
    background: linear-gradient(135deg, rgba(8, 13, 26, 0.85), rgba(95, 44, 255, 0.15));
    border: 1px solid rgba(102, 248, 255, 0.25);
    border-radius: 1.2rem;
    padding: 1.2rem;
    box-shadow: inset 0 0 20px rgba(102, 248, 255, 0.08), 0 0 22px rgba(95, 44, 255, 0.22);
    margin-bottom: 1.5rem;
}

.surge-indicator {
    display: grid;
    gap: 0.35rem;
    background: linear-gradient(135deg, rgba(8, 13, 26, 0.8), rgba(102, 248, 255, 0.1));
    border-radius: 1rem;
    padding: 1rem 1.2rem;
    border: 1px solid rgba(102, 248, 255, 0.35);
    box-shadow: 0 0 20px rgba(102, 248, 255, 0.3);
}

.surge-indicator .label {
    font-size: 0.9rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(244, 247, 255, 0.75);
}

.surge-indicator .value {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--aureon-neon);
    text-shadow: 0 0 30px rgba(102, 248, 255, 0.8);
}

.surge-indicator .status {
    font-size: 1.1rem;
    font-weight: 600;
}

.surge-indicator .threshold {
    font-size: 0.85rem;
    color: rgba(244, 247, 255, 0.6);
}

.surge-active {
    border-color: var(--aureon-surge);
    box-shadow: 0 0 25px rgba(249, 185, 56, 0.45);
}

.surge-active .status {
    color: var(--aureon-surge);
    text-shadow: 0 0 22px rgba(249, 185, 56, 0.6);
}

.surge-idle .status {
    color: rgba(244, 247, 255, 0.7);
}

.aureon-table {
    background: linear-gradient(135deg, rgba(8, 13, 26, 0.8), rgba(95, 44, 255, 0.2));
    border-radius: 1rem;
    padding: 1rem;
    border: 1px solid rgba(102, 248, 255, 0.18);
    box-shadow: inset 0 0 18px rgba(95, 44, 255, 0.28);
}

.aureon-caption {
    color: rgba(244, 247, 255, 0.65);
}
</style>
"""

st.markdown(AUREON_STYLE, unsafe_allow_html=True)

seal_path = Path(__file__).with_name("public").joinpath("nexus_aureon_seal.svg")
if seal_path.exists():
    st.markdown(
        f"<div class='nexus-crest'>{seal_path.read_text(encoding='utf-8')}</div>",
        unsafe_allow_html=True,
    )

st.title("Nexus • Live • Feed")
st.caption("Harmonic Nexus Core — Real-time coherence interface")

with st.sidebar:
    st.subheader("Backend")
    BACKEND = st.text_input(
        "Unified API base URL",
        value=st.secrets.get("AURIS_BACKEND", BACKEND_DEFAULT),
    )
    POLL_SEC = st.slider("Refresh (seconds)", 2, 20, POLL_DEFAULT)
    surge_thresh = st.slider("Surge Threshold (UVC)", 0.70, 0.99, 0.90)
    st.write("Status:")
    try:
        status = requests.get(f"{BACKEND}/status", timeout=2).json()
        st.success(f"{status.get('system', 'Unified API')} online")
    except Exception as exc:
        st.error(f"Backend not reachable: {exc}")

st.autorefresh(interval=int(POLL_SEC * 1000), key="nexus-poller")

col_left, col_right = st.columns([3, 2])


def fetch_json(url: str, timeout: int = 4) -> Dict[str, Any]:
    response = requests.get(url, timeout=timeout)
    response.raise_for_status()
    return response.json()


def render_surge_indicator(value: float, threshold: float) -> None:
    active = value >= threshold
    status_class = "surge-active" if active else "surge-idle"
    status_text = "Surge Window Active" if active else "Monitoring Window"
    st.markdown(
        """
        <div class="surge-indicator {status_class}">
            <span class="label">Surge Window</span>
            <span class="value">{value:.3f}</span>
            <span class="status">{status_text}</span>
            <span class="threshold">Threshold {threshold:.2f}</span>
        </div>
        """.format(
            status_class=status_class,
            value=value,
            status_text=status_text,
            threshold=threshold,
        ),
        unsafe_allow_html=True,
    )


components: Dict[str, Any] = {}

with col_left:
    st.subheader("Unified Validation Coherence (UVC)")
    st.markdown('<div class="aureon-panel">', unsafe_allow_html=True)
    try:
        feed = fetch_json(f"{BACKEND}/surge/uvc?n=240")
        uvc = feed.get("uvc", [])
        components = feed.get("components", {})
        if uvc:
            st.line_chart({"UVC": uvc})
            delta_value = None
            if len(uvc) > 1:
                delta_value = f"{(uvc[-1] - uvc[-2]):+.3f}"
            st.metric("Current UVC", f"{uvc[-1]:.3f}", delta=delta_value)
            render_surge_indicator(uvc[-1], surge_thresh)
        else:
            st.info("No bioscans available yet.")
    except requests.HTTPError as exc:
        st.error(f"UVC fetch failed: HTTP {exc.response.status_code}")
    except Exception as exc:  # pragma: no cover - Streamlit UI feedback path
        st.error(f"UVC fetch failed: {exc}")
    st.markdown("</div>", unsafe_allow_html=True)

with col_right:
    st.subheader("Components")
    st.markdown('<div class="aureon-panel">', unsafe_allow_html=True)
    if components:
        try:
            st.line_chart(
                {
                    "C1 Temporal": components.get("C1", []),
                    "1−Entropy": components.get("C2inv", []),
                    "Schumann": components.get("C4", []),
                    "BQI": components.get("C5_BQI", []),
                }
            )
        except Exception:  # pragma: no cover - visualization errors reported via UI
            st.warning("Component chart could not be rendered.")
    else:
        st.info("Component feed pending.")
    st.markdown("</div>", unsafe_allow_html=True)

st.divider()

st.subheader("Recent Bioscans")
st.markdown('<div class="aureon-panel aureon-table">', unsafe_allow_html=True)
try:
    recent = fetch_json(f"{BACKEND}/bioscan/recent?n=12").get("results", [])
    if recent:
        columns = st.columns(3)
        for index, record in enumerate(recent[:9]):
            layer_scores = record.get("layer_scores", {})
            with columns[index % 3]:
                st.markdown(f"**{record.get('session_id', '(no id)')}**")
                st.metric("BCI", f"{record.get('bci', 0):.3f}")
                st.write(
                    "CRC:**{crc:.2f}** NFC:**{nfc:.2f}** PEB:**{peb:.2f}** "
                    "BHS:**{bhs:.2f}** PLA:**{pla:.2f}**".format(
                        crc=(layer_scores.get("crc", {}).get("mu") or 0),
                        nfc=(layer_scores.get("nfc", {}).get("mu") or 0),
                        peb=(layer_scores.get("peb", {}).get("mu") or 0),
                        bhs=(layer_scores.get("bhs", {}).get("mu") or 0),
                        pla=(layer_scores.get("pla", {}).get("mu") or 0),
                    )
                )
                seals = record.get("seals") or {}
                st.caption(f"Seal: {seals.get('report_hash', '…')[:18]}…")
    else:
        st.info("No bioscans available yet.")
except requests.HTTPError as exc:
    st.error(f"Recent bioscans fetch failed: HTTP {exc.response.status_code}")
except Exception as exc:  # pragma: no cover - Streamlit UI feedback path
    st.error(f"Recent bioscans fetch failed: {exc}")

st.markdown(
    "<p class='aureon-caption'>Updates every {interval} seconds — adjust via the sidebar.</p>".format(
        interval=POLL_SEC
    ),
    unsafe_allow_html=True,
)
