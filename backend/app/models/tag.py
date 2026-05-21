from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(20), default="#6366f1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    note_tags = relationship("NoteTag", back_populates="tag", cascade="all, delete-orphan")

class NoteTag(Base):
    __tablename__ = "note_tags"

    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id"), nullable=False)
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=False)

    note = relationship("Note", back_populates="tags")
    tag = relationship("Tag", back_populates="note_tags")
