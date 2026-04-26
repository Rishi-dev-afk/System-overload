from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Avg, Count, Q
import requests
import json
from decouple import config

from apps.learning.models import Subject, Topic, Level, Question, UserLevelAttempt, UserQuestionResponse
from apps.users.models import User, UserSubjectProgress
from apps.gamification.models import Achievement, UserAchievement, Quest, UserQuest, PowerUp, UserPowerUp
from .serializers import (
    SubjectSerializer, TopicSerializer, LevelSerializer, QuestionSerializer,
    UserProgressSerializer, AchievementSerializer, QuestSerializer, PowerUpSerializer,
    UserLevelAttemptSerializer
)


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subject.objects.filter(is_active=True)
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]


class TopicViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Topic.objects.filter(is_active=True)
    serializer_class = TopicSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        subject_id = self.request.query_params.get('subject')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        return queryset


class LevelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Level.objects.all()
    serializer_class = LevelSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        topic_id = self.request.query_params.get('topic')
        if topic_id:
            queryset = queryset.filter(topic_id=topic_id)
        return queryset


class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Question.objects.filter(is_active=True)
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        level_id = self.request.query_params.get('level')
        if level_id:
            queryset = queryset.filter(level_id=level_id)
        return queryset


class UserProgressViewSet(viewsets.ModelViewSet):
    serializer_class = UserProgressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserSubjectProgress.objects.filter(user=self.request.user)
    
    def get_object(self):
        subject_id = self.kwargs.get('pk')
        return get_object_or_404(UserSubjectProgress, user=self.request.user, subject_id=subject_id)


class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Achievement.objects.filter(is_active=True)
    serializer_class = AchievementSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def earned(self, request):
        earned = UserAchievement.objects.filter(user=request.user).select_related('achievement')
        serializer = self.get_serializer([ua.achievement for ua in earned], many=True)
        return Response(serializer.data)


class QuestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Quest.objects.filter(is_active=True)
    serializer_class = QuestSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        # Get active quests for user
        user_quests = UserQuest.objects.filter(
            user=request.user,
            is_completed=False
        ).select_related('quest')
        serializer = self.get_serializer([uq.quest for uq in user_quests], many=True)
        return Response(serializer.data)


class PowerUpViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PowerUp.objects.filter(is_active=True)
    serializer_class = PowerUpSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def inventory(self, request):
        inventory = UserPowerUp.objects.filter(user=request.user).select_related('power_up')
        data = []
        for item in inventory:
            data.append({
                'power_up': PowerUpSerializer(item.power_up).data,
                'quantity': item.quantity,
                'last_used': item.last_used
            })
        return Response(data)


class StartLevelView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        level_id = request.data.get('level_id')
        level = get_object_or_404(Level, id=level_id)
        
        # Check if user can access this level
        user_progress, created = UserSubjectProgress.objects.get_or_create(
            user=request.user,
            subject=level.topic.subject,
            defaults={'current_level': 1}
        )
        
        # Create attempt
        attempt = UserLevelAttempt.objects.create(
            user=request.user,
            level=level
        )
        
        serializer = UserLevelAttemptSerializer(attempt)
        return Response(serializer.data)


class SubmitAnswerView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        attempt_id = request.data.get('attempt_id')
        question_id = request.data.get('question_id')
        user_answer = request.data.get('answer')
        time_taken = request.data.get('time_taken', 0)
        hints_used = request.data.get('hints_used', 0)
        
        attempt = get_object_or_404(UserLevelAttempt, id=attempt_id, user=request.user)
        question = get_object_or_404(Question, id=question_id)
        
        # Evaluate answer using AI
        is_correct, feedback = self.evaluate_answer(question, user_answer)
        
        # Save response
        response = UserQuestionResponse.objects.create(
            attempt=attempt,
            question=question,
            user_answer=user_answer,
            is_correct=is_correct,
            time_taken=time_taken,
            hints_used=hints_used,
            ai_feedback=feedback
        )
        
        return Response({
            'is_correct': is_correct,
            'feedback': feedback,
            'xp_earned': 10 if is_correct else 0
        })
    
    def evaluate_answer(self, question, user_answer):
        """Use AI to evaluate free-text answers"""
        if question.question_type in ['multiple_choice', 'true_false']:
            # Simple check
            return user_answer.strip().lower() == question.correct_answer.strip().lower(), "Correct!" if user_answer.strip().lower() == question.correct_answer.strip().lower() else "Incorrect."
        
        # For free-text, use AI
        prompt = f"""
        Evaluate this answer for the question: "{question.question_text}"
        
        Correct answer: {question.correct_answer}
        User's answer: {user_answer}
        
        Is the user's answer correct? Provide a brief explanation.
        Respond with JSON: {{"is_correct": true/false, "feedback": "explanation"}}
        """
        
        try:
            response = requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {config("OPENROUTER_API_KEY")}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'anthropic/claude-3-haiku',
                    'messages': [{'role': 'user', 'content': prompt}],
                    'max_tokens': 200
                },
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                try:
                    parsed = json.loads(content)
                    return parsed['is_correct'], parsed['feedback']
                except:
                    return False, "Unable to evaluate answer."
            else:
                return False, "Evaluation service unavailable."
        except:
            return False, "Error evaluating answer."


class CompleteLevelView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        attempt_id = request.data.get('attempt_id')
        attempt = get_object_or_404(UserLevelAttempt, id=attempt_id, user=request.user)
        
        if attempt.is_completed:
            return Response({'error': 'Level already completed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate score
        responses = attempt.responses.all()
        correct_count = responses.filter(is_correct=True).count()
        total_questions = responses.count()
        score = correct_count / total_questions if total_questions > 0 else 0
        
        # Update attempt
        attempt.completed_at = timezone.now()
        attempt.score = score
        attempt.xp_earned = int(score * attempt.level.xp_reward)
        attempt.is_completed = True
        attempt.save()
        
        # Update user progress
        user_progress, created = UserSubjectProgress.objects.get_or_create(
            user=request.user,
            subject=attempt.level.topic.subject
        )
        
        user_progress.total_xp += attempt.xp_earned
        user_progress.accuracy_rate = (user_progress.accuracy_rate + score) / 2  # Simple average
        
        # Update weak topics
        if score < 0.7:
            user_progress.weak_topics.add(attempt.level.topic)
        else:
            user_progress.weak_topics.remove(attempt.level.topic)
        
        user_progress.save()
        
        # Add XP to user
        request.user.add_xp(attempt.xp_earned)
        
        return Response({
            'score': score,
            'xp_earned': attempt.xp_earned,
            'completed': True
        })


class AIExplainView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        topic = request.data.get('topic')
        concept = request.data.get('concept')
        level = request.data.get('level', 'intermediate')  # simple, intermediate, technical
        
        prompt = f"""
        Explain the concept "{concept}" in the context of "{topic}".
        Provide a {level}-level explanation.
        
        Structure your response as JSON with:
        {{
            "simple": "simple explanation",
            "intermediate": "intermediate explanation", 
            "technical": "technical explanation",
            "analogy": "real-world analogy"
        }}
        """
        
        try:
            response = requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {config("OPENROUTER_API_KEY")}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'anthropic/claude-3-haiku',
                    'messages': [{'role': 'user', 'content': prompt}],
                    'max_tokens': 500
                },
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                try:
                    return Response(json.loads(content))
                except:
                    return Response({'error': 'Invalid AI response'}, status=500)
            else:
                return Response({'error': 'AI service unavailable'}, status=503)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class AIEvaluateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        question = request.data.get('question')
        answer = request.data.get('answer')
        context = request.data.get('context', '')
        
        prompt = f"""
        Evaluate this answer:
        Question: {question}
        Answer: {answer}
        Context: {context}
        
        Provide detailed feedback and suggestions for improvement.
        """
        
        try:
            response = requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {config("OPENROUTER_API_KEY")}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'anthropic/claude-3-haiku',
                    'messages': [{'role': 'user', 'content': prompt}],
                    'max_tokens': 300
                },
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                feedback = result['choices'][0]['message']['content']
                return Response({'feedback': feedback})
            else:
                return Response({'error': 'AI service unavailable'}, status=503)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class AIGenerateQuestionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        topic = request.data.get('topic')
        difficulty = request.data.get('difficulty', 'medium')
        question_type = request.data.get('type', 'multiple_choice')
        
        prompt = f"""
        Generate a {difficulty} difficulty {question_type} question about {topic}.
        
        Respond with JSON:
        {{
            "question": "the question text",
            "options": ["A", "B", "C", "D"] (for multiple choice),
            "correct_answer": "correct answer",
            "explanation": "brief explanation"
        }}
        """
        
        try:
            response = requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {config("OPENROUTER_API_KEY")}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'anthropic/claude-3-haiku',
                    'messages': [{'role': 'user', 'content': prompt}],
                    'max_tokens': 400
                },
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                try:
                    return Response(json.loads(content))
                except:
                    return Response({'error': 'Invalid AI response'}, status=500)
            else:
                return Response({'error': 'AI service unavailable'}, status=503)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # User stats
        user_data = {
            'username': user.username,
            'total_xp': user.total_xp,
            'level': user.level,
            'streak_days': user.streak_days,
        }
        
        # Subject progress
        progress = UserSubjectProgress.objects.filter(user=user).select_related('subject')
        progress_data = []
        for p in progress:
            progress_data.append({
                'subject': p.subject.name,
                'current_level': p.current_level,
                'total_xp': p.total_xp,
                'accuracy_rate': p.accuracy_rate,
                'weak_topics_count': p.weak_topics.count()
            })
        
        # Recent achievements
        achievements = UserAchievement.objects.filter(
            user=user
        ).select_related('achievement').order_by('-earned_at')[:5]
        
        achievement_data = []
        for ua in achievements:
            achievement_data.append({
                'name': ua.achievement.name,
                'description': ua.achievement.description,
                'earned_at': ua.earned_at
            })
        
        # Active quests
        quests = UserQuest.objects.filter(
            user=user,
            is_completed=False
        ).select_related('quest')
        
        quest_data = []
        for uq in quests:
            quest_data.append({
                'title': uq.quest.title,
                'description': uq.quest.description,
                'progress': uq.progress
            })
        
        return Response({
            'user': user_data,
            'progress': progress_data,
            'achievements': achievement_data,
            'quests': quest_data
        })