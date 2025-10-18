"""Streamlit WebSocket client for the Auris Unified Interface v4 backend."""

from __future__ import annotations

import json
import queue
import threading
import time
from typing import Any, Dict, List

import requests
import streamlit as st

try:
    import websocket  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    websocket = None


BACKEND_DEFAULT = st.secrets.get("AURIS_BACKEND", "http://localhost:8080")

st.set_page_config(page_title="Nexus Live Feed (WS)", page_icon="🛰️", layout="wide")

st.title("NEXUS • LIVE • FEED  — WebSocket")
st.caption("Harmonic Nexus Core — instant coherence telemetry")


with st.sidebar:
    backend = st.text_input("Unified API base URL", value=BACKEND_DEFAULT)
    ws_url = backend.replace("http://", "ws://").replace("https://", "wss://") + "/ws"
    surge_thresh = st.slider("Surge Threshold (UVC)", 0.70, 0.99, 0.90)
    manual_refresh = st.button("Manual refresh")
    st.write(f"WebSocket: {ws_url}")


if "event_q" not in st.session_state:
    st.session_state.event_q = queue.Queue()
if "ws_running" not in st.session_state:
    st.session_state.ws_running = False
if "initialized" not in st.session_state:
    st.session_state.initialized = False


status_ph = st.empty()
data_status_ph = st.empty()
event_log_ph = st.empty()


def ws_worker(url: str, q: "queue.Queue[Dict[str, Any]]") -> None:
    while True:
        try:
            def on_message(_ws: Any, message: str) -> None:
                try:
                    payload = json.loads(message)
                except json.JSONDecodeError:
                    return
                q.put(payload)

            def on_error(_ws: Any, err: Any) -> None:
                q.put({"type": "ws_error", "error": str(err)})

            def on_close(_ws: Any, status_code: int, msg: str) -> None:
                q.put({"type": "ws_closed", "code": status_code, "msg": str(msg)})

            ws = websocket.WebSocketApp(  # type: ignore[operator]
                url,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close,
            )
            ws.run_forever()
        except Exception as exc:  # pragma: no cover - background thread guard
            q.put({"type": "ws_exception", "error": str(exc)})
        finally:
            time.sleep(2.0)


if websocket is None:
    status_ph.error("websocket-client not installed. Run: pip install websocket-client")
else:
    if not st.session_state.ws_running:
        threading.Thread(
            target=ws_worker,
            args=(ws_url, st.session_state.event_q),
            daemon=True,
        ).start()
        st.session_state.ws_running = True
        status_ph.info("Connecting to WebSocket…")


uvc_chart = st.empty()
uvc_metric = st.empty()
components_chart = st.empty()
list_ph = st.empty()


def _render_recent(records: List[Dict[str, Any]]) -> None:
    container = list_ph.container()
    container.subheader("Recent Bioscans")
    if not records:
        container.info("No bioscans available yet.")
        return
    columns = container.columns(3)
    for index, record in enumerate(records[:9]):
        layer_scores = record.get("layer_scores", {})
        column = columns[index % 3]
        column.markdown(f"**{record.get('session_id', '(no id)')}**")
        column.metric("BCI", f"{record.get('bci', 0):.3f}")
        column.write(
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
        column.caption(f"Seal: {seals.get('report_hash', '…')[:18]}…")


def refresh_from_backend(base: str) -> None:
    try:
        feed = requests.get(f"{base}/surge/uvc?n=240", timeout=4).json()
        recent = requests.get(f"{base}/bioscan/recent?n=12", timeout=4).json().get("results", [])
    except Exception as exc:  # pragma: no cover - Streamlit feedback path
        data_status_ph.error(f"Backend fetch failed: {exc}")
        return

    uvc = feed.get("uvc", [])
    components = feed.get("components", {})

    if uvc:
        uvc_chart.line_chart({"UVC": uvc})
        delta_value = None
        if len(uvc) > 1:
            delta_value = f"{(uvc[-1] - uvc[-2]):+.3f}"
        uvc_metric.metric("Current UVC", f"{uvc[-1]:.3f}", delta=delta_value)
        if uvc[-1] >= surge_thresh:
            data_status_ph.success("Surge window active")
        else:
            data_status_ph.info("Monitoring…")
    else:
        uvc_chart.info("No bioscans available yet.")
        uvc_metric.empty()
        data_status_ph.info("Awaiting bioscans…")

    if components:
        try:
            components_chart.line_chart(
                {
                    "C1 Temporal": components.get("C1", []),
                    "1−Entropy": components.get("C2inv", []),
                    "Schumann": components.get("C4", []),
                    "BQI": components.get("C5_BQI", []),
                }
            )
        except Exception:  # pragma: no cover - visualization guard
            components_chart.warning("Component chart could not be rendered.")
    else:
        components_chart.info("Component feed pending bioscans.")

    _render_recent(recent)
    st.session_state.initialized = True


refresh_needed = manual_refresh or not st.session_state.initialized

event_notes: List[str] = []
while not st.session_state.event_q.empty():
    try:
        event = st.session_state.event_q.get_nowait()
    except queue.Empty:
        break
    event_type = event.get("type")
    if event_type == "bioscan":
        refresh_needed = True
        status_ph.success("WebSocket connected")
        event_notes.append(
            "New bioscan {session} • BCI {bci:.3f}".format(
                session=event.get("session_id", "?"), bci=event.get("bci", 0.0)
            )
        )
    elif event_type == "ws_error":
        status_ph.error(f"WebSocket error: {event.get('error')}")
        event_notes.append(f"WebSocket error: {event.get('error')}")
    elif event_type == "ws_closed":
        status_ph.warning("WebSocket closed — attempting to reconnect")
        event_notes.append("WebSocket closed — reconnecting…")
    elif event_type == "ws_exception":
        status_ph.error(f"WebSocket exception: {event.get('error')}")
        event_notes.append(f"WebSocket exception: {event.get('error')}")

if refresh_needed:
    refresh_from_backend(backend)

if event_notes:
    event_log_ph.write("\n".join(event_notes))

st.caption("Listening for bioscan events — charts refresh automatically on push.")
