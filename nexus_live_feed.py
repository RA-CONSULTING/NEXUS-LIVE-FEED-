"""Streamlit client for the Auris Unified Interface V4 backend."""


from typing import Any, Dict

import requests
import streamlit as st

BACKEND_DEFAULT = "http://localhost:8080"
POLL_DEFAULT = 5

st.set_page_config(page_title="Nexus Live Feed", page_icon="🌀", layout="wide")


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

        else:
            st.info("No bioscans available yet.")
    except requests.HTTPError as exc:
        st.error(f"UVC fetch failed: HTTP {exc.response.status_code}")

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

st.divider()

st.subheader("Recent Bioscans")

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


)
