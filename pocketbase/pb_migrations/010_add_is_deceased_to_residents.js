migrate((app) => {
  const collection = app.findCollectionByNameOrId("residents")
  if (collection.fields.find((f) => f.name === "is_deceased")) return
  collection.fields.add(new Field({
    name: "is_deceased",
    type: "bool",
    required: false,
    defaultValue: false,
  }))
  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("residents")
  const field = collection.fields.find((f) => f.name === "is_deceased")
  if (field) collection.fields.remove(field.id)
  app.save(collection)
})
