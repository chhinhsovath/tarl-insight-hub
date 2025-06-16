import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export interface UserHierarchy {
  user_id: number;
  role: string;
  hierarchy_level: number;
  can_manage_hierarchy: boolean;
  max_hierarchy_depth: number;
  accessible_zones?: number[];
  accessible_provinces?: number[];
  accessible_districts?: number[];
  accessible_schools?: number[];
  accessible_classes?: number[];
}

export interface DataScopePermission {
  role_name: string;
  data_type: string;
  scope_level: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_export: boolean;
}

export class HierarchyPermissionManager {
  /**
   * Get user's hierarchy and accessible resources
   */
  static async getUserHierarchy(userId: number): Promise<UserHierarchy | null> {
    const client = await pool.connect();
    
    try {
      // Get user role and hierarchy info
      const userResult = await client.query(`
        SELECT 
          u.id, u.role, 
          r.hierarchy_level, r.can_manage_hierarchy, r.max_hierarchy_depth
        FROM tbl_tarl_users u
        LEFT JOIN tbl_tarl_roles r ON u.role = r.name
        WHERE u.id = $1
      `, [userId]);

      if (userResult.rows.length === 0) {
        return null;
      }

      const user = userResult.rows[0];

      // For Admin, return with global access
      if (user.role === 'admin' || user.role === 'Admin') {
        return {
          user_id: userId,
          role: user.role,
          hierarchy_level: user.hierarchy_level || 1,
          can_manage_hierarchy: true,
          max_hierarchy_depth: 999,
          accessible_zones: [],
          accessible_provinces: [],
          accessible_districts: [],
          accessible_schools: [],
          accessible_classes: []
        };
      }

      // Get accessible zones
      const zoneResult = await client.query(`
        SELECT zone_id FROM user_zone_assignments 
        WHERE user_id = $1 AND is_active = true
      `, [userId]);

      // Get accessible provinces
      const provinceResult = await client.query(`
        SELECT province_id FROM user_province_assignments 
        WHERE user_id = $1 AND is_active = true
      `, [userId]);

      // Get accessible districts
      const districtResult = await client.query(`
        SELECT district_id FROM user_district_assignments 
        WHERE user_id = $1 AND is_active = true
      `, [userId]);

      // Get accessible schools
      const schoolResult = await client.query(`
        SELECT school_id FROM user_school_assignments 
        WHERE user_id = $1 AND is_active = true
      `, [userId]);

      // Get accessible classes (for teachers)
      const classResult = await client.query(`
        SELECT class_id FROM teacher_class_assignments 
        WHERE teacher_id = $1 AND is_active = true
      `, [userId]);

      return {
        user_id: userId,
        role: user.role,
        hierarchy_level: user.hierarchy_level || 3,
        can_manage_hierarchy: user.can_manage_hierarchy || false,
        max_hierarchy_depth: user.max_hierarchy_depth || 0,
        accessible_zones: zoneResult.rows.map(r => r.zone_id),
        accessible_provinces: provinceResult.rows.map(r => r.province_id),
        accessible_districts: districtResult.rows.map(r => r.district_id),
        accessible_schools: schoolResult.rows.map(r => r.school_id),
        accessible_classes: classResult.rows.map(r => r.class_id)
      };
    } catch (error) {
      console.error('Error getting user hierarchy:', error);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Check if user can access specific data type with specific action
   */
  static async canAccessData(
    userId: number, 
    dataType: string, 
    action: 'view' | 'create' | 'update' | 'delete' | 'export',
    resourceId?: number
  ): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const hierarchy = await this.getUserHierarchy(userId);
      if (!hierarchy) return false;

      // Admin has access to everything
      if (hierarchy.role === 'admin' || hierarchy.role === 'Admin') return true;

      // Get data scope permissions for user's role
      const scopeResult = await client.query(`
        SELECT * FROM role_data_scope 
        WHERE role_name = $1 AND data_type = $2
      `, [hierarchy.role, dataType]);

      if (scopeResult.rows.length === 0) return false;

      // Check each scope level the role has access to
      for (const scope of scopeResult.rows) {
        if (!scope[`can_${action}`]) continue;

        const hasAccess = await this.checkScopeAccess(
          hierarchy, 
          scope.scope_level, 
          dataType, 
          resourceId
        );

        if (hasAccess) return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking data access:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Check if user has access at specific scope level
   */
  private static async checkScopeAccess(
    hierarchy: UserHierarchy,
    scopeLevel: string,
    dataType: string,
    resourceId?: number
  ): Promise<boolean> {
    const client = await pool.connect();

    try {
      switch (scopeLevel) {
        case 'global':
          return hierarchy.role === 'Admin';

        case 'self':
          return true; // User can always access their own data

        case 'zone':
          if (!resourceId || hierarchy.accessible_zones?.length === 0) return true;
          return await this.checkZoneAccess(hierarchy, dataType, resourceId);

        case 'province':
          if (!resourceId || hierarchy.accessible_provinces?.length === 0) return true;
          return await this.checkProvinceAccess(hierarchy, dataType, resourceId);

        case 'district':
          if (!resourceId || hierarchy.accessible_districts?.length === 0) return true;
          return await this.checkDistrictAccess(hierarchy, dataType, resourceId);

        case 'school':
          if (!resourceId || hierarchy.accessible_schools?.length === 0) return true;
          return await this.checkSchoolAccess(hierarchy, dataType, resourceId);

        case 'class':
          if (!resourceId || hierarchy.accessible_classes?.length === 0) return true;
          return hierarchy.accessible_classes?.includes(resourceId) || false;

        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking scope access:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Check zone-level access
   */
  private static async checkZoneAccess(
    hierarchy: UserHierarchy,
    dataType: string,
    resourceId: number
  ): Promise<boolean> {
    const client = await pool.connect();

    try {
      let zoneId: number | null = null;

      switch (dataType) {
        case 'schools':
          const schoolZone = await client.query(
            'SELECT zone_id FROM tbl_tarl_schools WHERE id = $1',
            [resourceId]
          );
          zoneId = schoolZone.rows[0]?.zone_id;
          break;

        case 'users':
          const userSchoolZone = await client.query(`
            SELECT s.zone_id 
            FROM tbl_tarl_users u 
            JOIN tbl_tarl_schools s ON u.school_id = s.id 
            WHERE u.id = $1
          `, [resourceId]);
          zoneId = userSchoolZone.rows[0]?.zone_id;
          break;

        case 'students':
          const studentZone = await client.query(`
            SELECT s.zone_id 
            FROM tbl_tarl_students st 
            JOIN tbl_tarl_schools s ON st.school_id = s.id 
            WHERE st.id = $1
          `, [resourceId]);
          zoneId = studentZone.rows[0]?.zone_id;
          break;
      }

      return zoneId ? hierarchy.accessible_zones?.includes(zoneId) || false : false;
    } catch (error) {
      console.error('Error checking zone access:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Check province-level access
   */
  private static async checkProvinceAccess(
    hierarchy: UserHierarchy,
    dataType: string,
    resourceId: number
  ): Promise<boolean> {
    const client = await pool.connect();

    try {
      let provinceId: number | null = null;

      switch (dataType) {
        case 'schools':
          const schoolProvince = await client.query(
            'SELECT province_id FROM tbl_tarl_schools WHERE id = $1',
            [resourceId]
          );
          provinceId = schoolProvince.rows[0]?.province_id;
          break;

        case 'users':
          const userSchoolProvince = await client.query(`
            SELECT s.province_id 
            FROM tbl_tarl_users u 
            JOIN tbl_tarl_schools s ON u.school_id = s.id 
            WHERE u.id = $1
          `, [resourceId]);
          provinceId = userSchoolProvince.rows[0]?.province_id;
          break;

        case 'students':
          const studentProvince = await client.query(`
            SELECT s.province_id 
            FROM tbl_tarl_students st 
            JOIN tbl_tarl_schools s ON st.school_id = s.id 
            WHERE st.id = $1
          `, [resourceId]);
          provinceId = studentProvince.rows[0]?.province_id;
          break;
      }

      return provinceId ? hierarchy.accessible_provinces?.includes(provinceId) || false : false;
    } catch (error) {
      console.error('Error checking province access:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Check district-level access
   */
  private static async checkDistrictAccess(
    hierarchy: UserHierarchy,
    dataType: string,
    resourceId: number
  ): Promise<boolean> {
    const client = await pool.connect();

    try {
      let districtId: number | null = null;

      switch (dataType) {
        case 'schools':
          const schoolDistrict = await client.query(
            'SELECT district_id FROM tbl_tarl_schools WHERE id = $1',
            [resourceId]
          );
          districtId = schoolDistrict.rows[0]?.district_id;
          break;

        case 'users':
          const userSchoolDistrict = await client.query(`
            SELECT s.district_id 
            FROM tbl_tarl_users u 
            JOIN tbl_tarl_schools s ON u.school_id = s.id 
            WHERE u.id = $1
          `, [resourceId]);
          districtId = userSchoolDistrict.rows[0]?.district_id;
          break;

        case 'students':
          const studentDistrict = await client.query(`
            SELECT s.district_id 
            FROM tbl_tarl_students st 
            JOIN tbl_tarl_schools s ON st.school_id = s.id 
            WHERE st.id = $1
          `, [resourceId]);
          districtId = studentDistrict.rows[0]?.district_id;
          break;
      }

      return districtId ? hierarchy.accessible_districts?.includes(districtId) || false : false;
    } catch (error) {
      console.error('Error checking district access:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Check school-level access
   */
  private static async checkSchoolAccess(
    hierarchy: UserHierarchy,
    dataType: string,
    resourceId: number
  ): Promise<boolean> {
    const client = await pool.connect();

    try {
      let schoolId: number | null = null;

      switch (dataType) {
        case 'schools':
          schoolId = resourceId;
          break;

        case 'users':
          const userSchool = await client.query(
            'SELECT school_id FROM tbl_tarl_users WHERE id = $1',
            [resourceId]
          );
          schoolId = userSchool.rows[0]?.school_id;
          break;

        case 'students':
          const studentSchool = await client.query(
            'SELECT school_id FROM tbl_tarl_students WHERE id = $1',
            [resourceId]
          );
          schoolId = studentSchool.rows[0]?.school_id;
          break;

        case 'observations':
          const obsSchool = await client.query(
            'SELECT school_id FROM tbl_tarl_observations WHERE id = $1',
            [resourceId]
          );
          schoolId = obsSchool.rows[0]?.school_id;
          break;
      }

      return schoolId ? hierarchy.accessible_schools?.includes(schoolId) || false : false;
    } catch (error) {
      console.error('Error checking school access:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Get filtered data query based on user's hierarchy
   */
  static async getFilteredDataQuery(
    userId: number,
    dataType: string,
    baseQuery: string
  ): Promise<string> {
    const hierarchy = await this.getUserHierarchy(userId);
    if (!hierarchy) return '';

    // Admin gets full access
    if (hierarchy.role === 'Admin') return baseQuery;

    let whereClause = '';

    switch (dataType) {
      case 'schools':
        whereClause = await this.buildSchoolFilter(hierarchy);
        break;
      case 'users':
        whereClause = await this.buildUserFilter(hierarchy);
        break;
      case 'students':
        whereClause = await this.buildStudentFilter(hierarchy);
        break;
      case 'observations':
        whereClause = await this.buildObservationFilter(hierarchy);
        break;
    }

    if (whereClause) {
      const hasWhere = baseQuery.toLowerCase().includes('where');
      return `${baseQuery} ${hasWhere ? 'AND' : 'WHERE'} ${whereClause}`;
    }

    return baseQuery;
  }

  /**
   * Build school filter based on hierarchy
   */
  private static async buildSchoolFilter(hierarchy: UserHierarchy): Promise<string> {
    const conditions: string[] = [];

    if (hierarchy.accessible_zones?.length) {
      conditions.push(`zone_id IN (${hierarchy.accessible_zones.join(',')})`);
    }
    if (hierarchy.accessible_provinces?.length) {
      conditions.push(`province_id IN (${hierarchy.accessible_provinces.join(',')})`);
    }
    if (hierarchy.accessible_districts?.length) {
      conditions.push(`district_id IN (${hierarchy.accessible_districts.join(',')})`);
    }
    if (hierarchy.accessible_schools?.length) {
      conditions.push(`id IN (${hierarchy.accessible_schools.join(',')})`);
    }

    return conditions.length > 0 ? `(${conditions.join(' OR ')})` : '1=0';
  }

  /**
   * Build user filter based on hierarchy
   */
  private static async buildUserFilter(hierarchy: UserHierarchy): Promise<string> {
    const conditions: string[] = [];

    // Users can always see themselves
    conditions.push(`id = ${hierarchy.user_id}`);

    if (hierarchy.accessible_schools?.length) {
      conditions.push(`school_id IN (${hierarchy.accessible_schools.join(',')})`);
    }

    return conditions.length > 0 ? `(${conditions.join(' OR ')})` : '1=0';
  }

  /**
   * Build student filter based on hierarchy
   */
  private static async buildStudentFilter(hierarchy: UserHierarchy): Promise<string> {
    const conditions: string[] = [];

    if (hierarchy.accessible_classes?.length) {
      conditions.push(`class_id IN (${hierarchy.accessible_classes.join(',')})`);
    }
    if (hierarchy.accessible_schools?.length) {
      conditions.push(`school_id IN (${hierarchy.accessible_schools.join(',')})`);
    }

    return conditions.length > 0 ? `(${conditions.join(' OR ')})` : '1=0';
  }

  /**
   * Build observation filter based on hierarchy
   */
  private static async buildObservationFilter(hierarchy: UserHierarchy): Promise<string> {
    const conditions: string[] = [];

    // Collectors can see observations they created
    if (hierarchy.role === 'Collector') {
      conditions.push(`created_by = ${hierarchy.user_id}`);
    }

    if (hierarchy.accessible_schools?.length) {
      conditions.push(`school_id IN (${hierarchy.accessible_schools.join(',')})`);
    }

    return conditions.length > 0 ? `(${conditions.join(' OR ')})` : '1=0';
  }

  /**
   * Assign user to hierarchy level
   */
  static async assignUserToHierarchy(
    userId: number,
    assignmentType: 'zone' | 'province' | 'district' | 'school' | 'class',
    assignmentId: number,
    assignedBy: number
  ): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      let tableName = '';
      let columnName = '';

      switch (assignmentType) {
        case 'zone':
          tableName = 'user_zone_assignments';
          columnName = 'zone_id';
          break;
        case 'province':
          tableName = 'user_province_assignments';
          columnName = 'province_id';
          break;
        case 'district':
          tableName = 'user_district_assignments';
          columnName = 'district_id';
          break;
        case 'school':
          tableName = 'user_school_assignments';
          columnName = 'school_id';
          break;
        case 'class':
          tableName = 'teacher_class_assignments';
          columnName = 'class_id';
          break;
      }

      if (assignmentType === 'class') {
        await client.query(`
          INSERT INTO teacher_class_assignments (teacher_id, class_id, assigned_by)
          VALUES ($1, $2, $3)
          ON CONFLICT (teacher_id, class_id, subject) DO UPDATE SET is_active = true
        `, [userId, assignmentId, assignedBy]);
      } else {
        await client.query(`
          INSERT INTO ${tableName} (user_id, ${columnName}, assigned_by)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, ${columnName}) DO UPDATE SET is_active = true
        `, [userId, assignmentId, assignedBy]);
      }

      return true;
    } catch (error) {
      console.error('Error assigning user to hierarchy:', error);
      return false;
    } finally {
      client.release();
    }
  }
}