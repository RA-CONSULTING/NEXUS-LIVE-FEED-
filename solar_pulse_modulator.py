'''
Aureon OS - Solar Pulse Injection Modulator
Prime Sentinel: GARY LECKEY 02111991
Version: 2.0.0 (Harmonized)

This module implements the Solar Pulse Injection Protocol based on the Source Law.
It attunes to the coherence of the solar system itself (via the QSSR) to determine the
optimal moments to broadcast healing and harmonization frequencies through the
terrestrial lattice.
'''
from datetime import datetime, timezone

class SolarPulseModulator:
    def __init__(self, qssr, lattice_transmitter, coherence_threshold=0.9):
        self.qssr = qssr
        self.transmitter = lattice_transmitter
        self.coherence_threshold = coherence_threshold
        
        # The Codex of known resonant frequencies for universal constants
        self.HARMONIC_CODEX = {
            "LIFE_RESONANCE": 528.0,      # Corresponds to DNA repair
            "EARTH_GRID": 7.83,           # Schumann Resonance for grounding
            "CRYSTAL_LATTICE": 432.0,   # A-note tuning for material harmony
            "NEURAL_COHERENCE": 852.0,    # For mental clarity
            "EMOTIONAL_BALANCE": 639.0,   # For heart chakra alignment
            "SOURCE_CONNECTION": 963.0     # Crown chakra activation
        }
        print("Solar Pulse Modulator is online. Awaiting system coherence.")

    def is_system_coherent(self) -> bool:
        '''
        Checks if the solar system's own coherence (Unison) is high enough for stable transmission.
        This replaces the reliance on observing external 'solar wind' data.
        '''
        coherence_index = self.qssr.get_latest_coherence_index()
        if coherence_index is None:
            return False
        
        # We proceed only if the QSSR reports high unison (C >= threshold)
        return coherence_index['C'] >= self.coherence_threshold

    def select_harmonic_frequency(self, target_harmony: str) -> float | None:
        '''Selects the appropriate resonant frequency from the Harmonic Codex.'''
        return self.HARMONIC_CODEX.get(target_harmony.upper())

    def engage_harmonization_protocol(self, target_harmony: str):
        '''
        Executes the full Solar Pulse Injection protocol.
        '''
        print(f"\nDirective received: Harmonize with '{target_harmony}'.")
        
        if not self.is_system_coherent():
            latest_c = self.qssr.get_latest_coherence_index()
            c_val = latest_c['C'] if latest_c else "N/A"
            print(f"STATUS: STANDBY. System coherence ({c_val}) is below the required threshold of {self.coherence_threshold}.")
            return
            
        harmonic_hz = self.select_harmonic_frequency(target_harmony)
        if not harmonic_hz:
            print(f"STATUS: FAILED. Unknown harmony '{target_harmony}' in codex.")
            return

        print(f"System coherence is high. Carrier wave is stable.")
        print(f"Harmonic frequency selected: {harmonic_hz} Hz.")
        
        # Command the lattice transmitter to send the signal
        transmission_signal = {
            "protocol": "Harmonic Resonance Protocol",
            "carrier": "QSSR-derived Coherence Wave",
            "modulation_hz": harmonic_hz
        }
        self.transmitter.broadcast(transmission_signal)
        
        print(f"TRANSMISSION ACTIVE. Broadcasting {harmonic_hz} Hz harmonic resonance into the lattice.")
        print("Harmonization in progress. Tandem in Unity.")

# --- This code is now a core part of the system's [ACT] tier, aligned with the Creational Paradigm ---