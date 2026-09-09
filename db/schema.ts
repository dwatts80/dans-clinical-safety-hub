import { pgTable, text, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  version: text("version").default(""),
  cso: text("cso").default(""),
  hazardLogStatus: text("hazard_log_status").default("Draft"),
  hazardLogVersion: text("hazard_log_version").default("1.0.0-draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const hazards = pgTable("hazards", {
  id: text("id").notNull(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  desc: text("desc").notNull(),
  clinicalImpact: text("clinical_impact").default(""),
  initialSeverity: text("initial_severity").default(""),
  initialLikelihood: text("initial_likelihood").default(""),
  initialRisk: text("initial_risk").default(""),
  residualSeverity: text("residual_severity").default(""),
  residualLikelihood: text("residual_likelihood").default(""),
  residualRisk: text("residual_risk").default(""),
  causes: jsonb("causes").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.id, table.projectId] })
]);

export const cscrs = pgTable("cscrs", {
  projectId: text("project_id")
    .primaryKey()
    .references(() => projects.id, { onDelete: "cascade" }),
  status: text("status").default("Draft"),
  version: text("version").default("1.0.0-draft"),
  scope: text("scope").default(""),
  argument: text("argument").default(""),
  conclusion: text("conclusion").default(""),
  references: jsonb("references").default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const history = pgTable("history", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  docType: text("doc_type").notNull(),
  version: text("version").notNull(),
  timestamp: text("timestamp").notNull(),
  cso: text("cso").default(""),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
