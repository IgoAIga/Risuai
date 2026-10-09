import type { RisuPersona } from "./storage/database.svelte";

/** Include the legacy single image without requiring a database migration. */
export function getPersonaImages(persona: RisuPersona): string[] {
  return [
    ...new Set(
      [...(persona.profileImages ?? []), persona.icon].filter(Boolean),
    ),
  ];
}

export function selectPersonaImage(persona: RisuPersona, image: string) {
  if (!getPersonaImages(persona).includes(image)) return false;
  persona.profileImages = getPersonaImages(persona);
  persona.icon = image;
  return true;
}

export function addPersonaImage(persona: RisuPersona, image: string) {
  if (!image) return;
  persona.profileImages = [...new Set([...getPersonaImages(persona), image])];
  persona.icon = image;
}

export function removePersonaImage(persona: RisuPersona, image: string) {
  persona.profileImages = getPersonaImages(persona).filter(
    (value) => value !== image,
  );
  if (persona.icon === image) persona.icon = persona.profileImages[0] ?? "";
}

/** Selecting an export cover must not change the active chat portrait. */
export function getPersonaExportImage(
  persona: RisuPersona,
  image?: string,
): string {
  if (image === undefined) return persona.icon;
  if (!getPersonaImages(persona).includes(image))
    throw new Error("Unknown persona image");
  return image;
}
