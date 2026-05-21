from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None
    folder_id: Optional[int] = None
    color: Optional[str] = "#6366f1"
    language: Optional[str] = "en"
    tag_ids: Optional[List[int]] = []

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    folder_id: Optional[int] = None
    color: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None
    is_favorite: Optional[bool] = None
    tag_ids: Optional[List[int]] = None

class TagResponse(BaseModel):
    id: int
    name: str
    color: str

    class Config:
        from_attributes = True

class NoteResponse(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    summary: Optional[str] = None
    is_pinned: bool
    is_archived: bool
    is_favorite: bool
    color: str
    word_count: int
    reading_time_minutes: int
    language: str
    folder_id: Optional[int] = None
    ai_insights: Optional[Dict[str, Any]] = None
    tags: List[TagResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NoteListResponse(BaseModel):
    notes: List[NoteResponse]
    total: int
    page: int
    per_page: int
