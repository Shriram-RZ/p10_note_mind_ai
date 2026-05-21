from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.user import User
from app.models.note import Note
from app.models.tag import Tag, NoteTag
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteListResponse
from app.utils.auth import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(prefix="/notes", tags=["Notes"])

@router.post("/", response_model=NoteResponse, status_code=201)
async def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = note_data.content or ""
    word_count = len(content.split()) if content else 0
    reading_time = max(1, word_count // 200)

    note = Note(
        user_id=current_user.id,
        title=note_data.title,
        content=content,
        folder_id=note_data.folder_id,
        color=note_data.color or "#6366f1",
        language=note_data.language or "en",
        word_count=word_count,
        reading_time_minutes=reading_time
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    # Add tags
    if note_data.tag_ids:
        for tag_id in note_data.tag_ids:
            tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == current_user.id).first()
            if tag:
                note_tag = NoteTag(note_id=note.id, tag_id=tag_id)
                db.add(note_tag)
        db.commit()
        db.refresh(note)

    return _note_with_tags(note, db)

@router.get("/", response_model=NoteListResponse)
async def list_notes(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    folder_id: Optional[int] = None,
    is_pinned: Optional[bool] = None,
    is_archived: Optional[bool] = None,
    is_favorite: Optional[bool] = None,
    tag_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Note).filter(Note.user_id == current_user.id)

    if search:
        query = query.filter(
            Note.title.ilike(f"%{search}%") | Note.content.ilike(f"%{search}%")
        )
    if folder_id is not None:
        query = query.filter(Note.folder_id == folder_id)
    if is_pinned is not None:
        query = query.filter(Note.is_pinned == is_pinned)
    if is_archived is not None:
        query = query.filter(Note.is_archived == is_archived)
    if is_favorite is not None:
        query = query.filter(Note.is_favorite == is_favorite)

    total = query.count()
    notes = query.order_by(Note.is_pinned.desc(), Note.updated_at.desc().nullslast(), Note.created_at.desc()) \
                 .offset((page - 1) * per_page).limit(per_page).all()

    return NoteListResponse(
        notes=[_note_with_tags(n, db) for n in notes],
        total=total,
        page=page,
        per_page=per_page
    )

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return _note_with_tags(note, db)

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    update_data = note_data.model_dump(exclude_unset=True)
    tag_ids = update_data.pop("tag_ids", None)

    for field, value in update_data.items():
        setattr(note, field, value)

    if note.content:
        note.word_count = len(note.content.split())
        note.reading_time_minutes = max(1, note.word_count // 200)

    if tag_ids is not None:
        db.query(NoteTag).filter(NoteTag.note_id == note.id).delete()
        for tag_id in tag_ids:
            note_tag = NoteTag(note_id=note.id, tag_id=tag_id)
            db.add(note_tag)

    db.commit()
    db.refresh(note)
    return _note_with_tags(note, db)

@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}

@router.post("/{note_id}/generate-insights")
async def generate_insights(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if not note.content:
        raise HTTPException(status_code=400, detail="Note has no content")

    insights = await ai_service.generate_ai_insights(note.content)
    note.ai_insights = insights
    db.commit()

    return {"insights": insights}

def _note_with_tags(note: Note, db: Session) -> NoteResponse:
    tags = []
    for note_tag in note.tags:
        tag = db.query(Tag).filter(Tag.id == note_tag.tag_id).first()
        if tag:
            tags.append({"id": tag.id, "name": tag.name, "color": tag.color})

    return NoteResponse(
        id=note.id,
        title=note.title,
        content=note.content,
        summary=note.summary,
        is_pinned=note.is_pinned,
        is_archived=note.is_archived,
        is_favorite=note.is_favorite,
        color=note.color,
        word_count=note.word_count,
        reading_time_minutes=note.reading_time_minutes,
        language=note.language,
        folder_id=note.folder_id,
        ai_insights=note.ai_insights,
        tags=tags,
        created_at=note.created_at,
        updated_at=note.updated_at
    )
