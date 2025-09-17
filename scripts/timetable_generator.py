"""
Smart Timetable Generation Algorithm
Uses constraint satisfaction and optimization techniques to generate optimal timetables
"""

import json
import random
from typing import Dict, List, Tuple, Set, Optional
from dataclasses import dataclass
from enum import Enum
import itertools

class ConstraintType(Enum):
    HARD = "hard"
    SOFT = "soft"

@dataclass
class TimeSlot:
    id: str
    day_of_week: int  # 1=Monday, 7=Sunday
    slot_number: int
    start_time: str
    end_time: str
    is_break: bool
    shift: str

@dataclass
class Classroom:
    id: str
    name: str
    capacity: int
    type: str
    equipment: List[str]
    department_id: Optional[str]

@dataclass
class Subject:
    id: str
    name: str
    code: str
    credits: int
    classes_per_week: int
    duration_minutes: int
    requires_lab: bool
    subject_type: str
    department_id: str

@dataclass
class Faculty:
    id: str
    name: str
    department_id: str
    max_classes_per_day: int
    max_classes_per_week: int
    specializations: List[str]
    subjects: List[str]  # Subject IDs they can teach

@dataclass
class Batch:
    id: str
    name: str
    year: int
    semester: int
    student_count: int
    department_id: str
    subjects: List[str]  # Subject IDs for this batch

@dataclass
class TimetableEntry:
    time_slot_id: str
    subject_id: str
    faculty_id: str
    classroom_id: str
    batch_id: str
    class_type: str = "lecture"

@dataclass
class Constraint:
    name: str
    type: ConstraintType
    weight: int
    description: str

class TimetableGenerator:
    def __init__(self):
        self.time_slots: List[TimeSlot] = []
        self.classrooms: List[Classroom] = []
        self.subjects: List[Subject] = []
        self.faculty: List[Faculty] = []
        self.batches: List[Batch] = []
        self.constraints: List[Constraint] = []
        self.timetable: List[TimetableEntry] = []
        
    def load_data(self, data: Dict):
        """Load all data from the database"""
        # Load time slots
        self.time_slots = [
            TimeSlot(**slot) for slot in data.get('time_slots', [])
        ]
        
        # Load classrooms
        self.classrooms = [
            Classroom(**classroom) for classroom in data.get('classrooms', [])
        ]
        
        # Load subjects
        self.subjects = [
            Subject(**subject) for subject in data.get('subjects', [])
        ]
        
        # Load faculty
        self.faculty = [
            Faculty(**fac) for fac in data.get('faculty', [])
        ]
        
        # Load batches
        self.batches = [
            Batch(**batch) for batch in data.get('batches', [])
        ]
        
        # Load constraints
        self.constraints = [
            Constraint(
                name=c['name'],
                type=ConstraintType(c['type']),
                weight=c['weight'],
                description=c['description']
            ) for c in data.get('constraints', [])
        ]

    def generate_timetable(self, department_id: Optional[str] = None) -> Tuple[List[TimetableEntry], float]:
        """
        Generate optimized timetable using constraint satisfaction
        Returns: (timetable_entries, fitness_score)
        """
        print(f"[v0] Starting timetable generation for department: {department_id}")
        
        # Filter data by department if specified
        if department_id:
            self.filter_by_department(department_id)
        
        # Initialize empty timetable
        self.timetable = []
        
        # Get all required class assignments
        required_assignments = self.get_required_assignments()
        print(f"[v0] Total required assignments: {len(required_assignments)}")
        
        # Use backtracking with constraint propagation
        success = self.backtrack_schedule(required_assignments, 0)
        
        if success:
            fitness_score = self.calculate_fitness()
            print(f"[v0] Timetable generated successfully with fitness score: {fitness_score}")
            return self.timetable, fitness_score
        else:
            print("[v0] Failed to generate complete timetable")
            # Return partial solution with penalty
            return self.timetable, 0.0

    def filter_by_department(self, department_id: str):
        """Filter all data to specific department"""
        self.subjects = [s for s in self.subjects if s.department_id == department_id]
        self.faculty = [f for f in self.faculty if f.department_id == department_id]
        self.batches = [b for b in self.batches if b.department_id == department_id]
        # Keep all classrooms available (can be shared across departments)

    def get_required_assignments(self) -> List[Tuple[str, str]]:
        """Get all required (batch_id, subject_id) assignments"""
        assignments = []
        
        for batch in self.batches:
            for subject_id in batch.subjects:
                subject = next((s for s in self.subjects if s.id == subject_id), None)
                if subject:
                    # Add multiple assignments based on classes_per_week
                    for _ in range(subject.classes_per_week):
                        assignments.append((batch.id, subject_id))
        
        return assignments

    def backtrack_schedule(self, assignments: List[Tuple[str, str]], index: int) -> bool:
        """Backtracking algorithm to schedule classes"""
        if index >= len(assignments):
            return True  # All assignments scheduled
        
        batch_id, subject_id = assignments[index]
        
        # Get possible time slots for this assignment
        possible_slots = self.get_valid_time_slots(batch_id, subject_id)
        
        # Shuffle for randomization
        random.shuffle(possible_slots)
        
        for time_slot in possible_slots:
            # Try to assign this time slot
            entry = self.try_assign_slot(batch_id, subject_id, time_slot)
            
            if entry:
                self.timetable.append(entry)
                
                # Recursively try to schedule remaining assignments
                if self.backtrack_schedule(assignments, index + 1):
                    return True
                
                # Backtrack - remove this assignment
                self.timetable.remove(entry)
        
        return False  # No valid assignment found

    def get_valid_time_slots(self, batch_id: str, subject_id: str) -> List[TimeSlot]:
        """Get all valid time slots for a batch-subject combination"""
        valid_slots = []
        
        for slot in self.time_slots:
            if slot.is_break:
                continue
                
            if self.is_slot_valid(batch_id, subject_id, slot):
                valid_slots.append(slot)
        
        return valid_slots

    def is_slot_valid(self, batch_id: str, subject_id: str, slot: TimeSlot) -> bool:
        """Check if a time slot is valid for assignment"""
        # Check if batch is already scheduled at this time
        for entry in self.timetable:
            if entry.batch_id == batch_id and entry.time_slot_id == slot.id:
                return False
        
        return True

    def try_assign_slot(self, batch_id: str, subject_id: str, slot: TimeSlot) -> Optional[TimetableEntry]:
        """Try to assign a specific time slot"""
        # Find suitable faculty
        faculty_member = self.find_available_faculty(subject_id, slot)
        if not faculty_member:
            return None
        
        # Find suitable classroom
        classroom = self.find_available_classroom(batch_id, subject_id, slot)
        if not classroom:
            return None
        
        # Check faculty workload constraints
        if not self.check_faculty_workload(faculty_member.id, slot):
            return None
        
        return TimetableEntry(
            time_slot_id=slot.id,
            subject_id=subject_id,
            faculty_id=faculty_member.id,
            classroom_id=classroom.id,
            batch_id=batch_id,
            class_type="lecture"
        )

    def find_available_faculty(self, subject_id: str, slot: TimeSlot) -> Optional[Faculty]:
        """Find available faculty for subject at given time slot"""
        # Get faculty who can teach this subject
        qualified_faculty = [
            f for f in self.faculty 
            if subject_id in f.subjects
        ]
        
        # Check availability
        for faculty_member in qualified_faculty:
            # Check if faculty is already assigned at this time
            is_busy = any(
                entry.faculty_id == faculty_member.id and entry.time_slot_id == slot.id
                for entry in self.timetable
            )
            
            if not is_busy:
                return faculty_member
        
        return None

    def find_available_classroom(self, batch_id: str, subject_id: str, slot: TimeSlot) -> Optional[Classroom]:
        """Find available classroom for batch at given time slot"""
        batch = next((b for b in self.batches if b.id == batch_id), None)
        subject = next((s for s in self.subjects if s.id == subject_id), None)
        
        if not batch or not subject:
            return None
        
        # Filter classrooms by capacity and type
        suitable_classrooms = [
            c for c in self.classrooms
            if c.capacity >= batch.student_count
        ]
        
        # Prefer lab classrooms for lab subjects
        if subject.requires_lab:
            lab_classrooms = [c for c in suitable_classrooms if c.type == "laboratory"]
            if lab_classrooms:
                suitable_classrooms = lab_classrooms
        
        # Check availability
        for classroom in suitable_classrooms:
            is_occupied = any(
                entry.classroom_id == classroom.id and entry.time_slot_id == slot.id
                for entry in self.timetable
            )
            
            if not is_occupied:
                return classroom
        
        return None

    def check_faculty_workload(self, faculty_id: str, slot: TimeSlot) -> bool:
        """Check if faculty workload constraints are satisfied"""
        faculty_member = next((f for f in self.faculty if f.id == faculty_id), None)
        if not faculty_member:
            return False
        
        # Count classes for this faculty on the same day
        same_day_classes = sum(
            1 for entry in self.timetable
            if entry.faculty_id == faculty_id and 
            any(ts.day_of_week == slot.day_of_week and ts.id == entry.time_slot_id 
                for ts in self.time_slots)
        )
        
        if same_day_classes >= faculty_member.max_classes_per_day:
            return False
        
        # Count total weekly classes
        total_weekly_classes = sum(
            1 for entry in self.timetable
            if entry.faculty_id == faculty_id
        )
        
        if total_weekly_classes >= faculty_member.max_classes_per_week:
            return False
        
        return True

    def calculate_fitness(self) -> float:
        """Calculate fitness score of the current timetable"""
        total_score = 0.0
        max_possible_score = 0.0
        
        for constraint in self.constraints:
            score = self.evaluate_constraint(constraint)
            weighted_score = score * constraint.weight
            total_score += weighted_score
            max_possible_score += constraint.weight
        
        # Return normalized fitness score (0-1)
        return total_score / max_possible_score if max_possible_score > 0 else 0.0

    def evaluate_constraint(self, constraint: Constraint) -> float:
        """Evaluate a specific constraint (returns 0-1)"""
        if constraint.name == "No Faculty Double Booking":
            return self.check_no_faculty_double_booking()
        elif constraint.name == "No Classroom Double Booking":
            return self.check_no_classroom_double_booking()
        elif constraint.name == "No Batch Double Booking":
            return self.check_no_batch_double_booking()
        elif constraint.name == "Faculty Workload Limit":
            return self.check_faculty_workload_limits()
        elif constraint.name == "Classroom Capacity":
            return self.check_classroom_capacity()
        elif constraint.name == "Subject-Faculty Matching":
            return self.check_subject_faculty_matching()
        elif constraint.name == "Consecutive Classes Preference":
            return self.check_consecutive_classes()
        elif constraint.name == "Balanced Daily Schedule":
            return self.check_balanced_schedule()
        else:
            return 1.0  # Unknown constraint, assume satisfied

    def check_no_faculty_double_booking(self) -> float:
        """Check that no faculty is double-booked"""
        violations = 0
        total_checks = 0
        
        for slot in self.time_slots:
            if slot.is_break:
                continue
                
            faculty_at_slot = [
                entry.faculty_id for entry in self.timetable
                if entry.time_slot_id == slot.id
            ]
            
            total_checks += len(faculty_at_slot)
            violations += len(faculty_at_slot) - len(set(faculty_at_slot))
        
        return 1.0 - (violations / max(total_checks, 1))

    def check_no_classroom_double_booking(self) -> float:
        """Check that no classroom is double-booked"""
        violations = 0
        total_checks = 0
        
        for slot in self.time_slots:
            if slot.is_break:
                continue
                
            classrooms_at_slot = [
                entry.classroom_id for entry in self.timetable
                if entry.time_slot_id == slot.id
            ]
            
            total_checks += len(classrooms_at_slot)
            violations += len(classrooms_at_slot) - len(set(classrooms_at_slot))
        
        return 1.0 - (violations / max(total_checks, 1))

    def check_no_batch_double_booking(self) -> float:
        """Check that no batch is double-booked"""
        violations = 0
        total_checks = 0
        
        for slot in self.time_slots:
            if slot.is_break:
                continue
                
            batches_at_slot = [
                entry.batch_id for entry in self.timetable
                if entry.time_slot_id == slot.id
            ]
            
            total_checks += len(batches_at_slot)
            violations += len(batches_at_slot) - len(set(batches_at_slot))
        
        return 1.0 - (violations / max(total_checks, 1))

    def check_faculty_workload_limits(self) -> float:
        """Check faculty workload constraints"""
        violations = 0
        total_faculty = len(self.faculty)
        
        for faculty_member in self.faculty:
            # Check daily limits
            for day in range(1, 6):  # Monday to Friday
                daily_classes = sum(
                    1 for entry in self.timetable
                    if entry.faculty_id == faculty_member.id and
                    any(ts.day_of_week == day and ts.id == entry.time_slot_id 
                        for ts in self.time_slots)
                )
                
                if daily_classes > faculty_member.max_classes_per_day:
                    violations += 1
            
            # Check weekly limits
            weekly_classes = sum(
                1 for entry in self.timetable
                if entry.faculty_id == faculty_member.id
            )
            
            if weekly_classes > faculty_member.max_classes_per_week:
                violations += 1
        
        return 1.0 - (violations / max(total_faculty * 6, 1))  # 5 days + 1 weekly check

    def check_classroom_capacity(self) -> float:
        """Check classroom capacity constraints"""
        violations = 0
        total_entries = len(self.timetable)
        
        for entry in self.timetable:
            batch = next((b for b in self.batches if b.id == entry.batch_id), None)
            classroom = next((c for c in self.classrooms if c.id == entry.classroom_id), None)
            
            if batch and classroom and batch.student_count > classroom.capacity:
                violations += 1
        
        return 1.0 - (violations / max(total_entries, 1))

    def check_subject_faculty_matching(self) -> float:
        """Check that faculty are qualified for assigned subjects"""
        violations = 0
        total_entries = len(self.timetable)
        
        for entry in self.timetable:
            faculty_member = next((f for f in self.faculty if f.id == entry.faculty_id), None)
            
            if faculty_member and entry.subject_id not in faculty_member.subjects:
                violations += 1
        
        return 1.0 - (violations / max(total_entries, 1))

    def check_consecutive_classes(self) -> float:
        """Soft constraint: prefer consecutive classes for same subject"""
        consecutive_bonus = 0
        total_possible = 0
        
        # Group entries by batch and day
        for batch in self.batches:
            for day in range(1, 6):  # Monday to Friday
                day_entries = [
                    entry for entry in self.timetable
                    if entry.batch_id == batch.id and
                    any(ts.day_of_week == day and ts.id == entry.time_slot_id 
                        for ts in self.time_slots)
                ]
                
                # Sort by slot number
                day_entries.sort(key=lambda e: next(
                    ts.slot_number for ts in self.time_slots 
                    if ts.id == e.time_slot_id
                ))
                
                # Check for consecutive classes of same subject
                for i in range(len(day_entries) - 1):
                    total_possible += 1
                    if day_entries[i].subject_id == day_entries[i + 1].subject_id:
                        consecutive_bonus += 1
        
        return consecutive_bonus / max(total_possible, 1)

    def check_balanced_schedule(self) -> float:
        """Soft constraint: balanced distribution across days"""
        balance_score = 0
        
        for batch in self.batches:
            daily_counts = [0] * 5  # Monday to Friday
            
            for entry in self.timetable:
                if entry.batch_id == batch.id:
                    slot = next((ts for ts in self.time_slots if ts.id == entry.time_slot_id), None)
                    if slot and 1 <= slot.day_of_week <= 5:
                        daily_counts[slot.day_of_week - 1] += 1
            
            # Calculate variance (lower is better)
            if sum(daily_counts) > 0:
                mean_classes = sum(daily_counts) / 5
                variance = sum((count - mean_classes) ** 2 for count in daily_counts) / 5
                # Convert to score (0-1, higher is better)
                balance_score += 1.0 / (1.0 + variance)
        
        return balance_score / max(len(self.batches), 1)

    def generate_multiple_options(self, department_id: Optional[str] = None, num_options: int = 3) -> List[Tuple[List[TimetableEntry], float]]:
        """Generate multiple timetable options"""
        options = []
        
        for i in range(num_options):
            print(f"[v0] Generating timetable option {i + 1}/{num_options}")
            # Use different random seeds for variety
            random.seed(42 + i)
            
            timetable, fitness = self.generate_timetable(department_id)
            options.append((timetable.copy(), fitness))
            
            # Reset for next iteration
            self.timetable = []
        
        # Sort by fitness score (best first)
        options.sort(key=lambda x: x[1], reverse=True)
        return options

def main():
    """Test the timetable generator"""
    # Sample data for testing
    sample_data = {
        "time_slots": [
            {
                "id": "slot_1",
                "day_of_week": 1,
                "slot_number": 1,
                "start_time": "09:00",
                "end_time": "10:00",
                "is_break": False,
                "shift": "morning"
            },
            {
                "id": "slot_2",
                "day_of_week": 1,
                "slot_number": 2,
                "start_time": "10:00",
                "end_time": "11:00",
                "is_break": False,
                "shift": "morning"
            }
        ],
        "classrooms": [
            {
                "id": "room_1",
                "name": "Room 101",
                "capacity": 60,
                "type": "lecture_hall",
                "equipment": ["projector", "whiteboard"],
                "department_id": "dept_1"
            }
        ],
        "subjects": [
            {
                "id": "subj_1",
                "name": "Data Structures",
                "code": "CS201",
                "credits": 4,
                "classes_per_week": 3,
                "duration_minutes": 60,
                "requires_lab": False,
                "subject_type": "core",
                "department_id": "dept_1"
            }
        ],
        "faculty": [
            {
                "id": "fac_1",
                "name": "Dr. Smith",
                "department_id": "dept_1",
                "max_classes_per_day": 4,
                "max_classes_per_week": 20,
                "specializations": ["algorithms", "data_structures"],
                "subjects": ["subj_1"]
            }
        ],
        "batches": [
            {
                "id": "batch_1",
                "name": "CS-2023-A",
                "year": 2,
                "semester": 3,
                "student_count": 45,
                "department_id": "dept_1",
                "subjects": ["subj_1"]
            }
        ],
        "constraints": [
            {
                "name": "No Faculty Double Booking",
                "type": "hard",
                "weight": 10,
                "description": "Faculty cannot be in two places at once"
            }
        ]
    }
    
    generator = TimetableGenerator()
    generator.load_data(sample_data)
    
    options = generator.generate_multiple_options(num_options=2)
    
    for i, (timetable, fitness) in enumerate(options):
        print(f"\nOption {i + 1} (Fitness: {fitness:.2f}):")
        for entry in timetable:
            print(f"  {entry}")

if __name__ == "__main__":
    main()
