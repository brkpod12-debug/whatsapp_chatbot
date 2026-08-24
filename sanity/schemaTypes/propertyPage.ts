import { defineField, defineType } from "sanity";

export default defineType({
  name: "propertyPage",
  title: "Property page",
  type: "document",
  description:
    "These are the section titles shown on every single property page (the walkthrough video, the photo gallery, the story and the key facts). Change the text here and it changes everywhere.",
  fields: [
    defineField({
      name: "walkthroughKicker",
      title: "Photo gallery - small label",
      type: "string",
      initialValue: "Walk through",
    }),
    defineField({
      name: "walkthroughHeading",
      title: "Photo gallery - heading",
      type: "string",
      initialValue: "Drag through the property.",
    }),
    defineField({
      name: "videoKicker",
      title: "Video - small label",
      type: "string",
      description: "Shown only when a property has a YouTube video.",
      initialValue: "On film",
    }),
    defineField({
      name: "videoHeading",
      title: "Video - heading",
      type: "string",
      description: "Shown only when a property has a YouTube video.",
      initialValue: "The walkthrough, in motion.",
    }),
    defineField({
      name: "storyKicker",
      title: "Story - small label",
      type: "string",
      initialValue: "The story",
    }),
    defineField({
      name: "storyHeading",
      title: "Story - heading",
      type: "string",
      initialValue: "Why this property exists.",
    }),
    defineField({
      name: "factsKicker",
      title: "Key facts - small label",
      type: "string",
      initialValue: "The facts",
    }),
    defineField({
      name: "titleChainNote",
      title: "Title papers note (below key facts)",
      type: "text",
      rows: 3,
      initialValue:
        "The full chain of title, revenue records and survey maps are provided to serious enquirers before any payment is discussed.",
    }),
    defineField({
      name: "enquireLabel",
      title: "Enquiry button text",
      type: "string",
      initialValue: "Enquire about this property",
    }),
    defineField({
      name: "factsOriginLabel",
      title: "Key facts - the holdings source label",
      type: "string",
      description: "e.g. \"Ground holdings\" - the label for the list of other properties in the same ground.",
      initialValue: "Ground holdings",
    }),
    defineField({
      name: "groundHeading",
      title: "More properties - small label",
      type: "string",
      initialValue: "Also in this ground",
    }),
    defineField({
      name: "alsoHeading",
      title: "More properties - heading",
      type: "string",
      initialValue: "If this is almost right.",
    }),
    defineField({
      name: "viewFullListLabel",
      title: "View full list link text",
      type: "string",
      initialValue: "View the full list",
    }),
    defineField({
      name: "photosLabel",
      title: "Photos placeholder - heading",
      type: "string",
      initialValue: "Photographs on request",
    }),
    defineField({
      name: "imageNote",
      title: "Caption under the photos",
      type: "string",
      description:
        "Shown under the gallery. Say so here while the pictures are stock stand-ins rather than the actual flat.",
      initialValue:
        "Representative photograph. Pictures of this flat are shared privately on enquiry.",
    }),
    defineField({
      name: "photosNote",
      title: "Photos placeholder - note",
      type: "string",
      initialValue:
        "Site photographs and the full walkthrough are shared privately with serious enquirers.",
    }),
  ],
  preview: { prepare: () => ({ title: "Property page" }) },
});