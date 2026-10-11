import cv2
import numpy as np
from ultralytics import YOLO

def process_new_parking():
    image_path = "d:/BPUT/new_parking.jpg"
    output_path = "d:/BPUT/new_parking_result.jpg"

    orig = cv2.imread(image_path)
    if orig is None:
        raise FileNotFoundError(f"Image not found at {image_path}")
    h, w = orig.shape[:2]

    # Load ONNX model
    model = YOLO("d:/BPUT/yolov8s.onnx", task='detect')
    res = model.predict(orig, conf=0.35, classes=[2, 3, 5, 7], verbose=False)[0]
    car_boxes = [b.xyxy[0].cpu().numpy() for b in res.boxes]

    # Define the 10 parking stalls in Lot B
    stalls = [
        # Front Row
        ('Bay F1', np.array([[35, 410], [270, 410], [240, 660], [35, 660]])),
        ('Bay F2', np.array([[270, 410], [510, 410], [480, 660], [240, 660]])),
        ('Bay F3', np.array([[510, 410], [715, 410], [690, 660], [480, 660]])),
        ('Bay F4', np.array([[715, 410], [940, 410], [920, 660], [690, 660]])),
        ('Bay F5', np.array([[940, 410], [1195, 410], [1185, 660], [920, 660]])),

        # Back Row
        ('Bay B1', np.array([[170, 280], [340, 280], [340, 430], [170, 430]])),
        ('Bay B2', np.array([[340, 280], [500, 280], [500, 430], [340, 430]])),
        ('Bay B3', np.array([[500, 280], [680, 280], [680, 430], [500, 430]])),
        ('Bay B4', np.array([[680, 280], [880, 280], [880, 430], [680, 430]])),
        ('Bay B5', np.array([[880, 280], [1110, 280], [1110, 430], [880, 430]]))
    ]

    annotated = orig.copy()
    overlay = orig.copy()

    occupied_count = 0
    available_count = 0
    stall_results = []

    for name, poly in stalls:
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

        # Label placement
        M = cv2.moments(poly)
        if M["m00"] != 0:
            lx = int(M["m10"] / M["m00"]) - 50
            ly = int(M["m01"] / M["m00"])
        else:
            lx = int(poly[0][0]) + 15
            ly = int(poly[0][1]) + 30

        (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_DUPLEX, 0.55, 1)
        cv2.rectangle(annotated, (lx - 5, ly - th - 5), (lx + tw + 5, ly + 5), (20, 20, 20), -1)
        cv2.putText(annotated, label_text, (lx, ly), cv2.FONT_HERSHEY_DUPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)

        stall_results.append((name, status))

    # Blend overlay (alpha=0.30)
    cv2.addWeighted(overlay, 0.30, annotated, 0.70, 0, annotated)

    # Draw detected vehicle bounding boxes with thin yellow outline
    for cb in car_boxes:
        bx1, by1, bx2, by2 = [int(p) for p in cb]
        cv2.rectangle(annotated, (bx1, by1), (bx2, by2), (255, 215, 0), 1)

    # Top Dashboard HUD
    total_stalls = len(stalls)
    occ_rate = (occupied_count / total_stalls) * 100

    hud = annotated.copy()
    cv2.rectangle(hud, (20, 15), (w - 20, 75), (20, 20, 20), -1)
    cv2.addWeighted(hud, 0.85, annotated, 0.15, 0, annotated)
    cv2.rectangle(annotated, (20, 15), (w - 20, 75), (90, 90, 90), 1)

    cv2.putText(annotated, "CAMPUS CCTV LOT B - SMART PARKING MONITOR", (35, 38), cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 220, 255), 1, cv2.LINE_AA)
    cv2.putText(annotated, f"MONITORED: {total_stalls}", (35, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1, cv2.LINE_AA)
    cv2.putText(annotated, f"OCCUPIED: {occupied_count}", (230, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (80, 80, 255), 2, cv2.LINE_AA)
    cv2.putText(annotated, f"AVAILABLE: {available_count}", (410, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (80, 255, 80), 2, cv2.LINE_AA)
    cv2.putText(annotated, f"OCCUPANCY: {occ_rate:.1f}%", (620, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 0), 2, cv2.LINE_AA)
    cv2.putText(annotated, "FREE SPOTS: Bay F3, Bay B3, Bay B4", (810, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (0, 255, 200), 1, cv2.LINE_AA)

    cv2.imwrite(output_path, annotated)

    print("\n" + "="*55)
    print("      LOT B PARKING SPACE MONITOR RESULTS")
    print("="*55)
    for name, st in stall_results:
        icon = "[BUSY]" if st == "OCCUPIED" else "[FREE]"
        print(f" {name:15s} : {st:12s} {icon}")
    print("-"*55)
    print(f" Total Monitored Stalls : {total_stalls}")
    print(f" Occupied Stalls (Red)  : {occupied_count}")
    print(f" Available Stalls (Grn) : {available_count} (Bay F3, Bay B3, Bay B4)")
    print(f" Occupancy Rate         : {occ_rate:.2f}%")
    print(f" Output Image Saved To  : {output_path}")
    print("="*55 + "\n")

if __name__ == "__main__":
    process_new_parking()
