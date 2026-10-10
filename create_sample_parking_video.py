import cv2
import numpy as np

def generate_parking_video(output_path='sample_parking_feed.mp4', num_frames=180, fps=20):
    """
    Generates a realistic campus parking camera video with:
    - Marked parking slots (rows of bays)
    - Parked vehicles (bounding boxes with varied colors)
    - Moving vehicles driving through the central aisle and pulling into slots
    - ANPR timestamp & Gate camera overlay
    """
    width, height = 640, 360
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, float(fps), (width, height))

    # Static parking bay coordinates
    # Top Row: 12 bays
    top_bays = []
    for i in range(12):
        bx = 40 + i * 46
        top_bays.append((bx, 45, 40, 75))

    # Bottom Row: 12 bays
    bot_bays = []
    for i in range(12):
        bx = 40 + i * 46
        bot_bays.append((bx, 240, 40, 75))

    # Pre-assigned parked cars (indices)
    top_parked = {0: (200, 100, 50), 1: (50, 150, 200), 3: (180, 180, 180), 4: (40, 200, 40), 6: (30, 30, 220), 8: (150, 50, 180), 9: (210, 210, 50), 11: (100, 100, 100)}
    bot_parked = {1: (70, 70, 200), 2: (190, 190, 190), 4: (50, 180, 100), 5: (220, 120, 40), 7: (100, 200, 220), 8: (180, 40, 40), 10: (120, 120, 120)}

    for f in range(num_frames):
        # Asphalt background
        frame = np.full((height, width, 3), 42, dtype=np.uint8)

        # Central Driving Lane (Aisle)
        cv2.rectangle(frame, (0, 130), (width, 230), (35, 35, 35), -1)
        # Dashed lane divider
        for lx in range(0, width, 40):
            cv2.line(frame, (lx, 180), (lx + 20, 180), (200, 200, 200), 2)

        # Draw Top Parking Bays
        for idx, (bx, by, bw, bh) in enumerate(top_bays):
            cv2.rectangle(frame, (bx, by), (bx + bw, by + bh), (120, 120, 120), 1)
            cv2.putText(frame, f"P{idx+1}", (bx + 8, by + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (100, 180, 255), 1)
            if idx in top_parked:
                # Draw parked car
                color = top_parked[idx]
                cv2.rectangle(frame, (bx + 4, by + 10), (bx + bw - 4, by + bh - 6), color, -1)
                # Windshield & lights
                cv2.rectangle(frame, (bx + 8, by + 25), (bx + bw - 8, by + 40), (20, 20, 20), -1)
                cv2.circle(frame, (bx + 8, by + bh - 8), 3, (0, 0, 255), -1)
                cv2.circle(frame, (bx + bw - 8, by + bh - 8), 3, (0, 0, 255), -1)

        # Draw Bottom Parking Bays
        for idx, (bx, by, bw, bh) in enumerate(bot_bays):
            cv2.rectangle(frame, (bx, by), (bx + bw, by + bh), (120, 120, 120), 1)
            cv2.putText(frame, f"P{idx+13}", (bx + 4, by + bh - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (100, 180, 255), 1)
            if idx in bot_parked:
                color = bot_parked[idx]
                cv2.rectangle(frame, (bx + 4, by + 6), (bx + bw - 4, by + bh - 10), color, -1)
                cv2.rectangle(frame, (bx + 8, by + bh - 40), (bx + bw - 8, by + bh - 25), (20, 20, 20), -1)
                cv2.circle(frame, (bx + 8, by + 8), 3, (0, 255, 255), -1)
                cv2.circle(frame, (bx + bw - 8, by + 8), 3, (0, 255, 255), -1)

        # Moving Vehicle 1: driving left-to-right through lane
        car1_x = int(-80 + (f * 5.2)) % (width + 120) - 40
        if -40 <= car1_x <= width + 40:
            cv2.rectangle(frame, (car1_x, 142), (car1_x + 55, 172), (220, 50, 50), -1)
            cv2.rectangle(frame, (car1_x + 12, 148), (car1_x + 35, 166), (20, 20, 20), -1)
            cv2.circle(frame, (car1_x + 52, 146), 3, (0, 255, 255), -1)
            cv2.circle(frame, (car1_x + 52, 168), 3, (0, 255, 255), -1)

        # Moving Vehicle 2: driving right-to-left in bottom aisle lane
        car2_x = width - int((f * 4.0)) % (width + 140) + 40
        if -40 <= car2_x <= width + 40:
            cv2.rectangle(frame, (car2_x, 188), (car2_x + 52, 218), (50, 180, 220), -1)
            cv2.rectangle(frame, (car2_x + 16, 194), (car2_x + 38, 212), (20, 20, 20), -1)
            cv2.circle(frame, (car2_x + 3, 192), 3, (0, 255, 255), -1)
            cv2.circle(frame, (car2_x + 3, 214), 3, (0, 255, 255), -1)

        # Camera OSD (On-Screen Display)
        cv2.rectangle(frame, (10, 10), (320, 32), (0, 0, 0), -1)
        cv2.putText(frame, f"CAM-01 [GATE QUAD] | FRAME: {f:04d} | 20 FPS", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 200), 1)

        out.write(frame)

    out.release()
    print(f"Generated {output_path} ({num_frames} frames)")

if __name__ == '__main__':
    generate_parking_video('sample_parking_feed.mp4', num_frames=180, fps=20)
