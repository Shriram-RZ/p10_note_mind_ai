from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.mind_map import MindMap
from app.utils.auth import get_current_user

router = APIRouter(prefix="/mind-maps", tags=["Mind Maps"])

@router.get("/")
async def list_mind_maps(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    maps = db.query(MindMap).filter(MindMap.user_id == current_user.id).order_by(MindMap.created_at.desc()).all()
    return [{"id": m.id, "title": m.title, "node_count": len(m.nodes) if m.nodes else 0, "created_at": m.created_at} for m in maps]

@router.get("/{map_id}")
async def get_mind_map(map_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mind_map = db.query(MindMap).filter(MindMap.id == map_id, MindMap.user_id == current_user.id).first()
    if not mind_map:
        raise HTTPException(status_code=404, detail="Mind map not found")
    return {"id": mind_map.id, "title": mind_map.title, "description": mind_map.description, "nodes": mind_map.nodes or [], "edges": mind_map.edges or [], "layout": mind_map.layout, "created_at": mind_map.created_at}

@router.delete("/{map_id}")
async def delete_mind_map(map_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mind_map = db.query(MindMap).filter(MindMap.id == map_id, MindMap.user_id == current_user.id).first()
    if not mind_map:
        raise HTTPException(status_code=404, detail="Mind map not found")
    db.delete(mind_map)
    db.commit()
    return {"message": "Mind map deleted"}
