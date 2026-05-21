from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note_id = Column(Integer, ForeignKey("notes.id"), nullable=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id"), nullable=True)
    title = Column(String(500), nullable=True)
    original_text = Column(Text, nullable=True)
    summary_text = Column(Text, nullable=False)
    key_points = Column(JSON, nullable=True)
    topics = Column(JSON, nullable=True)
    action_items = Column(JSON, nullable=True)
    timestamps = Column(JSON, nullable=True)
    summary_type = Column(String(50), default="general")
    confidence_score = Column(Float, nullable=True)
    language = Column(String(10), default="en")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    note = relationship("Note", back_populates="summaries")
    file = relationship("UploadedFile", back_populates="summaries")
