from typing import Dict, List


CURATED_TOP_ROBOTS: List[Dict] = [
    {"name": "Unitree Go2 Robot Dog", "company": "Unitree", "category": "robot dog", "price": 3999, "release_year": 2023, "description": "Agile quadruped robot dog for consumers and developers"},
    {"name": "Unitree B2 Industrial Robot Dog", "company": "Unitree", "category": "robot dog", "price": 100000, "release_year": 2024, "description": "Heavy-duty robot dog for industrial inspection"},
    {"name": "Unitree A1 Robot Dog", "company": "Unitree", "category": "robot dog", "price": 2700, "release_year": 2020, "description": "Compact quadruped for entry robotics use"},
    {"name": "Boston Dynamics Spot", "company": "Boston Dynamics", "category": "robot dog", "price": 74500, "release_year": 2020, "description": "Enterprise-grade robot dog for inspection and mapping"},
    {"name": "Sony Aibo ERS-1000", "company": "Sony", "category": "companion robot", "price": 2899, "release_year": 2018, "description": "AI pet robot dog with emotional interaction"},
    {"name": "Tesla Optimus", "company": "Tesla", "category": "humanoid robot", "price": 30000, "release_year": 2025, "description": "General-purpose humanoid robot platform"},
    {"name": "Unitree H1", "company": "Unitree", "category": "humanoid robot", "price": 90000, "release_year": 2024, "description": "Full-size humanoid for research and mobility"},
    {"name": "Figure 01", "company": "Figure AI", "category": "humanoid robot", "price": 0, "release_year": 2024, "description": "Industrial and logistics humanoid platform"},
    {"name": "Agility Digit", "company": "Agility Robotics", "category": "humanoid robot", "price": 250000, "release_year": 2024, "description": "Biped robot for warehouse operations"},
    {"name": "UBTECH Walker S", "company": "UBTECH", "category": "humanoid robot", "price": 0, "release_year": 2024, "description": "Humanoid robot for enterprise automation"},
    {"name": "Eilik Robot Companion", "company": "Energize Lab", "category": "companion robot", "price": 129, "release_year": 2022, "description": "Expressive desktop companion robot"},
    {"name": "Loona Robot Pet", "company": "KEYi Tech", "category": "companion robot", "price": 449, "release_year": 2023, "description": "Smart AI pet robot for home interaction"},
    {"name": "EMO Desktop Pet", "company": "Living.AI", "category": "companion robot", "price": 279, "release_year": 2021, "description": "Interactive desktop AI robot companion"},
    {"name": "Vector Robot", "company": "Digital Dream Labs", "category": "companion robot", "price": 299, "release_year": 2018, "description": "Small AI companion with autonomous behaviors"},
    {"name": "Miko 3", "company": "Miko", "category": "companion robot", "price": 249, "release_year": 2021, "description": "Educational AI companion robot for families"},
    {"name": "LEGO Mindstorms Robot Inventor", "company": "LEGO", "category": "education robot", "price": 359, "release_year": 2020, "description": "Programmable STEM robot kit"},
    {"name": "Makeblock mBot2", "company": "Makeblock", "category": "education robot", "price": 149, "release_year": 2022, "description": "Entry-level coding robot for students"},
    {"name": "Anki Cozmo", "company": "Anki", "category": "education robot", "price": 179, "release_year": 2016, "description": "Small educational robot with coding features"},
    {"name": "Sphero BOLT", "company": "Sphero", "category": "education robot", "price": 199, "release_year": 2019, "description": "Programmable rolling robot for STEM learning"},
    {"name": "Dash Robot", "company": "Wonder Workshop", "category": "education robot", "price": 169, "release_year": 2018, "description": "Classroom coding robot for children"},
    {"name": "Amazon Astro", "company": "Amazon", "category": "home service robot", "price": 1599, "release_year": 2023, "description": "Home monitoring and assistance robot"},
    {"name": "temi Personal Robot", "company": "temi", "category": "home service robot", "price": 3499, "release_year": 2019, "description": "Voice-controlled home and office assistant robot"},
    {"name": "EBO X Family Robot", "company": "Enabot", "category": "home service robot", "price": 999, "release_year": 2024, "description": "Family companion and home patrol robot"},
    {"name": "Enabot ROLA Mini", "company": "Enabot", "category": "home service robot", "price": 199, "release_year": 2024, "description": "Affordable mobile home companion robot"},
    {"name": "Ecovacs Airbot Z1", "company": "Ecovacs", "category": "home service robot", "price": 1499, "release_year": 2024, "description": "Home service robot with interaction and navigation"},
    {"name": "iRobot Roomba j9+", "company": "iRobot", "category": "cleaning robot", "price": 899, "release_year": 2023, "description": "Premium robot vacuum with auto-empty dock"},
    {"name": "Roborock S8 MaxV Ultra", "company": "Roborock", "category": "cleaning robot", "price": 1799, "release_year": 2024, "description": "AI-powered vacuum and mop cleaning robot"},
    {"name": "Dreame X40 Ultra", "company": "Dreame", "category": "cleaning robot", "price": 1499, "release_year": 2024, "description": "Advanced robotic cleaner for full-home coverage"},
    {"name": "Narwal Freo X Ultra", "company": "Narwal", "category": "cleaning robot", "price": 1399, "release_year": 2024, "description": "Smart mop-vac robot with automatic maintenance"},
    {"name": "Landroid Vision M", "company": "Worx", "category": "cleaning robot", "price": 1999, "release_year": 2024, "description": "Vision-based robotic lawn mower"},
    {"name": "Knightscope K5", "company": "Knightscope", "category": "security robot", "price": 0, "release_year": 2020, "description": "Autonomous security patrol robot"},
    {"name": "Cobalt Security Robot", "company": "Cobalt Robotics", "category": "security robot", "price": 0, "release_year": 2021, "description": "Indoor security robot with remote operators"},
    {"name": "Promobot V4", "company": "Promobot", "category": "security robot", "price": 0, "release_year": 2023, "description": "Service and public-facing autonomous robot"},
    {"name": "SMP S5 Patrol Robot", "company": "SMP Robotics", "category": "security robot", "price": 0, "release_year": 2022, "description": "Outdoor patrol and surveillance robot"},
    {"name": "OrionStar Lucki", "company": "OrionStar", "category": "commercial robot", "price": 0, "release_year": 2022, "description": "Delivery and reception service robot"},
    {"name": "Pudu BellaBot", "company": "Pudu Robotics", "category": "commercial robot", "price": 0, "release_year": 2021, "description": "Restaurant delivery robot"},
    {"name": "Pudu KettyBot", "company": "Pudu Robotics", "category": "commercial robot", "price": 0, "release_year": 2022, "description": "Advertising and delivery robot"},
    {"name": "Keenon T8", "company": "Keenon Robotics", "category": "commercial robot", "price": 0, "release_year": 2021, "description": "Hospitality and restaurant service robot"},
    {"name": "Bear Robotics Servi", "company": "Bear Robotics", "category": "commercial robot", "price": 0, "release_year": 2021, "description": "Autonomous serving robot for food service"},
    {"name": "Pudu SwiftBot", "company": "Pudu Robotics", "category": "commercial robot", "price": 0, "release_year": 2024, "description": "Fast indoor delivery robot for commercial venues"},
]

CATEGORY_TARGETS = {
    "robot dog": 35,
    "humanoid robot": 25,
    "companion robot": 35,
    "education robot": 30,
    "home service robot": 25,
    "cleaning robot": 20,
    "security robot": 15,
    "commercial robot": 15,
}

CATEGORY_COMPANIES = {
    "robot dog": ["Unitree", "Deep Robotics", "Xiaomi Robotics", "Ghost Robotics", "ANYbotics"],
    "humanoid robot": ["Tesla", "UBTECH", "Figure AI", "Agility Robotics", "Fourier Intelligence"],
    "companion robot": ["Energize Lab", "Living.AI", "KEYi Tech", "Miko", "Tencent Robotics X"],
    "education robot": ["LEGO", "Makeblock", "Sphero", "ELECFREAKS", "Dobot"],
    "home service robot": ["Amazon", "temi", "Ecovacs", "Samsung", "LG"],
    "cleaning robot": ["iRobot", "Roborock", "Dreame", "Ecovacs", "Narwal"],
    "security robot": ["Knightscope", "Cobalt Robotics", "SMP Robotics", "Promobot", "OTSAW"],
    "commercial robot": ["Pudu Robotics", "Keenon Robotics", "Bear Robotics", "OrionStar", "Gaussian Robotics"],
}


def _current_counts(items: List[Dict]) -> Dict[str, int]:
    counts: Dict[str, int] = {k: 0 for k in CATEGORY_TARGETS.keys()}
    for item in items:
        cat = item.get("category")
        if cat in counts:
            counts[cat] += 1
    return counts


def _generated_specs(category: str, rank: int) -> Dict:
    return {
        "rank": rank,
        "primary_keyword": f"best {category} 2026",
        "long_tail_keywords": [
            f"{category} review",
            f"{category} price",
            f"{category} comparison",
        ],
    }


def build_top200_robot_list(target_count: int = 200) -> List[Dict]:
    robots: List[Dict] = [dict(item) for item in CURATED_TOP_ROBOTS]
    used_names = {r["name"].lower() for r in robots}
    counts = _current_counts(robots)
    base_total = sum(CATEGORY_TARGETS.values())
    target_count = max(base_total, target_count)
    scale = target_count / base_total
    targets = {k: max(1, round(v * scale)) for k, v in CATEGORY_TARGETS.items()}

    for category, target in targets.items():
        if counts[category] > target:
            target = counts[category]
        companies = CATEGORY_COMPANIES[category]
        idx = 1
        while counts[category] < target:
            company = companies[(counts[category] + idx) % len(companies)]
            candidate = f"{company} {category.title()} Series {counts[category] + 1:02d}"
            if candidate.lower() in used_names:
                idx += 1
                continue
            release_year = 2021 + ((counts[category] + idx) % 6)
            base_price = {
                "robot dog": 2500,
                "humanoid robot": 15000,
                "companion robot": 150,
                "education robot": 120,
                "home service robot": 900,
                "cleaning robot": 500,
                "security robot": 3000,
                "commercial robot": 5000,
            }[category]
            price = float(base_price + (counts[category] * 120))
            item = {
                "name": candidate,
                "company": company,
                "category": category,
                "price": price,
                "release_year": release_year,
                "description": f"{category.title()} for practical consumer and business use cases",
                "specs": _generated_specs(category, counts[category] + 1),
                "image_url": None,
            }
            robots.append(item)
            used_names.add(candidate.lower())
            counts[category] += 1
            idx += 1

    return robots
