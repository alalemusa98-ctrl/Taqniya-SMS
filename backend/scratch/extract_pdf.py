
import pypdf
reader = pypdf.PdfReader(r"C:\Users\alale\Downloads\صحائف مؤقته من الصف الأول للصف الخامس 2026 م مدرسة الحرية بالرياينة .pdf")
print("Total pages:", len(reader.pages))
for i in range(len(reader.pages)):
    print(f"=== PAGE {i+1} ===")
    print(reader.pages[i].extract_text())
