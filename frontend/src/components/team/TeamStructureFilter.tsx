"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

import type { TeamStructure } from "@/lib/api";
import { rolesForGroup, sortedGroups } from "@/lib/teamStructure";

type TeamStructureFilterProps = {
  structure: TeamStructure;
  groupId: string | null;
  roleId: string | null;
  onGroupChange: (groupId: string | null) => void;
  onRoleChange: (roleId: string | null) => void;
  size?: "small" | "medium";
};

const formControlSx = {
  minWidth: { xs: "100%", sm: 160 },
  flex: { xs: "1 1 100%", sm: "0 0 auto" },
};

export default function TeamStructureFilter({
  structure,
  groupId,
  roleId,
  onGroupChange,
  onRoleChange,
  size = "small",
}: TeamStructureFilterProps) {
  const hasStructure = structure.groups.length > 0 || structure.roles.length > 0;
  if (!hasStructure) return null;

  const rolesInGroup = groupId ? rolesForGroup(structure, groupId) : structure.roles;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, width: { xs: "100%", sm: "auto" } }}>
      {structure.groups.length > 0 && (
        <FormControl size={size} sx={formControlSx}>
          <InputLabel id="filter-group-label">Department</InputLabel>
          <Select
            labelId="filter-group-label"
            label="Department"
            value={groupId ?? ""}
            onChange={(e) => {
              onGroupChange(e.target.value || null);
              onRoleChange(null);
            }}
          >
            <MenuItem value="">All departments</MenuItem>
            {sortedGroups(structure).map((group) => (
              <MenuItem key={group.id} value={group.id}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <FormControl size={size} sx={formControlSx}>
        <InputLabel id="filter-role-label">Role / cargo</InputLabel>
        <Select
          labelId="filter-role-label"
          label="Role / cargo"
          value={roleId ?? ""}
          onChange={(e) => onRoleChange(e.target.value || null)}
        >
          <MenuItem value="">All roles</MenuItem>
          {(groupId ? rolesInGroup : structure.roles).map((role) => (
            <MenuItem key={role.id} value={role.id}>
              {role.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
