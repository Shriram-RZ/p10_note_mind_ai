from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import tempfile
import os
from app.database import get_db
from app.models.user import User
from app.models.note import Note
from app.schemas.ai import (
    SummarizeRequest, TranslateRequest, ChatRequest,
    FlashcardGenerateRequest, QuizGenerateRequest, MindMapGenerateRequest
)
from app.utils.auth import get_current_user
from app.services.ai_service import ai_service
from app.services.gemini_service import gemini_service
from app.services.file_service import file_service

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/summarize")
async def summarize_content(
    request: SummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = request.text or ""

    if request.note_id:
        note = db.query(Note).filter(Note.id == request.note_id, Note.user_id == current_user.id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        content = note.content or ""

    if not content.strip():
        raise HTTPException(status_code=400, detail="No content to summarize")

    result = await ai_service.summarize_content(
        db=db,
        user_id=current_user.id,
        content=content,
        note_id=request.note_id,
        file_id=request.file_id,
        summary_type=request.summary_type,
        language=request.language
    )

    return result

@router.post("/translate")
async def translate_content(
    request: TranslateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await ai_service.translate_content(
        db=db,
        user_id=current_user.id,
        text=request.text,
        source_language=request.source_language,
        target_language=request.target_language,
        note_id=request.note_id
    )
    return result

@router.post("/chat")
async def chat_with_notes(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await ai_service.chat_with_notes(
        db=db,
        user_id=current_user.id,
        message=request.message,
        session_id=request.session_id,
        context_type=request.context_type,
        context_id=request.context_id
    )
    return result

@router.post("/chat/stream")
async def stream_chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = ""
    if request.context_type == "note" and request.context_id:
        note = db.query(Note).filter(Note.id == request.context_id, Note.user_id == current_user.id).first()
        if note:
            content = note.content or ""

    from app.utils.prompts import CHAT_WITH_NOTES_PROMPT
    prompt = CHAT_WITH_NOTES_PROMPT.format(
        context=content or "No specific context.",
        history="",
        question=request.message
    )

    async def generate():
        async for chunk in gemini_service.stream_content(prompt):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/flashcards/generate")
async def generate_flashcards(
    request: FlashcardGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = request.text or ""

    if request.note_id:
        note = db.query(Note).filter(Note.id == request.note_id, Note.user_id == current_user.id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        content = note.content or ""

    if not content.strip():
        raise HTTPException(status_code=400, detail="No content provided")

    result = await ai_service.generate_flashcards(
        db=db,
        user_id=current_user.id,
        content=content,
        count=request.count,
        difficulty=request.difficulty,
        note_id=request.note_id,
        subject=request.subject
    )
    return result

@router.post("/quiz/generate")
async def generate_quiz(
    request: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = request.text or ""

    if request.note_id:
        note = db.query(Note).filter(Note.id == request.note_id, Note.user_id == current_user.id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        content = note.content or ""

    if not content.strip():
        raise HTTPException(status_code=400, detail="No content provided")

    result = await ai_service.generate_quiz(
        db=db,
        user_id=current_user.id,
        content=content,
        question_count=request.question_count,
        difficulty=request.difficulty,
        question_types=request.question_types,
        note_id=request.note_id
    )
    return result

@router.post("/mind-map/generate")
async def generate_mind_map(
    request: MindMapGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = request.text or ""

    if request.note_id:
        note = db.query(Note).filter(Note.id == request.note_id, Note.user_id == current_user.id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        content = note.content or ""

    if not content.strip():
        raise HTTPException(status_code=400, detail="No content provided")

    result = await ai_service.generate_mind_map(
        db=db,
        user_id=current_user.id,
        content=content,
        depth=request.depth,
        note_id=request.note_id
    )
    return result

@router.post("/upload-and-summarize")
async def upload_and_summarize(
    file: UploadFile = File(...),
    summary_type: str = Form(default="lecture"),
    language: str = Form(default="en"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Save file temporarily
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content_bytes = await file.read()
        tmp.write(content_bytes)
        tmp_path = tmp.name

    try:
        # Extract text
        text, error = await file_service.extract_text_from_file(tmp_path, suffix)

        if error or not text.strip():
            return {
                "error": error or "Could not extract text from file",
                "filename": file.filename
            }

        # Summarize
        result = await ai_service.summarize_content(
            db=db,
            user_id=current_user.id,
            content=text,
            summary_type=summary_type,
            language=language
        )

        result["extracted_text_preview"] = text[:500] + "..." if len(text) > 500 else text
        result["filename"] = file.filename
        return result

    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
