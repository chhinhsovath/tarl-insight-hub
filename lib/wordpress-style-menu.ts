/**
 * WordPress-Style Menu System
 * Provides advanced menu management with conditional display, user customization,
 * and separation of access permissions from display control
 */

import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export interface MenuItem {
  id: number;
  page_name: string;
  page_path: string;
  page_title?: string;
  icon_name?: string;
  parent_page_id?: number;
  is_parent_menu: boolean;
  menu_level: number;
  sort_order: number;
  is_displayed_in_menu: boolean;
  menu_visibility: 'visible' | 'hidden' | 'conditional';
  menu_group?: string;
  menu_template?: string;
  css_classes?: string;
  menu_icon_type?: string;
  custom_icon_url?: string;
  badge_text?: string;
  badge_color?: string;
  requires_confirmation?: boolean;
  confirmation_message?: string;
  external_url?: string;
  opens_in_new_tab?: boolean;
  is_divider?: boolean;
  divider_label?: string;
  children?: MenuItem[];
  display_conditions?: DisplayCondition[];
  role_permissions?: RolePermission[];
  user_customization?: UserMenuCustomization;
}

export interface DisplayCondition {
  type: string; // 'role', 'user_count', 'feature_flag', 'time_based'
  operator: string; // 'equals', 'not_equals', 'greater_than', 'less_than', 'in', 'not_in'
  value: string;
}

export interface RolePermission {
  role: string;
  allowed: boolean;
}

export interface UserMenuCustomization {
  is_hidden: boolean;
  is_pinned: boolean;
  custom_label?: string;
  custom_order?: number;
}

export interface MenuTemplate {
  template_name: string;
  template_config: {
    showIcons: boolean;
    showBadges: boolean;
    collapsible: boolean;
    showGroupLabels: boolean;
    animation: string;
    theme: string;
    showAdvanced?: boolean;
  };
}

export class WordPressStyleMenuService {
  /**
   * Get full menu structure with WordPress-style features
   */
  static async getMenuStructure(userId: number, userRole: string): Promise<MenuItem[]> {
    try {
      // Get all menu items with their permissions and conditions
      const query = `
        SELECT 
          p.id,
          p.page_name,
          p.page_path,
          p.page_title,
          p.icon_name,
          p.parent_page_id,
          p.is_parent_menu,
          p.menu_level,
          p.sort_order,
          p.is_displayed_in_menu,
          p.menu_visibility,
          p.menu_group,
          p.menu_template,
          p.css_classes,
          p.menu_icon_type,
          p.custom_icon_url,
          p.badge_text,
          p.badge_color,
          p.requires_confirmation,
          p.confirmation_message,
          p.external_url,
          p.opens_in_new_tab,
          p.is_divider,
          p.divider_label,
          -- User customizations
          umc.is_hidden as user_is_hidden,
          umc.is_pinned as user_is_pinned,
          umc.custom_label as user_custom_label,
          umc.custom_order as user_custom_order,
          -- Role permission for this user
          rpp.is_allowed as has_access
        FROM page_permissions p
        LEFT JOIN user_menu_customizations umc ON p.id = umc.page_id AND umc.user_id = $1
        LEFT JOIN role_page_permissions rpp ON p.id = rpp.page_id AND rpp.role = $2
        WHERE p.page_path IS NOT NULL AND p.page_path != ''
        ORDER BY p.menu_group, p.menu_level, 
                 COALESCE(umc.custom_order, p.sort_order), 
                 p.sort_order
      `;

      const result = await pool.query(query, [userId, userRole]);
      const allItems = result.rows as any[];

      // Get display conditions separately
      const conditionsQuery = `
        SELECT page_id, condition_type, condition_operator, condition_value
        FROM menu_display_conditions 
        WHERE is_active = true AND page_id = ANY($1)
      `;
      
      const pageIds = allItems.map(item => item.id);
      const conditionsResult = await pool.query(conditionsQuery, [pageIds]);
      const conditions = conditionsResult.rows;

      // Build menu items with all data
      const menuItems: MenuItem[] = allItems.map(item => ({
        id: item.id,
        page_name: item.page_name,
        page_path: item.page_path,
        page_title: item.page_title,
        icon_name: item.icon_name,
        parent_page_id: item.parent_page_id,
        is_parent_menu: item.is_parent_menu,
        menu_level: item.menu_level,
        sort_order: item.sort_order,
        is_displayed_in_menu: item.is_displayed_in_menu,
        menu_visibility: item.menu_visibility,
        menu_group: item.menu_group,
        menu_template: item.menu_template,
        css_classes: item.css_classes,
        menu_icon_type: item.menu_icon_type,
        custom_icon_url: item.custom_icon_url,
        badge_text: item.badge_text,
        badge_color: item.badge_color,
        requires_confirmation: item.requires_confirmation,
        confirmation_message: item.confirmation_message,
        external_url: item.external_url,
        opens_in_new_tab: item.opens_in_new_tab,
        is_divider: item.is_divider,
        divider_label: item.divider_label,
        display_conditions: conditions
          .filter(c => c.page_id === item.id)
          .map(c => ({
            type: c.condition_type,
            operator: c.condition_operator,
            value: c.condition_value
          })),
        role_permissions: [{
          role: userRole,
          allowed: item.has_access || false
        }],
        user_customization: item.user_is_hidden !== null ? {
          is_hidden: item.user_is_hidden,
          is_pinned: item.user_is_pinned,
          custom_label: item.user_custom_label,
          custom_order: item.user_custom_order
        } : undefined,
        children: []
      }));

      // Filter items based on display conditions and user customizations
      const visibleItems = menuItems.filter(item => 
        this.shouldShowMenuItem(item, userId, userRole)
      );

      // Build hierarchical structure
      return this.buildHierarchy(visibleItems);

    } catch (error) {
      console.error('Error getting menu structure:', error);
      return [];
    }
  }

  /**
   * Check if a menu item should be displayed based on WordPress-style rules
   */
  private static shouldShowMenuItem(item: MenuItem, userId: number, userRole: string): boolean {
    // If user has explicitly hidden this item
    if (item.user_customization?.is_hidden) {
      return false;
    }

    // If item is set to not display in menu
    if (!item.is_displayed_in_menu) {
      return false;
    }

    // If item visibility is hidden
    if (item.menu_visibility === 'hidden') {
      return false;
    }

    // Check conditional display rules
    if (item.menu_visibility === 'conditional' && item.display_conditions) {
      return this.evaluateDisplayConditions(item.display_conditions, userId, userRole);
    }

    return true;
  }

  /**
   * Evaluate display conditions (WordPress-style conditional logic)
   */
  private static evaluateDisplayConditions(conditions: DisplayCondition[], userId: number, userRole: string): boolean {
    for (const condition of conditions) {
      switch (condition.type) {
        case 'role':
          const allowedRoles = JSON.parse(condition.value);
          if (condition.operator === 'in') {
            if (!allowedRoles.includes(userRole)) return false;
          } else if (condition.operator === 'not_in') {
            if (allowedRoles.includes(userRole)) return false;
          }
          break;

        case 'user_count':
          // Example: only show if user has created items
          // Implementation would depend on specific logic
          break;

        case 'feature_flag':
          // Example: only show if feature is enabled
          // Implementation would check feature flags
          break;

        case 'time_based':
          // Example: only show during certain hours/days
          // Implementation would check current time
          break;
      }
    }
    return true;
  }

  /**
   * Build hierarchical menu structure
   */
  private static buildHierarchy(items: MenuItem[]): MenuItem[] {
    const itemMap = new Map<number, MenuItem>();
    const rootItems: MenuItem[] = [];

    // First pass: create map of all items
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build hierarchy
    items.forEach(item => {
      const menuItem = itemMap.get(item.id)!;
      
      if (item.parent_page_id && itemMap.has(item.parent_page_id)) {
        const parent = itemMap.get(item.parent_page_id)!;
        parent.children!.push(menuItem);
      } else {
        rootItems.push(menuItem);
      }
    });

    return rootItems;
  }

  /**
   * Check if user has access to a page (separate from display)
   */
  static async hasPageAccess(userId: number, userRole: string, pagePath: string): Promise<boolean> {
    try {
      const query = `
        SELECT rpp.is_allowed
        FROM page_permissions p
        LEFT JOIN role_page_permissions rpp ON p.id = rpp.page_id AND rpp.role = $1
        WHERE p.page_path = $2
      `;
      
      const result = await pool.query(query, [userRole, pagePath]);
      
      if (result.rows.length === 0) {
        // If no explicit permission found, default based on role
        return ['admin', 'director'].includes(userRole);
      }
      
      return result.rows[0].is_allowed || false;
    } catch (error) {
      console.error('Error checking page access:', error);
      return false;
    }
  }

  /**
   * Save user menu customization
   */
  static async saveUserMenuCustomization(
    userId: number, 
    pageId: number, 
    customization: Partial<UserMenuCustomization>
  ): Promise<boolean> {
    try {
      const query = `
        INSERT INTO user_menu_customizations (
          user_id, page_id, is_hidden, is_pinned, custom_label, custom_order
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, page_id) 
        DO UPDATE SET 
          is_hidden = COALESCE($3, user_menu_customizations.is_hidden),
          is_pinned = COALESCE($4, user_menu_customizations.is_pinned),
          custom_label = COALESCE($5, user_menu_customizations.custom_label),
          custom_order = COALESCE($6, user_menu_customizations.custom_order),
          updated_at = CURRENT_TIMESTAMP
      `;

      await pool.query(query, [
        userId,
        pageId,
        customization.is_hidden,
        customization.is_pinned,
        customization.custom_label,
        customization.custom_order
      ]);

      return true;
    } catch (error) {
      console.error('Error saving user menu customization:', error);
      return false;
    }
  }

  /**
   * Get menu template configuration
   */
  static async getMenuTemplate(templateName: string = 'default'): Promise<MenuTemplate | null> {
    try {
      const query = `
        SELECT template_name, template_config
        FROM menu_templates 
        WHERE template_name = $1 AND is_active = true
      `;
      
      const result = await pool.query(query, [templateName]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return {
        template_name: result.rows[0].template_name,
        template_config: result.rows[0].template_config
      };
    } catch (error) {
      console.error('Error getting menu template:', error);
      return null;
    }
  }

  /**
   * Get grouped menu structure (WordPress-style menu locations)
   */
  static async getGroupedMenuStructure(userId: number, userRole: string): Promise<Record<string, MenuItem[]>> {
    const menuItems = await this.getMenuStructure(userId, userRole);
    const grouped: Record<string, MenuItem[]> = {};

    menuItems.forEach(item => {
      const group = item.menu_group || 'other';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(item);
    });

    return grouped;
  }
}