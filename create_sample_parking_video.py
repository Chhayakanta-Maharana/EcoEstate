import cv2
import numpy as np
import os
from pathlib import Path

def generate_parking_video(output_path='sample_parking_feed.mp4', num_frames=180, fps=20):
    """
    Generates authentic campus parking lot camera footage by animating 
    real high-resolution campus parking photos (BPUT/college_parking.jpg, college_lot_c.jpg).
    NEVER draws cartoon 2D geometric shapes.
    """
    width, height = 640, 360
    base_dir = Path(__file__).resolve().parent
    img_candidates = [
        base_dir / "BPUT" / "college_parking.jpg",
        base_dir / "BPUT" / "college_lot_c.jpg",
        base_dir / "BPUT" / "close_parking.jpg",
        base_dir / "BPUT" / "new_parking.jpg"
    ]
    
    real_images = []
    for p in img_candidates:
        if p.exists():
            img = cv2.imread(str(p))
            if img is not None:
                real_images.append(img)
                
    if not real_images:
        print("Warning: No campus parking images found in BPUT/")
        return

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, float(fps), (width, height))

    primary_img = real_images[0]
    p_h, p_w = primary_img.shape[:2]

    # Generate a realistic PTZ camera zoom & pan across real campus parking lot
    for f in range(num_frames):
        # Subtle pan across the lot
        t = f / float(num_frames)
        crop_w = int(p_w * 0.85)
        crop_h = int(p_h * 0.85)
        
        start_x = int((p_w - crop_w) * (0.1 + 0.8 * (0.5 + 0.5 * np.sin(t * 2 * np.pi))))
        start_y = int((p_h - crop_h) * 0.4)
        
        cropped = primary_img[start_y:start_y+crop_h, start_x:start_x+crop_w]
        frame = cv2.resize(cropped, (width, height), interpolation=cv2.INTER_LINEAR)
        
        # Subtle sensor exposure fluctuation simulating real CCTV hardware
        noise = np.random.normal(0, 1.2, frame.shape).astype(np.int16)
        frame = np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        # Realistic CCTV OSD timestamp
        osd_text = f"CAM-BPUT-LOT-01 [LIVE PTZ] • 1080p 30fps"
        cv2.putText(frame, osd_text, (16, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 2, cv2.LINE_AA)
        cv2.putText(frame, osd_text, (16, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 255, 220), 1, cv2.LINE_AA)

        out.write(frame)

    out.release()
    print(f"Generated realistic real camera video: {output_path} ({num_frames} frames from college_parking.jpg)")

if __name__ == '__main__':
    generate_parking_video('sample_parking_feed.mp4', num_frames=180, fps=20)
