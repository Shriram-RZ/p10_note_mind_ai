from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.flashcard import FlashcardDeck, Flashcard
from app.utils.auth import get_current_user

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])

class FlashcardReview(BaseModel):
    card_id: int
    is_correct: bool

class FlashcardCreate(BaseModel):
    front: str
    back: str
    hint: Optional[str] = None
    difficulty: Optional[str] = "medium"

class DeckCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None

@router.get("/decks")
async def list_decks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decks = db.query(FlashcardDeck).filter(
        FlashcardDeck.user_id == current_user.id
    ).order_by(FlashcardDeck.created_at.desc()).all()

    return [
        {
            "id": d.id,
            "title": d.title,
            "description": d.description,
            "subject": d.subject,
            "total_cards": d.total_cards,
            "mastered_cards": d.mastered_cards,
            "progress": (d.mastered_cards / d.total_cards * 100) if d.total_cards > 0 else 0,
            "note_id": d.note_id,
            "created_at": d.created_at
        }
        for d in decks
    ]

@router.post("/decks", status_code=201)
async def create_deck(
    deck_data: DeckCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deck = FlashcardDeck(
        user_id=current_user.id,
        title=deck_data.title,
        description=deck_data.description,
        subject=deck_data.subject
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return {
        "id": deck.id,
        "title": deck.title,
        "description": deck.description,
        "subject": deck.subject,
        "total_cards": deck.total_cards,
        "mastered_cards": deck.mastered_cards
    }

@router.get("/decks/{deck_id}/cards")
async def get_deck_cards(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deck = db.query(FlashcardDeck).filter(
        FlashcardDeck.id == deck_id,
        FlashcardDeck.user_id == current_user.id
    ).first()

    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    cards = db.query(Flashcard).filter(Flashcard.deck_id == deck_id).all()
    return {
        "deck": {
            "id": deck.id,
            "title": deck.title,
            "subject": deck.subject,
            "total_cards": deck.total_cards,
            "mastered_cards": deck.mastered_cards
        },
        "cards": [
            {
                "id": c.id,
                "front": c.front,
                "back": c.back,
                "hint": c.hint,
                "difficulty": c.difficulty,
                "is_mastered": c.is_mastered,
                "review_count": c.review_count,
                "ease_factor": c.ease_factor
            }
            for c in cards
        ]
    }

@router.post("/decks/{deck_id}/cards", status_code=201)
async def add_card_to_deck(
    deck_id: int,
    card_data: FlashcardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deck = db.query(FlashcardDeck).filter(
        FlashcardDeck.id == deck_id,
        FlashcardDeck.user_id == current_user.id
    ).first()

    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    card = Flashcard(
        deck_id=deck.id,
        user_id=current_user.id,
        front=card_data.front,
        back=card_data.back,
        hint=card_data.hint,
        difficulty=card_data.difficulty or "medium"
    )
    db.add(card)
    deck.total_cards += 1
    db.commit()
    db.refresh(card)

    return {
        "id": card.id,
        "front": card.front,
        "back": card.back,
        "hint": card.hint,
        "difficulty": card.difficulty
    }

@router.post("/review")
async def review_card(
    review: FlashcardReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    card = db.query(Flashcard).filter(
        Flashcard.id == review.card_id,
        Flashcard.user_id == current_user.id
    ).first()

    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    card.review_count += 1
    if review.is_correct:
        card.ease_factor = min(2.5, card.ease_factor + 0.1)
        if card.review_count >= 3 and not card.is_mastered:
            card.is_mastered = True
            deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == card.deck_id).first()
            if deck:
                deck.mastered_cards += 1
    else:
        card.ease_factor = max(1.3, card.ease_factor - 0.2)
        if card.is_mastered:
            card.is_mastered = False
            deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == card.deck_id).first()
            if deck and deck.mastered_cards > 0:
                deck.mastered_cards -= 1

    db.commit()
    return {"success": True, "is_mastered": card.is_mastered, "ease_factor": card.ease_factor}

@router.delete("/decks/{deck_id}")
async def delete_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deck = db.query(FlashcardDeck).filter(
        FlashcardDeck.id == deck_id,
        FlashcardDeck.user_id == current_user.id
    ).first()

    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    db.delete(deck)
    db.commit()
    return {"message": "Deck deleted"}
