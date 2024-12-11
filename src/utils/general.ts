import * as core from '@actions/core'

export function panic(emsg: string): never {
  core.setFailed(emsg);
  process.exit(1);
}
