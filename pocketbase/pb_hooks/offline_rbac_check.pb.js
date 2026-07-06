/// <reference path="../pb_data/types.d.ts" />

const SKIP_COLLECTIONS = ["activity_logs", "users"]

function getUserRole(dao, userId) {
  try {
    const user = dao.findRecordById("users", userId)
    return user?.get("role") ?? ""
  } catch (_) {
    return ""
  }
}

function evaluateRule(rule, role, userId) {
  if (!rule) return false
  if (rule === "") return true

  const rolePattern = /@request\.auth\.role\s*=\s*"(\w+)"/g
  const idPattern = /@request\.auth\.id\s*=\s*id/g
  const anyAuthPattern = /@request\.auth\.id\s*!=\s*""/g

  let match

  if (anyAuthPattern.test(rule)) {
    if (userId) return true
  }

  const requiredRoles = []
  while ((match = rolePattern.exec(rule)) !== null) {
    requiredRoles.push(match[1])
  }

  let roleMatch = false
  if (requiredRoles.length > 0) {
    roleMatch = requiredRoles.includes(role)
  }

  const hasSelfCheck = idPattern.test(rule)

  if (rule.includes("||")) {
    if (roleMatch) return true
    if (hasSelfCheck && userId) return true
    return false
  }

  if (requiredRoles.length > 0 && !roleMatch) return false
  if (hasSelfCheck && !userId) return false

  return true
}

function checkBeforeWrite(e, actionRuleField) {
  if (SKIP_COLLECTIONS.includes(e.collection.name)) return

  const auth = e.httpContext?.auth
  if (!auth) {
    throw new ForbiddenError("Authentication required")
  }

  const userId = auth.id
  const currentRole = getUserRole(e.dao, userId)
  if (!currentRole) {
    throw new ForbiddenError("User not found or inactive")
  }

  const rule = e.collection[actionRuleField]
  if (!evaluateRule(rule, currentRole, userId)) {
    throw new ForbiddenError("Your current role does not have permission for this action")
  }
}

onRecordBeforeCreate((e) => {
  checkBeforeWrite(e, "createRule")
})

onRecordBeforeUpdate((e) => {
  checkBeforeWrite(e, "updateRule")
})

onRecordBeforeDelete((e) => {
  checkBeforeWrite(e, "deleteRule")
})
