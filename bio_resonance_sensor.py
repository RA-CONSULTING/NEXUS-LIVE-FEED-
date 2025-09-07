
import json
import random
import time

# A list of sample species and their approximate locations
SAMPLE_SPECIES = [
    ("Monarch Butterfly", "Sierra Madre, Mexico"),
    ("Blue Whale", "Pacific Ocean"),
    ("Giant Sequoia", "California, USA"),
    ("Bengal Tiger", "Sundarbans, India"),
    ("Emperor Penguin", "Antarctica"),
    ("Golden Lion Tamarin", "Brazilian Atlantic Forest")
]

def generate_bio_resonance_data():
    """Generates a sample bio-resonance reading."""
    species, location = random.choice(SAMPLE_SPECIES)
    
    # Simulate a resonance factor. A value closer to 1.0 is ideal.
    # We will simulate a range of values to represent species in various states of health.
    resonance_factor = random.uniform(0.3, 0.99)
    
    return {
        "species": species,
        "resonanceFactor": resonance_factor,
        "location": location
    }

def stream_bio_resonance_data():
    """Yields a continuous stream of bio-resonance data."""
    while True:
        # Generate a list of readings for different species
        data = {
            "bioResonance": [generate_bio_resonance_data() for _ in range(random.randint(3, 5))]
        }
        yield f"data: {json.dumps(data)}\n\n"
        time.sleep(2) # Simulate a 2-second interval between readings

if __name__ == "__main__":
    for data_point in stream_bio_resonance_data():
        print(data_point)
