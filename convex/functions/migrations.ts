import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";
import { slugifyPropertyName } from "../lib/emailRouting";

function uniqueSlug(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    return base;
  }
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

export const backfillPropertySlugs = internalMutation({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("property"),
      slug: v.string()
    })
  ),
  handler: async (ctx) => {
    const properties = await ctx.db.query("property").collect();
    const used = new Set<string>();

    for (const doc of properties) {
      if (doc.slug !== undefined) {
        used.add(doc.slug);
      }
    }

    const patched: Array<{ id: Id<"property">; slug: string }> = [];

    for (const doc of properties) {
      if (doc.slug !== undefined) {
        continue;
      }

      const base = slugifyPropertyName(doc.name);
      const slug = uniqueSlug(base, used);
      used.add(slug);

      await ctx.db.patch(doc._id, {
        slug,
        updatedAt: Date.now()
      });

      patched.push({ id: doc._id, slug });
    }

    return patched;
  }
});
