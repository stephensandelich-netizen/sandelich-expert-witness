/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module "*.astro" {
  const AstroComponent: any;
  export default AstroComponent;
}
