from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from database import Base

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    stage = Column(String, nullable=True)
    signal_type = Column(String)        # "hiring" / "funding" / "growth"
    signal_summary = Column(Text)       # raw signal text
    intent_score = Column(Float)        # 0-100
    score_tier = Column(String)         # hot / warm / cold
    reasoning = Column(Text) 
    recommended_approach = Column(Text, nullable=True)           # Claude's explanation
    source_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)