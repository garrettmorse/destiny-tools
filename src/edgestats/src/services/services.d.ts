export interface Mods {
  [modName: string]: string
}

export type APIResponse<T> = [Error, null] | [null, T];
