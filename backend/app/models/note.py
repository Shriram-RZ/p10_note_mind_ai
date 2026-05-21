from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    content_html = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    is_pinned = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    color = Column(String(20), default="#6366f1")
    word_count = Column(Integer, default=0)
    reading_time_minutes = Column(Integer, default=0)
    language = Column(String(10), default="en")
    ai_insights = Column(JSON, nullable=True)
    meta_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="notes")
    folder = relationship("Folder", back_populates="notes")
    tags = relationship("NoteTag", back_populates="note", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="note", cascade="all, delete-orphan")
    translations = relationship("Translation", back_populates="note", cascade="all, delete-orphan")
    flashcard_decks = relationship("FlashcardDeck", back_populates="note", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="note", cascade="all, delete-orphan")
    mind_maps = relationship("MindMap", back_populates="note", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="note", cascade="all, delete-orphan")
