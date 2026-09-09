CREATE TABLE "cscrs" (
	"project_id" text PRIMARY KEY,
	"status" text DEFAULT 'Draft',
	"version" text DEFAULT '1.0.0-draft',
	"scope" text DEFAULT '',
	"argument" text DEFAULT '',
	"conclusion" text DEFAULT '',
	"references" jsonb DEFAULT '[]',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hazards" (
	"id" text,
	"project_id" text,
	"title" text NOT NULL,
	"desc" text NOT NULL,
	"clinical_impact" text DEFAULT '',
	"initial_severity" text DEFAULT '',
	"initial_likelihood" text DEFAULT '',
	"initial_risk" text DEFAULT '',
	"residual_severity" text DEFAULT '',
	"residual_likelihood" text DEFAULT '',
	"residual_risk" text DEFAULT '',
	"causes" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "hazards_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE "history" (
	"id" text PRIMARY KEY,
	"project_id" text NOT NULL,
	"doc_type" text NOT NULL,
	"version" text NOT NULL,
	"timestamp" text NOT NULL,
	"cso" text DEFAULT '',
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"version" text DEFAULT '',
	"cso" text DEFAULT '',
	"hazard_log_status" text DEFAULT 'Draft',
	"hazard_log_version" text DEFAULT '1.0.0-draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cscrs" ADD CONSTRAINT "cscrs_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hazards" ADD CONSTRAINT "hazards_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;