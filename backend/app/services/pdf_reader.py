import fitz


def extract_text(file):

    document=fitz.open(
        stream=file.file.read(),
        filetype="pdf"
    )


    text=""

    for page in document:
        text+=page.get_text()


    return text