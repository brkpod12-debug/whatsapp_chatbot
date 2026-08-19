import { defineField, defineType } from "sanity";

export default defineType({
  name: "promiseItem",
  title: "Promise (Why Josh section)",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "body", title: "Body", type: "text", rows: 3, validation: (r) => r.required() }),
    defineField({
      name: "insight",
      title: "Why this matters",
      description:
        "Optional. Two sentences of proof revealed when a reader opens the pillar. Leave empty and the pillar simply has nothing to open.",
      type: "text",
      rows: 3,
    }),
    defineField({ name: "order", title: "Order", type: "number", validation: (r) => r.required() }),
  ],
  orderings: [{ title: "Display order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title" } },
});
