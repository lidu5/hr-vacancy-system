from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Permission class: Only admins can access
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsAdminUser(permissions.BasePermission):
    """
    Permission class: Only admins can access (alias for IsAdmin)
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrRecruiter(permissions.BasePermission):
    """
    Permission class: Admins and recruiters can access
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'recruiter']
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission class: Anyone can read, only admins can write
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class CanManageVacancy(permissions.BasePermission):
    """
    Permission class for vacancy management:
    - Admins can do everything
    - Recruiters can only manage their department's vacancies
    """
    def has_permission(self, request, view):
        # Allow authenticated users to access the view
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admins have full access
        if request.user.role == 'admin':
            return True
        
        # Recruiters can only manage vacancies in their department
        if request.user.role == 'recruiter':
            # Read operations allowed for all
            if request.method in permissions.SAFE_METHODS:
                return True
            # Write operations only for same department
            return obj.department == request.user.department
        
        return False


class CanManageApplication(permissions.BasePermission):
    """
    Permission class for application management:
    - Admins can manage all applications
    - Recruiters can manage applications for their department's vacancies
    - Interviewers can view applications (read-only)
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admins have full access
        if request.user.role == 'admin':
            return True
        
        # Recruiters can manage applications for their department
        if request.user.role == 'recruiter':
            return obj.vacancy.department == request.user.department
        
        # Interviewers can view applications (read-only)
        if request.user.role == 'interviewer':
            if request.method in permissions.SAFE_METHODS:
                return True
        
        return False