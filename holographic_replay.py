import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

class AdvancedSLMHolography:
    def __init__(self, resolution=(512, 512), wavelength=532e-9, pixel_pitch=8e-6, propagation_distance=0.1):
        self.resolution = resolution
        self.wavelength = wavelength
        self.pixel_pitch = pixel_pitch
        self.propagation_distance = propagation_distance
        self.k = 2 * np.pi / self.wavelength

    def generate_phase_hologram(self, image_path):
        """Generates a phase-only hologram from a target image using a simple method."""
        img = Image.open(image_path).convert('L')
        img = img.resize(self.resolution)
        target_amplitude = np.array(img) / 255.0

        random_phase = np.random.uniform(0, 2 * np.pi, self.resolution)
        object_field = target_amplitude * np.exp(1j * random_phase)

        hologram_field = np.fft.fft2(object_field)
        phase_hologram = np.angle(hologram_field)
        return phase_hologram

    def propagate_fresnel(self, phase_hologram):
        """Reconstructs the image from the hologram using Fresnel propagation."""
        slm_width = self.resolution[0] * self.pixel_pitch
        slm_height = self.resolution[1] * self.pixel_pitch
        x = np.linspace(-slm_width / 2, slm_width / 2, self.resolution[0])
        y = np.linspace(-slm_height / 2, slm_height / 2, self.resolution[1])
        X, Y = np.meshgrid(x, y)

        hologram_field = np.exp(1j * phase_hologram)

        fx = np.fft.fftfreq(self.resolution[0], self.pixel_pitch)
        fy = np.fft.fftfreq(self.resolution[1], self.pixel_pitch)
        FX, FY = np.meshgrid(fx, fy)
        
        kernel_fft = np.exp(-1j * np.pi * self.wavelength * self.propagation_distance * (FX**2 + FY**2))
        
        reconstructed_field_fft = np.fft.fft2(hologram_field) * kernel_fft
        reconstructed_field = np.fft.ifft2(reconstructed_field_fft)
        
        intensity = np.abs(reconstructed_field)**2
        return intensity

def main():
    # --- Create a simple synthetic target image ---
    img_size = (512, 512)
    img_array = np.zeros(img_size)
    img_array[192:320, 192:320] = 1.0
    target_image = Image.fromarray((img_array * 255).astype(np.uint8))
    target_image_path = "target_square.png"
    target_image.save(target_image_path)

    # --- Simulation ---
    simulator = AdvancedSLMHolography(resolution=img_size, propagation_distance=0.2)

    # 1. Generate the hologram
    print("Generating phase hologram...")
    phase_pattern = simulator.generate_phase_hologram(target_image_path)

    # 2. Reconstruct the hologram with Fresnel propagation
    print("Reconstructing with Fresnel propagation...")
    replay_field = simulator.propagate_fresnel(phase_pattern)

    # --- Visualization ---
    plt.figure(figsize=(18, 6))

    plt.subplot(1, 3, 1)
    plt.imshow(target_image, cmap='gray')
    plt.title('Original Target Image')
    plt.axis('off')

    plt.subplot(1, 3, 2)
    plt.imshow(phase_pattern, cmap='gray')
    plt.title('SLM Phase-Only Hologram')
    plt.axis('off')

    plt.subplot(1, 3, 3)
    replay_field_norm = replay_field / np.max(replay_field)
    plt.imshow(replay_field_norm, cmap='gray')
    plt.title(f'Holographic Replay (Fresnel)\nz={simulator.propagation_distance}m')
    plt.axis('off')

    plt.tight_layout()
    output_path = 'holographic_replay_demo.png'
    plt.savefig(output_path)
    print(f"Saved holographic replay visualization to {output_path}")

if __name__ == "__main__":
    main()
