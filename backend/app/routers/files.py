from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
import tempfile
import os
from app.database import get_db
from app.models.user import User
from app.models.uploaded_file import UploadedFile
from app.utils.auth import get_current_user
from app.services.file_service import file_service
from app.config import settings

router = APIRouter(prefix="/files", tags=["Files"])

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    process_immediately: bool = Form(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check file size
    content = await file.read()
    file_size = len(content)
    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024

    if file_size > max_size:
        raise HTTPException(status_code=413, detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB")

    # Get file info
    file_info = file_service.get_file_info(file.filename)

    # Save to temp file
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    extracted_text = ""
    transcription = ""

    try:
        if process_immediately:
            text, error = await file_service.extract_text_from_file(tmp_path, file_info["type"])
            if not error:
                if file_info["type"] in ["audio", "video"]:
                    transcription = text
                else:
                    extracted_text = text
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    # Create DB record
    db_file = UploadedFile(
        user_id=current_user.id,
        original_filename=file.filename,
        stored_filename=file.filename,
        file_type=file_info["type"],
        mime_type=file.content_type,
        file_size=file_size,
        is_processed=bool(extracted_text or transcription),
        processing_status="completed" if (extracted_text or transcription) else "pending",
        extracted_text=extracted_text,
        transcription=transcription
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return {
        "id": db_file.id,
        "filename": db_file.original_filename,
        "file_type": db_file.file_type,
        "file_size": db_file.file_size,
        "is_processed": db_file.is_processed,
        "processing_status": db_file.processing_status,
        "has_text": bool(extracted_text),
        "has_transcription": bool(transcription)
    }

@router.get("/")
async def list_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    files = db.query(UploadedFile).filter(
        UploadedFile.user_id == current_user.id
    ).order_by(UploadedFile.created_at.desc()).all()

    return [
        {
            "id": f.id,
            "filename": f.original_filename,
            "file_type": f.file_type,
            "file_size": f.file_size,
            "is_processed": f.is_processed,
            "processing_status": f.processing_status,
            "created_at": f.created_at
        }
        for f in files
    ]

@router.get("/{file_id}")
async def get_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_file = db.query(UploadedFile).filter(
        UploadedFile.id == file_id,
        UploadedFile.user_id == current_user.id
    ).first()

    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    return {
        "id": db_file.id,
        "filename": db_file.original_filename,
        "file_type": db_file.file_type,
        "file_size": db_file.file_size,
        "mime_type": db_file.mime_type,
        "is_processed": db_file.is_processed,
        "processing_status": db_file.processing_status,
        "extracted_text": db_file.extracted_text,
        "transcription": db_file.transcription,
        "file_url": db_file.file_url,
        "created_at": db_file.created_at
    }

@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_file = db.query(UploadedFile).filter(
        UploadedFile.id == file_id,
        UploadedFile.user_id == current_user.id
    ).first()

    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    db.delete(db_file)
    db.commit()
    return {"message": "File deleted"}
