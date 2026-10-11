import cv2
import numpy as np
from ultralytics import YOLO

def process_lot_c():
    image_path = "d:/BPUT/college_lot_c.jpg"
    output_path = "d:/BPUT/college_lot_c_result.jpg"

    orig = cv2.imread(image_path)
    if orig is None:
        raise FileNotFoundError(f"Image not found at {image_path}")
    h, w = orig.shape[:2]

    # Load ONNX model
    model = YOLO("d:/BPUT/yolov8s.onnx", task='detect')
    res = model.predict(orig, conf=0.35, classes=[2, 3, 5, 7], verbose=False)[0]
    car_boxes = [b.xyxy[0].cpu().numpy() for b in res.boxes]

    # Define the 11 monitored stalls in Lot C
    stalls = [
        # Main Foreground Row (C-11 to C-16)
        ('Slot C-11', np.array([[20, 470], [150, 470], [95, 650], [0, 650]])),
        ('Slot C-12', np.array([[150, 470], [280, 470], [225, 650], [95, 650]])),
        ('Slot C-13', np.array([[280, 470], [420, 470], [370, 650], [225, 650]])),
        ('Slot C-14', np.array([[420, 470], [565, 470], [535, 650], [370, 650]])),
        ('Slot C-15', np.array([[565, 470], [700, 470], [700, 650], [535, 650]])),
        ('Slot C-16', np.array([[700, 470], [870, 470], [870, 650], [700, 650]])),

        # Middle Row (B-12 to B-16)
        ('Slot B-12', np.array([[220, 370], [345, 370], [345, 470], [220, 470]])),
        ('Slot B-13', np.array([[345, 370], [455, 370], [455, 470], [345, 470]])),
        ('Slot B-14', np.array([[455, 370], [565, 370], [565, 470], [455, 470]])),
        ('Slot B-15', np.array([[565, 370], [670, 370], [670, 470], [565, 470]])),
        ('Slot B-16', np.array([[670, 370], [780, 370], [780, 470], [670, 470]]))
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
        cv2.polylines(annotated, [poly], isClosed=True, color=border_color, thickness=3)

        # Label placement at centroid of polygon
        M = cv2.moments(poly)
        if M["m00"] != 0:
            lx = int(M["m10"] / M["m00"]) - 50
            ly = int(M["m01"] / M["m00"])
        else:
            lx = int(poly[0][0]) + 15
            ly = int(poly[0][1]) + 30

        (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_DUPLEX, 0.52, 1)
        cv2.rectangle(annotated, (lx - 5, ly - th - 5), (lx + tw + 5, ly + 5), (20, 20, 20), -1)
        cv2.putText(annotated, label_text, (lx, ly), cv2.FONT_HERSHEY_DUPLEX, 0.52, (255, 255, 255), 1, cv2.LINE_AA)

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

    cv2.putText(annotated, "COLLEGE LOT C - ACADEMIC COMPLEX PARKING", (35, 38), cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 220, 255), 1, cv2.LINE_AA)
    cv2.putText(annotated, f"MONITORED: {total_stalls}", (35, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1, cv2.LINE_AA)
    cv2.putText(annotated, f"OCCUPIED: {occupied_count}", (230, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (80, 80, 255), 2, cv2.LINE_AA)
    cv2.putText(annotated, f"AVAILABLE: {available_count}", (410, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (80, 255, 80), 2, cv2.LINE_AA)
    cv2.putText(annotated, f"OCCUPANCY: {occ_rate:.1f}%", (620, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 0), 2, cv2.LINE_AA)
    cv2.putText(annotated, "FREE: C-14, C-15, C-16, B-15, B-16", (820, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 200), 1, cv2.LINE_AA)

    cv2.imwrite(output_path, annotated)

    print("\n" + "="*55)
    print("      COLLEGE LOT C PARKING SPACE MONITOR RESULTS")
    print("="*55)
    for name, st in stall_results:
        icon = "[BUSY]" if st == "OCCUPIED" else "[FREE]"
        print(f" {name:16s} : {st:12s} {icon}")
    print("-"*55)
    print(f" Total Monitored Stalls : {total_stalls}")
    print(f" Occupied Stalls (Red)  : {occupied_count}")
    print(f" Available Stalls (Grn) : {available_count} (C-14, C-15, C-16, B-15, B-16)")
    print(f" Occupancy Rate         : {occ_rate:.2f}%")
    print(f" Output Image Saved To  : {output_path}")
    print("="*55 + "\n")

if __name__ == "__main__":
    process_lot_c()
