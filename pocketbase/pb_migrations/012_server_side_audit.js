/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("activity_logs")
  collection.createRule = null
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("activity_logs")
  collection.createRule = '@request.auth.id != ""'
  return app.save(collection)
})
