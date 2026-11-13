import { z } from "zod";
import { CATEGORY_ICON_NAMES } from "../lib/icons.js";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(40, "Use at most 40 characters"),
  icon: z.enum(CATEGORY_ICON_NAMES, { error: "Choose an icon" }),
  color: z.enum(["c1", "c2", "c3", "c4", "c5", "c6", "c7"], { error: "Choose a colour" }),
});
