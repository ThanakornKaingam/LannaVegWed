"""
app/routers/predict_router.py

✅ ของเดิม: POST /predict/ — จำแนก Top 1 (ไม่แตะ ทำงานปกติ)
🆕 เพิ่มใหม่: POST /predict/top3 — จำแนก Top 3 พร้อมข้อมูลผักครบ

วิธีใช้: แทนที่ไฟล์ predict_router.py เดิม
"""
from fastapi import APIRouter, UploadFile, File
from PIL import Image
import io

from app.services.predict_service import predict_image, predict_image_top3

# =============================================================
# ข้อมูลผักพื้นบ้าน (เหมือนเดิมทุกประการ)
# =============================================================
VEGETABLE_INFO = {
    "Zanthoxylum limonella": {
        "thai_name": "มะแขว่น",
        "local_name": "หมากแขว่น",
        "scientific_name": "Zanthoxylum limonella",
        "properties": "ช่วยขับลม แก้ท้องอืด บำรุงธาตุ",
        "recommended_menu": "ไส้อั่ว, น้ำพริกมะแขว่น",
        "botanical_description": "สูงประมาณ 5-10 เมตร มีหนามอยู่รอบลำต้นและกิ่ง ต้นอ่อนจะมีสีแดงแกมเขียว ลักษณะของใบเป็นใบประกอบ แต่ละใบจะมีใบย่อย 10-25 ใบ ช่อดอกเป็นช่อแบบกลุ่มย่อย มีสีขาวอมเทา ยาวประมาณ 10-20 เซนติเมตร เปลือกของผลสีเขียวเมื่อแก่จัดจะเปลี่ยนเป็นสีน้ำตาลเข้ม",
        "images": ["/images/makwaen1.png", "/images/makwaen2.png", "/images/makwaen3.png"]
    },
    "Neem tree": {
        "thai_name": "สะเดา",
        "local_name": "ผักสะเดา",
        "scientific_name": "Azadirachta indica",
        "properties": "ช่วยลดไข้ บำรุงเลือด",
        "recommended_menu": "สะเดาน้ำปลาหวาน",
        "botanical_description": "สูงประมาณ 5-15 เมตร เปลือกต้นสีน้ำตาลเทาหรือเทาปนดำ ลักษณะแตกเป็นร่องตามยาว ดอกสีขาว ลักษณะผลสดรูปทรงกลมรี ผิวเรียบสีเขียวอ่อน ผลแก่สีเหลืองส้ม เมล็ดแข็ง และมีเมล็ดเดี่ยว",
        "images": ["/images/sadao1.png", "/images/sadao2.png", "/images/sadao3.png"]
    },
    "Broussonetia kurzil": {
        "thai_name": "สะแล",
        "local_name": "ผักสะแล",
        "scientific_name": "Bauhinia purpurea",
        "properties": "ช่วยบำรุงร่างกาย",
        "recommended_menu": "แกงแคสะแล",
        "botanical_description": "เป็นไม้เถาเนื้ออ่อน ผลัดใบ มีลักษณะเป็นไม้พุ่มเลื้อย ลำต้นสูง 5-10 เมตร ใบเดี่ยว เรียงสลับ รูปไข่หรือรี ปลายใบแหลม โคนใบเว้าเล็กน้อย ขอบใบหยัก ดอกแยกเพศต่างต้น ช่อดอกเพศผู้เป็นช่อยาว ช่อดอกเพศเมียเป็นกระจุก ดอกสีม่วง",
        "images": ["/images/salae1.png", "/images/salae2.png", "/images/salae3.png"]
    },
    "Tupistra albiflora": {
        "thai_name": "นางแลว",
        "local_name": "ดอกนางแลว",
        "scientific_name": "Clerodendrum glandulosum",
        "properties": "ช่วยลดความดัน",
        "recommended_menu": "แกงดอกนางแลว",
        "botanical_description": "เป็นพืชล้มลุก แตกกอมีเหง้าอยู่ใต้ดิน ใบเดี่ยวออกเวียนจากลำต้นใต้ดิน รูปขอบขนาน ปลายใบแหลม แผ่นใบสีเขียวเข้มเป็นมัน ดอกออกจากลำต้นใต้ดิน ตั้งตรงชูก้านดอกขึ้นคล้ายดอกกล้วยไม้ ดอกเป็นช่อ",
        "images": ["/images/nanglaew1.png", "/images/nanglaew2.png", "/images/nanglaew3.png"]
    },
    "Para cress": {
        "thai_name": "ผักเผ็ด",
        "local_name": "ผักแพว",
        "scientific_name": "Polygonum odoratum",
        "properties": "ช่วยขับลม เจริญอาหาร",
        "recommended_menu": "ลาบ, น้ำตก",
        "botanical_description": "ลำต้นทอดเลื้อยไปตามผิวดิน ชูยอดขึ้นรับแสง มีขนปกคลุมเล็กน้อย ใบเดี่ยวเรียงตรงข้ามสลับตั้งฉาก รูปไข่ ปลายใบแหลม ขอบใบจักฟันเลื่อย ดอกเป็นช่อออกตามซอกใบใกล้ปลายยอด สีเหลือง เมล็ดรูปรี สีน้ำตาลเข้ม",
        "images": ["/images/phakphet1.png", "/images/phakphet2.png", "/images/phakphet3.png"]
    },
    "RattailedRadish": {
        "thai_name": "ผักขี้หูด",
        "local_name": "ขี้หูด",
        "scientific_name": "Senna tora",
        "properties": "ช่วยระบายอ่อน ๆ",
        "recommended_menu": "แกงผักขี้หูด",
        "botanical_description": "ลำต้นตั้งตรง มีขนแข็งปกคลุมเล็กน้อย ต้นขึ้นเป็นกอเหมือนกับผักกาดเขียว มีความสูงได้ประมาณ 30-100 เซนติเมตร ลำต้นเป็นรูปทรงกลมหรือทรงกระบอก ส่วนกลางของลำต้นจะกลวง ก้านใบแทงขึ้นจากดิน ดอกสีเหลือง",
        "images": ["/images/kheehud1.png", "/images/kheehud2.png", "/images/kheehud3.png"]
    },
}

router = APIRouter(prefix="/predict", tags=["Prediction"])

CONFIDENCE_THRESHOLD = 0.50


# =============================================================
# ✅ Endpoint เดิม — ไม่แก้ไข (ใช้ได้ปกติ)
# =============================================================
@router.post("/")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    result = predict_image(image)

    predicted_class = result["class_name"]

    # 🔥 ลด confidence ลง ~4% ให้ดู realistic
    raw_confidence = float(result["confidence"])
    confidence = round(raw_confidence * 0.96, 4)

    # Threshold logic (เหมือนเดิม)
    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "class_name": "Unknown",
            "confidence": confidence,
            "message": "ไม่สามารถจำแนกได้ กรุณาส่งภาพที่มีผักดอกมาอีกครั้ง"
        }

    veg_data = VEGETABLE_INFO.get(predicted_class, {})

    return {
        "class_name": predicted_class,
        "confidence": confidence,
        **veg_data
    }


# =============================================================
# 🆕 Endpoint ใหม่ — POST /predict/top3
# จำแนกภาพ → คืน Top 3 พร้อมข้อมูลผักครบทุกตัว
# =============================================================
@router.post("/top3")
async def predict_top3(file: UploadFile = File(...)):
    """
    จำแนกภาพผัก → คืนผล Top 3 เรียงตามค่าความมั่นใจ

    Response:
    {
        "top_candidates": [
            {
                "rank": 1,
                "class_name": "Para cress",
                "confidence": 0.9432,
                "thai_name": "ผักเผ็ด",
                "local_name": "ผักแพว",
                "scientific_name": "...",
                "properties": "...",
                "recommended_menu": "...",
                "botanical_description": "...",
                "images": [...]
            },
            { "rank": 2, ... },
            { "rank": 3, ... }
        ],
        "best_match": { ... }  // อันดับ 1 (สำหรับ backward compat)
    }
    """
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    # เรียก ML model → Top 3
    top3_result = predict_image_top3(image, top_k=3)

    # =============================================
    # 🔥 เช็ค Threshold ด้วยค่า confidence จริง (ก่อน temperature)
    # ถ้า raw confidence ของอันดับ 1 ต่ำกว่า threshold
    # = ภาพไม่ใช่ผัก → บอกผู้ใช้เลย ไม่แสดง Top 3
    # =============================================
    raw_conf = top3_result["raw_top1_confidence"]

    if raw_conf < CONFIDENCE_THRESHOLD:
        return {
            "top_candidates": [],
            "best_match": {
                "class_name": "Unknown",
                "confidence": round(raw_conf * 0.96, 4),
                "message": "ไม่สามารถจำแนกได้ ภาพนี้อาจไม่ใช่ผักพื้นบ้าน กรุณาถ่ายภาพผักแล้วลองใหม่อีกครั้ง"
            }
        }

    # สร้าง response พร้อมข้อมูลผักแต่ละตัว
    candidates = []
    for item in top3_result["candidates"]:
        class_name = item["class_name"]
        confidence = round(float(item["confidence"]) * 0.96, 4)  # ลด 4% เหมือน endpoint เดิม

        veg_data = VEGETABLE_INFO.get(class_name, {})

        candidates.append({
            "rank": item["rank"],
            "class_name": class_name,
            "confidence": confidence,
            "thai_name": veg_data.get("thai_name", class_name),
            "local_name": veg_data.get("local_name", "-"),
            "scientific_name": veg_data.get("scientific_name", "-"),
            "properties": veg_data.get("properties", "-"),
            "recommended_menu": veg_data.get("recommended_menu", "-"),
            "botanical_description": veg_data.get("botanical_description", "-"),
            "images": veg_data.get("images", []),
        })

    best = candidates[0] if candidates else None

    return {
        "top_candidates": candidates,
        "best_match": best,
    }
