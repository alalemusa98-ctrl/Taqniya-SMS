import fs from 'fs';
import { execSync } from 'child_process';

const pdfPath = 'C:\\Users\\alale\\Downloads\\صحائف مؤقته من الصف الأول للصف الخامس 2026 م مدرسة الحرية بالرياينة .pdf';

// Let's use python to extract text or inspect via pdfplumber / pypdf / fitz
const pythonScript = `
import pypdf
reader = pypdf.PdfReader(r"${pdfPath}")
print("Total pages:", len(reader.pages))
for i in range(len(reader.pages)):
    print(f"=== PAGE {i+1} ===")
    print(reader.pages[i].extract_text())
`;

fs.writeFileSync('scratch/extract_pdf.py', pythonScript, 'utf8');
console.log('Script written');
