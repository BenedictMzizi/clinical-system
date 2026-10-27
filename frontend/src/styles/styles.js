const gold = "#D4AF37";
const goldDark = "#A78325";
const ink = "#111111";
const muted = "#6B7280";

export const theme = {
  gold,
  goldDark,
  ink,
  muted,
  background: "#F5F2EB",
  surface: "#FFFFFF",
  border: "#E6DFCE",
  text: "#222222",
};

export const container = {
  padding: "28px",
  color: theme.text,
  minHeight: "100%",
  boxSizing: "border-box",
};

export const header = {
  margin: "0 0 24px",
  fontSize: "28px",
  lineHeight: 1.25,
  fontWeight: "750",
  letterSpacing: "-0.6px",
  color: theme.ink,
};

export const subHeader = {
  margin: "0 0 14px",
  fontSize: "18px",
  fontWeight: "650",
  color: theme.ink,
};

export const card = {
  background: theme.surface,
  padding: "24px",
  borderRadius: "16px",
  border: `1px solid ${theme.border}`,
  borderTop: `3px solid ${gold}`,
  boxShadow: "0 5px 20px rgba(17,17,17,0.045)",
  marginBottom: "22px",
  boxSizing: "border-box",
};

export const table = {
  width: "100%",
  borderCollapse: "collapse",
  background: theme.surface,
  color: theme.text,
};

export const tableHeader = {
  background: "#F8F5ED",
  padding: "13px 14px",
  borderBottom: `1px solid ${theme.border}`,
  textAlign: "left",
  fontWeight: "700",
  color: theme.ink,
  fontSize: "13px",
};

export const tableCell = {
  padding: "13px 14px",
  borderBottom: "1px solid #EEEAE1",
  fontSize: "14px",
  verticalAlign: "middle",
};

export const th = tableHeader;
export const td = tableCell;

export const input = {
  width: "100%",
  padding: "12px 14px",
  marginTop: "8px",
  marginBottom: "12px",
  borderRadius: "9px",
  border: "1px solid #D9D3C6",
  background: "#FFFFFF",
  color: theme.text,
  fontSize: "14px",
  outlineColor: gold,
  boxSizing: "border-box",
};

export const textarea = {
  ...input,
  minHeight: "110px",
  resize: "vertical",
  fontFamily: "inherit",
};

export const button = {
  padding: "11px 17px",
  border: "1px solid transparent",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: "650",
  fontSize: "14px",
  transition: "background 160ms ease, border-color 160ms ease",
};

export const buttonPrimary = {
  ...button,
  background: ink,
  color: "#F5D978",
  border: `1px solid ${goldDark}`,
};

export const buttonSuccess = {
  ...button,
  background: "#E8F5EC",
  color: "#17653A",
  border: "1px solid #B9DFC5",
};

export const buttonDanger = {
  ...button,
  background: "#FFF0EE",
  color: "#A52B24",
  border: "1px solid #F1C4BF",
};

export const messageError = {
  color: "#A52B24",
  background: "#FFF0EE",
  border: "1px solid #F1C4BF",
  padding: "12px 14px",
  borderRadius: "9px",
  marginBottom: "14px",
  fontWeight: "500",
};

export const messageSuccess = {
  color: "#17653A",
  background: "#E8F5EC",
  border: "1px solid #B9DFC5",
  padding: "12px 14px",
  borderRadius: "9px",
  marginBottom: "14px",
  fontWeight: "500",
};

export const messageInfo = {
  color: "#594719",
  background: "#FBF5E5",
  padding: "12px 14px",
  borderRadius: "9px",
  border: "1px solid #E9D9A8",
  marginBottom: "14px",
  fontWeight: "500",
};
