from app.services.pdf import extract_text_from_pdf


def extract_text(file):
    """
    Extracts text from a FastAPI UploadFile or file object.
    """
    if hasattr(file, "file"):
        content = file.file.read()
        return extract_text_from_pdf(content)
    return extract_text_from_pdf(file)