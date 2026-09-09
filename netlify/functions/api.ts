import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { projects, hazards, cscrs, history } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

const defaultProjects = {
  "epr-upgrade": {
    id: "epr-upgrade",
    name: "Electronic Patient Record Integration",
    version: "2.1",
    cso: "Jane Doe",
    hazard_log_status: "Draft",
    hazard_log_version: "1.0.0-draft",
    history: [
      {
        id: "hist-1700000000000",
        docType: "hazard_log",
        version: "1.0.0-baseline",
        timestamp: "2026-06-15 14:30:22",
        cso: "Jane Doe",
        data: [
          {
            id: "HZ001",
            title: "Allergy Display Truncation Baseline",
            desc: "System fails on parser boundary lengths.",
            clinical_impact: "Adverse allergy event risk.",
            initial_severity: "4",
            initial_likelihood: "3",
            initial_risk: "High",
            residual_severity: "4",
            residual_likelihood: "1",
            residual_risk: "Medium",
            causes: [
              {
                id: "HZ001CS01",
                desc: "Truncation logic boundary conditions.",
                confirmed: true,
                controls: [
                  {
                    id: "HZ001CS01CT01",
                    desc: "Dynamic formatting frames.",
                    confirmed: true,
                    category: "Design",
                    evidenceDesc: "Audit Script ALLERGY-TS-04"
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    hazards: [
      {
        id: "HZ001",
        title: "Allergy Display Truncation",
        desc: "System failing to parse text strings longer than 50 characters over high-latency network calls inside regional diagnostic nodes.",
        clinical_impact: "Anaphylaxis due to critical drug allergies hidden from the prescribing clinician's viewport, leading to adverse event administration.",
        initial_severity: "4",
        initial_likelihood: "3",
        initial_risk: "High",
        residual_severity: "4",
        residual_likelihood: "1",
        residual_risk: "Medium",
        causes: [
          {
            id: "HZ001CS01",
            desc: "Truncation logic in regional pathology feed parser module failing on string boundaries.",
            confirmed: true,
            controls: [
              {
                id: "HZ001CS01CT01",
                desc: "Implement dynamic text-wrapping inside prescribing interface display frames without overflow.",
                confirmed: true,
                category: "Design",
                evidenceDesc: "Integration Test Script IT-ALLERGY-Display-04 verified successfully by QA team."
              },
              {
                id: "HZ001CS01CT02",
                desc: "Conduct mandatory training regarding text display limitations during EHR onboarding session.",
                confirmed: true,
                category: "Training",
                evidenceDesc: "EHR Training Handbook v4.2 Section 12 (Clinician Safety Prompts)."
              }
            ]
          }
        ]
      }
    ],
    cscr: {
      status: "Draft",
      version: "1.0.0-draft",
      scope: "The scope of this Safety Case is restricted to the update of the Integrated Clinical EHR System, specifically detailing interface connectivity to regional laboratory pathways.\n\nSee the primary architecture spec here: [Confluence Architecture Details](https://confluence.example.com)",
      argument: "Clinical safety analysis has been executed systematically across all integration boundaries. All mapped high severity failures have been mitigated below risk tolerances, ensuring the system remains As Low As Reasonably Practicable (ALARP).",
      conclusion: "It is declared that the clinical safety implications of integrating this release have been fully analyzed and audited. The system is structurally endorsed for release across clinical operational healthcare pathways.",
      references: [
        { type: "Hazard Log", title: "v2.1 Master Hazard Export", url: "https://share.example.com/log" },
        { type: "Aha!", title: "EHR Integration Feature Epic", url: "https://aha.example.com/epic/123" }
      ]
    }
  }
};

async function seedDatabaseIfEmpty() {
  const existingProjects = await db.select().from(projects);
  if (existingProjects.length > 0) return;

  for (const [key, proj] of Object.entries(defaultProjects)) {
    await db.insert(projects).values({
      id: proj.id,
      name: proj.name,
      version: proj.version,
      cso: proj.cso,
      hazardLogStatus: proj.hazard_log_status,
      hazardLogVersion: proj.hazard_log_version,
    }).onConflictDoNothing();

    if (proj.cscr) {
      await db.insert(cscrs).values({
        projectId: proj.id,
        status: proj.cscr.status,
        version: proj.cscr.version,
        scope: proj.cscr.scope,
        argument: proj.cscr.argument,
        conclusion: proj.cscr.conclusion,
        references: proj.cscr.references,
      }).onConflictDoNothing();
    }

    if (proj.hazards && proj.hazards.length > 0) {
      for (const hz of proj.hazards) {
        await db.insert(hazards).values({
          id: hz.id,
          projectId: proj.id,
          title: hz.title,
          desc: hz.desc,
          clinicalImpact: hz.clinical_impact,
          initialSeverity: hz.initial_severity,
          initialLikelihood: hz.initial_likelihood,
          initialRisk: hz.initial_risk,
          residualSeverity: hz.residual_severity,
          residualLikelihood: hz.residual_likelihood,
          residualRisk: hz.residual_risk,
          causes: hz.causes,
        }).onConflictDoNothing();
      }
    }

    if (proj.history && proj.history.length > 0) {
      for (const hist of proj.history) {
        await db.insert(history).values({
          id: hist.id,
          projectId: proj.id,
          docType: hist.docType,
          version: hist.version,
          timestamp: hist.timestamp,
          cso: hist.cso,
          data: hist.data,
        }).onConflictDoNothing();
      }
    }
  }
}

async function getAllProjectsFormatted() {
  await seedDatabaseIfEmpty();

  const allProjects = await db.select().from(projects);
  const allHazards = await db.select().from(hazards);
  const allCscrs = await db.select().from(cscrs);
  const allHistory = await db.select().from(history);

  const formatted: Record<string, any> = {};

  for (const proj of allProjects) {
    const projHazards = allHazards
      .filter((h) => h.projectId === proj.id)
      .map((h) => ({
        id: h.id,
        title: h.title,
        desc: h.desc,
        clinical_impact: h.clinicalImpact || "",
        initial_severity: h.initialSeverity || "",
        initial_likelihood: h.initialLikelihood || "",
        initial_risk: h.initialRisk || "",
        residual_severity: h.residualSeverity || "",
        residual_likelihood: h.residualLikelihood || "",
        residual_risk: h.residualRisk || "",
        causes: h.causes || [],
      }));

    const projCscr = allCscrs.find((c) => c.projectId === proj.id);
    const cscrFormatted = projCscr
      ? {
          status: projCscr.status || "Draft",
          version: projCscr.version || "1.0.0-draft",
          scope: projCscr.scope || "",
          argument: projCscr.argument || "",
          conclusion: projCscr.conclusion || "",
          references: projCscr.references || [],
        }
      : {
          status: "Draft",
          version: "1.0.0-draft",
          scope: "",
          argument: "",
          conclusion: "",
          references: [],
        };

    const projHistory = allHistory
      .filter((h) => h.projectId === proj.id)
      .map((h) => ({
        id: h.id,
        docType: h.docType,
        version: h.version,
        timestamp: h.timestamp,
        cso: h.cso || "",
        data: h.data,
      }));

    formatted[proj.id] = {
      id: proj.id,
      name: proj.name,
      version: proj.version || "",
      cso: proj.cso || "",
      hazard_log_status: proj.hazardLogStatus || "Draft",
      hazard_log_version: proj.hazardLogVersion || "1.0.0-draft",
      hazards: projHazards,
      cscr: cscrFormatted,
      history: projHistory,
    };
  }

  return formatted;
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (req.method === "GET") {
      const formatted = await getAllProjectsFormatted();
      return Response.json(formatted);
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (action === "save_project") {
        const { id, name, version, cso, hazard_log_status, hazard_log_version } = body;
        if (!id || !name) {
          return Response.json({ error: "Missing required project fields" }, { status: 400 });
        }

        await db
          .insert(projects)
          .values({
            id,
            name,
            version: version || "",
            cso: cso || "",
            hazardLogStatus: hazard_log_status || "Draft",
            hazardLogVersion: hazard_log_version || "1.0.0-draft",
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: projects.id,
            set: {
              name,
              version: version !== undefined ? version : projects.version,
              cso: cso !== undefined ? cso : projects.cso,
              hazardLogStatus: hazard_log_status || projects.hazardLogStatus,
              hazardLogVersion: hazard_log_version || projects.hazardLogVersion,
              updatedAt: new Date(),
            },
          });

        // Ensure default CSCR entry exists
        await db
          .insert(cscrs)
          .values({
            projectId: id,
            status: "Draft",
            version: "1.0.0-draft",
          })
          .onConflictDoNothing();

        const updated = await getAllProjectsFormatted();
        return Response.json({ success: true, projects: updated });
      }

      if (action === "save_hazard") {
        const { projectId, hazard } = body;
        if (!projectId || !hazard || !hazard.id || !hazard.title) {
          return Response.json({ error: "Missing required hazard fields" }, { status: 400 });
        }

        await db
          .insert(hazards)
          .values({
            id: hazard.id,
            projectId,
            title: hazard.title,
            desc: hazard.desc || "",
            clinicalImpact: hazard.clinical_impact || "",
            initialSeverity: hazard.initial_severity || "",
            initialLikelihood: hazard.initial_likelihood || "",
            initialRisk: hazard.initial_risk || "",
            residualSeverity: hazard.residual_severity || "",
            residualLikelihood: hazard.residual_likelihood || "",
            residualRisk: hazard.residual_risk || "",
            causes: hazard.causes || [],
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [hazards.id, hazards.projectId],
            set: {
              title: hazard.title,
              desc: hazard.desc || "",
              clinicalImpact: hazard.clinical_impact || "",
              initialSeverity: hazard.initial_severity || "",
              initialLikelihood: hazard.initial_likelihood || "",
              initialRisk: hazard.initial_risk || "",
              residualSeverity: hazard.residual_severity || "",
              residualLikelihood: hazard.residual_likelihood || "",
              residualRisk: hazard.residual_risk || "",
              causes: hazard.causes || [],
              updatedAt: new Date(),
            },
          });

        const updated = await getAllProjectsFormatted();
        return Response.json({ success: true, projects: updated });
      }

      if (action === "save_cscr") {
        const { projectId, cscr } = body;
        if (!projectId || !cscr) {
          return Response.json({ error: "Missing required CSCR fields" }, { status: 400 });
        }

        await db
          .insert(cscrs)
          .values({
            projectId,
            status: cscr.status || "Draft",
            version: cscr.version || "1.0.0-draft",
            scope: cscr.scope || "",
            argument: cscr.argument || "",
            conclusion: cscr.conclusion || "",
            references: cscr.references || [],
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: cscrs.projectId,
            set: {
              status: cscr.status || cscrs.status,
              version: cscr.version || cscrs.version,
              scope: cscr.scope !== undefined ? cscr.scope : cscrs.scope,
              argument: cscr.argument !== undefined ? cscr.argument : cscrs.argument,
              conclusion: cscr.conclusion !== undefined ? cscr.conclusion : cscrs.conclusion,
              references: cscr.references !== undefined ? cscr.references : cscrs.references,
              updatedAt: new Date(),
            },
          });

        const updated = await getAllProjectsFormatted();
        return Response.json({ success: true, projects: updated });
      }

      if (action === "save_history") {
        const { projectId, entry } = body;
        if (!projectId || !entry || !entry.id) {
          return Response.json({ error: "Missing required history fields" }, { status: 400 });
        }

        await db
          .insert(history)
          .values({
            id: entry.id,
            projectId,
            docType: entry.docType,
            version: entry.version,
            timestamp: entry.timestamp,
            cso: entry.cso || "",
            data: entry.data,
          })
          .onConflictDoNothing();

        const updated = await getAllProjectsFormatted();
        return Response.json({ success: true, projects: updated });
      }

      if (action === "sync_all") {
        // Full state sync from client to database
        const { projects: clientProjects } = body;
        if (clientProjects && typeof clientProjects === "object") {
          for (const [pId, pData] of Object.entries<any>(clientProjects)) {
            await db
              .insert(projects)
              .values({
                id: pId,
                name: pData.name,
                version: pData.version || "",
                cso: pData.cso || "",
                hazardLogStatus: pData.hazard_log_status || "Draft",
                hazardLogVersion: pData.hazard_log_version || "1.0.0-draft",
              })
              .onConflictDoUpdate({
                target: projects.id,
                set: {
                  name: pData.name,
                  version: pData.version || "",
                  cso: pData.cso || "",
                  hazardLogStatus: pData.hazard_log_status || "Draft",
                  hazardLogVersion: pData.hazard_log_version || "1.0.0-draft",
                },
              });

            if (pData.cscr) {
              await db
                .insert(cscrs)
                .values({
                  projectId: pId,
                  status: pData.cscr.status || "Draft",
                  version: pData.cscr.version || "1.0.0-draft",
                  scope: pData.cscr.scope || "",
                  argument: pData.cscr.argument || "",
                  conclusion: pData.cscr.conclusion || "",
                  references: pData.cscr.references || [],
                })
                .onConflictDoUpdate({
                  target: cscrs.projectId,
                  set: {
                    status: pData.cscr.status || "Draft",
                    version: pData.cscr.version || "1.0.0-draft",
                    scope: pData.cscr.scope || "",
                    argument: pData.cscr.argument || "",
                    conclusion: pData.cscr.conclusion || "",
                    references: pData.cscr.references || [],
                  },
                });
            }

            if (pData.hazards && Array.isArray(pData.hazards)) {
              for (const hz of pData.hazards) {
                await db
                  .insert(hazards)
                  .values({
                    id: hz.id,
                    projectId: pId,
                    title: hz.title,
                    desc: hz.desc || "",
                    clinicalImpact: hz.clinical_impact || "",
                    initialSeverity: hz.initial_severity || "",
                    initialLikelihood: hz.initial_likelihood || "",
                    initialRisk: hz.initial_risk || "",
                    residualSeverity: hz.residual_severity || "",
                    residualLikelihood: hz.residual_likelihood || "",
                    residualRisk: hz.residual_risk || "",
                    causes: hz.causes || [],
                  })
                  .onConflictDoUpdate({
                    target: [hazards.id, hazards.projectId],
                    set: {
                      title: hz.title,
                      desc: hz.desc || "",
                      clinicalImpact: hz.clinical_impact || "",
                      initialSeverity: hz.initial_severity || "",
                      initialLikelihood: hz.initial_likelihood || "",
                      initialRisk: hz.initial_risk || "",
                      residualSeverity: hz.residual_severity || "",
                      residualLikelihood: hz.residual_likelihood || "",
                      residualRisk: hz.residual_risk || "",
                      causes: hz.causes || [],
                    },
                  });
              }
            }

            if (pData.history && Array.isArray(pData.history)) {
              for (const hist of pData.history) {
                await db
                  .insert(history)
                  .values({
                    id: hist.id,
                    projectId: pId,
                    docType: hist.docType,
                    version: hist.version,
                    timestamp: hist.timestamp,
                    cso: hist.cso || "",
                    data: hist.data,
                  })
                  .onConflictDoNothing();
              }
            }
          }
        }

        const updated = await getAllProjectsFormatted();
        return Response.json({ success: true, projects: updated });
      }

      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    if (req.method === "DELETE") {
      if (action === "delete_hazard") {
        const pId = url.searchParams.get("projectId");
        const hId = url.searchParams.get("hazardId");
        if (!pId || !hId) {
          return Response.json({ error: "Missing projectId or hazardId" }, { status: 400 });
        }

        await db
          .delete(hazards)
          .where(and(eq(hazards.id, hId), eq(hazards.projectId, pId)));

        const updated = await getAllProjectsFormatted();
        return Response.json({ success: true, projects: updated });
      }

      if (action === "delete_project") {
        const pId = url.searchParams.get("projectId");
        if (!pId) {
          return Response.json({ error: "Missing projectId" }, { status: 400 });
        }

        await db.delete(projects).where(eq(projects.id, pId));

        const updated = await getAllProjectsFormatted();
        return Response.json({ success: true, projects: updated });
      }

      return Response.json({ error: "Invalid delete action" }, { status: 400 });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err: any) {
    console.error("API error:", err);
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/projects",
};
