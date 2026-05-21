from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.utils.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/sessions")
async def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id,
        ChatSession.is_active == True
    ).order_by(ChatSession.updated_at.desc().nullslast(), ChatSession.created_at.desc()).all()

    return [
        {
            "id": s.id,
            "title": s.title,
            "context_type": s.context_type,
            "context_id": s.context_id,
            "message_count": len(s.messages),
            "created_at": s.created_at,
            "updated_at": s.updated_at
        }
        for s in sessions
    ]

@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()

    return {
        "session": {
            "id": session.id,
            "title": session.title,
            "context_type": session.context_type
        },
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at
            }
            for m in messages
        ]
    }

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}

@router.patch("/sessions/{session_id}/archive")
async def archive_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_active = False
    db.commit()
    return {"message": "Session archived"}
