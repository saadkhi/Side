from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.core.mail import send_mail
from .serializers import UserRegistrationSerializer, UserSerializer, LoginSerializer


def send_welcome_email(email, username):
    """
    Send a welcome email to the newly registered user.
    """
    send_mail(
        subject='Welcome to Our Platform 🎉',
        message=f'Hi {username},\n\nWelcome to our system!',
        from_email='airtrackeroffic@gmail.com',
        recipient_list=[email],
        fail_silently=False,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user.
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Send welcome email
        try:
            send_welcome_email(user.email, user.username)
        except Exception as e:
            print(f"Error sending email: {e}")

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Login and get JWT tokens.
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get current user profile.
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout by blacklisting the refresh token.
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)
