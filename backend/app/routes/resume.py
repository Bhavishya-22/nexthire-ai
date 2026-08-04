from fastapi import APIRouter,UploadFile,File
from app.services.pdf_reader import extract_text


router=APIRouter(
prefix="/resume"
)



@router.post("/upload")
async def upload_resume(
    file:UploadFile=File(...)
):

    text=extract_text(file)

    return {

        "filename":file.filename,
        "text":text[:500]

    }