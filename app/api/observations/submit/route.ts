import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
})

export async function POST(request: Request) {
  const client = await pool.connect()
  
  try {
    const data = await request.json()
    const { formData, activities, materials, tarlLevels } = data

    // Start a transaction
    await client.query("BEGIN")

    try {
      // Insert the main observation response
      const observationResult = await client.query(
        `INSERT INTO tbl_tarl_observation_responses (
          visit_date, region, province, mentor_name, school_name, program_type_id,
          tarl_class_taking_place, tarl_class_not_taking_place_reason, tarl_class_not_taking_place_other_reason,
          teacher_name, observed_full_session, grade_group, grades_observed, subject_observed,
          total_class_strength, students_present, students_progressed_since_last_week,
          class_started_on_time, class_not_on_time_reason, class_not_on_time_other_reason,
          transition_time_between_subjects, children_grouped_appropriately, students_fully_involved,
          teacher_had_session_plan, teacher_no_session_plan_reason, teacher_followed_session_plan,
          teacher_not_follow_plan_reason, session_plan_appropriate_for_level,
          number_of_activities, suggestions_to_teacher, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
        RETURNING id`,
        [
          formData.visit_date,
          formData.region,
          formData.province,
          formData.mentor_name,
          formData.school_name,
          formData.program_type_id,
          formData.tarl_class_taking_place,
          formData.tarl_class_not_taking_place_reason,
          formData.tarl_class_not_taking_place_other_reason,
          formData.teacher_name,
          formData.observed_full_session,
          formData.grade_group,
          formData.grades_observed,
          formData.subject_observed,
          formData.total_class_strength,
          formData.students_present,
          formData.students_progressed_since_last_week,
          formData.class_started_on_time,
          formData.class_not_on_time_reason,
          formData.class_not_on_time_other_reason,
          formData.transition_time_between_subjects,
          formData.children_grouped_appropriately,
          formData.students_fully_involved,
          formData.teacher_had_session_plan,
          formData.teacher_no_session_plan_reason,
          formData.teacher_followed_session_plan,
          formData.teacher_not_follow_plan_reason,
          formData.session_plan_appropriate_for_level,
          formData.number_of_activities,
          formData.suggestions_to_teacher,
          formData.created_by
        ]
      )

      const observationId = observationResult.rows[0].id

      // Insert activities
      for (const activity of activities) {
        await client.query(
          `INSERT INTO tbl_tarl_observation_activities (
            observation_id, activity_number, activity_type_id_language, activity_type_id_numeracy,
            duration_minutes, teacher_gave_clear_instructions, teacher_no_clear_instructions_reason,
            teacher_demonstrated_activity, teacher_made_students_practice_in_front,
            students_performed_in_small_groups, students_performed_individually
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            observationId,
            activity.activity_number,
            activity.activity_type_id_language,
            activity.activity_type_id_numeracy,
            activity.duration_minutes,
            activity.teacher_gave_clear_instructions,
            activity.teacher_no_clear_instructions_reason,
            activity.teacher_demonstrated_activity,
            activity.teacher_made_students_practice_in_front,
            activity.students_performed_in_small_groups,
            activity.students_performed_individually
          ]
        )
      }

      // Insert materials
      for (const materialId of materials) {
        await client.query(
          `INSERT INTO tbl_tarl_observation_materials (observation_id, material_id) VALUES ($1, $2)`,
          [observationId, materialId]
        )
      }

      // Insert TaRL levels
      for (const levelId of tarlLevels) {
        await client.query(
          `INSERT INTO tbl_tarl_observation_tarl_levels (observation_id, tarl_level_id) VALUES ($1, $2)`,
          [observationId, levelId]
        )
      }

      // Commit the transaction
      await client.query("COMMIT")

      return NextResponse.json({ success: true, observationId })
    } catch (error) {
      // Rollback the transaction on error
      await client.query("ROLLBACK")
      throw error
    }
  } catch (error: any) {
    console.error("Error submitting observation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to submit observation" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
} 