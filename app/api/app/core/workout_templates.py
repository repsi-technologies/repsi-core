"""
Default workout templates for REPSI workspaces.

Provides curated, ready-to-assign programs:
1. Beginner Full-Body Foundation (3-day split)
2. Intermediate Upper / Lower Strength Split (4-day split)
3. Chest Hypertrophy & Sculpt Blast (targeted chest with grouped supersets and directional cues)
"""
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.exercise_seed import slugify
from app.models.fitness import Exercise, GLOBAL_SCOPE, WorkoutDay, WorkoutItem, WorkoutProgram, WorkoutProgramVersion


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


DEFAULT_WORKOUT_TEMPLATES = [
    {
        "key": "beginner_full_body",
        "name": "Beginner Full-Body Foundation",
        "description": "A 3-day foundation split designed for beginners to build movement competency, core stability, and total-body functional strength.",
        "objective": "general_fitness",
        "difficulty": "beginner",
        "duration_weeks": 4,
        "badge": "Beginner 3-Day",
        "days": [
            {
                "name": "Day 1: Full Body A - Squat & Push Foundation",
                "notes": "Focus on smooth movement patterns and controlled breathing.",
                "items": [
                    {
                        "exercise_name": "Cat-Cow",
                        "section": "warmup",
                        "sets": 2,
                        "reps_min": 10,
                        "reps_max": 10,
                        "rest_seconds": 30,
                        "tempo": "2-1-2",
                        "notes": "Mobilize thoracic spine and pelvis gently with breath.",
                    },
                    {
                        "exercise_name": "Goblet Squat",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 60,
                        "tempo": "2-0-1",
                        "notes": "Keep chest proud, elbows inside knees, pause 1s at bottom.",
                    },
                    {
                        "exercise_name": "Push-Up",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 8,
                        "reps_max": 10,
                        "rest_seconds": 60,
                        "notes": "Keep a rigid plank line. Elevate hands on a bench if needed.",
                    },
                    {
                        "exercise_name": "Lat Pulldown",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 60,
                        "notes": "Pull bar to upper chest, retract and depress shoulder blades.",
                    },
                    {
                        "exercise_name": "Plank",
                        "section": "cooldown",
                        "sets": 3,
                        "duration_seconds": 30,
                        "rest_seconds": 45,
                        "notes": "Squeeze glutes and brace core. Do not let hips sag.",
                    },
                ],
            },
            {
                "name": "Day 2: Full Body B - Hinge & Row Foundation",
                "notes": "Focus on posterior chain awareness and shoulder stability.",
                "items": [
                    {
                        "exercise_name": "World's Greatest Stretch",
                        "section": "warmup",
                        "sets": 2,
                        "reps_min": 8,
                        "reps_max": 8,
                        "rest_seconds": 30,
                        "notes": "Dynamic hip opener and thoracic extension.",
                    },
                    {
                        "exercise_name": "Romanian Deadlift",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 60,
                        "tempo": "2-1-1",
                        "notes": "Hinge at hips, soft knees, feel stretch in hamstrings with flat back.",
                    },
                    {
                        "exercise_name": "Seated Cable Row",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 60,
                        "notes": "Sit upright, drive elbows back into ribs, squeeze shoulder blades.",
                    },
                    {
                        "exercise_name": "Dumbbell Lateral Raise",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 12,
                        "reps_max": 15,
                        "rest_seconds": 45,
                        "notes": "Slight bend in elbows, raise smoothly to shoulder height.",
                    },
                    {
                        "exercise_name": "Dead Bug",
                        "section": "cooldown",
                        "sets": 3,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 45,
                        "notes": "Lower back firmly pressed against floor throughout.",
                    },
                ],
            },
            {
                "name": "Day 3: Full Body C - Legs & Arms Conditioning",
                "notes": "Finish the training week with endurance and accessory movements.",
                "items": [
                    {
                        "exercise_name": "Treadmill Run",
                        "section": "warmup",
                        "sets": 1,
                        "duration_seconds": 300,
                        "rest_seconds": 60,
                        "notes": "5-minute progressive brisk walk/jog to elevate core temperature.",
                    },
                    {
                        "exercise_name": "Leg Press",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 60,
                        "notes": "Full depth without lumbar lifting from seat pad.",
                    },
                    {
                        "exercise_name": "Barbell Biceps Curl",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 45,
                        "notes": "Keep elbows fixed at sides; eliminate torso swing.",
                    },
                    {
                        "exercise_name": "Bench Dip",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 45,
                        "notes": "Lower until upper arms are parallel to floor; press back up.",
                    },
                    {
                        "exercise_name": "Standing Calf Raise",
                        "section": "cooldown",
                        "sets": 3,
                        "reps_min": 12,
                        "reps_max": 15,
                        "rest_seconds": 30,
                        "notes": "Hold top peak contraction for 1 full second.",
                    },
                ],
            },
        ],
    },
    {
        "key": "intermediate_upper_lower",
        "name": "Intermediate Upper / Lower Strength Split",
        "description": "An 8-week progressive overload split balancing multi-joint compound strength lifts with hypertrophy accessory volume.",
        "objective": "strength",
        "difficulty": "intermediate",
        "duration_weeks": 8,
        "badge": "Intermediate 4-Day",
        "days": [
            {
                "name": "Day 1: Upper Body Power",
                "notes": "Heavy compound pressing and pulling for upper body strength.",
                "items": [
                    {
                        "exercise_name": "World's Greatest Stretch",
                        "section": "warmup",
                        "sets": 2,
                        "reps_min": 8,
                        "reps_max": 8,
                        "rest_seconds": 30,
                    },
                    {
                        "exercise_name": "Barbell Bench Press",
                        "section": "main",
                        "sets": 4,
                        "reps_min": 6,
                        "reps_max": 8,
                        "rest_seconds": 90,
                        "tempo": "2-0-1",
                        "notes": "Retract scapulae, tight leg drive, lower to mid-chest under control.",
                    },
                    {
                        "exercise_name": "Bent-Over Barbell Row",
                        "section": "main",
                        "sets": 4,
                        "reps_min": 6,
                        "reps_max": 8,
                        "rest_seconds": 75,
                        "notes": "Torso locked at 45 degrees, pull bar to lower ribcage.",
                    },
                    {
                        "exercise_name": "Overhead Press",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 8,
                        "reps_max": 8,
                        "rest_seconds": 75,
                        "notes": "Brace core, vertical bar path, finish directly overhead.",
                    },
                    {
                        "exercise_name": "Pull-Up",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 6,
                        "reps_max": 8,
                        "rest_seconds": 60,
                        "notes": "Full extension to chin over bar. Use assistance band if needed.",
                    },
                    {
                        "exercise_name": "Triceps Rope Pushdown",
                        "section": "cooldown",
                        "sets": 3,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 45,
                        "notes": "Lock out triceps with rope ends spread.",
                    },
                ],
            },
            {
                "name": "Day 2: Lower Body Power",
                "notes": "Heavy squatting and posterior chain power.",
                "items": [
                    {
                        "exercise_name": "Cat-Cow",
                        "section": "warmup",
                        "sets": 2,
                        "reps_min": 10,
                        "reps_max": 10,
                        "rest_seconds": 30,
                    },
                    {
                        "exercise_name": "Barbell Back Squat",
                        "section": "main",
                        "sets": 4,
                        "reps_min": 6,
                        "reps_max": 8,
                        "rest_seconds": 90,
                        "notes": "Break at hips and knees simultaneously, hit parallel depth.",
                    },
                    {
                        "exercise_name": "Romanian Deadlift",
                        "section": "main",
                        "sets": 4,
                        "reps_min": 8,
                        "reps_max": 8,
                        "rest_seconds": 75,
                        "notes": "Keep barbell glued to legs, drive hips through at top.",
                    },
                    {
                        "exercise_name": "Leg Press",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 10,
                        "reps_max": 10,
                        "rest_seconds": 60,
                    },
                    {
                        "exercise_name": "Hanging Knee Raise",
                        "section": "cooldown",
                        "sets": 3,
                        "reps_min": 12,
                        "reps_max": 15,
                        "rest_seconds": 45,
                        "notes": "Controlled curl of pelvis without momentum.",
                    },
                ],
            },
            {
                "name": "Day 3: Upper Body Hypertrophy",
                "notes": "Higher volume angles and isolation for muscle growth.",
                "items": [
                    {
                        "exercise_name": "Incline Dumbbell Press",
                        "section": "main",
                        "sets": 4,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 75,
                        "notes": "30-degree bench angle for clavicular upper pec emphasis.",
                    },
                    {
                        "exercise_name": "Seated Cable Row",
                        "section": "main",
                        "sets": 4,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 60,
                    },
                    {
                        "exercise_name": "Dumbbell Lateral Raise",
                        "section": "main",
                        "sets": 4,
                        "reps_min": 12,
                        "reps_max": 15,
                        "rest_seconds": 45,
                    },
                    {
                        "exercise_name": "Cable Chest Fly",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 12,
                        "reps_max": 15,
                        "rest_seconds": 45,
                        "notes": "Maintain fixed elbow bend, peak contraction squeeze.",
                    },
                    {
                        "exercise_name": "Barbell Biceps Curl",
                        "section": "cooldown",
                        "sets": 3,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 45,
                    },
                ],
            },
            {
                "name": "Day 4: Lower Body Hypertrophy",
                "notes": "Unilateral volume, glute emphasis, and core bracing.",
                "items": [
                    {
                        "exercise_name": "Conventional Deadlift",
                        "section": "main",
                        "sets": 4,
                        "reps_min": 5,
                        "reps_max": 6,
                        "rest_seconds": 90,
                        "notes": "Pull slack out of bar, drive feet through the floor.",
                    },
                    {
                        "exercise_name": "Walking Lunge",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 60,
                    },
                    {
                        "exercise_name": "Hip Thrust",
                        "section": "main",
                        "sets": 4,
                        "reps_min": 10,
                        "reps_max": 12,
                        "rest_seconds": 60,
                        "notes": "Drive through heels, squeeze glutes hard at top.",
                    },
                    {
                        "exercise_name": "Plank",
                        "section": "cooldown",
                        "sets": 3,
                        "duration_seconds": 45,
                        "rest_seconds": 45,
                    },
                ],
            },
        ],
    },
    {
        "key": "chest_hypertrophy_sculpt",
        "name": "Chest Hypertrophy & Sculpt Blast",
        "description": "Specialized chest specialization program. Combines heavy compound benching, upper-chest incline angles, and grouped superset flyes with clear directional cues.",
        "objective": "hypertrophy",
        "difficulty": "intermediate",
        "duration_weeks": 6,
        "badge": "Chest Specialized",
        "days": [
            {
                "name": "Day 1: Heavy Chest & Triceps Dominance",
                "notes": "Primary chest day: compound power into incline upper-chest work, finishing with a high-density fly/push-up superset.",
                "items": [
                    {
                        "exercise_name": "Push-Up",
                        "section": "warmup",
                        "sets": 2,
                        "reps_min": 15,
                        "reps_max": 15,
                        "rest_seconds": 45,
                        "tempo": "2-0-2",
                        "notes": "Warmup activation: engage pectorals, warm up rotator cuffs and serratus.",
                    },
                    {
                        "exercise_name": "Barbell Bench Press",
                        "section": "main",
                        "sets": 4,
                        "reps_min": 8,
                        "reps_max": 10,
                        "target_weight_kg": 60.0,
                        "rest_seconds": 90,
                        "tempo": "2-1-1",
                        "notes": "Heavy compound foundation: keep scapula retracted, plant heels firmly, lower to mid-chest with a 1s pause before pressing up.",
                    },
                    {
                        "exercise_name": "Incline Dumbbell Press",
                        "section": "main",
                        "sets": 3,
                        "reps_min": 10,
                        "reps_max": 12,
                        "target_weight_kg": 22.0,
                        "rest_seconds": 75,
                        "tempo": "2-0-1",
                        "notes": "Upper clavicular pec focus: set bench to 30°, maintain wide flare, pause at bottom stretch.",
                    },
                    {
                        "exercise_name": "Cable Chest Fly",
                        "section": "main",
                        "group_type": "superset",
                        "group_label": "A",
                        "sets": 3,
                        "reps_min": 12,
                        "reps_max": 15,
                        "rest_seconds": 0,
                        "notes": "SUPERSET A1 (Isolation): Keep constant tension, hug an imaginary tree, squeeze inner pecs hard for 1 full second at peak contraction.",
                    },
                    {
                        "exercise_name": "Push-Up",
                        "section": "main",
                        "group_type": "superset",
                        "group_label": "A",
                        "sets": 3,
                        "reps_min": 15,
                        "reps_max": 20,
                        "rest_seconds": 60,
                        "notes": "SUPERSET A2 (Burnout): Drop to floor immediately with 0s rest. Push out maximum reps until pectoral failure to maximize metabolic fatigue.",
                    },
                    {
                        "exercise_name": "Triceps Rope Pushdown",
                        "section": "cooldown",
                        "sets": 3,
                        "reps_min": 12,
                        "reps_max": 15,
                        "rest_seconds": 45,
                        "notes": "Triceps lockout finisher: pin elbows to ribs, spread rope ends at bottom.",
                    },
                    {
                        "exercise_name": "Bench Dip",
                        "section": "cooldown",
                        "sets": 3,
                        "reps_min": 12,
                        "reps_max": 12,
                        "rest_seconds": 45,
                        "notes": "Final lockout pump: stay upright and focus on triceps extension.",
                    },
                ],
            },
            {
                "name": "Day 2: Chest Accent & Volume Flush",
                "notes": "Secondary chest day: higher volume incline pressing and targeted stretch isolation paired with core stabilization.",
                "items": [
                    {
                        "exercise_name": "World's Greatest Stretch",
                        "section": "warmup",
                        "sets": 2,
                        "reps_min": 8,
                        "reps_max": 8,
                        "rest_seconds": 30,
                        "notes": "Mobilize chest, anterior delts and thoracic spine.",
                    },
                    {
                        "exercise_name": "Incline Dumbbell Press",
                        "section": "main",
                        "sets": 4,
                        "reps_min": 12,
                        "reps_max": 12,
                        "rest_seconds": 60,
                        "notes": "Focus on the squeeze and slow 2-second negative descent.",
                    },
                    {
                        "exercise_name": "Cable Chest Fly",
                        "section": "main",
                        "sets": 4,
                        "reps_min": 15,
                        "reps_max": 15,
                        "rest_seconds": 45,
                        "notes": "Deep pectoral stretch at rear, tight squeeze in front.",
                    },
                    {
                        "exercise_name": "Push-Up",
                        "section": "main",
                        "group_type": "superset",
                        "group_label": "B",
                        "sets": 3,
                        "reps_min": 15,
                        "reps_max": 15,
                        "rest_seconds": 0,
                        "notes": "SUPERSET B1: High-tempo chest push-ups with full range of motion.",
                    },
                    {
                        "exercise_name": "Plank",
                        "section": "main",
                        "group_type": "superset",
                        "group_label": "B",
                        "sets": 3,
                        "duration_seconds": 45,
                        "rest_seconds": 45,
                        "notes": "SUPERSET B2: Immediate core stability hold.",
                    },
                    {
                        "exercise_name": "Cat-Cow",
                        "section": "cooldown",
                        "sets": 2,
                        "reps_min": 10,
                        "reps_max": 10,
                        "rest_seconds": 30,
                        "notes": "Decompress spine and normalize breathing.",
                    },
                ],
            },
        ],
    },
]


def get_template_catalog() -> List[dict]:
    """Returns metadata and structure of all standard workout templates."""
    return [
        {
            "key": t["key"],
            "name": t["name"],
            "description": t["description"],
            "objective": t["objective"],
            "difficulty": t["difficulty"],
            "duration_weeks": t["duration_weeks"],
            "badge": t.get("badge"),
            "training_days": len(t["days"]),
            "exercise_count": sum(len(d["items"]) for d in t["days"]),
            "days": [
                {
                    "name": d["name"],
                    "notes": d.get("notes"),
                    "exercise_count": len(d["items"]),
                    "exercises": [
                        {
                            "name": it["exercise_name"],
                            "section": it.get("section", "main"),
                            "group_type": it.get("group_type"),
                            "group_label": it.get("group_label"),
                            "sets": it.get("sets"),
                            "reps_min": it.get("reps_min"),
                            "reps_max": it.get("reps_max"),
                            "duration_seconds": it.get("duration_seconds"),
                            "rest_seconds": it.get("rest_seconds"),
                            "target_weight_kg": it.get("target_weight_kg"),
                            "notes": it.get("notes"),
                        }
                        for it in d["items"]
                    ],
                }
                for d in t["days"]
            ],
        }
        for t in DEFAULT_WORKOUT_TEMPLATES
    ]


def instantiate_template(
    db: Session,
    workspace_id: str,
    template_data: dict,
    user_id: Optional[str] = None,
    trainer_id: Optional[str] = None,
) -> WorkoutProgram:
    """Creates a published WorkoutProgram in the given workspace from template specification."""
    # Find all exercises needed
    all_names = {it["exercise_name"] for d in template_data["days"] for it in d["items"]}
    slugs = {slugify(name): name for name in all_names}
    exercises = {
        ex.slug: ex
        for ex in db.query(Exercise).filter(
            Exercise.scope_key == GLOBAL_SCOPE,
            Exercise.slug.in_(slugs.keys()),
        ).all()
    }

    # Check if a program with this name already exists in workspace
    existing = db.query(WorkoutProgram).filter(
        WorkoutProgram.workspace_id == workspace_id,
        WorkoutProgram.name == template_data["name"],
    ).first()
    if existing and existing.status != "archived":
        return existing

    p = WorkoutProgram(
        workspace_id=workspace_id,
        name=template_data["name"],
        description=template_data["description"],
        objective=template_data.get("objective"),
        difficulty=template_data.get("difficulty", "beginner"),
        duration_weeks=template_data.get("duration_weeks"),
        status="published",
        created_by_user_id=user_id,
        created_by_trainer_id=trainer_id,
    )
    db.add(p)
    db.flush()

    v = WorkoutProgramVersion(
        workspace_id=workspace_id,
        program_id=p.id,
        version_number=1,
        status="published",
        published_at=utcnow(),
        created_by_user_id=user_id,
        change_note="Initial template installation",
    )
    db.add(v)
    db.flush()
    p.current_version_id = v.id

    for d_pos, d in enumerate(template_data["days"]):
        day = WorkoutDay(
            workspace_id=workspace_id,
            program_version_id=v.id,
            position=d_pos,
            name=d["name"],
            is_rest_day=False,
            notes=d.get("notes"),
        )
        db.add(day)
        db.flush()

        for i_pos, it in enumerate(d["items"]):
            ex_slug = slugify(it["exercise_name"])
            ex = exercises.get(ex_slug)
            if not ex:
                # Fallback: search by name
                ex = db.query(Exercise).filter(
                    Exercise.scope_key == GLOBAL_SCOPE,
                    Exercise.name == it["exercise_name"],
                ).first()
            if not ex:
                continue

            item = WorkoutItem(
                workspace_id=workspace_id,
                day_id=day.id,
                exercise_id=ex.id,
                position=i_pos,
                section=it.get("section", "main"),
                group_type=it.get("group_type"),
                group_label=it.get("group_label"),
                sets=it.get("sets"),
                reps_min=it.get("reps_min"),
                reps_max=it.get("reps_max"),
                target_weight_kg=it.get("target_weight_kg"),
                duration_seconds=it.get("duration_seconds"),
                distance_m=it.get("distance_m"),
                rest_seconds=it.get("rest_seconds", 60),
                tempo=it.get("tempo"),
                notes=it.get("notes"),
            )
            db.add(item)

    record_audit(
        db,
        workspace_id,
        user_id,
        "program.template_installed",
        resource_type="workout_program",
        resource_id=p.id,
        details={"name": p.name, "template_key": template_data.get("key")},
    )
    db.commit()
    db.refresh(p)
    return p


def seed_workspace_templates(
    db: Session,
    workspace_id: str,
    user_id: Optional[str] = None,
    trainer_id: Optional[str] = None,
) -> List[WorkoutProgram]:
    """Installs all default workout templates into a workspace."""
    installed = []
    for t in DEFAULT_WORKOUT_TEMPLATES:
        p = instantiate_template(db, workspace_id, t, user_id=user_id, trainer_id=trainer_id)
        installed.append(p)
    return installed
