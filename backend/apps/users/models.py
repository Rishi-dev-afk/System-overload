from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator


class User(AbstractUser):
    """Extended User model with gamification features"""
    total_xp = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    streak_days = models.PositiveIntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)
    
    # Preferences
    preferred_difficulty = models.CharField(
        max_length=20,
        choices=[
            ('easy', 'Easy'),
            ('medium', 'Medium'),
            ('hard', 'Hard'),
        ],
        default='medium'
    )
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return self.username
    
    def add_xp(self, xp_amount):
        """Add XP and handle level ups"""
        self.total_xp += xp_amount
        # Simple leveling: 1000 XP per level
        new_level = (self.total_xp // 1000) + 1
        if new_level > self.level:
            self.level = new_level
        self.save()


class UserSubjectProgress(models.Model):
    """Track user's progress in each subject"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.ForeignKey('learning.Subject', on_delete=models.CASCADE)
    current_level = models.PositiveIntegerField(default=1)
    total_xp = models.PositiveIntegerField(default=0)
    accuracy_rate = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    average_time = models.FloatField(default=0.0)  # seconds
    completed_topics = models.ManyToManyField('learning.Topic', blank=True)
    weak_topics = models.ManyToManyField('learning.Topic', related_name='weak_for_users', blank=True)
    
    class Meta:
        unique_together = ['user', 'subject']
        db_table = 'user_subject_progress'
    
    def __str__(self):
        return f"{self.user.username} - {self.subject.name}"