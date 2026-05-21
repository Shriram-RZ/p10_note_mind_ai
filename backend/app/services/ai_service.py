from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.services.gemini_service import gemini_service
from app.utils.prompts import (
    SUMMARIZE_LECTURE_PROMPT, GENERATE_FLASHCARDS_PROMPT,
    GENERATE_QUIZ_PROMPT, TRANSLATE_PROMPT, GENERATE_MIND_MAP_PROMPT,
    CHAT_WITH_NOTES_PROMPT, AI_INSIGHTS_PROMPT
)
from app.models.note import Note
from app.models.summary import Summary
from app.models.translation import Translation
from app.models.flashcard import FlashcardDeck, Flashcard
from app.models.quiz import Quiz, QuizQuestion
from app.models.mind_map import MindMap
from app.models.chat import ChatSession, ChatMessage
import logging

logger = logging.getLogger(__name__)

class AIService:

    async def summarize_content(
        self,
        db: Session,
        user_id: int,
        content: str,
        note_id: Optional[int] = None,
        file_id: Optional[int] = None,
        summary_type: str = "general",
        language: str = "en"
    ) -> Dict[str, Any]:
        prompt = SUMMARIZE_LECTURE_PROMPT.format(
            content=content[:15000],
            language=language,
            summary_type=summary_type
        )

        result = await gemini_service.generate_json_content(prompt, temperature=0.3)

        summary_record = Summary(
            user_id=user_id,
            note_id=note_id,
            file_id=file_id,
            summary_text=result.get("summary", ""),
            key_points=result.get("key_points", []),
            topics=result.get("topics", []),
            action_items=result.get("action_items", []),
            summary_type=summary_type,
            language=language,
            original_text=content[:5000]
        )
        db.add(summary_record)
        db.commit()
        db.refresh(summary_record)

        return {
            "summary_id": summary_record.id,
            "summary": result.get("summary", ""),
            "key_points": result.get("key_points", []),
            "topics": result.get("topics", []),
            "action_items": result.get("action_items", []),
            "important_concepts": result.get("important_concepts", []),
            "word_count": len(result.get("summary", "").split())
        }

    async def translate_content(
        self,
        db: Session,
        user_id: int,
        text: str,
        source_language: str = "auto",
        target_language: str = "en",
        note_id: Optional[int] = None
    ) -> Dict[str, Any]:
        prompt = TRANSLATE_PROMPT.format(
            text=text[:10000],
            source_language=source_language,
            target_language=target_language
        )

        result = await gemini_service.generate_json_content(prompt, temperature=0.1)

        translation_record = Translation(
            user_id=user_id,
            note_id=note_id,
            source_language=result.get("detected_source_language", source_language),
            target_language=target_language,
            original_text=text[:5000],
            translated_text=result.get("translated_text", "")
        )
        db.add(translation_record)
        db.commit()

        return {
            "translated_text": result.get("translated_text", ""),
            "source_language": result.get("detected_source_language", source_language),
            "target_language": target_language,
            "confidence": result.get("confidence", 0.9)
        }

    async def generate_flashcards(
        self,
        db: Session,
        user_id: int,
        content: str,
        count: int = 10,
        difficulty: str = "medium",
        note_id: Optional[int] = None,
        subject: Optional[str] = None
    ) -> Dict[str, Any]:
        prompt = GENERATE_FLASHCARDS_PROMPT.format(
            content=content[:10000],
            count=count,
            difficulty=difficulty
        )

        result = await gemini_service.generate_json_content(prompt, temperature=0.4)

        deck = FlashcardDeck(
            user_id=user_id,
            note_id=note_id,
            title=result.get("title", "Generated Flashcards"),
            subject=subject,
            total_cards=len(result.get("cards", []))
        )
        db.add(deck)
        db.commit()
        db.refresh(deck)

        cards = []
        for card_data in result.get("cards", []):
            card = Flashcard(
                deck_id=deck.id,
                user_id=user_id,
                front=card_data.get("front", ""),
                back=card_data.get("back", ""),
                hint=card_data.get("hint"),
                difficulty=card_data.get("difficulty", difficulty)
            )
            db.add(card)
            cards.append(card_data)

        db.commit()

        return {
            "deck_id": deck.id,
            "title": deck.title,
            "cards": cards
        }

    async def generate_quiz(
        self,
        db: Session,
        user_id: int,
        content: str,
        question_count: int = 10,
        difficulty: str = "medium",
        question_types: List[str] = None,
        note_id: Optional[int] = None
    ) -> Dict[str, Any]:
        if question_types is None:
            question_types = ["mcq", "true_false"]

        prompt = GENERATE_QUIZ_PROMPT.format(
            content=content[:10000],
            count=question_count,
            difficulty=difficulty,
            question_types=", ".join(question_types)
        )

        result = await gemini_service.generate_json_content(prompt, temperature=0.4)

        quiz = Quiz(
            user_id=user_id,
            note_id=note_id,
            title=result.get("title", "Generated Quiz"),
            difficulty=difficulty,
            total_questions=len(result.get("questions", []))
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)

        questions = []
        for i, q_data in enumerate(result.get("questions", [])):
            question = QuizQuestion(
                quiz_id=quiz.id,
                question_text=q_data.get("question", ""),
                question_type=q_data.get("type", "mcq"),
                options=q_data.get("options", []),
                correct_answer=q_data.get("correct_answer", ""),
                explanation=q_data.get("explanation", ""),
                difficulty=q_data.get("difficulty", difficulty),
                order_index=i
            )
            db.add(question)
            questions.append(q_data)

        db.commit()

        return {
            "quiz_id": quiz.id,
            "title": quiz.title,
            "questions": questions
        }

    async def generate_mind_map(
        self,
        db: Session,
        user_id: int,
        content: str,
        depth: int = 3,
        note_id: Optional[int] = None
    ) -> Dict[str, Any]:
        prompt = GENERATE_MIND_MAP_PROMPT.format(
            content=content[:10000],
            depth=depth
        )

        result = await gemini_service.generate_json_content(prompt, temperature=0.4)

        mind_map = MindMap(
            user_id=user_id,
            note_id=note_id,
            title=result.get("title", "Mind Map"),
            nodes=result.get("nodes", []),
            edges=result.get("edges", [])
        )
        db.add(mind_map)
        db.commit()
        db.refresh(mind_map)

        return {
            "map_id": mind_map.id,
            "title": mind_map.title,
            "nodes": result.get("nodes", []),
            "edges": result.get("edges", [])
        }

    async def chat_with_notes(
        self,
        db: Session,
        user_id: int,
        message: str,
        session_id: Optional[int] = None,
        context_type: str = "general",
        context_id: Optional[int] = None
    ) -> Dict[str, Any]:
        # Get or create session
        if session_id:
            session = db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id
            ).first()
        else:
            session = None

        if not session:
            session = ChatSession(
                user_id=user_id,
                title=message[:100],
                context_type=context_type,
                context_id=context_id
            )
            db.add(session)
            db.commit()
            db.refresh(session)

        # Build context from notes
        context = ""
        if context_type == "note" and context_id:
            note = db.query(Note).filter(Note.id == context_id).first()
            if note:
                context = f"Note Title: {note.title}\n\nContent:\n{note.content or ''}"

        # Build conversation history
        recent_messages = db.query(ChatMessage).filter(
            ChatMessage.session_id == session.id
        ).order_by(ChatMessage.created_at.desc()).limit(10).all()

        history = "\n".join([
            f"{'User' if msg.role == 'user' else 'Assistant'}: {msg.content}"
            for msg in reversed(recent_messages)
        ])

        # Save user message
        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=message
        )
        db.add(user_msg)

        # Generate response
        prompt = CHAT_WITH_NOTES_PROMPT.format(
            context=context or "No specific context provided. Use general knowledge.",
            history=history or "No previous conversation.",
            question=message
        )

        response_text = await gemini_service.generate_content(prompt, temperature=0.7)

        # Save AI response
        ai_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=response_text
        )
        db.add(ai_msg)
        db.commit()
        db.refresh(ai_msg)

        return {
            "response": response_text,
            "session_id": session.id,
            "message_id": ai_msg.id
        }

    async def generate_ai_insights(
        self,
        content: str
    ) -> Dict[str, Any]:
        prompt = AI_INSIGHTS_PROMPT.format(content=content[:5000])

        try:
            result = await gemini_service.generate_json_content(prompt, temperature=0.3)
            return result
        except Exception as e:
            logger.error(f"Failed to generate insights: {e}")
            return {}

ai_service = AIService()
