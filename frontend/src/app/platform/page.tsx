"use client";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useCallback, useEffect, useState } from "react";

import ContentCard from "@/components/ui/ContentCard";
import PageHeader from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { publicCompanyName } from "@/lib/branding";
import type { PlatformCompanySummary } from "@/lib/api";

function cardPath(code: string) {
  return `/p/${code}`;
}

export default function PlatformPage() {
  const { request } = useApi();
  const [companies, setCompanies] = useState<PlatformCompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request<PlatformCompanySummary[]>("/platform/companies");
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <PageHeader
        title="Tenant directory"
        subtitle="Public brand metadata and card URLs across all clients. Lead details and private analytics are not shown."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Configure platform admin access with <code>PLATFORM_ADMIN_EMAILS</code> in backend <code>.env</code>.
      </Alert>

      <ContentCard title={loading ? "Loading…" : `${companies.length} companies`} noPadding>
        <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>White-label</TableCell>
              <TableCell align="right">Cards</TableCell>
              <TableCell>Public previews</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((company) => {
              const displayName = publicCompanyName({
                company_name: company.company_name,
                brand_display_name: company.brand_display_name,
              });
              return (
                <TableRow key={company.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        src={company.brand_logo_url ?? undefined}
                        sx={{ width: 36, height: 36, bgcolor: company.brand_color || "#64748b" }}
                      >
                        {displayName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {displayName}
                        </Typography>
                        {company.brand_tagline && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {company.brand_tagline}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {company.white_label_enabled || company.hide_platform_branding ? (
                      <Chip label="On" size="small" color="success" variant="outlined" />
                    ) : (
                      <Chip label="Off" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="right">{company.product_count}</TableCell>
                  <TableCell>
                    {company.sample_card_codes.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        No cards yet
                      </Typography>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {company.sample_card_codes.map((code) => (
                          <Link
                            key={code}
                            component={NextLink}
                            href={cardPath(code)}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: "0.8rem" }}
                          >
                            /p/{code}
                            <OpenInNewOutlinedIcon sx={{ fontSize: 14 }} />
                          </Link>
                        ))}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary">
                    No companies registered yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </TableContainer>
      </ContentCard>
    </Box>
  );
}
