import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function LandingUnavailable({ code }: { code: string }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f8fafc",
        px: 3,
      }}
    >
      <Box sx={{ maxWidth: 420, textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
          Página indisponível
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Este produto ({code}) não está ativo no momento. Entre em contato com a empresa responsável.
        </Typography>
      </Box>
    </Box>
  );
}
