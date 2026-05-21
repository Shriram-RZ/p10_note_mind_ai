from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SummarizeRequest(BaseModel):
    text: Optional[str] = None
    note_id: Optional[int] = None
    file_id: Optional[int] = None
    summary_type: str = "general"
    language: str = "en"
    max_length: Optional[int] = None

class SummarizeResponse(BaseModel):
    summary: str
    key_points: List[str]
    topics: List[str]
    action_items: List[str]
    word_count: int

class TranslateRequest(BaseModel):
    text: str
    source_language: str = "auto"
    target_language: str = "en"
    note_id: Optional[int] = None

class TranslateResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str
    confidence: float

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None
    context_type: str = "general"
    context_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    session_id: int
    message_id: int

class FlashcardGenerateRequest(BaseModel):
    text: Optional[str] = None
    note_id: Optional[int] = None
    count: int = 10
    difficulty: str = "medium"
    subject: Optional[str] = None

class FlashcardItem(BaseModel):
    front: str
    back: str
    hint: Optional[str] = None
    difficulty: str = "medium"

class FlashcardGenerateResponse(BaseModel):
    deck_id: int
    title: str
    cards: List[FlashcardItem]

class QuizGenerateRequest(BaseModel):
    text: Optional[str] = None
    note_id: Optional[int] = None
    question_count: int = 10
    difficulty: str = "medium"
    question_types: List[str] = ["mcq", "true_false"]

class QuizQuestion(BaseModel):
    question: str
    type: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    difficulty: str

class QuizGenerateResponse(BaseModel):
    quiz_id: int
    title: str
    questions: List[QuizQuestion]

class MindMapGenerateRequest(BaseModel):
    text: Optional[str] = None
    note_id: Optional[int] = None
    depth: int = 3

class MindMapNode(BaseModel):
    id: str
    label: str
    type: str = "default"
    children: Optional[List["MindMapNode"]] = []

class MindMapGenerateResponse(BaseModel):
    map_id: int
    title: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

MindMapNode.model_rebuild()
