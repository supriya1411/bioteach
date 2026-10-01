from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional, Any
from datetime import datetime

from app.db.session import get_db
from app.models.document import AuditLog
from app.schemas.common import ApiResponse
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    user_id: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

router = APIRouter()

@router.get("", response_model=ApiResponse[List[AuditLogResponse]], summary="Query Security & Operational Audit Trail")
async def list_audit_logs(
    entity_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit)
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type.upper())

    res = await db.execute(stmt)
    logs = res.scalars().all()
    items = [AuditLogResponse.model_validate(l) for l in logs]
    return ApiResponse(success=True, data=items)
