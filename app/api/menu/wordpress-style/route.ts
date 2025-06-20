import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool } from "@/lib/database-config";
import { WordPressStyleMenuService } from "@/lib/wordpress-style-menu";

const pool = getPool();

async function validateSession(sessionToken: string) {
  const result = await pool.query(
    `SELECT u.id, u.full_name, r.name as role FROM tbl_tarl_users u 
     JOIN tbl_user_sessions s ON u.id = s.user_id 
     JOIN tbl_tarl_roles r ON u.role_id = r.id
     WHERE s.session_token = $1 AND s.expires_at > NOW()`,
    [sessionToken]
  );
  return result.rows[0];
}

// GET /api/menu/wordpress-style - Get WordPress-style menu structure
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session-token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get("grouped") === "true";
    const template = searchParams.get("template") || "default";

    // Get menu structure
    let menuStructure;
    if (grouped) {
      menuStructure = await WordPressStyleMenuService.getGroupedMenuStructure(user.id, user.role);
    } else {
      menuStructure = await WordPressStyleMenuService.getMenuStructure(user.id, user.role);
    }

    // Get menu template configuration
    const menuTemplate = await WordPressStyleMenuService.getMenuTemplate(template);

    return NextResponse.json({
      menu: menuStructure,
      template: menuTemplate,
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Error fetching WordPress-style menu:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu structure" },
      { status: 500 }
    );
  }
}

// POST /api/menu/wordpress-style - Save user menu customization
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session-token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, customization } = body;

    if (!pageId || !customization) {
      return NextResponse.json(
        { error: "Missing pageId or customization data" },
        { status: 400 }
      );
    }

    const success = await WordPressStyleMenuService.saveUserMenuCustomization(
      user.id,
      pageId,
      customization
    );

    if (success) {
      return NextResponse.json({ message: "Menu customization saved successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to save menu customization" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error saving menu customization:", error);
    return NextResponse.json(
      { error: "Failed to save menu customization" },
      { status: 500 }
    );
  }
}

// PUT /api/menu/wordpress-style/check-access - Check page access (separate from display)
export async function PUT(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session-token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { pagePath } = body;

    if (!pagePath) {
      return NextResponse.json(
        { error: "Missing pagePath" },
        { status: 400 }
      );
    }

    const hasAccess = await WordPressStyleMenuService.hasPageAccess(
      user.id,
      user.role,
      pagePath
    );

    return NextResponse.json({
      hasAccess,
      pagePath,
      userRole: user.role,
      userId: user.id
    });

  } catch (error) {
    console.error("Error checking page access:", error);
    return NextResponse.json(
      { error: "Failed to check page access" },
      { status: 500 }
    );
  }
}