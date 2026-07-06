/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const col = app.findCollectionByNameOrId("finance_audit_logs")
  col.createRule = '@request.auth.id != ""'
  app.save(col)
}, (app) => {
  const col = app.findCollectionByNameOrId("finance_audit_logs")
  col.createRule = null
  app.save(col)
})
