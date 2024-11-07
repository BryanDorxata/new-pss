export async function GET(req) {
  return new Response(JSON.stringify({ message: "Hello, world!" }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
