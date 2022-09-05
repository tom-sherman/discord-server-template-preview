export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Enter template ID</h1>
      <form action="/template">
        <input name="templateId" />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
