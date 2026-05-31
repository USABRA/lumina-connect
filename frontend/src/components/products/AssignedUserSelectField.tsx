"use client";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";

import type { CompanyMember } from "@/lib/api";

type AssignedUserSelectFieldProps = {
  members: CompanyMember[];
  value: number | null;
  onChange: (userId: number | null) => void;
  disabled?: boolean;
};

export default function AssignedUserSelectField({
  members,
  value,
  onChange,
  disabled = false,
}: AssignedUserSelectFieldProps) {
  const companyUsers = members.filter((m) => m.role === "company_user");

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel id="assigned-user-label">Assigned to</InputLabel>
      <Select
        labelId="assigned-user-label"
        label="Assigned to"
        value={value != null ? String(value) : ""}
        onChange={(e) => {
          const raw = String(e.target.value);
          onChange(raw === "" ? null : Number(raw));
        }}
      >
        <MenuItem value="">
          <Typography variant="body2" color="text.secondary">
            Unassigned
          </Typography>
        </MenuItem>
        {companyUsers.map((member) => (
          <MenuItem key={member.id} value={member.id}>
            {member.name} ({member.email})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
