from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_type = Column(String(50), default="general")
    duration_minutes = Column(Integer, default=0)
    notes_reviewed = Column(Integer, default=0)
    flashcards_reviewed = Column(Integer, default=0)
    quizzes_taken = Column(Integer, default=0)
    focus_score = Column(Integer, default=0)
    meta_data = Column(JSON, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="study_sessions")
