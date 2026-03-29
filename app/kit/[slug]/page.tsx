import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ContactSection from "./ContactSection";

export const dynamic = "force-dynamic";

export default async function PublicKit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: kit } = await supabase
    .from("media_kits")
    .select("generated_html, is_published, name, form_data")
    .eq("slug", slug)
    .single();

  if (!kit || !kit.is_published || !kit.generated_html) {
    notFound();
  }

  const contactEmail = kit.form_data?.contactEmail || "";
  const kitName = kit.name || "";

  // Inject a script into the generated HTML that makes "Get in Touch" buttons
  // message the parent frame to scroll to the contact form
  const injectedScript = `
<script>
document.addEventListener('click', function(e) {
  var btn = e.target.closest('button, a');
  if (!btn) return;
  var text = (btn.textContent || '').trim().toUpperCase();
  if (text === 'GET IN TOUCH' || text === 'CONTACT US FOR RATES') {
    e.preventDefault();
    window.parent.postMessage({ type: 'scrollToContact' }, '*');
  }
});
// Also intercept the contact modal from opening
var modal = document.getElementById('contact-modal');
if (modal) modal.remove();
</script>`;

  const htmlWithInjection = kit.generated_html.replace(
    "</body>",
    injectedScript + "\n</body>"
  );

  return (
    <div style={{ background: "#111", minHeight: "100vh" }}>
      <iframe
        srcDoc={htmlWithInjection}
        style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
        title={kit.name}
        id="kit-frame"
      />
      <ContactSection kitName={kitName} contactEmail={contactEmail} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: kit } = await supabase
    .from("media_kits")
    .select("name")
    .eq("slug", slug)
    .single();
  return {
    title: kit?.name ? `${kit.name} - Media Kit` : "Media Kit",
  };
}
