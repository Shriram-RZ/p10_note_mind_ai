from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note_id = Column(Integer, ForeignKey("notes.id"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String(200), nullable=True)
    total_cards = Column(Integer, default=0)
    mastered_cards = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    note = relationship("Note", back_populates="flashcard_decks")
    cards = relationship("Flashcard", back_populates="deck", cascade="all, delete-orphan")

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("flashcard_decks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    hint = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    difficulty = Column(String(20), default="medium")
    is_mastered = Column(Boolean, default=False)
    review_count = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)
    next_review = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    deck = relationship("FlashcardDeck", back_populates="cards")
