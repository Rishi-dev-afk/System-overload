from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'subjects', views.SubjectViewSet)
router.register(r'topics', views.TopicViewSet)
router.register(r'levels', views.LevelViewSet)
router.register(r'questions', views.QuestionViewSet)
router.register(r'user-progress', views.UserProgressViewSet, basename='user-progress')
router.register(r'achievements', views.AchievementViewSet)
router.register(r'quests', views.QuestViewSet)
router.register(r'power-ups', views.PowerUpViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('learning/start-level/', views.StartLevelView.as_view(), name='start-level'),
    path('learning/submit-answer/', views.SubmitAnswerView.as_view(), name='submit-answer'),
    path('learning/complete-level/', views.CompleteLevelView.as_view(), name='complete-level'),
    path('ai/explain/', views.AIExplainView.as_view(), name='ai-explain'),
    path('ai/evaluate/', views.AIEvaluateView.as_view(), name='ai-evaluate'),
    path('ai/generate-question/', views.AIGenerateQuestionView.as_view(), name='ai-generate-question'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
]