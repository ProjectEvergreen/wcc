export type Metadata = {
  [key: string]: {
    instanceName: string;
    moduleURL: URL;
    isEntry: boolean
  }
}

type renderToString = (elementURL: URL, wrappingEntryTag?: boolean, props?: any) => Promise<{
  html: string;
  metadata: Metadata
}>

type renderFromHTML = (html: string, elementURLs: URL[]) => Promise<{
  html: string;
  metadata: Metadata
}>

declare module "wc-compiler" {
  export const renderToString: renderToString;
  export const renderFromHTML: renderFromHTML;
}