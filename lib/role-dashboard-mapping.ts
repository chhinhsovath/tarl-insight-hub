// Role to dashboard URL mapping
export const roleDashboardMapping: Record<string, string> = {
  'admin': '/admin',
  'director': '/director',
  'teacher': '/teacher',
  'coordinator': '/coordinator',
  'partner': '/partner',
  'collector': '/collector',
  'intern': '/intern',
  'training organizer': '/training-organizer',
  'participant': '/participant/dashboard',
};

// Get dashboard URL for a specific role
export function getDashboardUrlForRole(role: string): string {
  const normalizedRole = role.toLowerCase();
  return roleDashboardMapping[normalizedRole] || '/dashboard';
}

// Transform menu items to use role-specific dashboard
export function transformMenuItemsForRole(menuItems: any[], role: string): any[] {
  const dashboardUrl = getDashboardUrlForRole(role);
  
  return menuItems.map(item => {
    // Replace /dashboard with role-specific dashboard
    if (item.page_path === '/dashboard') {
      return {
        ...item,
        page_path: dashboardUrl,
        page_name: item.page_name || 'Dashboard'
      };
    }
    
    // Process children recursively
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: transformMenuItemsForRole(item.children, role)
      };
    }
    
    return item;
  });
}