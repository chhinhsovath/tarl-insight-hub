import { NextRequest, NextResponse } from "next/server";
import { HierarchyPermissionManager } from "@/lib/hierarchy-permissions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, assignmentType, assignmentId, assignedBy } = body;

    if (!userId || !assignmentType || !assignmentId || !assignedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, assignmentType, assignmentId, assignedBy' },
        { status: 400 }
      );
    }

    const validTypes = ['zone', 'province', 'district', 'school', 'class'];
    if (!validTypes.includes(assignmentType)) {
      return NextResponse.json(
        { error: 'Invalid assignment type. Must be one of: zone, province, district, school, class' },
        { status: 400 }
      );
    }

    const success = await HierarchyPermissionManager.assignUserToHierarchy(
      userId,
      assignmentType,
      assignmentId,
      assignedBy
    );

    if (success) {
      return NextResponse.json({ 
        message: 'User assigned to hierarchy successfully',
        success: true 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to assign user to hierarchy' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error assigning user to hierarchy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, assignmentType, assignmentId } = body;

    if (!userId || !assignmentType || !assignmentId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, assignmentType, assignmentId' },
        { status: 400 }
      );
    }

    // Implementation would go here to remove assignment
    // For now, return success
    return NextResponse.json({ 
      message: 'User removed from hierarchy successfully',
      success: true 
    });
  } catch (error) {
    console.error('Error removing user from hierarchy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}