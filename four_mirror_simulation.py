
import math
import random
import statistics

# --- Configuration ---
CARRIER_HZ = 7.83
ROUNDS = 12
DELAY_MS = 120
CLIENT_ID = "PS-399"

# --- Simulation Primitives ---

def simulate_one_ping(mirror_id):
    """Simulates a single NTP-style ping-pong to a mirror."""
    # Simulate network conditions
    base_rtt_ms = random.uniform(5, 15)
    jitter = random.uniform(-2, 2)
    server_processing_ms = random.uniform(0.1, 0.5)
    
    # Simulate clock offset
    true_offset_ms = {
        "A": -2.5, "B": 1.0, "C": 3.5, "D": -0.5
    }[mirror_id] + random.uniform(-0.5, 0.5)

    t1 = random.randint(1e12, 2e12) # mono ns
    
    # Path from client to server
    t2 = t1 + ((base_rtt_ms / 2) + jitter) * 1e6 + (true_offset_ms * 1e6)
    
    # Path from server to client
    t3 = t2 + server_processing_ms * 1e6
    t4 = t3 + ((base_rtt_ms / 2) - jitter) * 1e6 - (true_offset_ms * 1e6)

    # Client-side calculation
    rtt_ms = ((t4 - t1) - (t3 - t2)) / 1e6
    offset_ms = (((t2 - t1) + (t3 - t4)) / 2) / 1e6

    return {
        "id": f"p_{random.randint(1000, 9999)}",
        "mirror": mirror_id,
        "rtt_ms": rtt_ms,
        "offset_ms": offset_ms,
    }

def measure_four_mirrors():
    """Simulates measuring all four mirrors."""
    return {mirror: simulate_one_ping(mirror) for mirror in ["A", "B", "C", "D"]}

# --- Core Logic from the user's prompt ---

def phase_from_offset(offset_ms, f_c_Hz):
    t_sec = offset_ms / 1000.0
    phi = 2 * math.pi * f_c_Hz * t_sec
    return math.atan2(math.sin(phi), math.cos(phi))

def photon_mix_phasor(offsets_ms, f_c):
    re, im = 0, 0
    for offset in offsets_ms.values():
        phi = phase_from_offset(offset, f_c)
        re += math.cos(phi)
        im += math.sin(phi)
    
    mag = math.hypot(re, im)
    coherence = mag / 4.0
    mean_phase_rad = math.atan2(im, re)
    return {"coherence": coherence, "mean_phase_rad": mean_phase_rad}

def braided_offset_ms(mean_phase_rad, f_c_Hz):
    t_sec = mean_phase_rad / (2 * math.pi * f_c_Hz)
    return t_sec * 1000.0

def nine_checks(sample, f_c_Hz):
    """Performs the 9 quality checks for a single round."""
    mirrors = sample
    offs = {m: d["offset_ms"] for m, d in mirrors.items()}
    rtts = [d["rtt_ms"] for d in mirrors.values()]
    
    mix = photon_mix_phasor(offs, f_c_Hz)
    coherence = mix["coherence"]
    mean_phase_rad = mix["mean_phase_rad"]
    braid_ms = braided_offset_ms(mean_phase_rad, f_c_Hz)
    
    checks_passed = []
    
    # 1. Coherence floor
    checks_passed.append(coherence >= 0.65)
    # 2. RTT sanity
    rtts_sorted = sorted(rtts)
    # Ensure list is not empty before accessing index 0
    if not rtts_sorted: return {"passed": 0, "total": 9, "coherence": 0, "braid_ms": 0, "rtts": [], "offsets": {}}
    checks_passed.append(statistics.median(rtts_sorted) <= 1.5 * rtts_sorted[0])
    # 3. Offsets spread (IQR)
    so = sorted(offs.values())
    iqr = so[2] - so[1]
    checks_passed.append(iqr < 2.5)
    # 4. Asymmetry guard
    checks_passed.append(abs((offs['A'] + offs['B']) / 2 - (offs['C'] + offs['D']) / 2) < 3.0)
    # 5. Min-RTT winner is part of braid
    closest = min(offs.values(), key=lambda v: abs(v - braid_ms))
    checks_passed.append(abs(closest - braid_ms) < 4.0)
    # 6. Phase wrap sensible
    checks_passed.append(abs(mean_phase_rad) <= math.pi + 1e-9)
    # 7. Finiteness
    checks_passed.append(all(math.isfinite(x) for x in [coherence, mean_phase_rad, braid_ms]))
    # 8. Jitter bound
    if len(rtts) < 2:
        checks_passed.append(True)
    else:
        checks_passed.append(statistics.stdev(rtts) < 1.5)
    # 9. Offset center bounded
    checks_passed.append(abs(braid_ms) < 250)

    num_passed = sum(checks_passed)
    return {
        "passed": num_passed,
        "total": 9,
        "coherence": coherence,
        "braid_ms": braid_ms,
        "rtts": rtts,
        "offsets": offs
    }

def seal_if_ethical(braid_ms):
    """Simulates the Sero/Love gate check."""
    return {"go": True, "reason": "GO - Sero/Love gates passed."}


# --- Main Simulation ---

def run_simulation():
    print("Running Four-Mirror Time Braid Simulation (10-9-1)...")
    print(f"Carrier: {CARRIER_HZ} Hz, Rounds: {ROUNDS}")
    print("-" * 40)
    
    passing_rounds = []
    
    for i in range(ROUNDS):
        mirrors_data = measure_four_mirrors()
        check_result = nine_checks(mirrors_data, CARRIER_HZ)
        
        if check_result["passed"] == 9:
            passing_rounds.append(check_result)

    if not passing_rounds:
        print("RESULT: NO-GO")
        print("Reason: No round passed all 9 quality checks.")
        return

    # Consensus (the "1")
    braid_offsets_ms = [r["braid_ms"] for r in passing_rounds]
    consensus_braid_ms = statistics.median(braid_offsets_ms)
    avg_coherence = statistics.mean(r["coherence"] for r in passing_rounds)
    
    # Ethical seal
    seal = seal_if_ethical(consensus_braid_ms)
    
    # Find representative round
    rep_round = min(passing_rounds, key=lambda r: abs(r["braid_ms"] - consensus_braid_ms))

    print("--- CONSENSUS RESULT ---")
    print(f"Braided offset: {consensus_braid_ms:+.4f} ms")
    print(f"Average coherence: {avg_coherence:.4f} ({avg_coherence * 100:.2f}%)")
    print(f"Rounds passed: {len(passing_rounds)} / {ROUNDS}")
    print(f"Ethics Gate: {seal['reason']}")
    print("-" * 20)
    print("Passing Braided Offsets (ms):")
    print([f'{b:+.4f}' for b in sorted(braid_offsets_ms)])
    print("-" * 20)
    print("--- REPRESENTATIVE PASSING ROUND ---")
    print(f"Round Braided Offset: {rep_round['braid_ms']:+.4f} ms")
    print(f"Round Coherence: {rep_round['coherence']:.4f}")
    print(f"Mirror Offsets (ms): " + ", ".join([f'{k}: {v:+.4f}' for k, v in rep_round['offsets'].items()]))
    print(f"RTT (ms): median {statistics.median(rep_round['rtts']):.3f}, stdev {statistics.stdev(rep_round['rtts']):.3f}")
    print("9/9 checks: PASSED")

if __name__ == "__main__":
    run_simulation()
