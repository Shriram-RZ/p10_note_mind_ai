from sqlalchemy import Column, Integer, String, Text, BigInteger, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_filename = Column(String(500), nullable=False)
    stored_filename = Column(String(500), nullable=False)
    file_url = Column(Text, nullable=True)
    file_type = Column(String(50), nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    is_processed = Column(Boolean, default=False)
    processing_status = Column(String(50), default="pending")
    extracted_text = Column(Text, nullable=True)
    transcription = Column(Text, nullable=True)
    meta_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="uploaded_files")
    summaries = relationship("Summary", back_populates="file", cascade="all, delete-orphan")
