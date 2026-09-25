from typing import List, Callable, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.user import UserRole, AccountStatus
from app.services.user_service import user_service
from app.utils.security import decode_access_token

security_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> Dict[str, Any]:
    """Validate JWT access token and return the current user document."""
    token = credentials.credentials
    payload = decode_access_token(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing subject identity (user_id).",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await user_service.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token does not exist.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check status
    account_status = user.get("account_status")
    if account_status == AccountStatus.INACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated.",
        )
    if account_status == AccountStatus.REJECTED.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account was rejected by an administrator.",
        )

    return user


def require_roles(*allowed_roles: UserRole) -> Callable:
    """Dependency factory that restricts endpoint access to specified roles."""
    async def role_checker(
        current_user: Dict[str, Any] = Depends(get_current_user),
    ) -> Dict[str, Any]:
        user_role = current_user.get("role")
        allowed_values = [r.value for r in allowed_roles]
        if user_role not in allowed_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires one of roles {allowed_values}. Your role is '{user_role}'.",
            )
        return current_user

    return role_checker


async def require_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Ensure user has ACTIVE account status."""
    if current_user.get("account_status") != AccountStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active account status is required to access this resource.",
        )
    return current_user


# Specific role shortcuts
require_admin = require_roles(UserRole.ADMIN)


async def require_approved_healthcare_worker(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Ensure user is a HEALTHCARE_WORKER and their account is APPROVED/ACTIVE."""
    if current_user.get("role") != UserRole.HEALTHCARE_WORKER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This resource is restricted to verified healthcare professionals.",
        )
    if current_user.get("account_status") != AccountStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Healthcare worker account is not active or awaiting administrator approval.",
        )
    return current_user


async def require_active_patient(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Ensure user has PATIENT role and is ACTIVE."""
    if current_user.get("role") != UserRole.PATIENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This resource is restricted to registered patients and families.",
        )
    if current_user.get("account_status") != AccountStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient account is not active.",
        )
    return current_user
