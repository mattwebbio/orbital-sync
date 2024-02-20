export interface SyncOptionsV5 {
  whitelist: boolean;
  regexWhitelist: boolean;
  blacklist: boolean;
  regexlist: boolean;
  adlist: boolean;
  client: boolean;
  group: boolean;
  auditlog: boolean;
  staticdhcpleases: boolean;
  localdnsrecords: boolean;
  localcnamerecords: boolean;
  flushtables: boolean;
}
