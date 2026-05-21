from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.tag import Tag
from app.utils.auth import get_current_user

router = APIRouter(prefix="/tags", tags=["Tags"])

class TagCreate(BaseModel):
    name: str
    color: Optional[str] = "#6366f1"

class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

@router.post("/", status_code=201)
async def create_tag(
    tag_data: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check for duplicate tag name for this user
    existing = db.query(Tag).filter(
        Tag.user_id == current_user.id,
        Tag.name == tag_data.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tag with this name already exists")

    tag = Tag(user_id=current_user.id, name=tag_data.name, color=tag_data.color or "#6366f1")
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return {"id": tag.id, "name": tag.name, "color": tag.color}

@router.get("/")
async def list_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tags = db.query(Tag).filter(Tag.user_id == current_user.id).order_by(Tag.name).all()
    return [{"id": t.id, "name": t.name, "color": t.color, "created_at": t.created_at} for t in tags]

@router.put("/{tag_id}")
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == current_user.id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    update_data = tag_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tag, field, value)

    db.commit()
    db.refresh(tag)
    return {"id": tag.id, "name": tag.name, "color": tag.color}

@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == current_user.id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag)
    db.commit()
    return {"message": "Tag deleted"}
