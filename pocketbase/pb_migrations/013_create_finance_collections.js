/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const incomeAccounts = new Collection({
    name: "income_accounts",
    type: "base",
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    deleteRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    fields: [
      { type: "text", name: "coa_code", max: 50 },
      { type: "text", name: "name", required: true, max: 255 },
      { type: "number", name: "fiscal_year" },
      { type: "number", name: "budgeted_amount" },
      { type: "text", name: "notes", max: 2000 },
    ],
    indexes: [
      "CREATE INDEX idx_income_accounts_fiscal ON income_accounts (fiscal_year)",
    ],
  })
  app.save(incomeAccounts)

  const savedIncomeAccounts = app.findCollectionByNameOrId("income_accounts")

  let docRequestsCol
  try { docRequestsCol = app.findCollectionByNameOrId("document_requests") } catch (_) {}

  const revenues = new Collection({
    name: "revenues",
    type: "base",
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    deleteRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    fields: [
      { type: "date", name: "revenue_date" },
      { type: "relation", name: "income_account", collectionId: savedIncomeAccounts.id, maxSelect: 1 },
      { type: "text", name: "fund_source", max: 255 },
      { type: "select", name: "category", values: ["nta_receipt", "tax_receipt", "other_receipt", "document_fee", "donation", "grant", "other"] },
      { type: "text", name: "source", max: 255 },
      { type: "number", name: "amount" },
      { type: docRequestsCol ? "relation" : "text", name: "document_request", ...(docRequestsCol ? { collectionId: docRequestsCol.id, maxSelect: 1 } : { max: 255 }) },
      { type: "text", name: "or_no", max: 50 },
      { type: "text", name: "remarks", max: 2000 },
    ],
    indexes: [
      "CREATE INDEX idx_revenues_date ON revenues (revenue_date)",
      "CREATE INDEX idx_revenues_category ON revenues (category)",
    ],
  })
  app.save(revenues)

  const financeAuditLogs = new Collection({
    name: "finance_audit_logs",
    type: "base",
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "action", required: true, max: 20 },
      { type: "text", name: "collection_name", required: true, max: 50 },
      { type: "text", name: "record_id", max: 50 },
      { type: "text", name: "details", max: 2000 },
      { type: "number", name: "amount" },
      { type: "text", name: "user_name", max: 255 },
    ],
    indexes: [],
  })
  app.save(financeAuditLogs)

  const ensureAutodateFields = (name) => {
    try {
      const col = app.findCollectionByNameOrId(name)
      const existingNames = col.fields.map((f) => f.name)
      let changed = false
      if (!existingNames.includes("created")) {
        col.fields.add(new AutodateField({ name: "created", system: true, onCreate: true, onUpdate: false }))
        changed = true
      }
      if (!existingNames.includes("updated")) {
        col.fields.add(new AutodateField({ name: "updated", system: true, onCreate: true, onUpdate: true }))
        changed = true
      }
      if (changed) app.save(col)
    } catch (e) {
      console.log("Cannot fix " + name + ": " + e.message)
    }
  }

  ensureAutodateFields("fund_sources")
  ensureAutodateFields("appropriations")
  ensureAutodateFields("disbursements")
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("finance_audit_logs")) } catch (_) {}
  try { app.delete(app.findCollectionByNameOrId("revenues")) } catch (_) {}
  try { app.delete(app.findCollectionByNameOrId("income_accounts")) } catch (_) {}
})
