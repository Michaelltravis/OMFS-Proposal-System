"""
Common schemas used across the application
"""
from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response"""

    items: List[T]
    total: int
    page: int
    pages: int
    limit: int

    class Config:
        from_attributes = True
