import cv2
import numpy as np
from ultralytics import YOLO

def process_dual_row_parking():
    image_path = "d:/BPUT/close_parking.jpg"
    output_path = "d:/BPUT/close_parking_dual_row_result.jpg"
    
    orig = cv2.imread(image_path)
    if orig is None:
        raise FileNotFoundError(f"Image not found at {image_path}")
    h, w = orig.shape[:2]

    # Load ONNX model
    model = YOLO("d:/BPUT/yolov8s.onnx", task='detect')
    res = model.predict(orig, conf=0.35, classes=[2, 3, 5, 7], verbose=False)[0]
    car_boxes = [b.xyxy[0].cpu().numpy() for b in res.boxes]

    # Define all 9 monitored slots (5 background, 4 foreground)
    slots = [
        # --- Background Row (Slots 17 to 22) ---
        ('Slot 17', np.array([[10, 260], [230, 260], [230, 495], [10, 495]])),
        ('Slot 19', np.array([[230, 260], [480, 260], [480, 495], [230, 495]])),
        ('Slot 20 [Spot 6]', np.array([[480, 260], [730, 260], [730, 495], [480, 495]])),
        ('Slot 21', np.array([[730, 260], [980, 260], [980, 495], [730, 495]])),
        ('Slot 22', np.array([[980, 260], [1195, 260], [1195, 495], [980, 495]])),

        # --- Foreground Row (User Marked Spots 2, 3, 4, 5) ---
        ('Spot 2', np.array([[10, 500], [380, 500], [180, 885], [10, 885]])),
        ('Spot 3', np.array([[380, 500], [640, 500], [720, 885], [180, 885]])),
        ('Spot 4', np.array([[640, 500], [900, 500], [1020, 885], [720, 885]])),
        ('Spot 5', np.array([[900, 500], [1190, 500], [1190, 885], [1020, 885]]))
    ]

    annotated = orig.copy()
    overlay = orig.copy()

    occupied_count = 0
    available_count = 0
    slot_details = []

    for name, poly in slots:
        is_occupied = False
        for cb in car_boxes:
            cx = (cb[0] + cb[2]) / 2.0
            cy = (cb[1] + cb[3]) / 2.0
            if cv2.pointPolygonTest(poly, (cx, cy), False) >= 0:
                is_occupied = True
                break

        if is_occupied:
            occupied_count += 1
            status = "OCCUPIED"
            tint_color = (0, 0, 220)       # Red tint
            border_color = (0, 0, 255)     # Solid red
            label_text = f"{name} [BUSY]"
        else:
            available_count += 1
            status = "AVAILABLE"
            tint_color = (0, 220, 0)       # Green tint
            border_color = (0, 255, 0)     # Solid green
            label_text = f"{name} [FREE]"

        # Fill polygon on overlay
        cv2.fillPoly(overlay, [poly], tint_color)
        # Draw solid contour
        cv2.polylines(annotated, [poly], isClosed=True, color=border_color, thickness=3)

        # Calculate polygon center for label placement
        M = cv2.moments(poly)
        if M["m00"] != 0:
            lx = int(M["m10"] / M["m00"]) - 60
            ly = int(M["m01"] / M["m00"])
        else:
            lx = int(poly[0][0]) + 15
            ly = int(poly[0][1]) + 30

        # Draw text background pill
        (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_DUPLEX, 0.55, 1)
        cv2.rectangle(annotated, (lx - 5, ly - th - 5), (lx + tw + 5, ly + 5), (20, 20, 20), -1)
        cv2.putText(annotated, label_text, (lx, ly), cv2.FONT_HERSHEY_DUPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)

        slot_details.append((name, status))

    # Blend translucent overlay (alpha=0.30)
    cv2.addWeighted(overlay, 0.30, annotated, 0.70, 0, annotated)

    # Draw detected vehicle bounding boxes with cyan contour
    for cb in car_boxes:
        bx1, by1, bx2, by2 = [int(p) for p in cb]
        cv2.rectangle(annotated, (bx1, by1), (bx2, by2), (255, 200, 0), 1)

    # Top HUD Bar
    hud = annotated.copy()
    cv2.rectangle(hud, (20, 15), (w - 20, 75), (20, 20, 20), -1)
    cv2.addWeighted(hud, 0.85, annotated, 0.15, 0, annotated)
    cv2.rectangle(annotated, (20, 15), (w - 20, 75), (90, 90, 90), 1)

    total_slots = len(slots)
    occ_rate = (occupied_count / total_slots) * 100

    cv2.putText(annotated, "DUAL-ROW SMART PARKING MONITOR (SPOTS 1-6)", (35, 38), cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 220, 255), 1, cv2.LINE_AA)
    cv2.putText(annotated, f"MONITORED: {total_slots}", (35, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1, cv2.LINE_AA)
    cv2.putText(annotated, f"OCCUPIED: {occupied_count}", (230, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (80, 80, 255), 2, cv2.LINE_AA)
    cv2.putText(annotated, f"AVAILABLE: {available_count}", (410, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (80, 255, 80), 2, cv2.LINE_AA)
    cv2.putText(annotated, f"OCCUPANCY: {occ_rate:.1f}%", (620, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 0), 2, cv2.LINE_AA)
    cv2.putText(annotated, "FREE: SPOTS 2, 3, 4, 5, 6", (830, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.50, (0, 255, 200), 1, cv2.LINE_AA)

    cv2.imwrite(output_path, annotated)

    print("\n" + "="*55)
    print("      DUAL-ROW PARKING SPACE MONITOR RESULTS")
    print("="*55)
    for name, st in slot_details:
        icon = "[BUSY]" if st == "OCCUPIED" else "[FREE]"
        print(f" {name:20s} : {st:10s} {icon}")
    print("-"*55)
    print(f" Total Monitored Slots : {total_slots}")
    print(f" Occupied Slots (Red)  : {occupied_count}")
    print(f" Available Slots (Grn) : {available_count} (Spots 2, 3, 4, 5 & 6)")
    print(f" Occupancy Rate        : {occ_rate:.2f}%")
    print(f" Output Image Saved To : {output_path}")
    print("="*55 + "\n")

if __name__ == "__main__":
    process_dual_row_parking()
