from rest_framework import serializers
from apps.learning.models import Subject, Topic, Level, Question, UserLevelAttempt
from apps.users.models import UserSubjectProgress
from apps.gamification.models import Achievement, Quest, PowerUp


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'description', 'icon', 'color', 'order']


class TopicSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = Topic
        fields = ['id', 'subject', 'subject_name', 'name', 'description', 'order', 'difficulty']


class LevelSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    subject_name = serializers.CharField(source='topic.subject.name', read_only=True)
    
    class Meta:
        model = Level
        fields = ['id', 'topic', 'topic_name', 'subject_name', 'level_number', 'title', 
                 'description', 'xp_reward', 'time_limit', 'required_accuracy', 'is_boss_level']


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'level', 'question_type', 'question_text', 'options', 'hints', 
                 'difficulty', 'time_estimate']
        read_only_fields = ['correct_answer', 'explanation']  # Don't expose answers


class UserProgressSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    weak_topics_count = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSubjectProgress
        fields = ['id', 'subject', 'subject_name', 'current_level', 'total_xp', 
                 'accuracy_rate', 'average_time', 'weak_topics_count']
        read_only_fields = ['user']
    
    def get_weak_topics_count(self, obj):
        return obj.weak_topics.count()


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'name', 'description', 'icon', 'category', 'xp_reward']


class QuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quest
        fields = ['id', 'title', 'description', 'quest_type', 'xp_reward']


class PowerUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = PowerUp
        fields = ['id', 'name', 'description', 'icon', 'cost_xp', 'effect', 'duration', 'cooldown']


class UserLevelAttemptSerializer(serializers.ModelSerializer):
    level_title = serializers.CharField(source='level.title', read_only=True)
    questions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = UserLevelAttempt
        fields = ['id', 'level', 'level_title', 'started_at', 'completed_at', 'score', 
                 'xp_earned', 'attempts_count', 'time_taken', 'hints_used', 'is_completed', 'questions_count']
        read_only_fields = ['user', 'started_at', 'completed_at', 'score', 'xp_earned']
    
    def get_questions_count(self, obj):
        return obj.level.questions.count()