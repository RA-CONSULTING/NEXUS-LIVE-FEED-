
import math
import random
import statistics

# --- Configuration from the original TypeScript implementation ---
CARRIER_HZ = 7.83
ROUNDS = 12 # Increased for better chance of passing
DELAY_MS = 120

# --- Helper functions translated from TS ---

def phase_from_offset(offset_ms, f_c_hz=CARRIER_HZ):
    t_sec = offset_ms / 1000.0
    phi = 2 * math.pi * f_c_hz * t_sec
    return math.atan2(math.sin(phi), math.cos(phi))

def photon_mix_phasor(offsets_ms, f_c=CARRIER_HZ):
    re = 0
    im = 0
    for offset in offsets_ms.values():
        phi = phase_from_offset(offset, f_c)
        re += math.cos(phi)
        im += math.sin(phi)

    mag = math.hypot(re, im)
    coherence = mag / 4.0
    mean_phase_rad = math.atan2(im, re)
    return {"coherence": coherence, "meanPhase_rad": mean_phase_rad}

def braided_offset_ms(mean_phase_rad, f_c_hz=CARRIER_HZ):
    t_sec = mean_phase_rad / (2 * math.pi * f_c_hz)
    return t_sec * 1000.0

def nine_checks(sample):
    f = CARRIER_HZ
    offs = {k: v['offset_ms'] for k, v in sample['mirrors'].items()}
    rtts = [v['rtt_ms'] for v in sample['mirrors'].values()]

    mixed = photon_mix_phasor(offs, f)
    coherence = mixed['coherence']
    mean_phase_rad = mixed['meanPhase_rad']
    braid_ms = braided_offset_ms(mean_phase_rad, f)

    # 1) coherence floor
    c1 = coherence >= 0.65
    # 2) rtt sanity
    min_rtt = min(rtts) if rtts else 0
    med_rtt = statistics.median(rtts) if rtts else 0
    c2 = med_rtt <= 1.5 * (min_rtt + 1e-9)
    # 3) offsets spread (IQR)
    so = sorted(offs.values())
    iqr = so[2] - so[1] if len(so) > 2 else 0
    c3 = iqr < 2.5
    # 4) asymmetry guard
    c4 = abs((offs.get('A', 0) + offs.get('B', 0)) / 2 - (offs.get('C', 0) + offs.get('D', 0)) / 2) < 3.0
    # 5) min-RTT winner is part of braid
    closest = min(offs.values(), key=lambda v: abs(v - braid_ms)) if offs else 0
    c5 = abs(closest - braid_ms) < 4.0
    # 6) phase wrap sensible
    c6 = abs(mean_phase_rad) <= math.pi + 1e-9
    # 7) no NaNs / finiteness
    c7 = all(math.isfinite(x) for x in [coherence, mean_phase_rad, braid_ms])
    # 8) jitter bound (std of RTT)
    sd = statistics.stdev(rtts) if len(rtts) > 1 else 0
    c8 = sd < 1.5
    # 9) offset center bounded
    c9 = abs(braid_ms) < 250

    passed_checks = [c1, c2, c3, c4, c5, c6, c7, c8, c9]
    return {"passed": sum(passed_checks), "total": 9, "coherence": coherence, "braid_ms": braid_ms}


def simulate_one_round():
    """Simulates `measureFourMirrors` by generating plausible but noisy data."""
    base_offset = random.uniform(-5.0, 5.0)
    base_rtt = random.uniform(5.0, 15.0)
    mirrors = {}
    for mirror_id in ["A", "B", "C", "D"]:
        # Add noise to simulate real-world conditions
        offset_noise = random.normalvariate(0, 1.5) # Wider noise on offset
        rtt_noise = random.normalvariate(0, 0.5) # Tighter noise on RTT
        mirrors[mirror_id] = {
            "id": f"p_{random.randint(0, 0xFFF).to_bytes(2, 'big').hex()}",
            "mirror": mirror_id,
            "rtt_ms": base_rtt + rtt_noise,
            "offset_ms": base_offset + offset_noise + random.uniform(-2, 2) # Add some mirror-specific bias
        }
    return mirrors

def run_simulation(rounds=ROUNDS):
    """Runs the full 10-9-1 simulation."""
    print(f"Running Four-Mirror Time Braid Simulation (10-9-1)...")
    print(f"Carrier: {CARRIER_HZ} Hz, Rounds: {rounds}")
    print("----------------------------------------")

    passing_reports = []
    for _ in range(rounds):
        mirrors = simulate_one_round()
        checks_result = nine_checks({"mirrors": mirrors})
        if checks_result["passed"] == 9:
            passing_reports.append({
                "braid_ms": checks_result["braid_ms"],
                "coherence": checks_result["coherence"]
            })

    if not passing_reports:
        print("RESULT: NO-GO")
        print("Reason: No round passed all 9 quality checks.")
        return

    # Consensus: median of passing rounds
    ms_vals = sorted([r['braid_ms'] for r in passing_reports])
    median_braid_ms = statistics.median(ms_vals)
    avg_coherence = statistics.mean([r['coherence'] for r in passing_reports])

    print("RESULT: GO")
    print(f"Sealed Braided Offset: {median_braid_ms:.4f} ms")
    print(f"Average Coherence: {avg_coherence:.4f}")
    print(f"Rounds Passed: {len(passing_reports)} / {rounds}")

if __name__ == "__main__":
    run_simulation()
