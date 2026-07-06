/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
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

  ensureAutodateFields("income_accounts")
  ensureAutodateFields("revenues")
  ensureAutodateFields("finance_audit_logs")
}, (app) => {})
