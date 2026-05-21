from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models.user import User
from app.models.folder import Folder
from app.utils.auth import get_current_user

router = APIRouter(prefix="/folders", tags=["Folders"])

class FolderCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#6366f1"
    icon: Optional[str] = "folder"
    parent_id: Optional[int] = None

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_pinned: Optional[bool] = None

class FolderResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    color: str
    icon: str
    parent_id: Optional[int] = None
    is_pinned: bool
    note_count: int = 0

    class Config:
        from_attributes = True

@router.post("/", response_model=FolderResponse, status_code=201)
async def create_folder(
    folder_data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = Folder(
        user_id=current_user.id,
        name=folder_data.name,
        description=folder_data.description,
        color=folder_data.color or "#6366f1",
        icon=folder_data.icon or "folder",
        parent_id=folder_data.parent_id
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)

    return FolderResponse(
        id=folder.id,
        name=folder.name,
        description=folder.description,
        color=folder.color,
        icon=folder.icon,
        parent_id=folder.parent_id,
        is_pinned=folder.is_pinned,
        note_count=len(folder.notes)
    )

@router.get("/")
async def list_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folders = db.query(Folder).filter(
        Folder.user_id == current_user.id,
        Folder.parent_id == None
    ).order_by(Folder.is_pinned.desc(), Folder.name).all()

    return [
        {
            "id": f.id,
            "name": f.name,
            "description": f.description,
            "color": f.color,
            "icon": f.icon,
            "is_pinned": f.is_pinned,
            "note_count": len(f.notes),
            "children": [
                {
                    "id": c.id,
                    "name": c.name,
                    "color": c.color,
                    "note_count": len(c.notes)
                }
                for c in f.children
            ]
        }
        for f in folders
    ]

@router.get("/{folder_id}")
async def get_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == current_user.id
    ).first()

    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    return {
        "id": folder.id,
        "name": folder.name,
        "description": folder.description,
        "color": folder.color,
        "icon": folder.icon,
        "is_pinned": folder.is_pinned,
        "parent_id": folder.parent_id,
        "note_count": len(folder.notes),
        "created_at": folder.created_at
    }

@router.put("/{folder_id}")
async def update_folder(
    folder_id: int,
    folder_data: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == current_user.id
    ).first()

    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    update_data = folder_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(folder, field, value)

    db.commit()
    db.refresh(folder)

    return {
        "id": folder.id,
        "name": folder.name,
        "description": folder.description,
        "color": folder.color,
        "icon": folder.icon,
        "is_pinned": folder.is_pinned,
        "note_count": len(folder.notes)
    }

@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == current_user.id
    ).first()

    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    db.delete(folder)
    db.commit()
    return {"message": "Folder deleted"}
