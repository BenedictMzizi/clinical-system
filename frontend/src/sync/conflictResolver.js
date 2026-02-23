export class ConflictResolver {

  static resolve(localRecord, serverRecord) {

    if (!serverRecord) return localRecord
    if (!localRecord) return serverRecord

    if (localRecord.version > serverRecord.version)
      return localRecord

    if (serverRecord.version > localRecord.version)
      return serverRecord

    const localTime = new Date(localRecord.updated_at).getTime()
    const serverTime = new Date(serverRecord.updated_at).getTime()

    if (localTime > serverTime)
      return localRecord

    return serverRecord
  }


  static merge(local, server) {

    return {
      ...server,
      ...local,
      version: Math.max(local.version, server.version) + 1,
      updated_at: new Date().toISOString()
    }
  }

}
