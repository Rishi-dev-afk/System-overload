from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Achievement(models.Model):
    """Achievements and badges"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='trophy')
    category = models.CharField(
        max_length=20,
        choices=[
            ('learning', 'Learning'),
            ('streak', 'Streak'),
            ('accuracy', 'Accuracy'),
            ('speed', 'Speed'),
            ('completion', 'Completion'),
        ],
        default='learning'
    )
    xp_reward = models.PositiveIntegerField(default=50)
    criteria = models.JSONField()  # Flexible criteria definition
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'achievements'
    
    def __str__(self):
        return self.name


class UserAchievement(models.Model):
    """User's earned achievements"""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'achievement']
        db_table = 'user_achievements'


class Quest(models.Model):
    """Daily/weekly quests"""
    title = models.CharField(max_length=200)
    description = models.TextField()
    quest_type = models.CharField(
        max_length=20,
        choices=[
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
        ],
        default='daily'
    )
    xp_reward = models.PositiveIntegerField(default=25)
    criteria = models.JSONField()  # What needs to be done
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'quests'
    
    def __str__(self):
        return self.title


class UserQuest(models.Model):
    """User's quest progress"""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    quest = models.ForeignKey(Quest, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    progress = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    is_completed = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['user', 'quest']
        db_table = 'user_quests'


class PowerUp(models.Model):
    """Available power-ups"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='bolt')
    cost_xp = models.PositiveIntegerField(default=10)
    effect = models.JSONField()  # What it does
    duration = models.PositiveIntegerField(default=0)  # seconds, 0 = permanent
    cooldown = models.PositiveIntegerField(default=0)  # seconds
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'power_ups'
    
    def __str__(self):
        return self.name


class UserPowerUp(models.Model):
    """User's power-up inventory"""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    power_up = models.ForeignKey(PowerUp, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    last_used = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user', 'power_up']
        db_table = 'user_power_ups'