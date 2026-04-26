from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Subject(models.Model):
    """Learning subjects (Algorithms, OS, Cloud, etc.)"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='book')  # Icon identifier
    color = models.CharField(max_length=7, default='#007bff')  # Hex color
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order', 'name']
        db_table = 'subjects'
    
    def __str__(self):
        return self.name


class Topic(models.Model):
    """Topics within subjects"""
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    name = models.CharField(max_length=200)
    description = models.TextField()
    order = models.PositiveIntegerField(default=0)
    difficulty = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
        ],
        default='beginner'
    )
    prerequisites = models.ManyToManyField('self', blank=True, symmetrical=False)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['subject', 'order', 'name']
        unique_together = ['subject', 'name']
        db_table = 'topics'
    
    def __str__(self):
        return f"{self.subject.name} - {self.name}"


class Level(models.Model):
    """Levels within topics"""
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='levels')
    level_number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField()
    xp_reward = models.PositiveIntegerField(default=100)
    time_limit = models.PositiveIntegerField(default=300)  # seconds, 0 = no limit
    required_accuracy = models.FloatField(
        default=0.7,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    is_boss_level = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['topic', 'level_number']
        unique_together = ['topic', 'level_number']
        db_table = 'levels'
    
    def __str__(self):
        return f"{self.topic.name} - Level {self.level_number}"


class Question(models.Model):
    """Questions for levels"""
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name='questions')
    question_type = models.CharField(
        max_length=20,
        choices=[
            ('multiple_choice', 'Multiple Choice'),
            ('true_false', 'True/False'),
            ('short_answer', 'Short Answer'),
            ('code', 'Code'),
            ('diagram', 'Diagram'),
        ],
        default='multiple_choice'
    )
    question_text = models.TextField()
    explanation = models.TextField(blank=True)
    correct_answer = models.TextField()
    options = models.JSONField(blank=True, null=True)  # For multiple choice
    hints = models.JSONField(blank=True, null=True)  # Array of hints
    difficulty = models.FloatField(
        default=1.0,
        validators=[MinValueValidator(0.1), MaxValueValidator(5.0)]
    )
    time_estimate = models.PositiveIntegerField(default=60)  # seconds
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'questions'
    
    def __str__(self):
        return f"Q: {self.question_text[:50]}..."


class UserLevelAttempt(models.Model):
    """Track user's attempts on levels"""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    xp_earned = models.PositiveIntegerField(default=0)
    attempts_count = models.PositiveIntegerField(default=1)
    time_taken = models.PositiveIntegerField(default=0)  # seconds
    hints_used = models.PositiveIntegerField(default=0)
    power_ups_used = models.JSONField(blank=True, null=True)
    is_completed = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'user_level_attempts'
    
    def __str__(self):
        return f"{self.user.username} - {self.level} - {self.score}"


class UserQuestionResponse(models.Model):
    """Track individual question responses"""
    attempt = models.ForeignKey(UserLevelAttempt, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    user_answer = models.TextField()
    is_correct = models.BooleanField()
    time_taken = models.PositiveIntegerField(default=0)  # seconds
    hints_used = models.PositiveIntegerField(default=0)
    ai_feedback = models.TextField(blank=True)
    
    class Meta:
        db_table = 'user_question_responses'