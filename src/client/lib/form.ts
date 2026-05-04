import type { CreateSpellInput } from "../../shared/schemas.js";

export const defaultSpellForm = (): CreateSpellInput => ({
  name: "",
  description: "",
  atHigherLevel: null,
  page: null,
  range: "",
  components: {
    verbal: false,
    somatic: false,
    material: false,
    materialDescription: null,
  },
  ritual: false,
  duration: "",
  concentration: false,
  castingTime: "",
  level: 0,
  school: "Abjuration",
  classes: [],
});
