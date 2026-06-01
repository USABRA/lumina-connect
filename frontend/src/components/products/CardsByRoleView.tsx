"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import ContentCard from "@/components/ui/ContentCard";
import type { CompanyMember, Product, TeamStructure } from "@/lib/api";
import { buildCardSections, roleById } from "@/lib/teamStructure";

type CardsByRoleProps = {
  cards: Product[];
  structure: TeamStructure;
  canManage?: boolean;
  members?: CompanyMember[];
  onEdit: (card: Product) => void;
  onQr: (card: Product) => void;
  onDelete: (card: Product) => void;
  onStatusChange: (card: Product, status: Product["status"]) => void;
  onRoleChange: (card: Product, roleId: string | null) => void;
  copyUrl: (url: string) => void;
};

function memberName(members: CompanyMember[], userId: number | null): string | null {
  if (userId == null) return null;
  return members.find((m) => m.id === userId)?.name ?? null;
}

function CardTable({
  cards,
  structure,
  canManage = true,
  members = [],
  onEdit,
  onQr,
  onDelete,
  onStatusChange,
  onRoleChange,
  copyUrl,
}: CardsByRoleProps) {
  if (cards.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, py: 2 }}>
        No cards in this role yet.
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            {canManage && <TableCell>Assigned to</TableCell>}
            <TableCell>Role</TableCell>
            <TableCell>Card link</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cards.map((card) => (
            <TableRow key={card.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {card.landing_headline || "—"}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                  {card.unique_code}
                </Typography>
              </TableCell>
              {canManage && (
                <TableCell>
                  <Typography variant="body2">
                    {memberName(members, card.assigned_user_id) ?? "Unassigned"}
                  </Typography>
                </TableCell>
              )}
              <TableCell>
                {canManage ? (
                  <Select
                    size="small"
                    value={card.team_role_id ?? ""}
                    displayEmpty
                    onChange={(e) => onRoleChange(card, e.target.value || null)}
                    sx={{ minWidth: { xs: 120, sm: 160 } }}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {structure.roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <Typography variant="body2">
                    {roleById(structure, card.team_role_id)?.name ?? "—"}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                    {card.qr_url}
                  </Typography>
                  {card.qr_url && (
                    <>
                      <IconButton size="small" onClick={() => copyUrl(card.qr_url!)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" component="a" href={card.qr_url!} target="_blank">
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                {canManage ? (
                  <Select
                    size="small"
                    value={card.status}
                    onChange={(e) => onStatusChange(card, e.target.value as Product["status"])}
                    sx={{ minWidth: { xs: 100, sm: 110 }, textTransform: "capitalize" }}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                ) : (
                  <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                    {card.status}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <IconButton aria-label="edit" size="small" onClick={() => onEdit(card)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton aria-label="qr" size="small" onClick={() => onQr(card)}>
                  <QrCode2Icon fontSize="small" />
                </IconButton>
                {canManage && (
                  <IconButton aria-label="delete" size="small" onClick={() => onDelete(card)}>
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function CardsByRoleView(props: CardsByRoleProps) {
  const { cards: _allCards, canManage = true, ...tableProps } = props;
  const sections = canManage
    ? buildCardSections(props.cards, props.structure)
    : [{ key: "mine", title: "My card", subtitle: undefined, roles: [{ role: null, cards: props.cards }] }];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {sections.map((section) => {
        const cardCount = section.roles.reduce((n, r) => n + r.cards.length, 0);
        return (
        <ContentCard
          key={section.key}
          title={`${section.title} (${cardCount})`}
          noPadding
        >
          {section.subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, pt: 2 }}>
              {section.subtitle}
            </Typography>
          )}
          {section.roles.map(({ role, cards }) => (
            <Box key={role?.id ?? "unassigned"}>
              {role && (
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: "action.hover", borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {role.name}
                  </Typography>
                  {role.description && (
                    <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                  )}
                </Box>
              )}
              <CardTable cards={cards} {...tableProps} />
            </Box>
          ))}
        </ContentCard>
        );
      })}
    </Box>
  );
}
