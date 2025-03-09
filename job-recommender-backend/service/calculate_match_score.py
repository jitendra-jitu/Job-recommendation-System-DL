import random
import re
from collections import defaultdict

def preprocess_skills(skills):
    return set(skill.strip().lower() for skill in skills.split('|') if skill.strip())

def calculate_match_score(input_skills, job_skills, debug=False):
    input_exact = preprocess_skills(input_skills)
    job_exact = preprocess_skills(job_skills)
    
    if not job_exact:
        return 0.0 if not debug else {"score": 0.0, "reason": "No job skills provided"}

    exact_matches = len(input_exact.intersection(job_exact))

    job_tokens = defaultdict(int)
    substr_scores = {length: defaultdict(int) for length in range(2, 10)}

    skill_rarity = defaultdict(int)
    for skill in job_exact:
        tokens = re.findall(r'\w+', skill)
        for token in tokens:
            job_tokens[token] += 1
            skill_rarity[token] += 1

    for skill in job_exact:
        for i in range(len(skill)):
            for j in range(i + 2, min(i + 10, len(skill) + 1)):
                substr = skill[i:j]
                length = len(substr)
                substr_scores[length][substr] += 1

    input_partial = input_exact - job_exact
    token_matches = 0
    length_matches = {length: 0 for length in substr_scores}

    input_skills_list = [skill.strip().lower() for skill in input_skills.split('|') if skill.strip()]
    position_weight = {skill: (1.0 - (0.1 * idx)) for idx, skill in enumerate(input_skills_list)}

    for skill in input_partial:
        tokens = re.findall(r'\w+', skill)
        for token in tokens:
            rarity_factor = 1.0 / (skill_rarity.get(token, 1))  
            token_matches += job_tokens.get(token, 0) * rarity_factor * position_weight.get(skill, 1.0)

        skill_length_bonus = 0.01 * len(skill)
        for i in range(len(skill)):
            for j in range(i + 2, min(i + 10, len(skill) + 1)):
                substr = skill[i:j]
                length = len(substr)
                if length in substr_scores:
                    length_matches[length] += substr_scores[length].get(substr, 0) * (1.0 + skill_length_bonus)

    length_weights = {
        2: 0.01, 3: 0.3, 4: 0.4, 5: 0.6, 6: 0.11, 7: 0.14, 8: 0.17, 9: 0.23
    }

    total_score = exact_matches + 0.3 * token_matches  
    for length, matches in length_matches.items():
        total_score += length_weights[length] * matches

    unmatched_skills = job_exact - input_exact
    unmatched_penalty = 0
    penalty_mapping = {
        (2, 3): -0.15,  
        (4, 5): -0.30,  
        (6, 7): -0.35,  
        (8, 10): -0.50,  
        (11, float('inf')): -0.70  
    }
    for skill in unmatched_skills:
        skill_length = len(skill)
        for (low, high), penalty in penalty_mapping.items():
            if low <= skill_length <= high:
                unmatched_penalty += penalty
                break

    raw_score = total_score / len(job_exact)

    avg_skill_length = sum(len(skill) for skill in job_exact) / len(job_exact)
    length_factor = 0.85 if avg_skill_length < 10 else (0.7 if avg_skill_length < 15 else 0.55)

    scaling_factor = random.uniform(0.65, 0.8) * length_factor  

    skill_count_factor = 1.0 - (0.02 * len(job_exact))  
    scaled_score = raw_score * scaling_factor * skill_count_factor

    scaled_score += unmatched_penalty  

    final_score = max(0.0, min(scaled_score, random.uniform(0.6, 0.8)))  

    if debug:
        breakdown = {
            "exact_matches": exact_matches,
            "token_matches": round(0.3 * token_matches, 2),
            "substring_matches": {length: round(length_weights[length] * length_matches[length], 2) for length in length_matches},
            "unmatched_penalty": round(unmatched_penalty, 2),
            "raw_score": round(raw_score, 2),
            "scaling_factor": round(scaling_factor, 2),
            "final_score": round(final_score, 2)
        }
        return breakdown
    else:
        return round(final_score, 2)
