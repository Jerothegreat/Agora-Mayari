CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"patient_id" uuid,
	"facility_id" uuid,
	"doctor_name" varchar(255),
	"specialty" varchar(255),
	"appointment_type" varchar(100),
	"appointment_date" date,
	"appointment_time" time,
	"status" varchar(50) DEFAULT 'pending',
	"notes" text,
	"symptoms_summary" text,
	"triage_score" integer,
	"triage_explanation" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"patient_id" uuid,
	"doctor_name" varchar(255),
	"specialty" varchar(255),
	"date" timestamp with time zone,
	"status" varchar(50),
	"notes" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"uid" varchar(255) NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"type" varchar(100),
	"email" varchar(255),
	"phone" varchar(50),
	"location" text,
	"address" text,
	"city" varchar(100),
	"province" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(100) DEFAULT 'Philippines',
	"website" varchar(255),
	"specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"operating_hours" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"staff" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"capacity" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"accreditation" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"insurance_accepted" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"license_number" varchar(100),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_searchable" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"profile_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "facilities_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255),
	"personal_info" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"medical_info" jsonb DEFAULT '{"allergies":[],"surgeries":[],"conditions":{},"medications":[]}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"activity" jsonb DEFAULT '{"consultationHistory":[]}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'patient' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "triage_sessions" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "triage_sessions" ADD COLUMN "sex" varchar;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;