export type Metadata = object[{
  [key: string]: {
    instanceName: string;
    moduleURL: URL;
    isEntry: boolean
  }
}]

export type renderToString = (elementURL: URL, wrappingEntryTag?: boolean, props?: any) => Promise<{
  html: string;
  metadata: Metadata
}>

export type renderFromHTML = (html: string, elementURLs: URL[]) => Promise<{
  html: string;
  metadata: Metadata
}>