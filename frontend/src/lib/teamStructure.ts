import type { TeamStructure } from "@/lib/api";

type TeamRole = TeamStructure["roles"][number];

export const EMPTY_TEAM_STRUCTURE: TeamStructure = { groups: [], roles: [] };

export function parseTeamStructure(raw: unknown): TeamStructure {
  if (!raw || typeof raw !== "object") return { ...EMPTY_TEAM_STRUCTURE };
  const data = raw as Partial<TeamStructure>;
  return {
    groups: Array.isArray(data.groups) ? data.groups : [],
    roles: Array.isArray(data.roles) ? data.roles : [],
  };
}

export function newTeamId() {
  return crypto.randomUUID();
}

export function roleById(structure: TeamStructure, roleId: string | null | undefined) {
  if (!roleId) return null;
  return structure.roles.find((r) => r.id === roleId) ?? null;
}

export function sortedGroups(structure: TeamStructure) {
  return [...structure.groups].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export function rolesForGroup(structure: TeamStructure, groupId: string | null) {
  return structure.roles
    .filter((r) => (groupId ? r.group_id === groupId : !r.group_id))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export type CardGroupSection = {
  key: string;
  title: string;
  subtitle?: string;
  color?: string;
  roles: {
    role: TeamRole | null;
    cards: import("@/lib/api").Product[];
  }[];
};

export function buildCardSections(
  cards: import("@/lib/api").Product[],
  structure: TeamStructure
): CardGroupSection[] {
  const sections: CardGroupSection[] = [];
  const assigned = new Set<number>();

  for (const group of sortedGroups(structure)) {
    const roleBlocks = rolesForGroup(structure, group.id).map((role) => {
      const roleCards = cards.filter((c) => c.team_role_id === role.id);
      roleCards.forEach((c) => assigned.add(c.id));
      return { role, cards: roleCards };
    });
    if (roleBlocks.some((b) => b.cards.length > 0) || roleBlocks.length > 0) {
      sections.push({
        key: group.id,
        title: group.name,
        subtitle: group.description,
        color: group.color,
        roles: roleBlocks,
      });
    }
  }

  const ungroupedRoles = rolesForGroup(structure, null);
  if (ungroupedRoles.length > 0) {
    const roleBlocks = ungroupedRoles.map((role) => {
      const roleCards = cards.filter((c) => c.team_role_id === role.id);
      roleCards.forEach((c) => assigned.add(c.id));
      return { role, cards: roleCards };
    });
    if (roleBlocks.some((b) => b.cards.length > 0) || roleBlocks.length > 0) {
      sections.push({
        key: "__ungrouped__",
        title: "Other roles",
        roles: roleBlocks,
      });
    }
  }

  const unassigned = cards.filter((c) => !c.team_role_id || !assigned.has(c.id));
  if (unassigned.length > 0) {
    sections.push({
      key: "__unassigned__",
      title: "Unassigned",
      subtitle: "Cards without a defined role",
      roles: [{ role: null, cards: unassigned }],
    });
  }

  if (sections.length === 0 && cards.length > 0) {
    sections.push({
      key: "__all__",
      title: "All cards",
      roles: [{ role: null, cards }],
    });
  }

  return sections;
}

type LeadGroupSection = {
  key: string;
  title: string;
  subtitle?: string;
  roles: {
    role: TeamRole | null;
    leads: import("@/lib/api").LeadEvent[];
  }[];
};

export function buildLeadSections(
  leads: import("@/lib/api").LeadEvent[],
  structure: TeamStructure
): LeadGroupSection[] {
  const roleLeadMap = new Map<string | null, import("@/lib/api").LeadEvent[]>();
  for (const lead of leads) {
    const roleId = lead.team_role_id ?? null;
    const list = roleLeadMap.get(roleId) ?? [];
    list.push(lead);
    roleLeadMap.set(roleId, list);
  }

  const sections: LeadGroupSection[] = [];
  const assigned = new Set<number>();

  for (const group of sortedGroups(structure)) {
    const roleBlocks = rolesForGroup(structure, group.id).map((role) => {
      const roleLeads = roleLeadMap.get(role.id) ?? [];
      roleLeads.forEach((l) => assigned.add(l.id));
      return { role, leads: roleLeads };
    });
    if (roleBlocks.some((b) => b.leads.length > 0)) {
      sections.push({
        key: group.id,
        title: group.name,
        subtitle: group.description,
        roles: roleBlocks.filter((b) => b.leads.length > 0),
      });
    }
  }

  const ungroupedRoles = rolesForGroup(structure, null);
  const ungroupedBlocks = ungroupedRoles
    .map((role) => {
      const roleLeads = roleLeadMap.get(role.id) ?? [];
      roleLeads.forEach((l) => assigned.add(l.id));
      return { role, leads: roleLeads };
    })
    .filter((b) => b.leads.length > 0);
  if (ungroupedBlocks.length > 0) {
    sections.push({ key: "__ungrouped__", title: "Other roles", roles: ungroupedBlocks });
  }

  const unassigned = leads.filter((l) => !l.team_role_id || !assigned.has(l.id));
  if (unassigned.length > 0) {
    sections.push({
      key: "__unassigned__",
      title: "Unassigned",
      subtitle: "Leads from cards without a defined role",
      roles: [{ role: null, leads: unassigned }],
    });
  }

  if (sections.length === 0 && leads.length > 0) {
    sections.push({
      key: "__all__",
      title: "All leads",
      roles: [{ role: null, leads }],
    });
  }

  return sections;
}
