import cv2
import numpy as np
import onnxruntime as ort

def detect_parking(image_path="college_parking.jpg", output_path="college_parking_detected.jpg", conf_thresh=0.25, iou_thresh=0.45):
    # 1. Load ONNX model
    session = ort.InferenceSession("best.onnx", providers=['CPUExecutionProvider'])
    input_name = session.get_inputs()[0].name
    classes = ['empty', 'occupied']
    colors = {
        'empty': (0, 255, 0),      # Green
        'occupied': (0, 0, 255)    # Red
    }

    # 2. Read image
    orig = cv2.imread(image_path)
    if orig is None:
        raise FileNotFoundError(f"Cannot find image: {image_path}")
    orig_h, orig_w = orig.shape[:2]

    # 3. Preprocess
    img_resized = cv2.resize(orig, (640, 640))
    input_tensor = (img_resized[:, :, ::-1].transpose(2, 0, 1) / 255.0).astype(np.float32)
    input_tensor = np.expand_dims(input_tensor, axis=0)

    # 4. Run inference
    output = session.run(None, {input_name: input_tensor})[0]
    output = np.squeeze(output).T  # Shape: (8400, 6)

    # 5. Extract bounding boxes & scores
    boxes = []
    confidences = []
    class_ids = []
    scale_x = orig_w / 640.0
    scale_y = orig_h / 640.0

    for row in output:
        scores = row[4:]
        cls_id = int(np.argmax(scores))
        conf = float(scores[cls_id])
        if conf >= conf_thresh:
            cx, cy, w, h = row[:4]
            x1 = int((cx - w / 2) * scale_x)
            y1 = int((cy - h / 2) * scale_y)
            bw = int(w * scale_x)
            bh = int(h * scale_y)
            boxes.append([x1, y1, bw, bh])
            confidences.append(conf)
            class_ids.append(cls_id)

    # 6. Apply Non-Maximum Suppression (NMS)
    indices = cv2.dnn.NMSBoxes(boxes, confidences, conf_thresh, iou_thresh)
    
    counts = {'empty': 0, 'occupied': 0}
    annotated = orig.copy()

    if len(indices) > 0:
        for idx in indices.flatten():
            box = boxes[idx]
            cls_id = class_ids[idx]
            conf = confidences[idx]
            label = classes[cls_id]
            counts[label] += 1
            
            x, y, bw, bh = box
            color = colors[label]
            cv2.rectangle(annotated, (x, y), (x + bw, y + bh), color, 2)
            caption = f"{label}: {conf:.2f}"
            cv2.putText(annotated, caption, (x, max(y - 5, 15)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

    # Draw summary banner at top
    total_det = len(indices) if len(indices) > 0 else 0
    overlay = annotated.copy()
    cv2.rectangle(overlay, (15, 15), (550, 70), (20, 20, 20), -1)
    cv2.addWeighted(overlay, 0.75, annotated, 0.25, 0, annotated)
    
    summary_text = f"Occupied: {counts['occupied']} | Empty: {counts['empty']} | Total: {total_det}"
    cv2.putText(annotated, summary_text, (30, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    cv2.imwrite(output_path, annotated)
    print("=== Inference Results ===")
    print(f"Total Detections: {total_det}")
    print(f"Occupied Slots (Cars): {counts['occupied']}")
    print(f"Empty Slots (Available): {counts['empty']}")
    print(f"Result saved to: {output_path}")

if __name__ == "__main__":
    detect_parking()
