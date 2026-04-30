from fastapi import UploadFile


async def extract_text_from_document(file: UploadFile) -> str:
    content = await file.read()
    snippet = content[:2000].decode("utf-8", errors="ignore")
    if snippet.strip():
        return snippet
    return "OCR placeholder: Integrate Tesseract or cloud OCR provider for scanned/image PDFs."
