import { randomUUID } from "crypto";
import { eq, desc, or, sql } from "drizzle-orm";
import type { Request, Response } from "express";
import { db, pool } from "../configs/db.js";
import {
  appointments,
  createAppointmentSchema,
  updateAppointmentSchema,
  type NewAppointment,
} from "../models/appointmentModel.js";
import { tryCatch } from "../utils/tryCatch.js";
import { patients } from "../models/patientModel.js";
import { facilities } from "../models/facilityModel.js";

const urgencyBucketFromScore = (score: number | null | undefined) => {
  const value = Number(score || 0);
  if (value >= 9) return "emergency";
  if (value >= 7) return "er";
  if (value >= 4) return "clinic";
  return "self-care";
};

const urgencyRank: Record<string, number> = {
  "self-care": 1,
  clinic: 2,
  er: 3,
  emergency: 4,
};

const getFacilityProfileIdForUser = async (user: any) => {
  if (!user || (user.role !== "facility" && user.role !== "admin")) return "";
  const f = await db.select({ id: facilities.id }).from(facilities).where(eq(facilities.user_id, user.id)).limit(1);
  return f[0]?.id || "";
};

const getPatientProfileIdForUser = async (user: any) => {
  if (!user || user.role !== "patient") return "";
  const p = await db.select({ id: patients.id }).from(patients).where(eq(patients.user_id, user.id)).limit(1);
  return p[0]?.id || "";
};

export const getAllAppointments = async (req: Request, res: Response) => {
  const allAppointments = await tryCatch(
    db.select().from(appointments),
  );
  if (allAppointments.error) return res.status(500).json({ message: "Failed to get appointments" });
  res.json(allAppointments.data);
};

export const getAppointment = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const appointment = await tryCatch(
    db.select().from(appointments).where(eq(appointments.id, id)),
  );
  if (appointment.error || !appointment.data?.[0]) return res.status(404).json({ message: "Not found" });
  res.json(appointment.data[0]);
};

export const createAppointment = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  try {
    let patientId = req.body.patient_id;
    if (!patientId && user.role === "patient") {
      const p = await db.select({ id: patients.id }).from(patients).where(eq(patients.user_id, user.id)).limit(1);
      if (p[0]) patientId = p[0].id;
    }

    const facilityId = req.body.facility_id;
    const appointmentDate = req.body.appointment_date;
    const appointmentTime = req.body.appointment_time || null;
    const doctorName = typeof req.body.doctor_name === "string" ? req.body.doctor_name.trim() : "";
    const specialty = typeof req.body.specialty === "string" ? req.body.specialty.trim() : "";
    const appointmentType = typeof req.body.appointment_type === "string" ? req.body.appointment_type.trim() : "";
    const notes = typeof req.body.notes === "string" ? req.body.notes.trim() : "";
    const symptomsSummary = req.body.symptoms_summary || '';
    const triageScore = req.body.triage_score || null;
    const triageExplanation = req.body.triage_explanation || null;
    const appointmentData = req.body.data && typeof req.body.data === "object" && !Array.isArray(req.body.data) ? req.body.data : {};
    const apptId = randomUUID();

    if (!patientId || !facilityId) {
      return res.status(400).json({ message: "patient_id and facility_id are required" });
    }

    const result = await pool.query(
      `INSERT INTO appointments (id, patient_id, facility_id, doctor_name, specialty, appointment_type, appointment_date, appointment_time, status, notes, symptoms_summary, triage_score, triage_explanation, data, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, $13::jsonb, NOW(), NOW())
       RETURNING *`,
      [apptId, patientId, facilityId, doctorName || null, specialty || null, appointmentType || null, appointmentDate, appointmentTime, notes || null, symptomsSummary, triageScore, triageExplanation, JSON.stringify(appointmentData)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("createAppointment error:", err);
    res.status(500).json({ message: "Failed to create appointment", detail: String(err) });
  }
};

export const submitTriageFeedback = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const appointmentId = req.params["id"];
  const clinicianBucket = typeof req.body.clinician_urgency_level === "string" ? req.body.clinician_urgency_level : "";
  const clinicianScore = req.body.clinician_score !== undefined ? Number(req.body.clinician_score) : null;
  const notes = typeof req.body.notes === "string" ? req.body.notes.trim().slice(0, 500) : "";
  const allowedBuckets = new Set(["self-care", "clinic", "er", "emergency"]);

  if (!appointmentId) return res.status(400).json({ message: "Appointment ID is required" });
  if (!allowedBuckets.has(clinicianBucket)) {
    return res.status(400).json({ message: "clinician_urgency_level must be self-care, clinic, er, or emergency" });
  }
  if (clinicianScore !== null && (!Number.isFinite(clinicianScore) || clinicianScore < 1 || clinicianScore > 10)) {
    return res.status(400).json({ message: "clinician_score must be between 1 and 10" });
  }

  try {
    const appointment = await pool.query(
      `SELECT id, facility_id, triage_score, data
       FROM appointments
       WHERE id = $1::uuid
       LIMIT 1`,
      [appointmentId],
    );
    const row = appointment.rows[0];
    if (!row) return res.status(404).json({ message: "Appointment not found" });

    if (user.role === "facility") {
      const facilityId = await getFacilityProfileIdForUser(user);
      if (!facilityId || row.facility_id !== facilityId) {
        return res.status(403).json({ message: "You can only review appointments for your facility" });
      }
    }

    const aiBucket = urgencyBucketFromScore(row.triage_score);
    const aiRank = urgencyRank[aiBucket] || 0;
    const clinicianRank = urgencyRank[clinicianBucket] || 0;
    const feedback = {
      ai_score: Number(row.triage_score || 0),
      ai_urgency_level: aiBucket,
      clinician_score: clinicianScore,
      clinician_urgency_level: clinicianBucket,
      agreement: aiBucket === clinicianBucket,
      correction_direction: clinicianRank > aiRank ? "ai_under_triaged" : clinicianRank < aiRank ? "ai_over_triaged" : "aligned",
      notes,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    const updated = await pool.query(
      `UPDATE appointments
       SET data = jsonb_set(COALESCE(data, '{}'::jsonb), '{clinician_feedback}', $2::jsonb, true),
           updated_at = NOW()
       WHERE id = $1::uuid
       RETURNING id, data`,
      [appointmentId, JSON.stringify(feedback)],
    );

    res.json({ appointment_id: appointmentId, feedback: updated.rows[0]?.data?.clinician_feedback || feedback });
  } catch (err) {
    console.error("submitTriageFeedback error:", err);
    res.status(500).json({ message: "Failed to save clinician feedback", detail: String(err) });
  }
};

export const getFeedbackMetrics = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const facilityId = await getFacilityProfileIdForUser(user);
    if (!facilityId && user.role !== "admin") return res.status(403).json({ message: "Facility account required" });

    const result = await pool.query(
      `SELECT triage_score, data->'clinician_feedback' AS feedback
       FROM appointments
       WHERE ($1::uuid IS NULL OR facility_id = $1::uuid)
         AND data ? 'clinician_feedback'`,
      [facilityId || null],
    );

    const matrix: Record<string, Record<string, number>> = {};
    let aligned = 0;
    let underTriaged = 0;
    let overTriaged = 0;

    result.rows.forEach((row) => {
      const feedback = row.feedback || {};
      const aiBucket = typeof feedback.ai_urgency_level === "string" ? feedback.ai_urgency_level : urgencyBucketFromScore(row.triage_score);
      const clinicianBucket = typeof feedback.clinician_urgency_level === "string" ? feedback.clinician_urgency_level : "clinic";
      matrix[aiBucket] = matrix[aiBucket] || {};
      matrix[aiBucket]![clinicianBucket] = (matrix[aiBucket]![clinicianBucket] || 0) + 1;

      if (feedback.correction_direction === "ai_under_triaged") underTriaged++;
      if (feedback.correction_direction === "ai_over_triaged") overTriaged++;
      if (feedback.agreement === true) aligned++;
    });

    const total = result.rows.length;
    const labels = ["self-care", "clinic", "er", "emergency"];
    const confusion_matrix = labels.flatMap((ai) =>
      labels.map((clinician) => ({
        ai,
        clinician,
        count: matrix[ai]?.[clinician] || 0,
      })),
    );

    res.json({
      total_reviews: total,
      agreement_rate: total > 0 ? Math.round((aligned / total) * 100) : 0,
      corrections: {
        ai_under_triaged: underTriaged,
        ai_over_triaged: overTriaged,
      },
      confusion_matrix,
    });
  } catch (err) {
    console.error("getFeedbackMetrics error:", err);
    res.status(500).json({ message: "Failed to compute feedback metrics", detail: String(err) });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const id = req.params["id"];
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const allowedStatuses = new Set(["pending", "confirmed", "cancelled", "completed"]);

  if (!id) return res.status(400).json({ message: "Appointment ID is required" });
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ message: "status must be pending, confirmed, cancelled, or completed" });
  }

  try {
    const appointment = await pool.query(
      `SELECT id, patient_id::text, facility_id::text
       FROM appointments
       WHERE id = $1::uuid
       LIMIT 1`,
      [id],
    );
    const row = appointment.rows[0];
    if (!row) return res.status(404).json({ message: "Appointment not found" });

    if (user.role === "facility") {
      const facilityId = await getFacilityProfileIdForUser(user);
      if (!facilityId || row.facility_id !== facilityId) {
        return res.status(403).json({ message: "You can only update appointments for your facility" });
      }
    }

    if (user.role === "patient") {
      const patientId = await getPatientProfileIdForUser(user);
      if (!patientId || row.patient_id !== patientId || status !== "cancelled") {
        return res.status(403).json({ message: "Patients can only cancel their own appointments" });
      }
    }

    const updated = await pool.query(
      `UPDATE appointments
       SET status = $2, updated_at = NOW()
       WHERE id = $1::uuid
       RETURNING *`,
      [id, status],
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ message: "Failed to update appointment status", detail: String(err) });
  }
};

export const getMyAppointments = async (req: Request, res: Response) => {
  const user = (req as any).user; 
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  try {
    let profileId = "";
    if (user.role === "patient") {
      const p = await db.select({ id: patients.id }).from(patients).where(eq(patients.user_id, user.id)).limit(1);
      if (p[0]) profileId = p[0].id;
    } else {
      const f = await db.select({ id: facilities.id }).from(facilities).where(eq(facilities.user_id, user.id)).limit(1);
      if (f[0]) profileId = f[0].id;
    }

    if (!profileId && user.role !== "admin") return res.json([]);

    // Use raw pg pool to avoid Drizzle ORM type casting issues with uuid
    const myAppts = user.role === "admin"
      ? await pool.query(
          `SELECT id, patient_id, facility_id, doctor_name, specialty, appointment_type, appointment_date, appointment_time, status, notes, symptoms_summary, triage_score, triage_explanation, data
           FROM appointments
           ORDER BY updated_at DESC, appointment_date DESC`,
        )
      : await pool.query(
          `SELECT id, patient_id, facility_id, doctor_name, specialty, appointment_type, appointment_date, appointment_time, status, notes, symptoms_summary, triage_score, triage_explanation, data
           FROM appointments
           WHERE patient_id = $1::uuid OR facility_id = $1::uuid
           ORDER BY updated_at DESC, appointment_date DESC`,
          [profileId]
        );

    // Enrich with names, with null safety
    const enriched = await Promise.all((myAppts.rows as any[]).map(async (appt: any) => {
      let patientName = "Unknown Patient";
      let facilityName = "Unknown Facility";

      if (appt.patient_id) {
        const p = await db.select({ name: patients.full_name }).from(patients).where(eq(patients.id, appt.patient_id)).limit(1);
        if (p[0]?.name) patientName = p[0].name;
      }
      if (appt.facility_id) {
        const f = await db.select({ name: facilities.name }).from(facilities).where(eq(facilities.id, appt.facility_id)).limit(1);
        if (f[0]?.name) facilityName = f[0].name;
      }
      
      return {
        ...appt,
        patient_name: patientName,
        facility_name: facilityName
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error("getMyAppointments error:", err);
    res.status(500).json({ message: "Error fetching appointments", detail: String(err) });
  }
};

export const getFacilities = async (req: Request, res: Response) => {
  const result = await tryCatch(db.select().from(facilities));
  if (result.error) return res.status(500).json({ message: "Error" });
  res.json(result.data);
};
