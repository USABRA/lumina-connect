"use client";

import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import {
  BLOCK_TYPE_DESCRIPTIONS,
  BLOCK_TYPE_LABELS,
  createEmptyBlock,
  insertBlock,
  moveBlock,
  removeBlock,
  updateBlock,
  type LandingBlock,
  type LandingBlockType,
} from "@/lib/landingBlocks";

const BLOCK_TYPES: LandingBlockType[] = [
  "hero",
  "text",
  "highlights",
  "image",
  "video",
  "cta_buttons",
  "contact_form",
  "spacer",
];

type EditorContext = {
  productType: string;
  companyName: string;
  campaignName: string;
};

function BlockFields({
  block,
  onChange,
}: {
  block: LandingBlock;
  onChange: (patch: Partial<LandingBlock>) => void;
}) {
  switch (block.type) {
    case "hero":
      return (
        <>
          <TextField
            label="Headline"
            fullWidth
            value={block.headline ?? ""}
            onChange={(e) => onChange({ headline: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={2}
            value={block.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
          />
          <TextField
            label="Logo URL"
            fullWidth
            value={block.logo_url ?? ""}
            onChange={(e) => onChange({ logo_url: e.target.value })}
            placeholder="https://…"
          />
          <FormControlLabel
            control={
              <Switch
                checked={block.show_campaign ?? true}
                onChange={(e) => onChange({ show_campaign: e.target.checked })}
              />
            }
            label="Show campaign name"
          />
        </>
      );
    case "text":
      return (
        <>
          <TextField
            label="Headline"
            fullWidth
            value={block.headline ?? ""}
            onChange={(e) => onChange({ headline: e.target.value })}
          />
          <TextField
            label="Body"
            fullWidth
            multiline
            minRows={3}
            value={block.body ?? ""}
            onChange={(e) => onChange({ body: e.target.value })}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Alignment</InputLabel>
            <Select
              label="Alignment"
              value={block.align ?? "left"}
              onChange={(e) => onChange({ align: e.target.value as "left" | "center" })}
            >
              <MenuItem value="left">Left</MenuItem>
              <MenuItem value="center">Center</MenuItem>
            </Select>
          </FormControl>
        </>
      );
    case "highlights":
      return (
        <>
          {[0, 1, 2].map((index) => (
            <TextField
              key={index}
              label={`Highlight ${index + 1}`}
              fullWidth
              value={block.items?.[index] ?? ""}
              onChange={(e) => {
                const items = [...(block.items ?? ["", "", ""])];
                items[index] = e.target.value;
                onChange({ items });
              }}
            />
          ))}
        </>
      );
    case "image":
      return (
        <>
          <TextField
            label="Image URL"
            fullWidth
            value={block.image_url ?? ""}
            onChange={(e) => onChange({ image_url: e.target.value })}
            placeholder="https://…"
          />
          <TextField
            label="Alt text"
            fullWidth
            value={block.alt ?? ""}
            onChange={(e) => onChange({ alt: e.target.value })}
          />
          <TextField
            label="Caption (optional)"
            fullWidth
            value={block.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </>
      );
    case "video":
      return (
        <TextField
          label="YouTube video URL"
          fullWidth
          value={block.video_url ?? ""}
          onChange={(e) => onChange({ video_url: e.target.value })}
          placeholder="https://youtube.com/watch?v=…"
        />
      );
    case "cta_buttons":
      return (
        <>
          <TextField
            label="PDF brochure URL"
            fullWidth
            value={block.pdf_url ?? ""}
            onChange={(e) => onChange({ pdf_url: e.target.value })}
          />
          <TextField
            label="Book demo URL (Calendly)"
            fullWidth
            value={block.meeting_url ?? ""}
            onChange={(e) => onChange({ meeting_url: e.target.value })}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Alignment</InputLabel>
            <Select
              label="Alignment"
              value={block.align ?? "center"}
              onChange={(e) => onChange({ align: e.target.value as "left" | "center" })}
            >
              <MenuItem value="left">Left</MenuItem>
              <MenuItem value="center">Center</MenuItem>
            </Select>
          </FormControl>
        </>
      );
    case "contact_form":
      return (
        <TextField
          label="Section title"
          fullWidth
          value={block.title ?? "Let's connect"}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      );
    case "spacer":
      return (
        <FormControl fullWidth size="small">
          <InputLabel>Size</InputLabel>
          <Select
            label="Size"
            value={block.size ?? "md"}
            onChange={(e) => onChange({ size: e.target.value as "sm" | "md" | "lg" })}
          >
            <MenuItem value="sm">Small</MenuItem>
            <MenuItem value="md">Medium</MenuItem>
            <MenuItem value="lg">Large</MenuItem>
          </Select>
        </FormControl>
      );
    default:
      return null;
  }
}

export default function CustomBlocksEditor({
  blocks,
  onChange,
  context,
  primaryColor,
  onPrimaryColorChange,
}: {
  blocks: LandingBlock[];
  onChange: (blocks: LandingBlock[]) => void;
  context: EditorContext;
  primaryColor: string;
  onPrimaryColorChange: (color: string) => void;
}) {
  const [addType, setAddType] = useState<LandingBlockType>("text");

  function patchBlock(id: string, patch: Partial<LandingBlock>) {
    onChange(updateBlock(blocks, id, patch));
  }

  function addBlock() {
    onChange(insertBlock(blocks, createEmptyBlock(addType, context)));
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        Add, reorder and edit sections to build your page. Your layout is saved and preserved when you stay on Custom.
      </Typography>

      <TextField
        label="Brand color"
        fullWidth
        type="color"
        value={primaryColor}
        onChange={(e) => onPrimaryColorChange(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Divider />

      {blocks.length === 0 && (
        <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No sections yet. Add your first block below.
          </Typography>
        </Paper>
      )}

      {blocks.map((block, index) => (
        <Paper key={block.id} variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, gap: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {BLOCK_TYPE_LABELS[block.type]}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {BLOCK_TYPE_DESCRIPTIONS[block.type]}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <IconButton
                size="small"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => onChange(moveBlock(blocks, index, -1))}
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                aria-label="Move down"
                disabled={index === blocks.length - 1}
                onClick={() => onChange(moveBlock(blocks, index, 1))}
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                aria-label="Remove section"
                color="error"
                onClick={() => onChange(removeBlock(blocks, block.id))}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <BlockFields block={block} onChange={(patch) => patchBlock(block.id, patch)} />
          </Box>
        </Paper>
      ))}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Block type</InputLabel>
          <Select label="Block type" value={addType} onChange={(e) => setAddType(e.target.value as LandingBlockType)}>
            {BLOCK_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {BLOCK_TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={addBlock}>
          Add section
        </Button>
      </Box>
    </Box>
  );
}
