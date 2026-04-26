from rest_framework import viewsets, status, serializers as drf_serializers
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


# ── Simple user serializer for the /auth/user/ endpoint ──────────────────────
class UserSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'total_xp', 'level', 'streak_days', 'preferred_difficulty']


class UserProfileView(APIView):
    """Return the authenticated user's profile — used by the frontend after login."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# ── ViewSets ─────────────────────────────────────────────────────────────────

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


# ── Learning flow views ───────────────────────────────────────────────────────

class StartLevelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        level_id = request.data.get('level_id')
        if not level_id:
            return Response({'error': 'level_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        level = get_object_or_404(Level, id=level_id)

        # Ensure user has a progress record for this subject
        UserSubjectProgress.objects.get_or_create(
            user=request.user,
            subject=level.topic.subject,
            defaults={'current_level': 1}
        )

        # Create a new attempt
        attempt = UserLevelAttempt.objects.create(
            user=request.user,
            level=level
        )

        serializer = UserLevelAttemptSerializer(attempt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SubmitAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        attempt_id = request.data.get('attempt_id')
        question_id = request.data.get('question_id')
        user_answer = request.data.get('answer')
        time_taken = request.data.get('time_taken', 0)
        hints_used = request.data.get('hints_used', 0)

        if not all([attempt_id, question_id, user_answer is not None]):
            return Response(
                {'error': 'attempt_id, question_id and answer are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        attempt = get_object_or_404(UserLevelAttempt, id=attempt_id, user=request.user)
        question = get_object_or_404(Question, id=question_id)

        # Prevent duplicate responses for the same question in the same attempt
        existing = UserQuestionResponse.objects.filter(attempt=attempt, question=question).first()
        if existing:
            return Response({
                'is_correct': existing.is_correct,
                'feedback': existing.ai_feedback,
                'xp_earned': 10 if existing.is_correct else 0
            })

        is_correct, feedback = self.evaluate_answer(question, user_answer)

        UserQuestionResponse.objects.create(
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
            'xp_earned': 10 if is_correct else 0,
            'attempt_id': attempt.id,
        })

    def evaluate_answer(self, question, user_answer):
        """Evaluate answers — simple equality for MC/TF, AI for free-text."""
        if question.question_type in ['multiple_choice', 'true_false']:
            correct = user_answer.strip().lower() == question.correct_answer.strip().lower()
            return correct, ("Correct!" if correct else f"Incorrect. The correct answer is: {question.correct_answer}")

        # Free-text — use AI
        api_key = config('OPENROUTER_API_KEY', default='')
        if not api_key:
            # Graceful fallback when no API key is configured
            return False, "AI evaluation unavailable — no API key configured."

        prompt = (
            f'Evaluate this answer for the question: "{question.question_text}"\n\n'
            f'Correct answer: {question.correct_answer}\n'
            f"User's answer: {user_answer}\n\n"
            'Is the user\'s answer correct? Provide a brief explanation.\n'
            'Respond with JSON only: {"is_correct": true/false, "feedback": "explanation"}'
        )

        try:
            response = requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {api_key}',
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
                content = response.json()['choices'][0]['message']['content']
                # Strip markdown code fences if present
                content = content.strip().lstrip('```json').lstrip('```').rstrip('```').strip()
                parsed = json.loads(content)
                return bool(parsed['is_correct']), str(parsed['feedback'])
            return False, "Evaluation service unavailable."
        except (requests.RequestException, json.JSONDecodeError, KeyError):
            return False, "Error evaluating answer."


class CompleteLevelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        attempt_id = request.data.get('attempt_id')
        if not attempt_id:
            return Response({'error': 'attempt_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        attempt = get_object_or_404(UserLevelAttempt, id=attempt_id, user=request.user)

        if attempt.is_completed:
            return Response({'error': 'Level already completed'}, status=status.HTTP_400_BAD_REQUEST)

        responses = attempt.responses.all()
        correct_count = responses.filter(is_correct=True).count()
        total_questions = responses.count()
        score = (correct_count / total_questions) if total_questions > 0 else 0.0

        attempt.completed_at = timezone.now()
        attempt.score = score
        attempt.xp_earned = int(score * attempt.level.xp_reward)
        attempt.is_completed = True
        attempt.save()

        user_progress, _ = UserSubjectProgress.objects.get_or_create(
            user=request.user,
            subject=attempt.level.topic.subject,
            defaults={'current_level': 1}
        )

        user_progress.total_xp += attempt.xp_earned
        # Running weighted average for accuracy
        if user_progress.accuracy_rate == 0.0:
            user_progress.accuracy_rate = score
        else:
            user_progress.accuracy_rate = (user_progress.accuracy_rate + score) / 2

        topic = attempt.level.topic
        if score < 0.7:
            user_progress.weak_topics.add(topic)
        else:
            # Only remove if it's actually in the set (avoids RelatedManager error)
            user_progress.weak_topics.remove(topic)

        user_progress.save()
        request.user.add_xp(attempt.xp_earned)

        return Response({
            'score': score,
            'xp_earned': attempt.xp_earned,
            'completed': True,
            'passed': score >= attempt.level.required_accuracy,
        })


# ── AI views ─────────────────────────────────────────────────────────────────

def _call_openrouter(prompt: str, max_tokens: int = 500) -> dict:
    """Shared helper to call OpenRouter. Returns {'ok': bool, 'content': str|None, 'error': str|None}."""
    api_key = config('OPENROUTER_API_KEY', default='')
    if not api_key:
        return {'ok': False, 'error': 'AI service not configured.'}

    try:
        resp = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            json={
                'model': 'anthropic/claude-3-haiku',
                'messages': [{'role': 'user', 'content': prompt}],
                'max_tokens': max_tokens
            },
            timeout=15
        )
        if resp.status_code == 200:
            return {'ok': True, 'content': resp.json()['choices'][0]['message']['content']}
        return {'ok': False, 'error': f'AI service returned {resp.status_code}'}
    except requests.RequestException as e:
        return {'ok': False, 'error': str(e)}


class AIExplainView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        topic = request.data.get('topic', '')
        concept = request.data.get('concept', '')
        level = request.data.get('level', 'intermediate')

        if not concept:
            return Response({'error': 'concept is required'}, status=status.HTTP_400_BAD_REQUEST)

        prompt = (
            f'Explain the concept "{concept}" in the context of "{topic}".\n'
            f'Provide a {level}-level explanation.\n\n'
            'Respond with JSON only (no markdown fences):\n'
            '{"simple": "...", "intermediate": "...", "technical": "...", "analogy": "..."}'
        )

        result = _call_openrouter(prompt, max_tokens=600)
        if not result['ok']:
            return Response({'error': result['error']}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            content = result['content'].strip().lstrip('```json').lstrip('```').rstrip('```').strip()
            return Response(json.loads(content))
        except json.JSONDecodeError:
            return Response({'error': 'Invalid AI response format'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIEvaluateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question = request.data.get('question', '')
        answer = request.data.get('answer', '')
        context = request.data.get('context', '')

        prompt = (
            f'Evaluate this answer:\nQuestion: {question}\nAnswer: {answer}\nContext: {context}\n\n'
            'Provide detailed feedback and suggestions for improvement.'
        )

        result = _call_openrouter(prompt, max_tokens=400)
        if not result['ok']:
            return Response({'error': result['error']}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({'feedback': result['content']})


class AIGenerateQuestionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        topic = request.data.get('topic', '')
        difficulty = request.data.get('difficulty', 'medium')
        question_type = request.data.get('type', 'multiple_choice')

        if not topic:
            return Response({'error': 'topic is required'}, status=status.HTTP_400_BAD_REQUEST)

        prompt = (
            f'Generate a {difficulty} difficulty {question_type} question about {topic}.\n\n'
            'Respond with JSON only (no markdown fences):\n'
            '{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "...", "explanation": "..."}'
        )

        result = _call_openrouter(prompt, max_tokens=500)
        if not result['ok']:
            return Response({'error': result['error']}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            content = result['content'].strip().lstrip('```json').lstrip('```').rstrip('```').strip()
            return Response(json.loads(content))
        except json.JSONDecodeError:
            return Response({'error': 'Invalid AI response format'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        user_data = {
            'username': user.username,
            'total_xp': user.total_xp,
            'level': user.level,
            'streak_days': user.streak_days,
        }

        progress = UserSubjectProgress.objects.filter(user=user).select_related('subject')
        progress_data = [
            {
                'subject': p.subject.name,
                'current_level': p.current_level,
                'total_xp': p.total_xp,
                'accuracy_rate': p.accuracy_rate,
                'weak_topics_count': p.weak_topics.count()
            }
            for p in progress
        ]

        achievements = UserAchievement.objects.filter(
            user=user
        ).select_related('achievement').order_by('-earned_at')[:5]

        achievement_data = [
            {
                'name': ua.achievement.name,
                'description': ua.achievement.description,
                'earned_at': ua.earned_at,
            }
            for ua in achievements
        ]

        quests = UserQuest.objects.filter(
            user=user, is_completed=False
        ).select_related('quest')

        quest_data = [
            {
                'title': uq.quest.title,
                'description': uq.quest.description,
                'progress': uq.progress,
            }
            for uq in quests
        ]

        return Response({
            'user': user_data,
            'progress': progress_data,
            'achievements': achievement_data,
            'quests': quest_data,
        })
