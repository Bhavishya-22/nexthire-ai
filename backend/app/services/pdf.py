import os
import fitz


def extract_text_from_pdf(source) -> str:
    """
    Extracts text from a PDF source, which can be:
    - bytes / bytearray
    - str / os.PathLike (file path)
    - file-like object with a .read() method
    """
    document = None
    try:
        if isinstance(source, (bytes, bytearray)):
            document = fitz.open(stream=source, filetype="pdf")
        elif isinstance(source, str):
            if not os.path.exists(source):
                raise FileNotFoundError(f"PDF file not found at: {source}")
            document = fitz.open(source)
        elif hasattr(source, "read"):
            data = source.read()
            if isinstance(data, str):
                data = data.encode("utf-8")
            document = fitz.open(stream=data, filetype="pdf")
        else:
            raise ValueError(f"Unsupported PDF source type: {type(source)}")

        text_parts = []
        for page in document:
            page_text = page.get_text()
            if page_text:
                text_parts.append(page_text)

        return "\n".join(text_parts).strip()

    finally:
        if document is not None:
            document.close()