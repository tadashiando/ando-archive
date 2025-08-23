// Font Awesome icon codes (unicode values)
export const FONT_AWESOME_ICONS = {
  // Food & Cooking
  utensils: "\uf2e7",
  "chef-hat": "\uf86c",
  "bowl-food": "\ue4c6",
  bread: "\uf45c",

  // Construction & Building
  hammer: "\uf6e3",
  "hard-hat": "\uf807",
  wrench: "\uf0ad",
  screwdriver: "\uf54a",
  "house-chimney": "\ue3af",

  // Architecture & Design
  "drafting-compass": "\uf568",
  "ruler-combined": "\uf546",
  building: "\uf1ad",
  city: "\uf64f",
  blueprint: "\uf5ec",

  // Education & Learning
  "graduation-cap": "\uf19d",
  book: "\uf02d",
  school: "\uf549",
  chalkboard: "\uf51b",
  pencil: "\uf040",

  // General Categories
  folder: "\uf07b",
  "folder-open": "\uf07c",
  file: "\uf15b",
  "file-alt": "\uf15c",
  tag: "\uf02b",
  tags: "\uf02c",

  // Nature & Plants
  leaf: "\uf06c",
  tree: "\uf1bb",
  seedling: "\uf4d8",

  // Technology
  laptop: "\uf109",
  "mobile-alt": "\uf3cd",
  code: "\uf121",

  // Business
  briefcase: "\uf0b1",
  "chart-bar": "\uf080",
  calculator: "\uf1ec",

  // Health & Medical
  "heart-pulse": "\uf21e",
  "user-md": "\uf0f0",
  pills: "\uf484",

  // Travel & Transport
  car: "\uf1b9",
  plane: "\uf072",
  "map-marked": "\uf59f",
} as const;

export type IconName = keyof typeof FONT_AWESOME_ICONS;

// Predefined category icons with their Font Awesome equivalents
export const CATEGORY_ICON_OPTIONS = [
  { name: "utensils" as const, label: "Utensils", category: "cooking" },
  { name: "chef-hat" as const, label: "Chef Hat", category: "cooking" },
  { name: "bowl-food" as const, label: "Bowl", category: "cooking" },
  { name: "bread" as const, label: "Bread", category: "cooking" },

  { name: "hammer" as const, label: "Hammer", category: "construction" },
  { name: "hard-hat" as const, label: "Hard Hat", category: "construction" },
  { name: "wrench" as const, label: "Wrench", category: "construction" },
  {
    name: "screwdriver" as const,
    label: "Screwdriver",
    category: "construction",
  },
  { name: "house-chimney" as const, label: "House", category: "construction" },

  {
    name: "drafting-compass" as const,
    label: "Compass",
    category: "architecture",
  },
  { name: "ruler-combined" as const, label: "Ruler", category: "architecture" },
  { name: "building" as const, label: "Building", category: "architecture" },
  { name: "city" as const, label: "City", category: "architecture" },
  { name: "blueprint" as const, label: "Blueprint", category: "architecture" },

  {
    name: "graduation-cap" as const,
    label: "Graduation",
    category: "education",
  },
  { name: "book" as const, label: "Book", category: "education" },
  { name: "school" as const, label: "School", category: "education" },
  { name: "chalkboard" as const, label: "Chalkboard", category: "education" },
  { name: "pencil" as const, label: "Pencil", category: "education" },

  { name: "folder" as const, label: "Folder", category: "general" },
  { name: "folder-open" as const, label: "Open Folder", category: "general" },
  { name: "file" as const, label: "File", category: "general" },
  { name: "tag" as const, label: "Tag", category: "general" },
  { name: "tags" as const, label: "Tags", category: "general" },

  { name: "leaf" as const, label: "Leaf", category: "nature" },
  { name: "tree" as const, label: "Tree", category: "nature" },
  { name: "seedling" as const, label: "Seedling", category: "nature" },

  { name: "laptop" as const, label: "Laptop", category: "technology" },
  { name: "code" as const, label: "Code", category: "technology" },

  { name: "briefcase" as const, label: "Briefcase", category: "business" },
  { name: "chart-bar" as const, label: "Chart", category: "business" },
  { name: "calculator" as const, label: "Calculator", category: "business" },

  { name: "heart-pulse" as const, label: "Health", category: "health" },
  { name: "pills" as const, label: "Medicine", category: "health" },

  { name: "car" as const, label: "Car", category: "transport" },
  { name: "plane" as const, label: "Plane", category: "transport" },
  { name: "map-marked" as const, label: "Map", category: "transport" },
] as const;
