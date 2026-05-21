from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User
from app.models.note import Note
from app.models.uploaded_file import UploadedFile
from app.models.summary import Summary
from app.models.study_session import StudySession
from app.models.flashcard import FlashcardDeck
from app.models.quiz import QuizAttempt
from app.utils.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total notes
    total_notes = db.query(Note).filter(Note.user_id == current_user.id).count()

    # Notes this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    notes_this_week = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.created_at >= week_ago
    ).count()

    # Total files
    total_files = db.query(UploadedFile).filter(UploadedFile.user_id == current_user.id).count()

    # Total summaries
    total_summaries = db.query(Summary).filter(Summary.user_id == current_user.id).count()

    # Total flashcard decks
    total_decks = db.query(FlashcardDeck).filter(FlashcardDeck.user_id == current_user.id).count()

    # Recent notes
    recent_notes = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.is_archived == False
    ).order_by(Note.updated_at.desc().nullslast(), Note.created_at.desc()).limit(5).all()

    # Recent files
    recent_files = db.query(UploadedFile).filter(
        UploadedFile.user_id == current_user.id
    ).order_by(UploadedFile.created_at.desc()).limit(5).all()

    # Study sessions this month
    month_ago = datetime.utcnow() - timedelta(days=30)
    study_sessions = db.query(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudySession.started_at >= month_ago
    ).all()

    total_study_minutes = sum(s.duration_minutes for s in study_sessions)

    return {
        "stats": {
            "total_notes": total_notes,
            "notes_this_week": notes_this_week,
            "total_files": total_files,
            "total_summaries": total_summaries,
            "total_flashcard_decks": total_decks,
            "study_streak": current_user.study_streak,
            "total_study_minutes": total_study_minutes,
        },
        "recent_notes": [
            {
                "id": n.id,
                "title": n.title,
                "color": n.color,
                "word_count": n.word_count,
                "created_at": n.created_at,
                "updated_at": n.updated_at
            }
            for n in recent_notes
        ],
        "recent_files": [
            {
                "id": f.id,
                "filename": f.original_filename,
                "file_type": f.file_type,
                "file_size": f.file_size,
                "created_at": f.created_at
            }
            for f in recent_files
        ],
        "weekly_activity": _get_weekly_activity(db, current_user.id)
    }

def _get_weekly_activity(db: Session, user_id: int):
    activity = []
    for i in range(7):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59)

        notes_count = db.query(Note).filter(
            Note.user_id == user_id,
            Note.created_at >= day_start,
            Note.created_at <= day_end
        ).count()

        activity.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "notes": notes_count,
            "day": day_start.strftime("%a")
        })

    return list(reversed(activity))
