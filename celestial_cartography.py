
import matplotlib.pyplot as plt
from skyfield.api import Star, load
from datetime import datetime

def generate_celestial_chart():
    ts = load.timescale()
    t = ts.now()

    eph = load('de421.bsp')
    earth = eph['earth']

    fig, ax = plt.subplots(figsize=(10, 10), subplot_kw={'projection': 'polar'})
    ax.set_rlim(0, 2)
    ax.set_theta_zero_location('N')
    ax.set_theta_direction(-1)
    ax.grid(True)

    # Plot stars
    # This is a simplified representation. A real star chart would require a star catalog.
    stardata = [
        ('Polaris', 0.0, 89.15, 'red'),
        ('Sirius', 6.75, -16.7, 'blue'),
        ('Betelgeuse', 5.91, 7.4, 'orange')
    ]
    for name, ra, dec, color in stardata:
        ax.plot(ra * 15 * 3.14159 / 180, 90 - dec, 'o', color=color, label=name)

    # Plot planets
    planets = ['mercury', 'venus', 'mars', 'jupiter', 'saturn']
    for planet_name in planets:
        planet = eph[planet_name]
        astrometric = earth.at(t).observe(planet)
        ra, dec, distance = astrometric.radec()
        ax.plot(ra.hours * 15 * 3.14159 / 180, 90 - dec.degrees, 'o', markersize=10, label=planet_name.capitalize())

    ax.legend()
    chart_path = 'public/celestial_chart.png'
    plt.savefig(chart_path)
    return chart_path
