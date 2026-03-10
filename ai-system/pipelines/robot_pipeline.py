from typing import Dict
from ..agents.product_agent import normalize_robot

def run_robot_pipeline(raw: Dict) -> Dict:
    return normalize_robot(raw)
