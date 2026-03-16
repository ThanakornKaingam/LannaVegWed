from fastapi import APIRouter, UploadFile, File
from PIL import Image
import io
from app.services.predict_service import predict_image

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

CONFIDENCE_THRESHOLD = 0.85
MARGIN_THRESHOLD = 0.20

@router.post("/")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    result = predict_image(image)

    predicted_class = result["class_name"]
    confidence = round(float(result["confidence"]), 4)
    all_probs = result.get("all_probs", None)

    # ✅ เช็ก margin ระหว่าง top1 และ top2
    if all_probs is not None and len(all_probs) >= 2:
        sorted_probs = sorted(all_probs, reverse=True)
        margin = sorted_probs[0] - sorted_probs[1]
        if margin < MARGIN_THRESHOLD:
            return {
                "class_name": "Unknown",
                "confidence": confidence,
                "message": "ไม่สามารถจำแนกได้ กรุณาส่งภาพผักที่ชัดเจนมาอีกครั้ง"
            }

    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "class_name": "Unknown",
            "confidence": confidence,
            "message": "ไม่สามารถจำแนกได้ กรุณาส่งภาพผักที่ชัดเจนมาอีกครั้ง"
        }

    veg_data = VEGETABLE_INFO.get(predicted_class, {})
    return {
        "class_name": predicted_class,
        "confidence": confidence,
        **veg_data
    }
