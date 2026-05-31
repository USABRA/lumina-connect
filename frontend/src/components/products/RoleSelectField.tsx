"use client";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

import type { TeamStructure } from "@/lib/api";
import { rolesForGroup, roleById, sortedGroups } from "@/lib/teamStructure";

type RoleSelectFieldProps = {
  structure: TeamStructure;
  value: string | null;
  onChange: (roleId: string | null, roleName: string | null) => void;
  size?: "small" | "medium";
};

export default function RoleSelectField({ structure, value, onChange, size = "medium" }: RoleSelectFieldProps) {
  const hasRoles = structure.roles.length > 0;

  if (!hasRoles) {
    return (
      <Typography variant="body2" color="text.secondary">
        Define roles in{" "}
        <Link component={NextLink} href="/team">
          Team organization
        </Link>{" "}
        to group cards by cargo.
      </Typography>
    );
  }

  return (
    <FormControl fullWidth size={size}>
      <InputLabel id="team-role-label">Role / cargo</InputLabel>
      <Select
        labelId="team-role-label"
        label="Role / cargo"
        value={value ?? ""}
        onChange={(e) => {
          const roleId = e.target.value || null;
          const role = roleById(structure, roleId);
          onChange(roleId, role?.name ?? null);
        }}
      >
        <MenuItem value="">No role assigned</MenuItem>
        {sortedGroups(structure).map((group) => {
          const roles = rolesForGroup(structure, group.id);
          if (roles.length === 0) return null;
          return [
            <ListSubheader key={`g-${group.id}`}>{group.name}</ListSubheader>,
            ...roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            )),
          ];
        })}
        {rolesForGroup(structure, null).length > 0 && (
          <>
            <ListSubheader>Other roles</ListSubheader>
            {rolesForGroup(structure, null).map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </>
        )}
      </Select>
    </FormControl>
  );
}
