import type { House } from "@/db/schema";

interface ColorMapping {
    name: House;
    color: (alpha: number) => string;
}
export const HOUSE_COLOR_MAPPINGS: ColorMapping[] = [
    {
        name: "sagar",
        color: (alpha) => `rgba(31, 204, 242, ${alpha})`
    },
    {
        name: "vasundhara",
        color: (alpha) => `rgba(248, 94, 94, ${alpha})`
    },
    {
        name: "srishti",
        color: (alpha) => `rgba(0, 204, 102, ${alpha})`
    },
    {
        name: "himgiri",
        color: (alpha) => `rgba(255, 204, 0, ${alpha})`
    },
    {
        name: "alumni",
        color: (alpha) => `rgba(204, 102, 255, ${alpha})`
    }
];