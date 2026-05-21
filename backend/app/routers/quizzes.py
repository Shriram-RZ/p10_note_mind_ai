from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt
from app.utils.auth import get_current_user

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

class QuizSubmission(BaseModel):
    answers: Dict[str, str]
    time_taken_seconds: Optional[int] = None

@router.get("/")
async def list_quizzes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).order_by(Quiz.created_at.desc()).all()
    return [{"id": q.id, "title": q.title, "difficulty": q.difficulty, "total_questions": q.total_questions, "attempt_count": len(q.attempts), "created_at": q.created_at} for q in quizzes]

@router.get("/{quiz_id}")
async def get_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).order_by(QuizQuestion.order_index).all()
    return {"id": quiz.id, "title": quiz.title, "difficulty": quiz.difficulty, "questions": [{"id": q.id, "question": q.question_text, "type": q.question_type, "options": q.options, "points": q.points} for q in questions]}

@router.post("/{quiz_id}/submit")
async def submit_quiz(quiz_id: int, submission: QuizSubmission, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    total_points = sum(q.points for q in questions)
    earned_points = 0
    results = []
    for q in questions:
        user_answer = submission.answers.get(str(q.id), "")
        is_correct = user_answer.strip().lower() == q.correct_answer.strip().lower()
        if is_correct:
            earned_points += q.points
        results.append({"question_id": q.id, "question": q.question_text, "user_answer": user_answer, "correct_answer": q.correct_answer, "is_correct": is_correct, "explanation": q.explanation, "points": q.points if is_correct else 0})
    score = (earned_points / total_points * 100) if total_points > 0 else 0
    attempt = QuizAttempt(quiz_id=quiz_id, user_id=current_user.id, score=score, total_points=total_points, answers=submission.answers, time_taken_seconds=submission.time_taken_seconds, completed_at=datetime.utcnow())
    db.add(attempt)
    db.commit()
    return {"score": score, "earned_points": earned_points, "total_points": total_points, "results": results, "attempt_id": attempt.id}

@router.delete("/{quiz_id}")
async def delete_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted"}
