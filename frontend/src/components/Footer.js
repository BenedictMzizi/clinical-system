export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 40,
        padding: "20px 0",
        textAlign: "center",
        fontSize: 12,
        color: "#666",
        borderTop: "1px solid #eee"
      }}
    >
      © {new Date().getFullYear()} Benedict de Almeida Mzizi. All rights reserved.
    </footer>
  );
}
