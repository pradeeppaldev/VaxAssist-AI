from fastapi import APIRouter, Depends, status
from app.api.deps import get_current_user
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
)
from app.schemas.common import APIResponse
from app.services.user_service import user_service
from app.utils.security import create_access_token

router = APIRouter()


@router.post(
    "/register",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Patient or Healthcare Worker",
)
async def register(req: UserRegisterRequest):
    """
    Public registration endpoint.
    - Allows PATIENT (status: ACTIVE) and HEALTHCARE_WORKER (status: PENDING).
    - Blocks ADMIN role creation.
    - Healthcare workers require Admin approval before login is permitted.
    """
    user_doc = await user_service.register_user(
        name=req.name,
        email=req.email,
        password=req.password,
        role=req.role,
        license_number=req.license_number,
        clinic_or_hospital=req.clinic_or_hospital,
    )

    msg = (
        "Healthcare Worker account registered successfully. Your account is pending administrator approval."
        if req.role.value == "HEALTHCARE_WORKER"
        else "Patient account registered successfully. You can now log in."
    )

    return APIResponse[UserResponse](
        success=True,
        message=msg,
        data=UserResponse(**user_doc),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User Login & JWT Generation",
)
async def login(req: UserLoginRequest):
    """
    Authenticates user with email and password.
    - Rejects invalid credentials (401).
    - Rejects inactive or rejected accounts (403).
    - Rejects pending healthcare workers (403).
    - Returns JWT Bearer token and user profile on success.
    """
    user = await user_service.authenticate(email=req.email, password=req.password)

    # Issue JWT token
    token_payload = {
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
    }
    access_token = create_access_token(data=token_payload)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user),
    )


@router.get(
    "/me",
    response_model=APIResponse[UserResponse],
    summary="Get Current Authenticated User Profile",
)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's profile and assigned role."""
    return APIResponse[UserResponse](
        success=True,
        message="Profile retrieved successfully",
        data=UserResponse(**current_user),
    )
