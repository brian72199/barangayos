/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("blotter_records")

  collection.deleteRule = '@request.auth.role = "admin"'
  collection.updateRule = '@request.auth.role = "admin" || (@request.auth.role = "staff" && @request.auth.id = created_by)'

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("blotter_records")

  collection.deleteRule = '@request.auth.role = "admin" || @request.auth.role = "staff"'
  collection.updateRule = '@request.auth.role = "admin" || @request.auth.role = "staff"'

  return app.save(collection)
})
