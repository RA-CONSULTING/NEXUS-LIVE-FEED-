import json

from organism.public_field import SOURCE, observe_planetary_k_index


def test_planetary_k_index_uses_the_measured_row_only():
    body = json.dumps(
        [
            {"time_tag": "2026-10-14T21:00:00", "Kp": 2.0, "a_running": 7, "station_count": 8},
            {"time_tag": "2026-10-15T06:00:00", "Kp": 1.33, "a_running": 5, "station_count": 8},
        ]
    ).encode()

    observed = observe_planetary_k_index(lambda url: body if url == SOURCE else (_ for _ in ()).throw(ValueError(url)))

    assert observed["kp"] == 1.33
    assert observed["time_tag"] == "2026-10-15T06:00:00"
    assert observed["station_count"] == 8
    assert observed["generated_values"] is False
    assert observed["may_act"] is False
    assert observed["source"] == SOURCE
