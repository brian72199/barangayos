/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const adminOnly = '@request.auth.role = "admin"'

  // 1. Restrict deleteRule to admin-only on all 5 mutable finance collections
  for (const name of ["income_accounts", "revenues", "fund_sources", "appropriations", "disbursements"]) {
    const col = app.findCollectionByNameOrId(name)
    col.deleteRule = adminOnly
    app.save(col)
  }

  // 2. Restrict fund_sources updateRule to admin-only (balance manipulation protection)
  const fs = app.findCollectionByNameOrId("fund_sources")
  fs.updateRule = adminOnly
  app.save(fs)

  // 3. Restrict finance_audit_logs listRule/viewRule to admin or staff
  const audit = app.findCollectionByNameOrId("finance_audit_logs")
  audit.listRule = '@request.auth.role = "admin" || @request.auth.role = "staff"'
  audit.viewRule = '@request.auth.role = "admin" || @request.auth.role = "staff"'
  app.save(audit)
}, (app) => {
  // revert: restore original rules
  const origDelete = '@request.auth.role = "admin" || @request.auth.role = "staff"'
  for (const name of ["income_accounts", "revenues", "fund_sources", "appropriations", "disbursements"]) {
    const col = app.findCollectionByNameOrId(name)
    col.deleteRule = origDelete
    app.save(col)
  }

  const fs = app.findCollectionByNameOrId("fund_sources")
  fs.updateRule = origDelete
  app.save(fs)

  const audit = app.findCollectionByNameOrId("finance_audit_logs")
  audit.listRule = '@request.auth.id != ""'
  audit.viewRule = '@request.auth.id != ""'
  app.save(audit)
})
